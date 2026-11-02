#!/usr/bin/env python3
"""Cut silences + bad takes using a word-level transcript.

Usage: cut.py <raw_video> <project_dir> [--pad 0.02] [--max-gap 0.15] [--fps 30] [--size 1080x1920]

Reads  <project_dir>/transcript_raw.json  (from transcribe.py)
       <project_dir>/cuts.json            (optional) {"remove": [[start, end], ...], "order": [[start, end], ...]}  seconds in RAW time;
                                          "order" (optional) re-arranges: ranges are played in that order
Writes <project_dir>/cut.mp4              vertical, CFR, H.264/AAC
       <project_dir>/transcript.json      words/segments re-timed to cut.mp4
       <project_dir>/segments.json        kept [raw_start, raw_end, new_start]
"""
import argparse
import json
import os
import subprocess


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("raw")
    ap.add_argument("project")
    ap.add_argument("--pad", type=float, default=0.02, help="padding kept around each word (s)")
    ap.add_argument("--max-gap", type=float, default=0.15, help="gaps between words shorter than this stay untouched (s)")
    ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--size", default="1080x1920")
    ap.add_argument("--crf", type=int, default=17)
    args = ap.parse_args()

    P = args.project
    tr = json.load(open(os.path.join(P, "transcript_raw.json")))
    cuts_path = os.path.join(P, "cuts.json")
    cuts = json.load(open(cuts_path)) if os.path.exists(cuts_path) else {}
    remove = cuts.get("remove", [])
    # optional "order": [[start, end], ...] raw-time ranges, played in THIS order (re-arranges the video)
    order = cuts.get("order") or [[0.0, float("inf")]]

    def removed(w):
        mid = (w["start"] + w["end"]) / 2
        return any(a <= mid <= b for a, b in remove)

    sil = [[s + args.pad, e - args.pad] for s, e in tr.get("silences", []) if e - s > 2 * args.pad + 0.05]
    seg, words, new_words, new_segments = [], [], [], []
    t = 0.0
    for oa, ob in order:
        gw = [w for w in tr["words"] if not removed(w) and w["end"] > w["start"] and oa <= (w["start"] + w["end"]) / 2 <= ob]
        if not gw:
            continue
        # keep-intervals: each word +- pad, merged when the gap is small, never outside the order range
        iv = []
        for w in gw:
            a, b = max(0.0, oa, w["start"] - args.pad), min(ob, w["end"] + args.pad)
            if iv and a - iv[-1][1] <= args.max_gap:
                iv[-1][1] = max(iv[-1][1], b)
            else:
                iv.append([a, b])
        # never keep audio inside an explicit remove range, nor inside detected silences (minus padding)
        clipped = []
        for a, b in iv:
            parts = [[a, b]]
            for ra, rb in remove + sil:
                nxt = []
                for pa, pb in parts:
                    if rb <= pa or ra >= pb:
                        nxt.append([pa, pb])
                    else:
                        if ra > pa:
                            nxt.append([pa, ra])
                        if rb < pb:
                            nxt.append([rb, pb])
                parts = nxt
            clipped += [p for p in parts if p[1] - p[0] > 0.04]
        gseg = []
        for a, b in clipped:
            gseg.append([round(a, 3), round(b, 3), round(t, 3)])
            t += b - a
        if not gseg:
            continue
        seg += gseg

        def remap(x, gseg=gseg):
            for a, b, n in gseg:
                if a - 1e-6 <= x <= b + 1e-6:
                    return round(n + (x - a), 3)
            # outside kept audio: snap to nearest segment edge
            best = min(gseg, key=lambda s: min(abs(x - s[0]), abs(x - s[1])))
            return round(best[2] if abs(x - best[0]) < abs(x - best[1]) else best[2] + best[1] - best[0], 3)

        gnew = [{**w, "start": remap(w["start"]), "end": remap(w["end"])} for w in gw]
        words += gw
        new_words += gnew
        for s in tr["segments"]:
            ws = [nw for nw, w in zip(gnew, gw) if s["start"] - 0.01 <= w["start"] <= s["end"] + 0.01]
            if ws:
                new_segments.append({"text": " ".join(w["w"] for w in ws), "start": ws[0]["start"], "end": ws[-1]["end"]})
    if not seg:
        raise SystemExit("no words left after cuts")
    total = t

    # ffmpeg: trim each interval, tiny audio fades against clicks, concat
    W, H = args.size.split("x")
    parts, fc = [], []
    for i, (a, b, _) in enumerate(seg):
        d = b - a
        fc.append(f"[0:v]trim=start={a}:end={b},setpts=PTS-STARTPTS[v{i}]")
        fc.append(
            f"[0:a]atrim=start={a}:end={b},asetpts=PTS-STARTPTS,"
            f"afade=t=in:st=0:d=0.004,afade=t=out:st={max(0, d - 0.006):.3f}:d=0.006[a{i}]"
        )
        parts.append(f"[v{i}][a{i}]")
    fc.append(f"{''.join(parts)}concat=n={len(seg)}:v=1:a=1[vc][ac]")
    fc.append(f"[vc]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},fps={args.fps},format=yuv420p[vo]")
    fc_path = os.path.join(P, ".cut_filter.txt")
    open(fc_path, "w").write(";\n".join(fc))
    out = os.path.join(P, "cut.mp4")
    cmd = [
        "ffmpeg", "-loglevel", "error", "-y", "-i", args.raw,
        "-filter_complex_script", fc_path, "-map", "[vo]", "-map", "[ac]",
        "-c:v", "libx264", "-preset", "medium", "-crf", str(args.crf),
        "-c:a", "aac", "-b:a", "256k", "-ar", "48000", "-movflags", "+faststart", out,
    ]
    subprocess.run(cmd, check=True)
    os.remove(fc_path)

    json.dump({"language": tr.get("language"), "duration": round(total, 3), "words": new_words, "segments": new_segments},
              open(os.path.join(P, "transcript.json"), "w"), ensure_ascii=False, indent=1)
    json.dump(seg, open(os.path.join(P, "segments.json"), "w"))
    print(f"raw {tr['duration']:.2f}s -> cut {total:.2f}s  ({len(seg)} pieces, {len(remove)} bad-take ranges removed)")


if __name__ == "__main__":
    main()

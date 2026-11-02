#!/usr/bin/env python3
"""Make the review pack the critic looks at (references/critique.md).

Usage: review.py <render.mp4> <out_dir> [--start S] [--end S]

Writes to <out_dir>:
  contact.jpg   2 frames per second, 8 per row (the whole edit at a glance)
  phone.jpg     1 frame per second at 360 px wide (what a phone shows: can you read it?)
  hook.jpg      the first 3 s at 6 fps (does frame 0 already work? is the hook in by 1.5 s?)
  metrics.json  duration, loudness (LUFS / true peak), longest stretch with no visual change,
                frozen stretches, near-black frames
"""
import argparse
import json
import math
import os
import re
import subprocess


def run(args):
    return subprocess.run(args, capture_output=True, text=True)


def probe_duration(path):
    r = run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path])
    return float(r.stdout.strip())


HAS_DRAWTEXT = "drawtext" in run(["ffmpeg", "-hide_banner", "-filters"]).stdout


def sheet(src, out, fps, width, cols, start, end):
    """Tiles read left→right, top→bottom; tile i shows second start + i/fps (stamped when ffmpeg has drawtext)."""
    n = max(1, math.ceil((end - start) * fps))
    rows = math.ceil(n / cols)
    stamp = f"drawtext=text='%{{pts\\:hms}}':x=6:y=6:fontsize={max(12, width // 14)}:fontcolor=white:box=1:boxcolor=black@0.6," if HAS_DRAWTEXT else ""
    run([
        "ffmpeg", "-v", "error", "-y", "-ss", str(start), "-to", str(end), "-i", src,
        "-vf", f"fps={fps},scale={width}:-2,{stamp}tile={cols}x{rows}:padding=4:color=white",
        "-frames:v", "1", "-q:v", "3", out,
    ])
    return {"file": os.path.basename(out), "fps": fps, "cols": cols, "tile_i_is_second": f"{start} + i/{fps}"}


def visual_events(src, start, end):
    """Times where the picture changes noticeably (cuts, scenes, UI pops, caption changes)."""
    r = run([
        "ffmpeg", "-v", "info", "-ss", str(start), "-to", str(end), "-i", src,
        "-vf", "scale=270:-2,select='gt(scene,0.04)',showinfo", "-an", "-f", "null", "-",
    ])
    return [start + float(t) for t in re.findall(r"pts_time:([\d.]+)", r.stderr)]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("out")
    ap.add_argument("--start", type=float, default=0.0)
    ap.add_argument("--end", type=float, default=None)
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    dur = probe_duration(a.video)
    end = min(a.end or dur, dur)

    sheets = [
        sheet(a.video, os.path.join(a.out, "contact.jpg"), 2, 270, 8, a.start, end),
        sheet(a.video, os.path.join(a.out, "phone.jpg"), 1, 360, 6, a.start, end),
        sheet(a.video, os.path.join(a.out, "hook.jpg"), 6, 270, 6, a.start, min(end, a.start + 3)),
    ]

    ev = visual_events(a.video, a.start, end)
    marks = [a.start] + ev + [end]
    gaps = sorted(((round(b - x, 2), round(x, 2)) for x, b in zip(marks, marks[1:])), reverse=True)

    lr = run(["ffmpeg", "-v", "info", "-ss", str(a.start), "-to", str(end), "-i", a.video, "-af", "ebur128=peak=true", "-f", "null", "-"]).stderr
    lufs = re.findall(r"I:\s+(-?[\d.]+) LUFS", lr)
    peak = re.findall(r"Peak:\s+(-?[\d.]+) dBFS", lr)

    fr = run(["ffmpeg", "-v", "info", "-ss", str(a.start), "-to", str(end), "-i", a.video, "-vf", "freezedetect=n=0.002:d=2.5", "-an", "-f", "null", "-"]).stderr
    frozen = [(round(float(s), 2), round(float(d), 2)) for s, d in zip(re.findall(r"freeze_start: ([\d.]+)", fr), re.findall(r"freeze_duration: ([\d.]+)", fr))]
    bl = run(["ffmpeg", "-v", "info", "-ss", str(a.start), "-to", str(end), "-i", a.video, "-vf", "blackdetect=d=0.05:pix_th=0.06", "-an", "-f", "null", "-"]).stderr
    black = [round(float(t), 2) for t in re.findall(r"black_start:([\d.]+)", bl)]

    metrics = {
        "duration": round(end - a.start, 2),
        "loudness_lufs": float(lufs[-1]) if lufs else None,
        "true_peak_dbfs": float(peak[-1]) if peak else None,
        "visual_events": len(ev),
        "longest_static_gaps": [{"seconds": g, "from": t} for g, t in gaps[:5]],
        "frozen_stretches": [{"from": s, "seconds": d} for s, d in frozen],
        "black_frames_at": black,
        "sheets": sheets,
    }
    json.dump(metrics, open(os.path.join(a.out, "metrics.json"), "w"), indent=1)
    print(json.dumps(metrics, indent=1))


if __name__ == "__main__":
    main()

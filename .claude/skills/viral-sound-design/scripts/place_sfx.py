#!/usr/bin/env python3
"""Turn a sound-design cue sheet into frame-accurate `sfx` entries in edit.json.

Usage: place_sfx.py <project_dir> <cues.json> [--sfx-root <public/sfx>] [--pass whooshes|textures|risers|all]

cues.json = [
  {"track": "WHOOSHES", "sound": "whooshes/deep_voice_02", "event": 112, "db": -12, "note": "L02 scene slides in"},
  {"track": "RISERS",   "sound": "risers/sharp_bass_riser_01", "event": 150, "db": -5, "align": "end"},
  ...
]
- event = the visual frame the sound is locked to (fastest frame of a move / pop frame / transition frame).
- align: "peak" (default — the file's loudest point from manifest.json lands on `event`),
         "onset" (first audible moment lands on event; pack sounds only, else same as start),
         "start" (clip starts at event), "end" (clip ends on event — risers resolving into a cut).
- lead: optional frames to arrive early (2–3 for transitions).
Entries for the tracks present in cues.json REPLACE existing entries on those tracks (one family per track);
other tracks are kept, so passes can be run one after another.
"""
import argparse
import json
import os


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("project")
    ap.add_argument("cues")
    ap.add_argument("--sfx-root", default=None)
    args = ap.parse_args()
    P = args.project
    root = args.sfx_root or os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(P))), "sfx")
    manifest = json.load(open(os.path.join(root, "manifest.json")))
    edit_path = os.path.join(P, "edit.json")
    edit = json.load(open(edit_path))
    fps = edit["fps"]
    cues = json.load(open(args.cues))

    tracks = {c["track"] for c in cues}
    out = [s for s in edit.get("sfx", []) if s["track"] not in tracks]
    for c in cues:
        rel = c["sound"] if c["sound"].endswith(".wav") else c["sound"] + ".wav"
        m = manifest.get(rel)
        if m is None:
            raise SystemExit(f"unknown sound {rel}")
        align = c.get("align", "peak")
        off = {"peak": m["peak"], "onset": m.get("onset", 0.0), "start": 0.0, "end": m["duration"]}[align]
        if align == "end":
            off = m["peak"]  # risers peak at their end; lock the peak (not the silent tail) to the cut
        start = int(round(c["event"] - off * fps - c.get("lead", 0)))
        out.append({
            "track": c["track"],
            "file": f"sfx/{rel}",
            "frame": max(0, start),
            "eventFrame": c["event"],
            "volumeDb": c["db"],
            **({"note": c["note"]} if c.get("note") else {}),
        })
        if start < 0:
            print(f"warning: {rel} would start before frame 0 (event {c['event']}), clamped")
    order = {"WHOOSHES": 0, "TEXTURES": 1, "RISERS": 2, "HITS": 3, "MUSIC": 4}
    out.sort(key=lambda s: (order.get(s["track"], 9), s["frame"]))
    edit["sfx"] = out
    json.dump(edit, open(edit_path, "w"), ensure_ascii=False, indent=1)
    for s in out:
        print(f"{s['track']:9s} f{s['frame']:5d} (event {s['eventFrame']:5d}) {s['volumeDb']:>4} dB  {s['file']}  {s.get('note', '')}")


if __name__ == "__main__":
    main()

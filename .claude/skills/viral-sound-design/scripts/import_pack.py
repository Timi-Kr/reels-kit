#!/usr/bin/env python3
"""Import a user-supplied SFX pack into the studio library.

Usage: import_pack.py <pack_source_dir> <public/sfx> [--map references/pack-map.json]

Every file listed in pack-map.json is decoded with ffmpeg (WAV, MP3, ...), converted to 48 kHz stereo,
peak-normalized to -1 dBFS (same as the synthesized library, so the guide's dB levels mean the same thing)
and written to <sfx>/pack/<family>/<slug>.wav. manifest.json gets an entry with source "pack", the `use`
note, duration, peak (loudest 20 ms window, s from file start) and onset (first moment above -30 dB).
Files in the source folder that are NOT in the map are listed so they can be classified.
"""
import argparse
import json
import os
import subprocess

import numpy as np
from scipy.io import wavfile

SR = 48000
AUDIO_EXT = {".wav", ".mp3", ".aif", ".aiff", ".flac", ".m4a", ".ogg"}


def decode(path):
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", path, "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"],
        check=True, capture_output=True,
    ).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).astype(np.float64)


def envelope(x, win=0.02):
    mono = np.abs(x).max(axis=1)
    n = max(1, int(win * SR))
    pad = len(mono) % n
    m = np.pad(mono, (0, (n - pad) % n))
    return np.sqrt((m.reshape(-1, n) ** 2).mean(axis=1)), n


def main():
    here = os.path.dirname(os.path.abspath(__file__))
    ap = argparse.ArgumentParser()
    ap.add_argument("source")
    ap.add_argument("sfx")
    ap.add_argument("--map", default=os.path.join(here, "..", "references", "pack-map.json"))
    args = ap.parse_args()

    pack_map = {k: v for k, v in json.load(open(args.map)).items() if not k.startswith("_")}
    mpath = os.path.join(args.sfx, "manifest.json")
    manifest = json.load(open(mpath)) if os.path.exists(mpath) else {}

    for src, meta in pack_map.items():
        path = os.path.join(args.source, src)
        if not os.path.exists(path):
            print(f"missing: {src}")
            continue
        x = decode(path)
        x = x / (np.abs(x).max() or 1) * 10 ** (-1 / 20)
        env, n = envelope(x)
        peak = (int(env.argmax()) + 0.5) * n / SR
        above = np.nonzero(env > env.max() * 10 ** (-30 / 20))[0]
        onset = above[0] * n / SR if len(above) else 0.0
        rel = f"pack/{meta['family']}/{meta['slug']}.wav"
        os.makedirs(os.path.dirname(os.path.join(args.sfx, rel)), exist_ok=True)
        wavfile.write(os.path.join(args.sfx, rel), SR, (x * 32767).astype(np.int16))
        manifest[rel] = {
            "family": meta["family"],
            "name": meta["slug"],
            "source": "pack",
            "origin": src,
            "use": meta["use"],
            "duration": round(len(x) / SR, 3),
            "peak": round(peak, 3),
            "onset": round(onset, 3),
        }
        print(f"{rel:44s} {len(x) / SR:5.2f}s  peak@{peak:.3f}s  onset@{onset:.3f}s")

    json.dump(manifest, open(mpath, "w"), indent=1)

    known = set(pack_map)
    for root, _, files in os.walk(args.source):
        for f in files:
            rel = os.path.relpath(os.path.join(root, f), args.source)
            if os.path.splitext(f)[1].lower() in AUDIO_EXT and rel not in known:
                print(f"NOT MAPPED (add to pack-map.json): {rel}")


if __name__ == "__main__":
    main()

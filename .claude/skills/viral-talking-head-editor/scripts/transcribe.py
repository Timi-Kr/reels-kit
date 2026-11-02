#!/usr/bin/env python3
"""Word-level transcript with faster-whisper, built for finding bad takes.

Usage: transcribe.py <video_or_audio> <out.json> [--lang hr|en] [--model large-v3-turbo]
                     [--silence-db -35] [--min-silence 0.3]

Whisper tends to swallow repeated takes (it "dedupes" a restarted sentence into one long word).
So we first find silences with ffmpeg, split the audio into speech chunks, and transcribe every
chunk on its own — each take stays a separate piece of text.

Output: {"language", "duration",
         "words":[{"w","start","end","p"}],
         "segments":[{"text","start","end"}],      # one per speech chunk (≈ one take / phrase)
         "silences":[[start,end],...],             # used by cut.py to trim words to real speech
         "suspect":[{"w","start","end"}]}          # words that are still suspiciously long
"""
import argparse
import json
import os
import re
import subprocess
import tempfile

import numpy as np
from faster_whisper import WhisperModel
from scipy.io import wavfile


def detect_silences(wav, db, min_len):
    r = subprocess.run(
        ["ffmpeg", "-hide_banner", "-i", wav, "-af", f"silencedetect=noise={db}dB:d={min_len}", "-f", "null", "-"],
        capture_output=True, text=True,
    )
    starts = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", r.stderr)]
    ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", r.stderr)]
    sil = []
    for i, s in enumerate(starts):
        e = ends[i] if i < len(ends) else None
        sil.append([round(s, 3), round(e, 3) if e is not None else None])
    return sil


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("out")
    ap.add_argument("--lang", default=None, help="hr / en; default auto-detect")
    ap.add_argument("--model", default="large-v3-turbo")
    ap.add_argument("--prompt", default=None, help="initial prompt: names / jargon to spell right")
    ap.add_argument("--silence-db", type=float, default=-35)
    ap.add_argument("--min-silence", type=float, default=0.3)
    ap.add_argument("--max-chunk", type=float, default=20.0)
    args = ap.parse_args()

    with tempfile.TemporaryDirectory() as td:
        wav = os.path.join(td, "a.wav")
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", args.src, "-ac", "1", "-ar", "16000", wav], check=True)
        sr, audio = wavfile.read(wav)
        audio = audio.astype(np.float32) / 32768.0
        duration = len(audio) / sr

        sil = detect_silences(wav, args.silence_db, args.min_silence)
        sil = [[s, e if e is not None else duration] for s, e in sil]
        # speech chunks = complement of silences
        chunks, t = [], 0.0
        for s, e in sil:
            if s - t > 0.08:
                chunks.append([t, s])
            t = e
        if duration - t > 0.08:
            chunks.append([t, duration])
        # split chunks longer than max-chunk (rare: someone talking 20 s without a pause)
        split = []
        for a, b in chunks:
            while b - a > args.max_chunk:
                split.append([a, a + args.max_chunk])
                a += args.max_chunk
            split.append([a, b])
        chunks = split

        model = WhisperModel(args.model, device="cpu", compute_type="int8")
        lang = args.lang
        if lang is None:
            _, info = model.transcribe(audio[: int(min(duration, 30) * sr)], beam_size=1)
            lang = info.language

        words, segments = [], []
        PADS = 0.15
        for a, b in chunks:
            a0, b0 = max(0, a - PADS), min(duration, b + PADS)
            piece = audio[int(a0 * sr) : int(b0 * sr)]
            segs, _ = model.transcribe(
                piece, language=lang, word_timestamps=True, vad_filter=False,
                condition_on_previous_text=False, initial_prompt=args.prompt, beam_size=5,
            )
            cw = []
            for s in segs:
                for w in s.words or []:
                    ws, we = a0 + w.start, a0 + w.end
                    # keep words inside the speech chunk
                    ws, we = max(ws, a), min(we, b)
                    if we <= ws:
                        continue
                    cw.append({"w": w.word.strip(), "start": round(ws, 3), "end": round(we, 3), "p": round(w.probability, 3)})
            if cw:
                words += cw
                segments.append({"text": " ".join(x["w"] for x in cw), "start": cw[0]["start"], "end": cw[-1]["end"]})

    suspect = [w for w in words if (w["end"] - w["start"]) > max(1.0, 0.12 * len(w["w"]) + 0.5)]
    out = {"language": lang, "duration": round(duration, 3), "words": words, "segments": segments, "silences": sil, "suspect": suspect}
    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    json.dump(out, open(args.out, "w"), ensure_ascii=False, indent=1)
    print(f"language={lang} duration={duration:.1f}s words={len(words)} chunks={len(segments)}")
    for i, s in enumerate(segments):
        print(f"[{i:03d}] {s['start']:7.2f}-{s['end']:7.2f}  {s['text']}")
    if suspect:
        print("SUSPECT (long words, may hide a swallowed take — listen / re-check):")
        for w in suspect:
            print(f"   {w['start']:.2f}-{w['end']:.2f} {w['w']}")


if __name__ == "__main__":
    main()

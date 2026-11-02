#!/usr/bin/env python3
"""Synthesize the SFX library used by the viral-sound-design skill.

Usage: python3 -I generate_sfx.py <out_dir> [--only folder/name] [--seed N]

Creates <out_dir>/<family>/<name>_0{1,2,3}.wav (48 kHz stereo, peak -1 dBFS)
and <out_dir>/manifest.json with duration + peak time (s) for each file,
so whoosh peaks / transients can be aligned to the exact frame.
"""
import argparse
import json
import os

import numpy as np
from scipy import signal
from scipy.io import wavfile

SR = 48000
rng = np.random.default_rng(7)


# ---------------------------------------------------------------- helpers
def t_axis(dur):
    return np.arange(int(dur * SR)) / SR


def noise(dur):
    return rng.standard_normal(int(dur * SR))


def pink(dur):
    n = int(dur * SR)
    f = np.fft.rfftfreq(n, 1 / SR)
    spec = rng.standard_normal(len(f)) + 1j * rng.standard_normal(len(f))
    spec[1:] /= np.sqrt(f[1:])
    spec[0] = 0
    x = np.fft.irfft(spec, n)
    return x / (np.abs(x).max() + 1e-9)


def env_ar(dur, peak_pos, attack_curve=2.0, release_curve=2.0):
    """Asymmetric envelope that rises to 1 at peak_pos (0..1) then decays."""
    t = np.linspace(0, 1, int(dur * SR))
    e = np.where(
        t < peak_pos,
        (t / max(peak_pos, 1e-6)) ** attack_curve,
        (1 - (t - peak_pos) / max(1 - peak_pos, 1e-6)).clip(0) ** release_curve,
    )
    return e


def exp_decay(dur, tau):
    return np.exp(-t_axis(dur) / tau)


def sweep_filter(x, f_start, f_end, q=1.0, btype="bandpass", curve=None, chunk=256):
    """Time-varying biquad: center freq follows f_start->f_end (or a curve 0..1)."""
    n = len(x)
    out = np.zeros(n)
    zi = np.zeros((1, 2))
    pos = np.linspace(0, 1, n) if curve is None else curve
    for i in range(0, n, chunk):
        p = pos[min(i, n - 1)]
        fc = f_start * (f_end / f_start) ** p
        fc = float(np.clip(fc, 30, SR / 2 - 500))
        if btype == "bandpass":
            bw = fc / q
            lo, hi = max(fc - bw / 2, 20), min(fc + bw / 2, SR / 2 - 100)
            sos = signal.butter(1, [lo, hi], btype="bandpass", fs=SR, output="sos")
        else:
            sos = signal.butter(2, fc, btype=btype, fs=SR, output="sos")
        seg = x[i : i + chunk]
        y, zi_new = signal.sosfilt(sos, seg, zi=zi if zi.shape == (sos.shape[0], 2) else np.zeros((sos.shape[0], 2)))
        zi = zi_new
        out[i : i + chunk] = y
    return out


def filt(x, f, btype="lowpass", order=4):
    sos = signal.butter(order, f, btype=btype, fs=SR, output="sos")
    return signal.sosfilt(sos, x)


def reverb(x, decay=1.2, mix=0.3, predelay=0.01, bright=6000):
    ir = noise(decay) * exp_decay(decay, decay / 6)
    ir = filt(ir, bright)
    ir = np.concatenate([np.zeros(int(predelay * SR)), ir])
    ir /= np.abs(ir).sum() ** 0.5 * 4
    wet = signal.fftconvolve(x, ir)[: len(x) + len(ir) - 1]
    dry = np.concatenate([x, np.zeros(len(wet) - len(x))])
    return dry * (1 - mix) + wet * mix


def tone(freq, dur, kind="sine"):
    """freq may be a scalar or an array (per-sample) for glides."""
    n = int(dur * SR)
    f = np.broadcast_to(np.asarray(freq, dtype=float), (n,)) if np.ndim(freq) == 0 else freq[:n]
    ph = 2 * np.pi * np.cumsum(f) / SR
    if kind == "sine":
        return np.sin(ph)
    if kind == "square":
        return np.sign(np.sin(ph)) * 0.6
    if kind == "saw":
        return 2 * ((ph / (2 * np.pi)) % 1) - 1
    if kind == "tri":
        return 2 * np.abs(2 * ((ph / (2 * np.pi)) % 1) - 1) - 1
    raise ValueError(kind)


def glide(f0, f1, dur, curve=1.0):
    p = np.linspace(0, 1, int(dur * SR)) ** curve
    return f0 * (f1 / f0) ** p


def click(dur=0.012, f=3000, decay=0.002, q=4):
    x = noise(dur) * exp_decay(dur, decay)
    return sweep_filter(x, f, f, q=q)


def mix(*xs):
    out = np.zeros(max(len(x) for x in xs))
    for x in xs:
        out[: len(x)] += x
    return out


def place(base, x, at):
    i = int(at * SR)
    end = min(len(base), i + len(x))
    base[i:end] += x[: end - i]
    return base


def pan_sweep(x, start=-0.6, end=0.6):
    p = np.linspace(start, end, len(x))
    l = np.cos((p + 1) * np.pi / 4)
    r = np.sin((p + 1) * np.pi / 4)
    return np.stack([x * l, x * r], 1)


def stereo(x, width=0.0):
    if width <= 0:
        return np.stack([x, x], 1)
    d = int(0.012 * SR * width)
    r = np.concatenate([np.zeros(d), x])[: len(x)]
    return np.stack([x, x * (1 - width * 0.3) + r * width * 0.3], 1)


def fade(x, fin=0.003, fout=0.02):
    n = len(x)
    a, b = int(fin * SR), int(fout * SR)
    w = np.ones(n)
    if a:
        w[:a] = np.linspace(0, 1, a)
    if b:
        w[-b:] *= np.linspace(1, 0, b)
    return x * (w[:, None] if x.ndim == 2 else w)


def finish(x):
    if x.ndim == 1:
        x = stereo(x)
    x = fade(x)
    x = x / (np.abs(x).max() + 1e-9) * 10 ** (-1 / 20)
    return x


def peak_time(x):
    mono = np.abs(x).mean(1) if x.ndim == 2 else np.abs(x)
    win = int(0.01 * SR)
    env = np.convolve(mono, np.ones(win) / win, "same")
    return float(np.argmax(env) / SR)


# ---------------------------------------------------------------- whooshes
def whoosh(dur, peak, f0, f1, f2, q, color="white", tonal=None, sub=None, pan=True, rv=0.15):
    base = pink(dur) if color == "pink" else noise(dur)
    n = len(base)
    pk = int(peak * n)
    # center freq rises f0->f1 into the peak then falls to f2 (doppler feel)
    fc = np.concatenate([f0 * (f1 / f0) ** (np.linspace(0, 1, pk) ** 1.4), f1 * (f2 / f1) ** np.linspace(0, 1, n - pk)])
    curve = np.log(fc / f0) / np.log(max(f1, f0 * 1.0001) / f0)
    x = sweep_filter(base, f0, f1, q=q, curve=curve)
    e = env_ar(dur, peak, 2.2, 1.6)
    x = x * e
    if tonal is not None:
        kind, a, b, lvl = tonal
        x += tone(np.concatenate([glide(a, b, peak * dur), glide(b, a * 0.8, dur - peak * dur + 1 / SR)]), dur, kind)[:n] * e * lvl
    if sub is not None:
        a, b, lvl = sub
        x += tone(glide(a, b, dur), dur)[:n] * e**1.5 * lvl
    x = x / (np.abs(x).max() + 1e-9)
    x = reverb(x, 0.8, rv)[: n + int(0.25 * SR)]
    return pan_sweep(x, -0.7, 0.7) if pan else stereo(x, 0.5)


def W(v):
    s = [0.9, 1.0, 1.15][v]
    return s


WHOOSHES = {
    "classy_airy": lambda v: whoosh(1.4 * W(v), 0.55, 300, 2200, 500, 0.8, "pink", rv=0.35),
    "hollow": lambda v: whoosh(0.75 * W(v), 0.5, 350, 1400 + 200 * v, 450, 4.0, rv=0.25),
    "futuristic": lambda v: whoosh(0.7 * W(v), 0.5, 500, 3500, 800, 2.0, tonal=("saw", 180 + 40 * v, 900, 0.18)),
    "deep_voice": lambda v: whoosh(0.8 * W(v), 0.5, 200, 1200, 260, 2.5, tonal=("sine", 90 + 15 * v, 260, 0.35), sub=(60, 110, 0.4)),
    "generic_long": lambda v: whoosh(2.2 * W(v), 0.82, 200, 3000, 600, 1.2, "pink", rv=0.25),
    "organic_wind": lambda v: whoosh(1.6 * W(v), 0.5, 250, 900, 300, 1.5, "pink", rv=0.3),
    "short": lambda v: whoosh(0.28 * W(v), 0.45, 600, 4000, 1200, 1.5, rv=0.1),
    "synthetic": lambda v: whoosh(0.9 * W(v), 0.55, 300, 5000, 400, 2.0, tonal=("square", 120, 1400 + 200 * v, 0.12)),
    "transition_spacey": lambda v: whoosh(1.2 * W(v), 0.6, 250, 4000, 500, 1.8, tonal=("tri", 400 + 50 * v, 1600, 0.15), rv=0.45),
    "water_dropper": lambda v: water_drop(v),
}


def water_drop(v):
    w = whoosh(0.7, 0.5, 400, 2500, 500, 2.0, rv=0.2)
    d = 0.35
    b = tone(glide(1400 + 200 * v, 300, d, 0.5), d) * exp_decay(d, 0.08)
    b = reverb(b, 0.6, 0.35)
    out = np.zeros((len(w) + len(b), 2))
    out[: len(w)] += w * 0.7
    at = int(0.33 * SR)
    out[at : at + len(b)] += stereo(b, 0.6) * 0.8
    return out


# ---------------------------------------------------------------- textures
def pop(v):
    d = 0.12
    x = tone(glide(700 + 120 * v, 180, d, 0.4), d) * exp_decay(d, 0.03)
    x[: int(0.01 * SR)] += click(0.01, 2500, 0.001) * 0.5
    return x


def ui_click(v):
    d = 0.05
    x = tone(2200 + 400 * v, d) * exp_decay(d, 0.008) * 0.7
    x[: int(0.012 * SR)] += click(0.012, 4000, 0.0015)
    return reverb(x, 0.25, 0.12)


def scifi_click(v):
    d = 0.18
    x = tone(glide(900, 2600 + 300 * v, d, 0.3), d, "square") * exp_decay(d, 0.03)
    x = filt(x, 6000)
    y = np.zeros(int(0.35 * SR))
    place(y, x, 0)
    place(y, x * 0.35, 0.08)
    place(y, x * 0.12, 0.16)
    return stereo(y, 0.7)


def mechanical_click(v):
    d = 0.08
    x = mix(click(0.03, 1800 + 500 * v, 0.004, 3), click(0.03, 5000, 0.002, 6) * 0.5)
    y = np.zeros(int(d * SR))
    place(y, x, 0)
    place(y, click(0.02, 1200, 0.003, 3) * 0.4, 0.03)
    return y


def analog_button(v):
    d = 0.14
    y = np.zeros(int(d * SR))
    place(y, mix(click(0.04, 900 + 150 * v, 0.006, 5), tone(180, 0.04) * exp_decay(0.04, 0.008) * 0.6), 0)
    place(y, click(0.03, 1500, 0.004, 5) * 0.5, 0.07)
    return y


def gears(v, dur=0.9):
    y = np.zeros(int(dur * SR))
    t = 0.0
    k = 0
    while t < dur - 0.05:
        f = [3200, 4200, 2600][k % 3] + 300 * v
        place(y, click(0.025, f, 0.0025, 10) * (0.6 + 0.4 * rng.random()), t)
        t += 0.035 + 0.02 * rng.random()
        k += 1
    y *= np.linspace(0.8, 1.0, len(y))
    return reverb(y, 0.3, 0.1)


def complex_mechanism(v):
    y = gears(v, 1.2)
    place(y, analog_button(v)[: int(0.14 * SR)], 0.0)
    place(y, mechanical_click(v), 1.05)
    return y


def keyboard_writing(v):
    dur = 1.4
    y = np.zeros(int(dur * SR))
    t = 0.0
    while t < dur - 0.06:
        f = 1500 + 900 * rng.random()
        place(y, mix(click(0.03, f, 0.004, 3), click(0.015, 6000, 0.001, 4) * 0.3), t)
        t += 0.06 + 0.07 * rng.random()
    return reverb(y, 0.2, 0.08)


def video_scan(v):
    d = 0.55
    lfo = 0.5 + 0.5 * np.sin(2 * np.pi * (30 + 6 * v) * t_axis(d))
    x = tone(glide(300, 1200 + 200 * v, d), d, "saw") * lfo * env_ar(d, 0.7)
    x = filt(x, 5000)
    x[: int(0.015 * SR)] += click(0.015, 3000, 0.002)
    return stereo(x, 0.5)


def scifi_impact(v):
    d = 1.2
    sub = tone(glide(120 + 10 * v, 38, d, 0.3), d) * exp_decay(d, 0.25)
    burst = filt(noise(d), 3500) * exp_decay(d, 0.05)
    metal = sum(tone(f, d) * exp_decay(d, 0.3 + 0.1 * i) for i, f in enumerate([523 + 30 * v, 1187, 1873, 2711])) * 0.12
    zap = tone(glide(2500, 200, 0.15), 0.15, "square") * exp_decay(0.15, 0.04) * 0.3
    x = sub * 0.9 + burst * 0.6 + metal
    x[: len(zap)] += zap
    return stereo(reverb(x, 1.4, 0.3), 0.6)


def scifi_hit(v):
    d = 0.6
    x = tone(glide(220 + 30 * v, 55, d, 0.25), d, "tri") * exp_decay(d, 0.12)
    x += filt(noise(d), 6000) * exp_decay(d, 0.025) * 0.7
    x += tone(glide(1800, 900, d), d, "square") * exp_decay(d, 0.05) * 0.15
    return stereo(reverb(x, 0.9, 0.25), 0.6)


def activate_energy(v):
    d = 1.1
    t = t_axis(d)
    carrier = glide(150 + 20 * v, 900, d, 1.6)
    mod = np.sin(2 * np.pi * np.cumsum(carrier * 2.01) / SR) * np.linspace(0.5, 4, len(t))
    x = np.sin(2 * np.pi * np.cumsum(carrier) / SR + mod) * env_ar(d, 0.85, 1.5, 1.0)
    shimmer = filt(noise(d), 7000, "highpass") * env_ar(d, 0.9, 3, 1) * 0.3
    return stereo(reverb(x * 0.7 + shimmer, 1.2, 0.35), 0.8)


def camera_click(v):
    d = 0.25
    y = np.zeros(int(d * SR))
    place(y, mix(click(0.02, 2500 + 400 * v, 0.003, 2), click(0.01, 7000, 0.001, 3) * 0.5), 0)
    place(y, filt(noise(0.06), 3000) * exp_decay(0.06, 0.012) * 0.4, 0.015)
    place(y, click(0.02, 1800, 0.003, 2) * 0.7, 0.11)
    return stereo(reverb(y, 0.2, 0.1), 0.3)


def heavenly_choir(v):
    d = 2.6
    root = [261.6, 293.7, 246.9][v]
    chord = [1, 5 / 4, 3 / 2, 2, 5 / 2]
    x = np.zeros(int(d * SR))
    for r in chord:
        for det in (-0.004, 0.004):
            x += tone(root * r * (1 + det), d, "saw") * 0.15
    vib = 1 + 0.003 * np.sin(2 * np.pi * 5 * t_axis(d))
    x = x * vib
    # "aah" formants
    y = sum(sweep_filter(x, f, f, q=6) * g for f, g in [(730, 1.0), (1090, 0.5), (2440, 0.25)])
    y *= env_ar(d, 0.45, 1.2, 1.2)
    return stereo(reverb(y, 2.0, 0.45), 0.9)


def success_reward(v):
    notes = [[523.3, 659.3, 784.0, 1046.5], [587.3, 740.0, 880.0, 1174.7], [659.3, 830.6, 987.8, 1318.5]][v]
    d = 1.0
    y = np.zeros(int(d * SR))
    for i, f in enumerate(notes):
        nd = 0.5
        b = (tone(f, nd) + 0.3 * tone(f * 2.76, nd) * exp_decay(nd, 0.05)) * exp_decay(nd, 0.15)
        place(y, b * 0.5, i * 0.08)
    return stereo(reverb(y, 1.0, 0.3), 0.6)


def alarm_buzzer(v):
    d = 1.2
    x = tone(420 + 30 * v, d, "square") * (np.sin(2 * np.pi * 4 * t_axis(d)) > 0)
    return filt(x, 2500) * env_ar(d, 0.5, 1, 1)


def ui_success(v):
    d = 0.4
    y = np.zeros(int(d * SR))
    for i, f in enumerate([880 + 60 * v, 1318.5 + 90 * v]):
        place(y, tone(f, 0.2) * exp_decay(0.2, 0.06) * 0.6, i * 0.09)
    return reverb(y, 0.4, 0.2)


def ui_fail(v):
    d = 0.45
    y = np.zeros(int(d * SR))
    for i, f in enumerate([330 - 20 * v, 247 - 15 * v]):
        place(y, filt(tone(f, 0.18, "square"), 2500) * exp_decay(0.18, 0.08) * 0.6, i * 0.13)
    return y


TEXTURES = {
    "pop": pop,
    "ui_click": ui_click,
    "scifi_click": scifi_click,
    "mechanical_click": mechanical_click,
    "analog_button": analog_button,
    "tiny_gearwheel": lambda v: gears(v, 0.6),
    "complex_mechanism_gizmo": complex_mechanism,
    "keyboard_writing": keyboard_writing,
    "video_scan": video_scan,
    "scifi_impact": scifi_impact,
    "scifi_hit": scifi_hit,
    "activate_protection_energy": activate_energy,
    "digital_camera_click": camera_click,
    "cartoon_heavenly_choir": heavenly_choir,
    "success_reward": success_reward,
    "alarm_buzzer": alarm_buzzer,
    "ui_success": ui_success,
    "ui_fail": ui_fail,
}


# ---------------------------------------------------------------- risers & hits
def sharp_bass_riser(v):
    d = [2.5, 3.0, 4.0][v]
    sub = tone(glide(35, 140, d, 1.8), d, "saw")
    sub = filt(sub, 900)
    x = sub * 0.6 + sweep_filter(noise(d), 200, 6000, q=1.2, curve=np.linspace(0, 1, int(d * SR)) ** 2) * 0.5
    x *= np.linspace(0, 1, len(x)) ** 2.6
    x[-int(0.01 * SR):] *= np.linspace(1, 0, int(0.01 * SR))
    return stereo(x, 0.7)


def metallic_riser(v):
    d = [2.5, 3.0, 4.0][v]
    partials = [1, 2.76, 5.4, 8.93]
    base = glide(180 + 30 * v, 900, d, 1.7)
    x = sum(tone(base * p, d) / (i + 1) for i, p in enumerate(partials))
    x *= 1 + 0.6 * np.sin(2 * np.pi * glide(4, 22, d) * t_axis(d))
    x += sweep_filter(noise(d), 1500, 9000, q=2, curve=np.linspace(0, 1, int(d * SR)) ** 2) * 0.4
    x *= np.linspace(0, 1, len(x)) ** 2.4
    x[-int(0.01 * SR):] *= np.linspace(1, 0, int(0.01 * SR))
    return stereo(reverb(x, 0.6, 0.2)[: len(x)], 0.8)


def suspense_buildup(v):
    d = 4.0
    x = sum(tone(glide(f, f * 1.5, d), d, "saw") for f in [110 + 5 * v, 164.8, 220.5]) / 3
    x = filt(x, 1800)
    x *= 0.6 + 0.4 * np.sin(2 * np.pi * glide(6, 14, d) * t_axis(d))
    x *= np.linspace(0, 1, len(x)) ** 2
    return stereo(reverb(x, 1.0, 0.3)[: len(x)], 0.8)


def suckback_riser(v):
    d = [1.5, 2.0, 2.6][v]
    burst = filt(noise(0.2), 5000) * exp_decay(0.2, 0.03) + tone(110, 0.2) * exp_decay(0.2, 0.06)
    tail = reverb(burst, d, 0.9)[: int(d * SR)]
    x = tail[::-1].copy()
    x *= np.linspace(0.2, 1, len(x)) ** 1.5
    x[-int(0.008 * SR):] *= np.linspace(1, 0, int(0.008 * SR))
    return stereo(x, 0.9)


def impact_hit(v):
    d = 2.2
    x = tone(glide(90 + 10 * v, 35, d, 0.3), d) * exp_decay(d, 0.5)
    x += filt(noise(d), 2500) * exp_decay(d, 0.06) * 0.8
    return stereo(reverb(x, 2.0, 0.35), 0.7)


def bass_hit(v):
    d = 2.0
    x = tone(glide(70 + 8 * v, 38, d, 0.2), d) * exp_decay(d, 0.6)
    x = np.tanh(x * 2.5) * 0.8
    x[: int(0.004 * SR)] += click(0.004, 1500, 0.001)
    return stereo(x)


def heavy_hit(v):
    d = 2.6
    x = tone(glide(60 + 5 * v, 30, d, 0.25), d) * exp_decay(d, 0.7)
    x += filt(noise(d), 1800) * exp_decay(d, 0.12) * 0.9
    x += sum(tone(f, d) * exp_decay(d, 0.5) for f in [196, 311, 466]) * 0.08
    x = np.tanh(x * 2.0)
    return stereo(reverb(x, 2.4, 0.4), 0.8)


RISERS = {
    "sharp_bass_riser": sharp_bass_riser,
    "metallic_riser": metallic_riser,
    "suspenseful_buildup": suspense_buildup,
    "suckback_riser": suckback_riser,
}
HITS = {"impact_hit": impact_hit, "bass_hit": bass_hit, "heavy_hit": heavy_hit}

LIBRARY = {"whooshes": WHOOSHES, "textures": TEXTURES, "risers": RISERS, "hits": HITS}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("out")
    ap.add_argument("--only", help="family/name, e.g. whooshes/hollow")
    args = ap.parse_args()
    mpath = os.path.join(args.out, "manifest.json")
    manifest = json.load(open(mpath)) if os.path.exists(mpath) else {}
    for fam, items in LIBRARY.items():
        os.makedirs(os.path.join(args.out, fam), exist_ok=True)
        for name, fn in items.items():
            if args.only and args.only != f"{fam}/{name}":
                continue
            for v in range(3):
                x = finish(np.asarray(fn(v), dtype=float))
                rel = f"{fam}/{name}_0{v + 1}.wav"
                wavfile.write(os.path.join(args.out, rel), SR, (x * 32767).astype(np.int16))
                manifest[rel] = {
                    "family": fam,
                    "name": name,
                    "variation": v + 1,
                    "duration": round(len(x) / SR, 3),
                    "peak": round(peak_time(x), 3),
                }
                print(f"{rel:48s} {len(x) / SR:5.2f}s  peak@{manifest[rel]['peak']:.3f}s")
    json.dump(manifest, open(mpath, "w"), indent=1)


if __name__ == "__main__":
    main()

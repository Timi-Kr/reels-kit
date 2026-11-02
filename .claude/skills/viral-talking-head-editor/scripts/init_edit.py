#!/usr/bin/env python3
"""Create / refresh <project>/edit.json from transcript.json + plan.json.

Usage: init_edit.py <project_dir> [--fps 30] [--reset-scenes]

- style            ← plan.style (defaults if missing)
- captions         ← regenerated every run: word groups (≤3 words / ≤20 chars, break on punctuation & pauses),
                     plan highlight words marked script:true
- scenes           ← one stub per plan line whose type != captions (component = "<lineId>"), only created
                     when edit.json has no scenes yet or --reset-scenes is passed. Existing scenes are kept.
- durationInFrames ← cut duration
- camera / sfx / music are preserved.
"""
import argparse
import json
import os
import re
import unicodedata

DEFAULT_STYLE = {
    "accent": "#F19A3E",
    "sansFont": "Inter",
    "scriptFont": "Cormorant Garamond",
    "sansColor": "#F3F3F3",
    "scriptColor": "#F19A3E",
    "dark": "#2B2B2B",
    "light": "#ECE8E1",
    "bg": "mix",
}


def norm(s):
    s = unicodedata.normalize("NFKD", s.lower())
    return re.sub(r"[^\w%$€]+", "", "".join(c for c in s if not unicodedata.combining(c)))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("project")
    ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--reset-scenes", action="store_true")
    args = ap.parse_args()
    P = args.project
    fps = args.fps
    slug = os.path.basename(os.path.abspath(P))
    tr = json.load(open(os.path.join(P, "transcript.json")))
    plan_path = os.path.join(P, "plan.json")
    plan = json.load(open(plan_path)) if os.path.exists(plan_path) else {"style": {}, "lines": []}
    edit_path = os.path.join(P, "edit.json")
    edit = json.load(open(edit_path)) if os.path.exists(edit_path) else {}

    style = {**DEFAULT_STYLE, **edit.get("style", {}), **plan.get("style", {})}
    F = lambda t: int(round(t * fps))
    words = tr["words"]
    dur = F(tr["duration"]) + 6

    # highlight words per plan line (matched by time range)
    hl = []  # (start, end, set(norm words))
    for l in plan.get("lines", []):
        toks = {norm(t) for h in l.get("highlight", []) for t in h.split()}
        toks.discard("")
        if toks:
            hl.append((l["start"] - 0.05, l["end"] + 0.05, toks))

    def is_script(w):
        n = norm(w["w"])
        return any(a <= w["start"] <= b and n in toks for a, b, toks in hl)

    groups, cur = [], []
    for i, w in enumerate(words):
        cur.append(w)
        nxt = words[i + 1] if i + 1 < len(words) else None
        chars = sum(len(x["w"]) + 1 for x in cur)
        brk = (
            nxt is None
            or re.search(r"[.!?,;:…]$", w["w"])
            or nxt["start"] - w["end"] > 0.3
            or len(cur) >= 3
            or chars + len(nxt["w"]) > 20
            or (is_script(nxt) and not is_script(w) and len(cur) >= 2)
            or (is_script(w) and not is_script(nxt) and any(not is_script(x) for x in cur))
        )
        if brk:
            groups.append(cur)
            cur = []

    captions = []
    for gi, g in enumerate(groups):
        frm = max(0, F(g[0]["start"]) - 2)
        nxt_from = F(groups[gi + 1][0]["start"]) - 2 if gi + 1 < len(groups) else dur
        to = min(nxt_from, F(g[-1]["end"]) + 18)
        ws = [{"text": re.sub(r"[.,;:]+$", "", w["w"]), "at": max(frm, F(w["start"]) - 1), **({"script": True} if is_script(w) else {})} for w in g]
        cap = {"from": frm, "to": max(to, frm + 6), "words": ws}
        if any(w.get("script") for w in ws):
            cap["layout"] = "stack"
        captions.append(cap)

    scenes = edit.get("scenes") or []
    if args.reset_scenes or not scenes:
        scenes = []
        for l in plan.get("lines", []):
            if l.get("type", "captions") == "captions":
                continue
            scenes.append({
                "id": l["id"],
                "type": l["type"],
                "from": max(0, F(l["start"]) - 3),
                "to": F(l["end"]) + 6,
                "component": l["id"],
                "props": {},
                "note": l.get("notes", ""),
                "look": l.get("bg", "auto"),
            })

    # scenes must not overlap: trim each scene's end to the next scene's start
    scenes.sort(key=lambda s: s["from"])
    for a, b in zip(scenes, scenes[1:]):
        if a["to"] > b["from"]:
            a["to"] = b["from"]

    out = {
        "fps": fps,
        "width": 1080,
        "height": 1920,
        "durationInFrames": dur,
        "video": f"projects/{slug}/cut.mp4",
        "style": style,
        "captions": captions,
        "scenes": scenes,
        "camera": edit.get("camera", []),
        "sfx": edit.get("sfx", []),
        **({"music": edit["music"]} if "music" in edit else {}),
    }
    json.dump(out, open(edit_path, "w"), ensure_ascii=False, indent=1)
    print(f"{edit_path}: {dur} frames, {len(captions)} caption groups, {len(scenes)} scenes")
    for s in scenes:
        print(f"  {s['id']:5s} {s['type']:10s} {s['from']:5d}-{s['to']:5d}  {s.get('note', '')[:70]}")


if __name__ == "__main__":
    main()

# Studio setup

The studio is the root of this repo. First time on a machine run `./setup.sh` there (checks Node ≥ 18, ffmpeg, Python 3.9+,
runs `npm ci`, creates `.venv` with faster-whisper/numpy/scipy, and pre-downloads the whisper model `large-v3-turbo`, ~1.6 GB).
Missing tools on macOS: `brew install node ffmpeg python`.

Layout:
```
./                          repo root = Remotion studio (Claude Code is opened here)
  .claude/skills/           viral-talking-head-editor + viral-sound-design
  public/sfx/               SFX library: pack/ (real sounds, used first) + synthesized fallback, manifest.json
  public/fonts/             local fonts (Creato Display)
  public/projects/<slug>/   raw.*, transcript_raw.json, cuts.json, cut.mp4, transcript.json,
                            lines.json, plan.html, plan.json, edit.json, cues.json, assets/
  src/Root.tsx              compositions "Edit" (props {slug}) and "UIKit" (catalogue of glow/iOS UI pieces)
  src/Edit.tsx              layers: TalkingHead → scenes → Captions → Audio
  src/components/           design.tsx (paper/editorial), glow.tsx (light + iOS UI), ui.tsx, Captions, TalkingHead, Audio
  src/projects/<slug>/      per-edit scene components (index.tsx exports `scenes`)
  src/projects/registry.ts  auto-registers every src/projects/<slug>/index.tsx
  out/                      renders + stills (git-ignored)
```

Commands (repo root):
- Studio preview: `npx remotion studio` → composition `Edit`, props `{"slug":"<slug>"}`; `UIKit` shows every UI piece.
- Still: `npx remotion still Edit out/stills/f120.png --frame=120 --props='{"slug":"<slug>"}' --scale=0.5`
- Render: `npx remotion render Edit out/<slug>.mp4 --props='{"slug":"<slug>"}'`
- Typecheck: `npx tsc --noEmit`
- Python: `.venv/bin/python -I <script>`

A Remotion "Version mismatch" warning pointing to a `node_modules` folder OUTSIDE this repo (e.g. `~/node_modules`) comes from stray packages on that machine; delete that folder if renders misbehave.

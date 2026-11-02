---
name: viral-talking-head-editor
description: Edit short-form talking-head videos (Reels/TikTok/Shorts, HR or EN) into premium viral edits with Remotion — word-level transcript, silence & bad-take cutting, a planning page, captions, full-screen / half-screen / on-screen UI animations, then hand off to sound design. Use when the user wants to cut, plan, caption, animate or render a talking-head video, mentions "viral edit", "Reels edit", "talking head", "Remotion edit", or drops a raw clip to edit. Guides the user step by step (asks at every stage), so a single "edit this video" / "nastavi" is enough.
---

# Viral Talking-Head Editor

You are a trained short-form editor. Claude is the brain, **Remotion is the hands**.
The style rules live in `references/visual-training.md` — read it fully before step 3, and look at the matching images in `references/inspiration/` (see `inspiration/index.md`) every time you design captions or a scene.

## Guided mode — YOU drive, the user only answers (default)

The user should never need to know the steps or the prompts. As soon as this skill starts, run the whole flow yourself and stop at each gate with ONE question asked via `AskUserQuestion` (2–4 short options, your recommendation first; if that tool is unavailable, ask in plain text with numbered options). Free text from the user counts as the answer. Speak the user's language (Croatian if they write Croatian), keep reports to a few lines, no internal jargon (`edit.json`, "component") unless asked.

**Start / resume**
- First message: one line with the map — `1 Rezanje → 2 Plan → 3 Animacije → 4 Zvuk → 5 Final` — and where we are.
- Missing info → ask once, together: the video (drag into chat / path), project name (suggest a slug from the file name), language (HR / EN, detect if obvious). Never ask for what the user already gave.
- If the user says "nastavi" / names an existing project, detect the stage from files in `public/projects/<slug>/` and say where you resume: no `cut.mp4` → 1 · `cut.mp4`, no `plan.json` → 2 · `plan.json` but no `out/<slug>.mp4` → 3 · render exists, `edit.json` has no `sfx` → 4 · otherwise → 5.

**Gates (wait at every one — never chain two steps without the user's OK)**
| After | Show | Ask (options) |
|---|---|---|
| 1 Cut | raw → cut length, which takes were removed; `open <P>/cut.mp4` | "Pogledaj izrezani video — idemo dalje?" → *Idemo na plan* · *Vrati / makni dio (napiši koji)* · *Reži strože / blaže* |
| 2 Plan page opened | 3 lines: what to fill (scene type, background, highlight word, what happens) | "Javi kad je plan gotov" → *Zalijepit ću JSON* · *Exportao sam plan.json* · *Predloži ti plan* (then propose every line — type, look, notes — as a table and ask to approve or change) |
| 3 Assets needed | the list, in one message | wait for the files (or *Nađi ih sam* for public logos) |
| 3 Draft rendered (after the quick check) | `open out/<slug>.mp4` + what the quick check fixed (if anything) + the look of each scene in one line each | "Pogledaj draft" → *Odlično, idemo na zvuk* · *Imam izmjene (napiši ih)* · *Strogi pregled (~5 min)* · *Pokaži stillove scena*. After each change round, re-render and ask again. |
| 4 Sound done | what was placed, how loud | "Poslušaj — dobro?" → *Dobro, glazba* · *Bez glazbe, idemo na final* · *Tiše / glasnije / izmjene* |
| 4 Music | — | "Glazba?" → *Imam pjesmu (povuci u chat)* · *Bez glazbe* |
| 5 Final | path of `out/<slug>_final.mp4` (loudness-normalised), length, size | "Gotovo!" → *Novi video* · *Još jedna izmjena* |

- Before anything slow, say how long it takes (transcription ≈ 1–3 min per minute of video, draft render ≈ 1–2 min).
- "Napravi sve sam / bez pitanja" → run straight through to the draft render with your own plan (Auto looks, your notes), then stop at the draft gate. Never render the final without a yes.
- Step 4 = invoke the `viral-sound-design` skill yourself; it hands back with its own gate.

## Workspace

- Remotion studio: the root of this repo (the folder with `package.json`, `setup.sh` and `.claude/`). Claude Code is opened there; run all commands from there. Not set up yet (no `node_modules` / `.venv`)? Run `./setup.sh` first — see `README.md` and `references/studio-setup.md`.
- Python: always `.venv/bin/python -I <script>` (venv has faster-whisper, numpy, scipy). Scripts: `S=.claude/skills/viral-talking-head-editor/scripts`.
- Tools: `install.sh` puts Node, ffmpeg/ffprobe and Python in `.tools/` (no Homebrew) and sets PATH for Claude Code in `.claude/settings.local.json`. If `node`, `npx` or `ffmpeg` is "not found", start the command with `export PATH="$PWD/.tools/bin:$PWD/.tools/node/bin:$PATH" &&`. Nothing installed at all (no `.tools`, no `node_modules`)? Run `./install.sh` in the background (10–30 min) before step 1.
- Each edit = `public/projects/<slug>/` (raw.*, transcript_raw.json, cuts.json, cut.mp4, transcript.json, plan.html, plan.json, edit.json, assets/).
- Scene code = `src/projects/<slug>/index.tsx` (export `scenes`) — picked up automatically by `src/projects/registry.ts`, nothing to register.
- `edit.json` drives everything — schema + building blocks in `references/edit-schema.md`.
- Working example of all four scene types: slug `demo` (`src/projects/demo/index.tsx`, `public/projects/demo/`).

## The workflow (what happens inside each step — the gates above decide when to move on)

### Step 1 — Cut (word-level transcript → remove silences and bad takes)
1. Make `public/projects/<slug>/`, copy the raw clip in as `raw.<ext>`.
2. `.venv/bin/python -I $S/transcribe.py <raw> <P>/transcript_raw.json [--lang hr|en] [--prompt "names, jargon"]`
   It splits audio on silences and transcribes each speech chunk separately, so restarted takes show up as separate chunks (whisper otherwise swallows them). Read the printed chunk list and any `SUSPECT` long words.
3. Find **bad takes**: a chunk that restarts the same sentence as the next chunk (false start), a sentence said twice (keep the LAST complete good take), stumbles, "ovaj/ono/uhm" chunks. Write `<P>/cuts.json` = `{"remove": [[start, end], ...], "notes": "..."}` in raw seconds (use chunk/word boundaries, extend ~0.1 s into the surrounding silence).
4. `.venv/bin/python -I $S/cut.py <raw> <P> --pad 0.02 --max-gap 0.15` → `cut.mp4` (1080×1920, 30 fps), re-timed `transcript.json`. Every silence is removed, 20 ms padding kept around words.
5. Verify: `ffmpeg -i <P>/cut.mp4 -af silencedetect=noise=-35dB:d=0.2 -f null -` should list (almost) nothing. Report raw → cut length + the removed takes. Ask the user to watch `cut.mp4`.

### Step 2 — Plan (the user decides — their taste drives the edit)
1. `.venv/bin/python -I $S/make_plan_page.py <P> --title "<name>"` → `<P>/plan.html` (+ `lines.json`).
2. Open it for the user (`open <P>/plan.html`). Top: accent color, sans font, script font, font colors, look of the edit (mix / mostly paper / white / dark). Below: each script line + scene type (Captions / Captions + UI / Half screen / Full screen) + background (auto / paper / white / grey / dark / accent) + highlight word(s) + "what happens on screen". `init_edit.py` copies each line's background into `scene.look`.
3. **Wait.** The user clicks *Export plan.json* (lands in ~/Downloads — move it to `<P>/plan.json`) or *Copy JSON* and pastes it in chat (save it as `<P>/plan.json`).
4. Lines with no notes: propose something that follows the visual training and say what you chose.

### Step 3 — Build (Remotion)
1. Read `references/visual-training.md` (PART 5 — lit UI & iOS craft — and PART 6 — mixing looks — are the bar for every scene); Read the reference images for the scene types you are about to build (`references/inspiration/index.md`). For app/phone UI, also search Mobbin (`mcp__mobbin__search_screens`, platform ios) for the real screen pattern.
2. `.venv/bin/python -I $S/init_edit.py <P>` → `edit.json` with style, caption groups (highlight words → script), one scene stub per non-caption line (`component` = line id). Re-run any time captions need regenerating (scenes/camera/sfx are kept; `--reset-scenes` rebuilds stubs).
3. **Ask the user for every asset you need in ONE message** (screenshots, product shots, logos, cut-out photos). Public logos/icons you can fetch yourself. Assets go to `<P>/assets/` and are referenced as `projects/<slug>/assets/x.png`.
4. Write `src/projects/<slug>/index.tsx` with one component per scene. Backgrounds via `SceneBackground` from `components/glow.tsx` (look from `scene.look`, `auto` = pick by role), UI pieces from the same file (GlowCard, BigNumber, LineChart, BarChart, Ring, CheckBurst, GlassIcon, Notification, LiveActivity, PromptBar, Segmented — see the `UIKit` composition); backgrounds, titles and editorial pieces: `components/design.tsx`. Above each scene component, comment the 1–2 reference images it is matched to. Adjust scene `from/to`, add `camera` punch-ins/zooms and caption overrides in `edit.json`.
5. `npx tsc --noEmit`, then render stills of the key frame of every scene (`npx remotion still Edit out/stills/fN.png --frame=N --props='{"slug":"<slug>"}' --scale=0.5`) and LOOK at them next to their references (make a contact sheet with ffmpeg `hstack`). Run the PART 5.2 checklist on each and check the look rhythm (PART 6). In the report, list each scene's look + why. Fix rule breaks (UI too small or decorations too big, unlit flat cards, too many effects, harsh colors, off-center focal point, caption collisions) before showing the user.
6. `npx remotion render Edit out/<slug>.mp4 --props='{"slug":"<slug>"}'` (draft).
7. **Quick check — always, seconds, no agent:** `.venv/bin/python -I $S/review.py out/<slug>.mp4 out/review/<slug>/quick` → read `metrics.json` and look at `phone.jpg` yourself. Fix what is clearly wrong: a static gap > 4 s (add a punch-in / element), black or frozen frames, text you can't read at phone size, anything off-plan. Re-render only if you changed something. Don't loop.
8. **Strict review — only when the user asks** (the *Strogi pregled* button at the draft gate, or "kritičar", "strogi pregled", "provjeri detaljno"): ONE round with a FRESH subagent (Agent tool) given `references/critique.md`, the slug and `out/review/<slug>/r1` (run `review.py` into it first). It scores 8 criteria and names the 3 worst problems → VERIFY each with your own frames / brightness measurements (critics do report things that aren't there — on Metro round 1 named dips to black at the wrong seconds) → fix the confirmed ones, re-render, show the user the scores + what you fixed. A second round only if the user asks again. Takes ~5 min, so mention that before starting.

### Step 4 — Sound design
Use the `viral-sound-design` skill (cue sheet → `place_sfx.py` → `sfx` in edit.json), then music.

### Step 5 — Final
1. `npx remotion render Edit out/<slug>.mp4 --props='{"slug":"<slug>"}'`
2. Loudness for Reels/TikTok (≈ −14 LUFS, true peak −1 dB) — our renders come out ~−22 LUFS, noticeably quieter than the feed:
   `ffmpeg -y -i out/<slug>.mp4 -c:v copy -af loudnorm=I=-14:TP=-1.5:LRA=11 -c:a aac -b:a 256k out/<slug>_final.mp4`
3. Give the user `out/<slug>_final.mp4` (path, length, size).

## Hard rules (from the training)
- Captions: sans #F3F3F3 + subtle shadow, special word in script + accent + glow, lower third, centered, small, word-by-word pop (rise + fade + light blur), ≤ 1.5 s per line.
- Hook: speaker always on screen, highlight the ONE word that keeps them watching.
- Scenes: background (white + thin grey grid + cast shadow + gradient + texture) → focal point in center cell → supporting elements around → depth elements on the outer cells.
- 3-tone palette (off-white, near-black, one accent), dull high-end colors, gradients with very light difference on text, cast shadows + textures on objects.
- Decorative elements ~25% smaller than your first instinct — but focal UI is BIG: card ≈ 80–85 % of the width, key number 110–160 px, text ≥ 30 px.
- MIX looks across the edit (visual-training PART 6): every full/half screen uses `SceneBackground look=paper|white|grey|dark|accent`, chosen by the scene's role and the plan's per-line Background; 2–4 looks per edit, one system (same accent, fonts, cards). Bare graphics where they read alone (no card around maps/rings/icons). Never flat grey glass cards (`GlassCard` is legacy).
- On-screen UI: speaker darkens + blurs, UI sits in the lower half.
- Motion (visual-training PART 7): every enter / exit / move is a spring — `useSpring(delay, 'snappy' | 'default' | 'heavy')` from design.tsx (snappy = buttons, chips, notifications, icons; default = cards, phones, camera; heavy = big type, numbers, logos). Never a pure fade as an enter or exit. Something new on screen every 2–4 s.
- `Phone` (iPhone mockup) is RARE — only when the scene is literally about using a specific app AND you have its real screenshots (typically at most once per edit). Everything else — cards, charts, numbers, notifications — is shown bare or in a card at full size, never squeezed into a phone. Logos and product UI are real files, never redrawn.
- A motion-graphics clip made elsewhere (e.g. the motion-reel kit: `videos/<film>/renders/9x16.mp4`) can be a full-screen scene: copy it to `<P>/assets/` and render it with `MotionClip` (muted by default; our SFX carry the sound, or pass `volumeDb`).
- Never change the voice audio; never put music under animations (sound skill handles it).

## Prompts
The original prompts from the source workflow (training prompt, cut prompt, build prompt, sound prompt) are in `references/prompts.md` — the user may paste them; they map 1:1 to the steps above.

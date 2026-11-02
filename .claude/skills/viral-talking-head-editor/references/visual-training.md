# Visual Training — viral talking-head edit (short form, 1080×1920)

This is the full visual brief. It has three parts: **Captions**, **Animations**, **On-screen animations**.
Before designing anything, open the matching reference images listed in `inspiration/index.md`. The more specific you follow this, the better.

---

## PART 1 — CAPTIONS & TYPOGRAPHY

Reference: `inspiration/rules/Screenshot 2026-10-19 at 12.26.02.png` (breakdown), `inspiration/text/*` (caption board).

### Fonts — two fonts, always
- **Sans** for most words: simple modern sans with many weights (thin / normal / medium / black) so weights can vary inside the edit. Default **Medium**. Default **Inter** (`sansFont: "Inter"`). *Creato Display* (the reference edit's font) has **no č/ć** — never use it for Croatian text.
- **Script / serif-italic** for SPECIAL words: always the *opposite* of the sans — if the sans is thin, the script is bold, and vice versa. Reference edit used *Apple Garamond*. Fallback: `Cormorant Garamond` italic 600–700 or `Playfair Display` italic, `EB Garamond` italic.

### Colors
- Sans text: **#F3F3F3** — not pure white, slightly warm.
- Script (special) words: one vibrant **accent color** chosen per edit (reference was a warm orange ~#F19A3E; other boards use gold, mint green, red, blue). Only the special word(s) get the accent.

### Placement
- Always in the **lower third**, **center aligned**, unless there is a special text design in mind.
- Keep text scale **smaller than "normal"** — it reads as higher quality. Scale a word up only to drag attention to it.
- Typical stack (see text board): small sans line → BIG script accent word → small sans line, tightly leaded, the script word overlapping lines slightly.
- Keep within safe area: nothing in bottom ~250 px (platform UI) or right ~120 px.

### Effects
- Script special words: **glow** in accent color (soft, low opacity, ~20–30 px blur).
- Normal sans words: **light drop shadow** to separate from background (e.g. `0 2px 8px rgba(0,0,0,.35)`), extremely subtle.
- When text needs focus: **blur + darken the speaker background** behind the text (see breakdown slide).

### Animation
- **Word-by-word pop-up**: each word rises from slightly under its final position (≈ 12–20 px), **fades in**, and has a **very light blur** while fading (≈ 6 px → 0). Smoothly ease the motion down (ease-out / spring with no overshoot).
- The whole line's animation never exceeds **1.5 s**.
- Each word appears at its spoken timestamp (from the word-level transcript).

### Hook rules (first ~3–5 s)
- The **speaker is always on screen** in the hook.
- Subtitles sit in the **lower half**.
- Highlight (script + accent) the **one word that makes the viewer keep watching** (the number, the promise, the pain — e.g. "3 mistakes", "30,000ft").
- Show the right text combinations between sound and script so the curiosity line lands.

---

## PART 2 — ANIMATIONS (B-roll scenes built in Remotion)

### 2.1 Three looks (from the video)
1. **White minimal** (default) — warm/cold white backgrounds, black text, one accent.
2. **Casted-shadow** — white minimal + strong soft window/plant shadows overlay.
3. **Accent/yellow** — same system with a saturated accent field (yellow, purple, red) taking a big block.
Also allowed for UI/graphic scenes: the **dark glassy SaaS** look from the boards (deep navy/black, blue-purple glow, glass cards).

### 2.2 Four scene categories (reference `inspiration/rules/...12.27.28.png`, `...12.27.50.png`)
- **Text-centric** — text is the star.
  - *Text only*: text in the middle and that's it (big sans + script accent word, brush strokes/marks in corners for depth).
  - *Text + object*: text takes most of the screen, an object sits secondary (corner / under).
  - *Text + graphic*: text in the middle supported by graphic shapes around it (bars, blocks, arrows).
- **Person-centric** — built around a character.
  - *Person in center*: cut-out person in middle, typically a **graphic behind them** (circle, colored block, poster frame) to support and emphasize.
  - *Person on side*: person on one side, text on the other side by side.
- **Object-centric** — built around an object.
  - *Object (middle) + text*: object in center, text on top or under it.
  - *Object + graphic*: object in center with graphics around it (colored panels, lines, UI chips).
- **Graphic-centric** — a graphic in the middle delivers the point: charts, UIs, sliders, loading bars, icons, diagrams, combined with an object or text.

### 2.3 How to build a scene — the minimal animation principles (`rules/...12.28.03/10/14/19`)
1. **Background** — generally white (warm `#EEEBE6`-ish or cold `#E9ECEF`-ish), **light thin grey grid**, **light casted-shadow overlay**, plus subtle **gradient** and **texture** (halftone dots / paper grain).
2. **Focal point** — decide the scene's main focus (object / text / person) and put it in the **main focal zone = center cell of a 3×3 grid**.
3. **Supporting elements** — add elements **around the main object** (ring around the center cell) to emphasize it: text on top of an object, or an object on the right of the text.
4. **Depth elements** — add elements **outside the focal area (the 8 outer cells)**: corner objects, blurred foreground shapes, brush marks, partial objects bleeding off-frame, color blocks.

Short version = **three object rules**: main object in the center, supporting elements on the edges, depth elements around the outside.

### 2.4 Design principles (`rules/...12.28.25/35/48/52/57`)
1. **Color** — 3-tone palette: **off-white + near-black (#2B2B2B-ish) + one special color** (examples: teal green, deep red, purple). Prefer **dull, high-end** tones (dull blue, dull green) over harsh pure black/white/bright red.
2. **Fonts** — sans for main text, script (or other contrasting face) for the highlighted special word.
3. **Texts** — use gradients with a **very light difference** for the main text color (e.g. #2A2A2A → #4A4A4A; accent → slightly lighter accent).
4. **Objects** — **casted shadows + textures** on objects (soft contact shadow + long soft drop shadow; halftone/grain overlay so cut-outs don't look pasted).
5. **Backgrounds** — **gradients + textures + casted shadows**.

### 2.5 Taste rules
- **Make decorative elements ~25% smaller** than your first instinct (icons, shapes, depth marks). This does NOT apply to the focal UI: the main card/number/chart must read on a phone — UI card ≥ 80 % of the width (≈ 860–920 px), body text ≥ 30 px, the key number 110–160 px. Tiny UI was the #1 reason past scenes looked poor.
- **Less is more with effects** — reserve glows, shakes, flashes for the elements that really need attention.
- **Dull colors look more luxurious.**
- Motion: smooth ease-out / springs without bounce for UI; small camera drifts (scale 1 → 1.04) to keep scenes alive; camera can track (pan/zoom) between text in top-left and bottom-right.
- Each scene has one main move + small secondary moves, staggered 3–6 frames.

### 2.6 Inspiration boards (`rules/...12.29.05.png`, `inspiration/boards/`)
- **Clean modern white design inspiration**, **UI inspiration** (dark glass UI cards, sliders, toggles, charts, progress bars, app icons), **Inspiration / references** (editorial halftone posters: brains, hourglasses, chess pieces, cut-out people). Pull layouts, compositions, UI patterns from these every time.

---

## PART 3 — ON-SCREEN ANIMATIONS (UI over the talking head)

Reference: `inspiration/onscreen/*` (last 5 images show it in context on a talking head).
Two rules:
1. Only the **lower part of the frame behind the UI** darkens and blurs (feathered top edge, brightness ~0.6, blur ~12 px, ease in/out ~8 frames). **Never blur the whole frame — the speaker's face must stay sharp** (user feedback). `TalkingHead.tsx` does this automatically for `ui` scenes.
2. The **animation sits in the lower half** of the screen.
Caption sits right above the UI (sans + script accent). UI style = the lit iOS pieces of PART 5 (`GlowCard frosted`, `Notification`, `PromptBar`, `LiveActivity` …), ≈ 80–85 % of the width. Bright / busy footage → light frosted pieces; dark footage → dark tone (`tone="dark"`) can read better. Graphics that work without a container (maps, rings, icons) stay BARE — no card around them.

---

## PART 4 — SCENE TYPES used in the planning page

| Type | What it is |
|---|---|
| **Captions** | Talking head + captions only (optionally a punch-in zoom). |
| **Captions + UI** | Talking head + captions + small on-screen UI in the lower half (background darkened/blurred). |
| **Half screen** | Animation on the **top half**, speaker on the **bottom half**. |
| **Full screen** | Animation takes over the whole screen (voice continues underneath). |

Use full screens for the big explanations, half screens for supporting examples, captions+UI for recurring structural beats (e.g. a chapter tracker "1 2 3"), plain captions for breathers. Recurring UI (chapter circles) should reappear consistently so the viewer feels progress.

---

## PART 5 — LIT UI & iOS CRAFT

Review (Nov 2026) of our Metro scenes vs. `inspiration/onscreen` + `boards`: UI looked poor because it was tiny and unlit. Then two one-look redesigns were BOTH rejected — all dark ("sve tak crno") and all paper-with-shadow. The user wants **variety that makes sense** — see PART 6.

### 5.1 Build from `src/components/glow.tsx`
| Piece | Use it for |
|---|---|
| `SceneBackground look=…` | EVERY full / half screen background: `paper`, `white`, `grey`, `dark`, `accent` (PART 6). Sets the tone for the pieces inside. |
| `GlowCard` | Container for UI. Light tone: warm-white card, hairline, top highlight, layered soft shadows + faint accent glow underneath (`frosted` over video). Dark tone: rim light + colour glowing inside + bloom. |
| `BigNumber` | Label → huge tabular number (small raised decimals, small currency) → coloured delta (`deltaColor` on the accent look). Counts up. |
| `LineChart` / `BarChart` | Self-drawing line with fading fill, dotted baselines, scrub dot + value bubble / bars growing with one accent bar. |
| `Ring` | Thick round-cap progress ring, value counts up. 1–3 side by side, bare. |
| `CheckBurst` | Success / "done": ring sweeps, check draws, soft colour glow. |
| `GlassIcon` | Glossy 3D app icon (glyph or real logo `src`). |
| `Notification`, `LiveActivity`, `PromptBar`, `Segmented` | Real iOS system UI: banner from the top, live activity with step tracker, AI prompt bar that types, segmented control. |
| `Bloom` | Soft colour light behind a focal element (≤ 0.3 on light looks, ~0.5 on dark). |
Catalogue: composition `UIKit` (`src/showcase/UIKit.tsx`) — one panel per look. Extend glow.tsx when a scene needs a new piece; keep both tones working.

### 5.2 Lighting checklist (every UI scene, check the still against it)
1. The focal element is LIT: light look → layered soft shadow + faint accent glow under it + top highlight; dark look → rim light + bloom.
2. Accent colour only on the 1–2 things that matter (key number, chart line, active bar/ring). Everything else ink-grey (`INKS[tone].secondary/tertiary`). Bright accents (yellow) are darkened for text on light via `accentInk()`.
3. **Bare beats boxed**: if a graphic reads on its own (map, rings, icons, a number), don't put it in a card. The Croatia map floating transparent over the speaker was better than the map in a card.
4. Grain always (SceneBackground does it).

### 5.3 iOS craft (from Mobbin: Monzo, Mercury, Cash App, WHOOP, Oura, Apple Wallet, Flighty)
- Typography in 3 steps: small grey label (≈ 0.2× the number) → huge number (weight 600, tracking −0.045em, tabular-nums) → small coloured delta with an arrow.
- Decimals and currency smaller and secondary-coloured; thousands "." and decimal "," for HR.
- Radii: cards 40–56 px at 1080 width, pills fully round; padding ≥ 40 px.
- Charts: one bright line, fill fading to 0, dotted baselines, a scrub dot with a value bubble. No axis boxes, no legends.
- Real system UI beats invented UI: notification banners, live activities, prompt bars, segmented controls, success ticks.
- **Need a pattern that is not in glow.tsx?** Search Mobbin (`mcp__mobbin__search_screens`, platform ios) for the real app screen, look at 4–8 results, copy layout / hierarchy / spacing. Cite the app in a code comment.

### 5.4 Reference-matching rule (mandatory)
For every UI / half / full screen scene: pick 1–2 concrete images (`inspiration/onscreen/…`, `inspiration/boards/…`, a Mobbin screen, or an earlier scene the user approved) and write them in a comment above the scene component. After rendering the still, put it next to the references (ffmpeg `hstack`) and fix what is visibly worse: size, light, hierarchy, spacing.

---

## PART 6 — MIXING LOOKS (one edit, several backgrounds, one system)

Never lock a whole edit into one background. Pick each scene's look from its ROLE, and keep everything else constant so it still feels like one video: same accent, same fonts, same card language, same motion.

| Look | Feels | Use it for |
|---|---|---|
| `paper` | editorial, warm, crafted | statements, quotes, big titles, objects / cut-outs, "the idea" |
| `white` | clean, product, Apple | logos, products, app icons, a single UI piece that should breathe |
| `grey` | calm, data | dashboards, charts, several cards, comparisons |
| `dark` | tech, premium, dramatic | AI / tech moments, the problem / tension beat, contrast after light scenes |
| `accent` | loud, branded | the ONE payoff: big reveal number, result, CTA / end card. Max 1–2 per edit. |

Rhythm rules:
- Use **2–4 looks per edit**. Not the same look more than 2 scenes in a row; avoid ping-ponging every scene either — group by section (e.g. problem = dark, solution = white/grey, payoff = accent).
- The plan page has a per-line **Background** choice; the user's choice wins. `auto` = you pick by the table above. Global "Look of the edit": `mix` (default) = vary; `paper` / `white` / `dark` = mostly that look, with at most one or two contrast scenes.
- Over the speaker (Captions + UI) there is no background — the footage is the background; pick light frosted vs dark tone pieces by how bright the footage is.
- When you report the build, list the look of every scene and why in one line each (e.g. "L05 · dark — the AI moment, contrast after two white scenes").

---

## PART 7 — MOTION (adopted from the motion-reel kit's house rules, in our words)

- **Springs, not easing curves**, for everything that enters, exits or moves to a new place: `useSpring(delay, preset)` / `SPRINGS` in design.tsx.
  - `snappy` — buttons, chips, toggles, notifications, icons, leading edges (a hair of overshoot)
  - `default` — cards, containers, phones, camera moves
  - `heavy` — big type, big numbers, logo lockups (no overshoot — type never bounces)
  Counting numbers, chart lines and progress rings may use eased `interpolate` — they fill, they don't enter.
- **A fade is never an entrance or an exit on its own.** Pair opacity with travel, scale or a mask.
- Text inside something that changes shape appears after the change starts and leaves before the next one.
- **Something new every 2–4 s.** Talking-only stretches get punch-ins / slow pushes; long UI holds get a second element, a counter, a state change.
- **Real assets, never redrawn**: real logos, real product screenshots. The `Phone` mockup is RARE: only when the scene is literally about using a specific app and you have its real screenshots (typically at most once per edit). Never put our own UI pieces (cards, charts, numbers) inside a phone — it shrinks and crops them; show them bare or in a card at full size.
- One display face + one UI face, one accent colour.
- Banned: everything fading in, centered title on a plain gradient, glitches, spins, light leaks, particle bursts, crossfades between shots, bouncy text, frame borders / corner labels, glow on everything, dead time.
- Check it: the quick check (`review.py` metrics + phone sheet) after every draft; the strict critic (`references/critique.md`) only when the user asks (Step 3.8).

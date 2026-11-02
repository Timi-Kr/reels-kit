# Library map

## 1 · USER'S PACK — ALWAYS FIRST (`pack/`)

Real sounds (Essentials SFX Pack, Botanica Trial), already converted into `public/sfx/pack/`. One file per sound, peak-normalized to −1 dBFS. Use these before anything synthesized. `cues.json` sound = `pack/<family>/<slug>`.


### Whooshes — ≈ −17 dB (−12 max)
| Sound | Dur | Peak | Use it for |
|---|---|---|---|
| `pack/whooshes/woosh` | 0.70s | 0.15s | Clean, punchy standard whoosh. DEFAULT for slides, pans, zooms and scene-to-scene transitions. |
| `pack/whooshes/knife_draw` | 1.04s | 0.25s | Sharp metallic swipe. Fast text/element slide-in, a 'cutting' reveal, wipe transitions. |
| `pack/whooshes/shutter_woosh` | 0.89s | 0.17s | Camera shutter + whoosh. Photo/b-roll grid transitions, photo flying in. |
| `pack/whooshes/granular_warp_01` | 2.07s | 0.05s | Granular warp, attack at the start then a tail. Element morphing/transforming, splash-in of a UI card. |
| `pack/whooshes/granular_warp_02` | 1.17s | 1.03s | Granular warp that swells into its peak. Morph/transform moves, smooth UI transitions. |
| `pack/whooshes/spin_flip` | 1.17s | 0.41s | Card flip, rotation, spinning element or number wheel. |
| `pack/whooshes/granular_combo` | 2.97s | 1.05s | Long (3 s) granular transition. Into a full-screen animation or a new chapter. |

### Textures — ≈ −13 dB
| Sound | Dur | Peak | Use it for |
|---|---|---|---|
| `pack/textures/mouse_click` | 0.51s | 0.13s | Cursor clicks a button/link in UI. On the press frame. |
| `pack/textures/granular_button` | 0.23s | 0.13s | Soft modern UI tap: toggle, button, chip, tab switch. DEFAULT for UI element pops. |
| `pack/textures/magnet` | 0.30s | 0.19s | Element snaps into place / locks in (0.3 s). Card landing, logo snapping. |
| `pack/textures/message_tone` | 0.95s | 0.25s | Notification / chat bubble / message arrives. |
| `pack/textures/iphone_charging` | 1.00s | 0.63s | Phone/iOS UI appears, positive confirmation, something 'connects'. |
| `pack/textures/ding` | 2.02s | 0.05s | Success, checkmark, conclusion reached, correct answer. |
| `pack/textures/mac_typing` | 1.11s | 0.89s | Typing in a search bar / text field on screen. |
| `pack/textures/gear` | 0.65s | 0.33s | Mechanical tick: letter-by-letter text, counter ticking, mechanism. |
| `pack/textures/timer` | 1.93s | 1.03s | Clock ticking, countdown, deadline, 'time' topic. |
| `pack/textures/glitch_text_01` | 1.13s | 0.41s | Glitchy flicker. Text/number glitching in, tech reveal. |
| `pack/textures/glitch_text_02` | 1.27s | 0.39s | Glitchy flicker (variation). Text/number glitching in, tech reveal. |
| `pack/textures/shimmer` | 3.03s | 0.03s | Sparkle/shimmer. Premium highlight, glow sweep, 'magic' AI moment, big reveal (instead of choir). |
| `pack/textures/heartbeat` | 2.07s | 0.43s | Tension, suspense, health/emotion topic. Low level. |
| `pack/textures/camera_shutter` | 0.35s | 0.15s | Photo taken, flash transition, screenshot. |
| `pack/textures/camera_clicks` | 0.35s | 0.33s | Photo taken (double click). |
| `pack/textures/camera_click_single` | 0.21s | 0.11s | One photo pops into a grid. |
| `pack/textures/camera_click_dslr` | 0.21s | 0.11s | Short DSLR click. Photo pop, clip-to-clip flash. |
| `pack/textures/camera_shutter_click` | 0.37s | 0.23s | Shutter click. Photo pop, flash. |
| `pack/textures/camera_reflex` | 0.63s | 0.09s | Reflex lens clicks. Photo pop with more body. |
| `pack/textures/camera_burst` | 0.44s | 0.37s | Short burst. Several photos popping in fast. |
| `pack/textures/camera_rapid_fire` | 1.31s | 0.67s | Rapid-fire shutter (1.3 s). Photo grid filling up. |

### Risers — only if asked, ≈ −12 dB, align end
| Sound | Dur | Peak | Use it for |
|---|---|---|---|
| `pack/risers/reverse_crash` | 2.00s | 1.87s | 2 s reverse cymbal building into a cut. Peak = end → align 'end' on the transition frame. |
| `pack/risers/metallic_riser` | 1.65s | 1.39s | 1.65 s metallic build. Align 'end' on the transition frame. |
| `pack/risers/punch_stop_riser` | 0.81s | 0.71s | Short 0.8 s build that stops dead. Hook → body cut, punchline. |

### Hits — only if asked, under riser end
| Sound | Dur | Peak | Use it for |
|---|---|---|---|
| `pack/hits/cinematic_impact` | 2.30s | 0.67s | Big cinematic hit. The ONE loudest moment of the video, under a riser end. |
| `pack/hits/powerdown` | 2.07s | 0.03s | Impact that powers down. Negative turn, 'problem' moment, ending/shutdown. |

## 2 · Synthesized fallback (only when no pack sound fits)



Library root: `public/sfx/` (in Remotion: `staticFile("sfx/<path>")`).
Every sound has 3 variations `_01/_02/_03`. `manifest.json` gives `duration` and `peak` (s from file start).
All files are peak-normalized to −1 dBFS, so the guide's dB levels apply directly as `volumeDb`.

Alignment: `startFrame = eventFrame − round(peak × fps)` (whoosh peak on fastest frame; texture transient on event frame; riser peak = its end → on transition frame; hit transient on transition frame).

## Whooshes (`whooshes/`) — -12 dB (max -10)
| Guide name | File | Notes |
|---|---|---|
| Classy airy whoosh | `classy_airy_0N` | ~1.3–1.6 s, big & heavy. Rare. |
| Hollow whoosh | `hollow_0N` | ~0.9 s, resonant/textured. Standard slides/pans. |
| Futuristic whooshes | `futuristic_0N` | ~0.9 s, saw tone sweep. Standard slides. |
| Deep voice whoosh | `deep_voice_0N` | ~1 s, sub + low tone. **Default when unsure.** |
| Generic long whoosh | `generic_long_0N` | ~2–2.5 s, peak at ~82 %. Build into fast transition. |
| Organic wind whooshes | `organic_wind_0N` | ~1.6–2 s, soft. Slow drifts. |
| Short whooshes | `short_0N` | ~0.3–0.5 s. Very quick small moves. Rare. |
| Synthetic whoosh | `synthetic_0N` | scene → scene. |
| Transition spacey whoosh | `transition_spacey_0N` | scene → scene, long shimmer. |
| Water dropper | `water_dropper_0N` | scene → scene, bloop drop. |

## Textures (`textures/`) — -6 to -7 dB
| Guide name | File |
|---|---|
| Pop (text pops) | `pop_0N` |
| UI click (UI element pops) | `ui_click_0N` |
| Sci-fi click (click / change inside animation) | `scifi_click_0N` |
| Gears / tiny gearwheel (letter-by-letter, mechanical text) | `tiny_gearwheel_0N` |
| Complex mechanism gizmo (multiple assets popping in sequence) | `complex_mechanism_gizmo_0N` |
| Keyboard writing (typing) | `keyboard_writing_0N` |
| Video scan / gears moving (single object pop that needs emphasis) | `video_scan_0N` |
| Sci-fi impact (new UI/object REVEALED) | `scifi_impact_0N` |
| Sci-fi hit (also scene transitions) | `scifi_hit_0N` |
| Activate protection energy (transition into new animation) | `activate_protection_energy_0N` |
| Digital camera click (clip-to-clip / flash) | `digital_camera_click_0N` |
| Cartoon musical heavenly choir (big reveal) | `cartoon_heavenly_choir_0N` |
| Success reward (conclusion reached) | `success_reward_0N` |
| Alarm buzzer (very low anticipation, rare) | `alarm_buzzer_0N` |
| Mechanical clicks (clicks folder) | `mechanical_click_0N` |
| Analog buttons | `analog_button_0N` |
| UI success / UI fail | `ui_success_0N` / `ui_fail_0N` |

## Risers (`risers/`) — -5 dB · Hits (`hits/`) — under riser
| Guide name | File | Notes |
|---|---|---|
| Sharp bass riser | `sharp_bass_riser_0N` | 2.5 / 3 / 4 s. Favourite; ~5 s after hook. |
| Metallic riser | `metallic_riser_0N` | 2.5 / 3 / 4 s. Favourite. |
| Suspenseful build-ups | `suspenseful_buildup_0N` | 4 s. Sparingly. |
| Suck-back risers | `suckback_riser_0N` | 1.5 / 2 / 2.6 s. Very low OR very loud, never middle. |
| Impact hits | `impact_hit_0N` | under riser end. |
| Bass hit | `bass_hit_0N` | tight sub drop. |
| Heavy hit | `heavy_hit_0N` | biggest stack moment. |

Rule: ≥ 2 sharp bass + ≥ 2 metallic risers per video (scale down for edits under ~30 s and say so).

# Prompts (reconstructed from the source workflow)

Use with Opus 5.5, high effort.

## 0. Training prompt (original, from "Prompts List.docx")
> The link below is the full brief on how you should be editing short-form talking head videos using Remotion. Go through that brief and learn it step by step. Top left: how to create the captions and the stylization — two kinds of captions: a sans font and a script font; font placement, font color and font animations. To the right: an inspiration board with caption examples — use it as inspiration every time you create captions. Under that: a hook document — hook psychology: keep the speaker on screen, show the right text combinations between sounds and script, show the right lines that keep viewers hooked. To the right: the full on-screen animations guide — the three kinds of animations and the four categories (text-centric, object-centric, character-centric, graphic/video-centric), each with a short description; pay attention to assets, effects, shapes, placement. Use those images as inspiration every time you animate in Remotion. Under that: "How to Create Animations" — how we create the background, the placement, the effects on objects and the stylization. To the left: a big inspiration board of UIs, graphs and scenes — always use as reference. At the bottom: the on-screen animations category — how we place on-screen UIs and darken + blur the background behind them; use the sheet to the right as inspiration for on-screen animations.
>
> → Then: "Turn this into a skill." (Already done: this skill. `references/visual-training.md` is that brief in text form, `references/inspiration/` holds the boards.)

## 1. Cut prompt
> I have a short form video I want you to edit. Use the viral talking head editor skill to edit this video. First, here is the raw video [folder]. Cut the video by creating a word level transcript and removing every silence and every bad take. Keep the padding around 20 milliseconds and hand me back the fully cut up video.

Optional add-on used in the video (start while cutting):
> Also build me a simple planning page with two sections: one where I choose the main color, fonts and font colors of the edit, and one with the script on the left and an empty text box on the right for each line where I write the plan.

## 2. Build prompt
> Here's the full plan [plan.json / pasted plan]. Now use Remotion to build these animations. Tell me if you need any assets from me.

## 3. Review prompt
> Change X, Y and Z. (Rebuilds only those scenes.)

## 4. Sound design prompt
> Use the sound design skill and the sound effects library to sound design the video you just edited.

## 5. Music
> Add [song file] under the talking head at −20 dB (−19 per the sound guide), never under the animations.

## Example plan lines (from the source video, for taste calibration)
- Hook "These three mistakes make your edits look amateur" → Captions + UI: "three mistakes" in accent, UI with 3 numbered circles.
- "Here's what you should do to take your animation from beginner to professional" → zoom on face + cursor drags a slider from Beginner to Professional (Captions + UI).
- "Number one, stop oversizing everything" → chapter UI: circle 1 fills in with chapter title under it.
- "The biggest thing that screams beginner editor is huge icons and huge shape layers" → Full screen: low-quality edit screenshot pops up in the center, camera tracks text writing top-left then bottom-right.
- "Make every element 25% smaller" → Half screen: a play icon starts way too big, snaps 25% smaller.
- "Less is more…" → Half screen: loading bar where only one segment lights up.
- "Reserve your visual effects…" → Full screen: eyeball pops in and spins, editing-timeline cards slide in around it.
- "Beginner editors use harsh blacks, whites and bright reds" → Half screen: three color boxes pop up.
- "Luxurious brands use dull colors…" → Full screen: luxury logos spin in a circle, fade out as new text writes on.
- Ending → Captions with chapter UI filling 1, 2, 3.

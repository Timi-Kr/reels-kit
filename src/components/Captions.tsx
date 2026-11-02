import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, Easing} from 'remotion';
import {fontFamily} from '../fonts';
import type {CaptionGroup, CaptionWord, Edit, Scene} from '../types';

// Word-by-word pop: rise from slightly under + fade + light blur, eased out.
// One word's animation lasts WORD_FRAMES; a full group never exceeds 1.5 s of animation.
const WORD_FRAMES = 9;
const RISE = 18;
const BLUR = 6;

const defaultY = (scene: Scene | undefined) => {
  if (!scene) return 0.7;
  if (scene.captionY !== undefined) return scene.captionY;
  if (scene.type === 'halfscreen') return 0.535;
  if (scene.type === 'ui') return 0.53;
  return 0.7;
};

export const activeScene = (edit: Edit, frame: number) =>
  edit.scenes.find((s) => frame >= s.from && frame < s.to && s.type !== 'captions') ??
  edit.scenes.find((s) => frame >= s.from && frame < s.to);

const Word: React.FC<{w: CaptionWord; edit: Edit; groupFrom: number; scale: number; stackBig?: boolean}> = ({w, edit, groupFrom, scale, stackBig}) => {
  const frame = useCurrentFrame();
  const {style} = edit;
  // never let the in-animation of a group run past 1.5s: clamp late words
  const start = Math.min(w.at, groupFrom + Math.round(edit.fps * 1.5) - WORD_FRAMES);
  const p = interpolate(frame, [start, start + WORD_FRAMES], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const script = !!w.script;
  const base = (script ? 92 : 46) * scale * (w.size ?? 1) * (stackBig ? 1.15 : 1);
  const color = script ? style.scriptColor ?? style.accent : style.sansColor;
  return (
    <span
      style={{
        display: 'inline-block',
        transform: `translateY(${(1 - p) * RISE}px)`,
        opacity: p,
        filter: `blur(${(1 - p) * BLUR}px)`,
        fontFamily: script ? fontFamily(style.scriptFont, 'Cormorant Garamond') : fontFamily(style.sansFont),
        fontStyle: script ? 'italic' : 'normal',
        fontWeight: script ? 700 : 500,
        fontSize: base,
        lineHeight: script ? 0.9 : 1.05,
        letterSpacing: script ? '-0.02em' : '-0.01em',
        color,
        textShadow: script
          ? `0 0 22px ${color}66, 0 0 6px ${color}55, 0 3px 10px rgba(0,0,0,0.35)`
          : '0 2px 8px rgba(0,0,0,0.35)',
        margin: script ? '0 0.12em' : '0 0.13em',
        whiteSpace: 'pre',
      }}
    >
      {w.text}
    </span>
  );
};

export const Captions: React.FC<{edit: Edit}> = ({edit}) => {
  const frame = useCurrentFrame();
  const {height} = useVideoConfig();
  const group: CaptionGroup | undefined = edit.captions.find((g) => frame >= g.from && frame < g.to);
  if (!group) return null;
  const scene = activeScene(edit, frame);
  const hide = scene && (scene.captions === 'hide' || (scene.type === 'fullscreen' && scene.captions !== 'show'));
  if (hide) return null;
  const y = group.y ?? defaultY(scene);
  const scale = group.scale ?? 1;
  const out = interpolate(frame, [group.to - 4, group.to], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  // "stack" layout: sans words on lines, script words on their own big line (as in the caption board)
  const lines: CaptionWord[][] = [];
  if (group.layout === 'stack') {
    let cur: CaptionWord[] = [];
    // consecutive script words share one line; sans runs get their own lines
    for (const w of group.words) {
      if (cur.length && !!cur[cur.length - 1].script !== !!w.script) {
        lines.push(cur);
        cur = [];
      }
      cur.push(w);
    }
    if (cur.length) lines.push(cur);
  } else lines.push(group.words);

  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          left: 90,
          right: 90,
          top: y * height,
          transform: 'translateY(-50%)',
          textAlign: 'center',
          opacity: out,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: group.layout === 'stack' ? 0 : 6,
        }}
      >
        {lines.map((line, i) => (
          <div key={i} style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'baseline'}}>
            {line.map((w, j) => (
              <Word key={j} w={w} edit={edit} groupFrom={group.from} scale={scale} stackBig={group.layout === 'stack' && w.script} />
            ))}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

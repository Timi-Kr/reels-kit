// Demo edit — reference implementation of the four scene types.
// Every new edit gets its own folder like this one, with one component per planned scene.
import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Cursor, DepthMark, Drift, EASE_IN_OUT, EASE_OUT, MinimalBackground, Reveal, Title} from '../../components/design';
import {ChapterTracker, Slider} from '../../components/ui';
import type {SceneProps} from '../../types';

/** L01 · Captions + UI — three numbered circles, one per mistake (lower half). */
const L01: React.FC<SceneProps> = ({edit}) => (
  <AbsoluteFill style={{alignItems: 'center', justifyContent: 'flex-start', paddingTop: 110}}>
    <ChapterTracker style={edit.style} count={3} delay={10} />
  </AbsoluteFill>
);

/** L02 · Full screen — text-centric + graphic: cursor drags slider Amater → Profesionalac. */
const L02: React.FC<SceneProps> = ({edit, width}) => {
  const frame = useCurrentFrame();
  const s = edit.style;
  const grab = 34;
  const drag = interpolate(frame, [grab + 6, grab + 46], [0.08, 0.94], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE_IN_OUT});
  const sliderW = 640;
  const sliderX = (width - sliderW) / 2;
  const cursorIn = interpolate(frame, [18, grab], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE_OUT});
  const cx = sliderX + drag * sliderW + (1 - cursorIn) * 220 - 6;
  const cy = 1030 + (1 - cursorIn) * 160;
  return (
    <MinimalBackground tone="warm" style={s} accentGlow>
      <Drift>
        {/* depth elements on the outer cells */}
        <DepthMark x={-40} y={120} size={260} rotate={20} color={s.dark} blur={3} delay={4} />
        <DepthMark x={width - 210} y={1500} size={240} rotate={200} color={s.dark} blur={3} delay={8} />
        {/* focal point: center cell */}
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
          <div style={{marginTop: -120, width: 820}}>
            <Reveal delay={2}>
              <Title text="od amatera do" style={s} size={54} delay={2} />
            </Reveal>
            <Title text="profesionalca" script={['profesionalca']} style={s} size={74} delay={10} />
          </div>
          {/* supporting element right under the focal text */}
          <Reveal delay={14} style={{marginTop: 80}}>
            <Slider style={s} value={drag} left="Amater" right="Profesionalac" width={sliderW} />
          </Reveal>
        </AbsoluteFill>
        <Cursor x={cx} y={cy} pressed={frame > grab && frame < grab + 50} />
      </Drift>
    </MinimalBackground>
  );
};

/** L03 · Captions + UI — chapter 1 fills in with its title. */
const L03: React.FC<SceneProps> = ({edit}) => (
  <AbsoluteFill style={{alignItems: 'center', justifyContent: 'flex-start', paddingTop: 110}}>
    <ChapterTracker style={edit.style} count={3} filled={[1]} fillAt={[8]} active={1} title="Prestani sve raditi preveliko" delay={0} />
  </AbsoluteFill>
);

/** L05 · Half screen — object-centric: a play icon starts way too big, then snaps 25 % smaller. */
const L05: React.FC<SceneProps> = ({edit}) => {
  const frame = useCurrentFrame();
  const s = edit.style;
  const snapAt = 34;
  const scale = interpolate(frame, [0, 10, snapAt, snapAt + 8], [0.6, 1.0, 1.0, 0.75], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE_OUT});
  const size = 420;
  return (
    <MinimalBackground tone="warm" style={s} shadow="window">
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
        <div
          style={{
            width: size,
            height: size * 0.7,
            borderRadius: 60,
            transform: `scale(${scale})`,
            background: `linear-gradient(160deg, ${s.accent}, ${s.accent}cc)`,
            boxShadow: `0 10px 20px rgba(0,0,0,0.18), 30px 60px 60px rgba(0,0,0,0.22), inset 0 2px 0 rgba(255,255,255,0.35)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width={size * 0.26} viewBox="0 0 10 10">
            <path d="M2 1 L9 5 L2 9 Z" fill="#F3F3F3" />
          </svg>
        </div>
      </AbsoluteFill>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 2, background: 'rgba(0,0,0,0.25)'}} />
    </MinimalBackground>
  );
};

export const scenes = {L01, L02, L03, L05};

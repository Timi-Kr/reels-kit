// Reusable on-screen UI pieces (dark glass look from the on-screen inspo board).
import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {fontFamily} from '../fonts';
import type {Style} from '../types';
import {EASE_OUT, GlassCard, useSpringIn} from './design';

/** Numbered chapter circles (1 2 3). `filled` circles fill in at `fillAt` frames (relative). */
export const ChapterTracker: React.FC<{
  style: Style;
  count?: number;
  filled?: number[]; // which numbers are filled (1-based)
  fillAt?: number[]; // frame each filled circle animates in (relative to sequence)
  active?: number; // number highlighted with a title
  title?: string;
  delay?: number;
}> = ({style, count = 3, filled = [], fillAt = [], active, title, delay = 0}) => {
  const frame = useCurrentFrame();
  const inP = useSpringIn(delay);
  return (
    <GlassCard style={style} padding={34} css={{transform: `scale(${0.9 + 0.1 * inP})`, opacity: inP, minWidth: 560}}>
      <div style={{display: 'flex', gap: 46, justifyContent: 'center', alignItems: 'center'}}>
        {Array.from({length: count}, (_, i) => {
          const n = i + 1;
          const idx = filled.indexOf(n);
          const at = fillAt[idx] ?? delay + 6 + i * 5;
          const f = idx < 0 ? 0 : interpolate(frame, [at, at + 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE_OUT});
          const pop = interpolate(frame, [delay + 4 + i * 4, delay + 14 + i * 4], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE_OUT});
          const isActive = active === n;
          return (
            <div key={n} style={{position: 'relative', width: 104, height: 104, transform: `scale(${0.6 + 0.4 * pop})`, opacity: pop}}>
              <div style={{position: 'absolute', inset: 0, borderRadius: '50%', border: `2px solid ${f > 0 ? style.accent : 'rgba(255,255,255,0.25)'}`}} />
              <div
                style={{
                  position: 'absolute',
                  inset: 6,
                  borderRadius: '50%',
                  background: `radial-gradient(circle at 35% 30%, ${style.accent}, ${style.accent}aa)`,
                  transform: `scale(${f})`,
                  boxShadow: `0 0 ${30 * f}px ${style.accent}${isActive ? '88' : '44'}`,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: fontFamily(style.sansFont),
                  fontWeight: 600,
                  fontSize: 44,
                  color: f > 0.5 ? '#fff' : 'rgba(255,255,255,0.75)',
                }}
              >
                {n}
              </div>
            </div>
          );
        })}
      </div>
      {title ? (
        <div
          style={{
            marginTop: 26,
            textAlign: 'center',
            fontSize: 30,
            fontWeight: 500,
            color: '#F3F3F3',
            letterSpacing: '-0.01em',
            opacity: interpolate(frame, [delay + 14, delay + 24], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
          }}
        >
          {title}
        </div>
      ) : null}
    </GlassCard>
  );
};

/** Horizontal slider with a knob at 0..1 and two end labels. */
export const Slider: React.FC<{style: Style; value: number; left: string; right: string; width?: number; dark?: boolean}> = ({style, value, left, right, width = 700, dark = false}) => {
  const ink = dark ? '#F3F3F3' : style.dark;
  return (
    <div style={{width, fontFamily: fontFamily(style.sansFont)}}>
      <div style={{position: 'relative', height: 14, borderRadius: 99, background: dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.15)'}}>
        <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${value * 100}%`, borderRadius: 99, background: `linear-gradient(90deg, ${style.accent}99, ${style.accent})`, boxShadow: `0 0 18px ${style.accent}55`}} />
        <div
          style={{
            position: 'absolute',
            left: `${value * 100}%`,
            top: '50%',
            width: 44,
            height: 44,
            borderRadius: '50%',
            transform: 'translate(-50%,-50%)',
            background: 'linear-gradient(180deg,#fff,#e9e9e9)',
            boxShadow: '0 6px 14px rgba(0,0,0,0.25), 0 1px 0 rgba(255,255,255,0.8) inset',
          }}
        />
      </div>
      <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 26, fontSize: 26, fontWeight: 500, color: ink, opacity: 0.75}}>
        <span>{left}</span>
        <span>{right}</span>
      </div>
    </div>
  );
};

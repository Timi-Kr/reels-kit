// Shared design primitives that encode the visual training rules.
// Build every scene from these so the look stays consistent:
//   background (gradient + thin grid + halftone texture + cast shadow)
//   → focal point in center cell → supporting elements around → depth elements outside.
import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {fontFamily} from '../fonts';
import type {Style} from '../types';

export const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
export const EASE_IN_OUT = Easing.bezier(0.45, 0, 0.2, 1);

const asset = (src: string) => (src.startsWith('http') ? src : staticFile(src));

/* ------------------------------------------------------------------ background */

export const Halftone: React.FC<{opacity?: number; size?: number; color?: string}> = ({opacity = 0.12, size = 7, color = '#000'}) => (
  <AbsoluteFill
    style={{
      backgroundImage: `radial-gradient(${color} 1px, transparent 1.4px)`,
      backgroundSize: `${size}px ${size}px`,
      opacity,
      mixBlendMode: 'multiply',
      pointerEvents: 'none',
    }}
  />
);

export const Grain: React.FC<{opacity?: number}> = ({opacity = 0.08}) => {
  const frame = useCurrentFrame();
  const seed = frame % 6;
  return (
    <AbsoluteFill style={{opacity, mixBlendMode: 'overlay', pointerEvents: 'none'}}>
      <svg width="100%" height="100%">
        <filter id={`g${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={seed} />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#g${seed})`} />
      </svg>
    </AbsoluteFill>
  );
};

/** Light thin grey grid. cell = px. */
export const Grid: React.FC<{cell?: number; color?: string; opacity?: number}> = ({cell = 90, color = '#000', opacity = 0.07}) => (
  <AbsoluteFill
    style={{
      backgroundImage: `linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px)`,
      backgroundSize: `${cell}px ${cell}px`,
      backgroundPosition: 'center center',
      opacity,
      pointerEvents: 'none',
    }}
  />
);

/** Soft window-blind / leaf cast shadows drifting slowly over the scene. */
export const CastShadow: React.FC<{opacity?: number; angle?: number; kind?: 'blinds' | 'window'}> = ({opacity = 0.18, angle = -28, kind = 'blinds'}) => {
  const frame = useCurrentFrame();
  const drift = frame * 0.25;
  return (
    <AbsoluteFill style={{opacity, mixBlendMode: 'multiply', pointerEvents: 'none', overflow: 'hidden'}}>
      <div
        style={{
          position: 'absolute',
          inset: '-40%',
          transform: `rotate(${angle}deg) translateX(${drift}px)`,
          backgroundImage:
            kind === 'blinds'
              ? 'repeating-linear-gradient(90deg, rgba(0,0,0,0.9) 0 70px, transparent 70px 190px)'
              : 'linear-gradient(90deg, transparent 0 30%, rgba(0,0,0,0.9) 30% 34%, transparent 34% 64%, rgba(0,0,0,0.9) 64% 68%, transparent 68%)',
          filter: 'blur(38px)',
        }}
      />
    </AbsoluteFill>
  );
};

export type BgTone = 'warm' | 'cold' | 'dark';

/** The default scene background: gradient + grid + halftone + cast shadow + grain. */
export const MinimalBackground: React.FC<{
  tone?: BgTone;
  style?: Style;
  grid?: boolean;
  shadow?: boolean | 'blinds' | 'window';
  halftone?: boolean;
  accentGlow?: boolean;
  children?: React.ReactNode;
}> = ({tone = 'warm', style, grid = true, shadow = true, halftone = true, accentGlow = false, children}) => {
  const bg =
    tone === 'dark'
      ? 'radial-gradient(120% 80% at 50% 40%, #1a1d2b 0%, #0b0c12 60%, #050508 100%)'
      : tone === 'cold'
        ? 'radial-gradient(120% 90% at 50% 40%, #F4F6F8 0%, #E6E9EE 60%, #D5DAE1 100%)'
        : `radial-gradient(120% 90% at 50% 40%, #F6F3EE 0%, ${style?.light ?? '#ECE8E1'} 60%, #D9D3CA 100%)`;
  const ink = tone === 'dark' ? '#fff' : '#000';
  return (
    <AbsoluteFill style={{background: bg, overflow: 'hidden'}}>
      {accentGlow && style ? (
        <AbsoluteFill style={{background: `radial-gradient(50% 35% at 50% 50%, ${style.accent}33 0%, transparent 70%)`}} />
      ) : null}
      {grid ? <Grid color={ink} opacity={tone === 'dark' ? 0.05 : 0.07} /> : null}
      {halftone ? <Halftone color={ink} opacity={tone === 'dark' ? 0.08 : 0.1} /> : null}
      {shadow && tone !== 'dark' ? <CastShadow kind={shadow === 'window' ? 'window' : 'blinds'} /> : null}
      {children}
      <Grain />
      <AbsoluteFill style={{background: 'radial-gradient(100% 70% at 50% 45%, transparent 55%, rgba(0,0,0,0.18) 100%)', pointerEvents: 'none'}} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ motion */

/** Entry animation wrapper. delay in frames. */
export const Reveal: React.FC<{
  delay?: number;
  from?: 'up' | 'down' | 'left' | 'right' | 'scale' | 'fade';
  distance?: number;
  blur?: number;
  dur?: number;
  outAt?: number; // frame (relative to sequence) to start exit
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({delay = 0, from = 'up', distance = 40, blur = 8, dur = 14, outAt, style, children}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [delay, delay + dur], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE_OUT});
  const o = outAt === undefined ? 1 : interpolate(frame, [outAt, outAt + 8], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const d = (1 - p) * distance;
  const t =
    from === 'up' ? `translateY(${d}px)` : from === 'down' ? `translateY(${-d}px)` : from === 'left' ? `translateX(${-d}px)` : from === 'right' ? `translateX(${d}px)` : from === 'scale' ? `scale(${0.85 + 0.15 * p})` : 'none';
  return <div style={{transform: t, opacity: p * o, filter: `blur(${(1 - p) * blur}px)`, ...style}}>{children}</div>;
};

/** Spring 0..1 without overshoot — for UI pops. */
export const useSpringIn = (delay = 0, damping = 200) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return spring({frame: frame - delay, fps, config: {damping, mass: 0.6}});
};

/** Spring presets — every enter, exit and retarget uses one (no easing curves, never a pure fade):
 *  snappy  — buttons, toggles, chips, notifications, icons, leading edges (≈1.5 % overshoot)
 *  default — cards, containers, phones, camera moves (barely any overshoot)
 *  heavy   — big type, big numbers, logo lockups (no overshoot) */
export const SPRINGS = {
  snappy: {stiffness: 320, damping: 24, mass: 0.7},
  default: {stiffness: 180, damping: 24, mass: 0.9},
  heavy: {stiffness: 120, damping: 26, mass: 1.1},
} as const;
export type SpringName = keyof typeof SPRINGS;

/** 0 → 1 (may overshoot slightly for snappy) starting at `delay` frames. */
export const useSpring = (delay = 0, preset: SpringName = 'default') => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return spring({frame: frame - delay, fps, config: SPRINGS[preset]});
};

/** Slow camera drift to keep scenes alive (scale 1 → 1.04). */
export const Drift: React.FC<{amount?: number; children: React.ReactNode}> = ({amount = 0.04, children}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const s = 1 + amount * (frame / Math.max(durationInFrames, 1));
  return <AbsoluteFill style={{transform: `scale(${s})`}}>{children}</AbsoluteFill>;
};

/* ------------------------------------------------------------------ type */

/** Sans + script title. Words in `script` are set in script font + accent + glow.
 *  Main color uses a very light gradient (rule 3 - Texts). */
export const Title: React.FC<{
  text: string;
  script?: string[];
  style: Style;
  size?: number;
  color?: string;
  align?: 'center' | 'left' | 'right';
  stagger?: number;
  delay?: number;
  weight?: number;
}> = ({text, script = [], style, size = 64, color, align = 'center', stagger = 3, delay = 0, weight = 500}) => {
  const frame = useCurrentFrame();
  const words = text.split(' ');
  const main = color ?? style.dark;
  return (
    <div style={{textAlign: align, lineHeight: 1.0, display: 'flex', flexWrap: 'wrap', justifyContent: align === 'center' ? 'center' : align === 'left' ? 'flex-start' : 'flex-end', alignItems: 'baseline'}}>
      {words.map((w, i) => {
        const isScript = script.some((s) => s.toLowerCase() === w.toLowerCase().replace(/[.,!?]/g, ''));
        const st = delay + i * stagger;
        const p = interpolate(frame, [st, st + 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE_OUT});
        const c = isScript ? style.scriptColor ?? style.accent : main;
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              margin: '0 0.12em',
              transform: `translateY(${(1 - p) * 16}px)`,
              opacity: p,
              filter: `blur(${(1 - p) * 6}px)`,
              fontFamily: isScript ? fontFamily(style.scriptFont, 'Cormorant Garamond') : fontFamily(style.sansFont),
              fontStyle: isScript ? 'italic' : 'normal',
              fontWeight: isScript ? 700 : weight,
              fontSize: isScript ? size * 1.35 : size,
              letterSpacing: '-0.02em',
              backgroundImage: `linear-gradient(180deg, ${c} 0%, ${shade(c, isScript ? 0.12 : 0.18)} 100%)`,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              textShadow: isScript ? `0 0 24px ${c}40` : undefined,
              whiteSpace: 'pre',
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};

/** Letter-by-letter write-on (pairs with "gears" texture). */
export const WriteOn: React.FC<{text: string; delay?: number; perChar?: number; style: React.CSSProperties}> = ({text, delay = 0, perChar = 1.2, style}) => {
  const frame = useCurrentFrame();
  const n = Math.max(0, Math.floor((frame - delay) / perChar));
  return (
    <span style={style}>
      {text.slice(0, n)}
      <span style={{opacity: n < text.length && n > 0 ? 1 : 0}}>|</span>
    </span>
  );
};

/** Lighten (amt>0) or darken (amt<0) a hex color. */
export const shade = (hex: string, amt: number) => {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  const ch = (v: number) => Math.round(amt >= 0 ? v + (255 - v) * amt : v * (1 + amt));
  const r = ch((n >> 16) & 255);
  const g = ch((n >> 8) & 255);
  const b = ch(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
};

/* ------------------------------------------------------------------ objects & UI */

/** Cut-out object / photo with cast shadow + halftone texture (rule 4 - Objects). */
export const ObjectImage: React.FC<{src: string; width: number; rotate?: number; shadow?: boolean; texture?: boolean; style?: React.CSSProperties}> = ({
  src,
  width,
  rotate = 0,
  shadow = true,
  texture = true,
  style,
}) => (
  <div style={{position: 'relative', width, transform: `rotate(${rotate}deg)`, ...style}}>
    <Img
      src={asset(src)}
      style={{
        width: '100%',
        display: 'block',
        filter: shadow ? 'drop-shadow(0 6px 6px rgba(0,0,0,0.25)) drop-shadow(18px 40px 40px rgba(0,0,0,0.28))' : undefined,
      }}
    />
    {texture ? (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          WebkitMaskImage: `url(${asset(src)})`,
          WebkitMaskSize: '100% 100%',
          backgroundImage: 'radial-gradient(#000 1px, transparent 1.4px)',
          backgroundSize: '6px 6px',
          opacity: 0.18,
          mixBlendMode: 'multiply',
        }}
      />
    ) : null}
  </div>
);

/** Dark glass UI card (on-screen UI inspo). */
export const GlassCard: React.FC<{style: Style; width?: number | string; padding?: number; glow?: boolean; light?: boolean; children: React.ReactNode; css?: React.CSSProperties}> = ({
  style,
  width = 'auto',
  padding = 32,
  glow = true,
  light = false,
  children,
  css,
}) => (
  <div
    style={{
      width,
      padding,
      borderRadius: 30,
      background: light ? 'linear-gradient(160deg, rgba(255,255,255,0.92), rgba(240,240,244,0.82))' : 'linear-gradient(160deg, rgba(34,36,48,0.92) 0%, rgba(14,15,22,0.94) 100%)',
      border: light ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.12)',
      boxShadow: [
        light ? '0 30px 60px rgba(0,0,0,0.18)' : '0 30px 80px rgba(0,0,0,0.55)',
        'inset 0 1px 0 rgba(255,255,255,0.10)',
        glow ? `0 0 60px ${style.accent}33, inset 0 -30px 60px ${style.accent}22` : '',
      ]
        .filter(Boolean)
        .join(', '),
      color: light ? style.dark : '#F3F3F3',
      fontFamily: fontFamily(style.sansFont),
      backdropFilter: 'blur(20px)',
      ...css,
    }}
  >
    {children}
  </div>
);

/** Mouse cursor for slider drags / clicks. */
export const Cursor: React.FC<{x: number; y: number; pressed?: boolean; size?: number}> = ({x, y, pressed = false, size = 46}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{position: 'absolute', left: x, top: y, transform: `scale(${pressed ? 0.88 : 1})`, filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.35))'}}>
    <path d="M4 2 L4 19 L8.5 14.8 L11.6 21.6 L14.4 20.4 L11.3 13.7 L17.6 13.7 Z" fill="#fff" stroke="#111" strokeWidth="1.3" strokeLinejoin="round" />
  </svg>
);

/** Brush-stroke / blot depth marks for corners (as in the text-only boards). */
export const DepthMark: React.FC<{x: number; y: number; size?: number; rotate?: number; color?: string; blur?: number; delay?: number}> = ({x, y, size = 180, rotate = 0, color = '#111', blur = 2, delay = 0}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [delay, delay + 14], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE_OUT});
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{position: 'absolute', left: x, top: y, transform: `rotate(${rotate}deg) scale(${0.7 + 0.3 * p})`, opacity: p, filter: `blur(${blur}px)`}}>
      <path d="M50 5 C70 25 92 40 78 70 C68 92 40 96 30 80 C20 64 40 50 50 5 Z" fill={color} />
    </svg>
  );
};

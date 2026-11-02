// Lit UI layer + iOS-grade pieces, in a light and a dark tone. Scenes MIX looks (SceneBackground: paper / white /
// grey / dark / accent) by their role — never one look for the whole edit. Pieces follow the tone their
// SceneBackground sets (light by default); a piece's `tone` prop overrides it.
// Why: past UI looked cheap because it was unlit and tiny. What makes the references look expensive:
//   light — soft layered shadows + a faint accent-coloured glow under the focal element (light) /
//           rim light + bloom (dark);
//   iOS craft — huge tabular numbers with small decimals, thin chart lines with a fading fill,
//           thick round-cap rings, real system UI (notifications, live activities, prompt bars).
// Every piece takes `delay` (frames, relative to the scene) and animates itself in.
// Backgrounds: always through SceneBackground (below).
import React from 'react';
import {AbsoluteFill, Img, interpolate, OffthreadVideo, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {fontFamily} from '../fonts';
import type {Look, Style} from '../types';
import {EASE_IN_OUT, EASE_OUT, Grain, MinimalBackground, SPRINGS, shade, useSpring} from './design';

const asset = (src: string) => (src.startsWith('http') ? src : staticFile(src));
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/* ------------------------------------------------------------------ tone */

export type Tone = 'light' | 'dark';

/** iOS label colours per tone. */
export const INKS = {
  light: {
    primary: '#1C1C1E',
    secondary: 'rgba(60,60,67,0.62)',
    tertiary: 'rgba(60,60,67,0.34)',
    hairline: 'rgba(0,0,0,0.08)',
    track: 'rgba(0,0,0,0.07)',
    up: '#1FA855',
    down: '#E5372C',
  },
  dark: {
    primary: '#F5F5F7',
    secondary: 'rgba(235,235,245,0.62)',
    tertiary: 'rgba(235,235,245,0.32)',
    hairline: 'rgba(255,255,255,0.09)',
    track: 'rgba(255,255,255,0.12)',
    up: '#34C759',
    down: '#FF453A',
  },
};

const ToneCtx = React.createContext<Tone>('light');

/** Sets the tone for every glow piece inside (default light). */
export const ToneProvider: React.FC<{tone: Tone; children: React.ReactNode}> = ({tone, children}) => <ToneCtx.Provider value={tone}>{children}</ToneCtx.Provider>;

/** Tone of the current piece: its own `tone` prop wins over the provider. */
export const useTone = (own?: Tone) => {
  const ctx = React.useContext(ToneCtx);
  return own ?? ctx;
};

/** Label colours for the current tone. */
export const useInk = (own?: Tone) => INKS[useTone(own)];

/** Perceived brightness of a hex colour, 0..1. */
export const luminance = (hex: string) => {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h.slice(0, 6), 16);
  return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
};

/** 0→1 over `dur` frames after `delay`, eased. */
export const useProgress = (delay = 0, dur = 20, easing = EASE_OUT) => {
  const frame = useCurrentFrame();
  return interpolate(frame, [delay, delay + dur], [0, 1], {...clamp, easing});
};

/** Accent text colour that stays readable: bright accents (yellow, lime) are darkened on light surfaces. */
export const accentInk = (accent: string, tone: Tone) => (tone === 'light' && luminance(accent) > 0.7 ? shade(accent, -0.45) : accent);

/* ------------------------------------------------------------------ light */

/** Soft light blob. Put it BEHIND the focal element — this is what makes things look lit.
 *  On light backgrounds keep intensity ≤ 0.3: it reads as a coloured glow on paper. */
export const Bloom: React.FC<{color: string; x?: number | string; y?: number | string; w?: number; h?: number; intensity?: number; delay?: number}> = ({
  color,
  x = '50%',
  y = '50%',
  w = 700,
  h = 420,
  intensity = 0.55,
  delay = 0,
}) => {
  const p = useProgress(delay, 26);
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: w,
        height: h,
        transform: `translate(-50%, -50%) scale(${0.7 + 0.3 * p})`,
        borderRadius: '50%',
        background: `radial-gradient(closest-side, ${color} 0%, ${color}88 35%, transparent 100%)`,
        opacity: intensity * p,
        filter: 'blur(40px)',
        pointerEvents: 'none',
      }}
    />
  );
};

/** The `dark` look (use via SceneBackground): deep accent-tinted gradient, glowing horizon arc,
 *  optional light beams, masked grid, grain, vignette. Wrap children in it and they render in dark tone. */
export const GlowBackground: React.FC<{style: Style; horizon?: boolean; beams?: boolean; grid?: boolean; children?: React.ReactNode}> = ({
  style,
  horizon = true,
  beams = false,
  grid = true,
  children,
}) => {
  const frame = useCurrentFrame();
  const a = style.accent;
  return (
    <ToneProvider tone="dark">
      <AbsoluteFill style={{background: `radial-gradient(120% 70% at 50% 40%, ${shade(a, -0.82)} 0%, #07080d 55%, #030305 100%)`, overflow: 'hidden'}}>
        {grid ? (
          <AbsoluteFill
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)',
              backgroundSize: '90px 90px',
              backgroundPosition: 'center center',
              WebkitMaskImage: 'radial-gradient(70% 50% at 50% 50%, #000 0%, transparent 100%)',
            }}
          />
        ) : null}
        {beams ? (
          <AbsoluteFill style={{opacity: 0.5, mixBlendMode: 'screen'}}>
            {[-26, -14, 10, 22].map((r, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: -300,
                  width: 90 + i * 30,
                  height: 1500,
                  transform: `translateX(-50%) rotate(${r + Math.sin(frame / 50 + i) * 1.5}deg)`,
                  transformOrigin: 'top center',
                  background: `linear-gradient(180deg, ${a}55 0%, ${a}11 60%, transparent 100%)`,
                  filter: 'blur(30px)',
                }}
              />
            ))}
          </AbsoluteFill>
        ) : null}
        {horizon ? (
          <>
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: '78%',
                width: 2200,
                height: 2200,
                transform: 'translateX(-50%)',
                borderRadius: '50%',
                boxShadow: `0 -2px 0 ${shade(a, 0.5)}, 0 -30px 90px ${a}aa, inset 0 40px 120px ${a}55`,
                background: '#030305',
              }}
            />
            <Bloom color={a} y="79%" w={1300} h={260} intensity={0.45} />
          </>
        ) : null}
        {children}
        <Grain opacity={0.06} />
        <AbsoluteFill style={{background: 'radial-gradient(100% 70% at 50% 45%, transparent 50%, rgba(0,0,0,0.55) 100%)', pointerEvents: 'none'}} />
      </AbsoluteFill>
    </ToneProvider>
  );
};

/** The container for all UI.
 *  light (default): warm-white card, hairline, top highlight, layered soft shadows and a faint accent glow
 *    spilling from under it — reads as a lit object on the paper background / over the speaker.
 *  dark: 2 px rim light from `rimFrom`, colour glowing inside (`tint`), bloom under the lit edge.
 *  intensity 0..1 = how much accent light; bright tints (yellow, lime) are halved automatically. */
export const GlowCard: React.FC<{
  style: Style;
  width?: number | string;
  padding?: number;
  radius?: number;
  tint?: string;
  intensity?: number;
  rimFrom?: 'bottom' | 'top' | 'left' | 'right';
  tone?: Tone;
  frosted?: boolean; // light only: translucent white with backdrop blur (over video)
  delay?: number; // pops in (rise + scale + fade + blur); undefined = no entry animation
  css?: React.CSSProperties;
  children: React.ReactNode;
}> = ({style, width = 'auto', padding = 40, radius = 44, tint, intensity: rawIntensity = 0.8, rimFrom = 'bottom', tone: own, frosted = false, delay, css, children}) => {
  const tone = useTone(own);
  const ink = INKS[tone];
  const p = useSpring(delay ?? -100, 'default');
  const t = tint ?? style.accent;
  const intensity = rawIntensity * (luminance(t) > 0.6 ? 0.5 : 1);
  const anim = delay === undefined ? {} : {transform: `translateY(${(1 - p) * 40}px) scale(${0.92 + 0.08 * p})`};
  const font = fontFamily(style.sansFont);

  if (tone === 'light') {
    return (
      <div style={{position: 'relative', width, ...anim, ...css}}>
        {/* faint accent light spilling out under the card */}
        <div style={{position: 'absolute', left: '12%', right: '12%', bottom: -26, height: 80, background: t, filter: 'blur(46px)', opacity: 0.32 * intensity, borderRadius: '50%'}} />
        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            padding,
            borderRadius: radius,
            background: frosted ? 'rgba(255,255,255,0.84)' : 'linear-gradient(180deg, #FFFFFF 0%, #F8F7F4 100%)',
            backdropFilter: frosted ? 'blur(30px) saturate(1.5)' : undefined,
            border: '1px solid rgba(0,0,0,0.05)',
            boxShadow: [
              'inset 0 1px 0 #fff',
              '0 1px 2px rgba(0,0,0,0.06)',
              '0 10px 24px rgba(0,0,0,0.08)',
              '0 36px 80px rgba(0,0,0,0.16)',
              `0 18px 60px ${t}${Math.round(0x30 * intensity).toString(16).padStart(2, '0')}`,
            ].join(', '),
            color: ink.primary,
            fontFamily: font,
          }}
        >
          {/* a whisper of the accent inside, from the lit side */}
          <div style={{position: 'absolute', inset: 0, background: `radial-gradient(110% 70% at 50% ${rimFrom === 'top' ? '0%' : '115%'}, ${t}${Math.round(0x1c * intensity).toString(16).padStart(2, '0')} 0%, transparent 70%)`}} />
          <div style={{position: 'relative'}}>{children}</div>
        </div>
      </div>
    );
  }

  const dir = {bottom: '0deg', top: '180deg', left: '90deg', right: '270deg'}[rimFrom];
  return (
    <div style={{position: 'relative', width, ...anim, ...css}}>
      <div
        style={{
          position: 'absolute',
          left: '10%',
          right: '10%',
          bottom: rimFrom === 'bottom' ? -30 : undefined,
          top: rimFrom === 'top' ? -30 : rimFrom === 'bottom' ? undefined : '20%',
          height: rimFrom === 'bottom' || rimFrom === 'top' ? 90 : '60%',
          background: t,
          filter: 'blur(50px)',
          opacity: 0.55 * intensity,
          borderRadius: '50%',
        }}
      />
      <div
        style={{
          position: 'relative',
          padding: 2,
          borderRadius: radius,
          background: `linear-gradient(${dir}, ${shade(t, 0.35)} 0%, ${t}66 22%, rgba(255,255,255,0.10) 55%, rgba(255,255,255,0.16) 100%)`,
          boxShadow: `0 40px 90px rgba(0,0,0,0.6), 0 0 ${60 * intensity}px ${t}33`,
        }}
      >
        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            padding,
            borderRadius: radius - 2,
            background: `radial-gradient(120% 90% at 50% ${rimFrom === 'top' ? '0%' : '115%'}, ${t}${Math.round(0x66 * intensity).toString(16).padStart(2, '0')} 0%, ${shade(t, -0.7)}cc 38%, #0c0d14 75%)`,
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.14)',
            color: ink.primary,
            fontFamily: font,
          }}
        >
          <Grain opacity={0.07} />
          <div style={{position: 'relative'}}>{children}</div>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ scene looks */

/** One switch for every scene background. MIX these across an edit by scene role (visual-training PART 6):
 *   paper  — warm paper + drifting cast shadow, grid, halftone (editorial, statements, objects)
 *   white  — clean white, nothing else (product / Apple-like, UI that should breathe, logos)
 *   grey   — flat light grey (data, dashboards, several cards)
 *   dark   — deep accent-tinted dark with horizon glow (tech / AI / premium / contrast moment)
 *   accent — solid accent gradient (the ONE punch: big reveal, payoff number, CTA)
 *  Sets the tone for glow pieces inside (dark/accent → light ink on colour, bright accents stay dark ink). */
export const SceneBackground: React.FC<{look: Exclude<Look, 'auto'>; style: Style; horizon?: boolean; beams?: boolean; children?: React.ReactNode}> = ({look, style, horizon, beams, children}) => {
  const a = style.accent;
  if (look === 'paper') {
    return (
      <ToneProvider tone="light">
        <MinimalBackground tone="warm" style={style}>
          {children}
        </MinimalBackground>
      </ToneProvider>
    );
  }
  if (look === 'dark') {
    return (
      <GlowBackground style={style} horizon={horizon ?? true} beams={beams}>
        {children}
      </GlowBackground>
    );
  }
  const bg =
    look === 'white'
      ? 'radial-gradient(130% 90% at 50% 35%, #FFFFFF 55%, #F3F3F1 100%)'
      : look === 'grey'
        ? 'radial-gradient(130% 90% at 50% 35%, #F5F5F7 0%, #E9E9ED 100%)'
        : `radial-gradient(120% 80% at 50% 38%, ${shade(a, 0.18)} 0%, ${a} 45%, ${shade(a, -0.35)} 100%)`;
  const tone: Tone = look === 'accent' && luminance(a) < 0.6 ? 'dark' : 'light';
  return (
    <ToneProvider tone={tone}>
      <AbsoluteFill style={{background: bg, overflow: 'hidden'}}>
        {children}
        <Grain opacity={look === 'accent' ? 0.08 : 0.035} />
      </AbsoluteFill>
    </ToneProvider>
  );
};

/** Resolve "auto": the plan's choice wins, else the scene's role picks a default (Claude can always override). */
export const pickLook = (look: Look | undefined, fallback: Exclude<Look, 'auto'>): Exclude<Look, 'auto'> => (look && look !== 'auto' ? look : fallback);

/* ------------------------------------------------------------------ type & numbers */

const fmt = (v: number, decimals: number, sep: string) => {
  const [i, d] = v.toFixed(decimals).split('.');
  return {int: i.replace(/\B(?=(\d{3})+(?!\d))/g, sep), dec: d};
};

/** iOS finance-style number: small label → huge value (decimals small & raised) → coloured delta.
 *  Counts up from `from` to `value`. `glow` = accent halo behind the digits (dark tone only). */
export const BigNumber: React.FC<{
  style: Style;
  value: number;
  from?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  label?: string;
  delta?: string; // e.g. "+12,4 % ovaj mjesec"
  deltaUp?: boolean;
  deltaColor?: string; // override (e.g. white on the accent look, where green/red would clash)
  size?: number;
  sep?: string; // thousands separator, "." for HR
  glow?: boolean;
  align?: 'left' | 'center';
  tone?: Tone;
  delay?: number;
  dur?: number;
}> = ({style, value, from = 0, decimals = 0, prefix = '', suffix = '', label, delta, deltaUp = true, deltaColor, size = 150, sep = '.', glow = true, align = 'center', tone: own, delay = 0, dur = 36}) => {
  const tone = useTone(own);
  const ink = INKS[tone];
  const p = useProgress(delay, dur, EASE_IN_OUT);
  const inP = useSpring(delay, 'heavy');
  const dP = useProgress(delay + dur - 6, 14);
  const n = fmt(from + (value - from) * p, decimals, sep);
  return (
    <div style={{textAlign: align, fontFamily: fontFamily(style.sansFont), opacity: inP, transform: `translateY(${(1 - inP) * 20}px)`}}>
      {label ? <div style={{fontSize: size * 0.2, color: ink.secondary, fontWeight: 500, marginBottom: size * 0.06, letterSpacing: '-0.01em'}}>{label}</div> : null}
      <div
        style={{
          fontSize: size,
          fontWeight: 600,
          lineHeight: 1,
          letterSpacing: '-0.045em',
          fontVariantNumeric: 'tabular-nums',
          color: ink.primary,
          textShadow: glow && tone === 'dark' ? `0 0 ${size * 0.35}px ${style.accent}88` : undefined,
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{fontSize: '0.62em', verticalAlign: '0.32em', marginRight: '0.04em', color: ink.secondary}}>{prefix}</span>
        {n.int}
        {decimals > 0 ? <span style={{fontSize: '0.45em', verticalAlign: '0.85em', color: ink.secondary}}>,{n.dec}</span> : null}
        {suffix ? <span style={{fontSize: '0.5em', marginLeft: '0.06em', color: ink.secondary}}>{suffix}</span> : null}
      </div>
      {delta ? (
        <div style={{marginTop: size * 0.1, fontSize: size * 0.19, fontWeight: 600, color: deltaColor ?? (deltaUp ? ink.up : ink.down), opacity: dP}}>
          {deltaUp ? '↗' : '↘'} {delta}
        </div>
      ) : null}
    </div>
  );
};

/* ------------------------------------------------------------------ charts */

const smoothPath = (pts: [number, number][]) => {
  if (pts.length < 2) return '';
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const cx = (x0 + x1) / 2;
    d += ` C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`;
  }
  return d;
};

/** Line chart that draws itself: 5 px line (glowing in dark), fill fading down, dotted baselines,
 *  scrub dot (ring + vertical line + value bubble) riding the tip. */
export const LineChart: React.FC<{
  style: Style;
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  tip?: string; // bubble text at the end, e.g. "€6"
  labels?: string[]; // x-axis labels (evenly spaced)
  tone?: Tone;
  delay?: number;
  dur?: number;
}> = ({style, data, width = 820, height = 380, color, tip, labels, tone: own, delay = 0, dur = 40}) => {
  const tone = useTone(own);
  const ink = INKS[tone];
  const p = useProgress(delay, dur, EASE_IN_OUT);
  const c = color ?? accentInk(style.accent, tone);
  const id = React.useId().replace(/:/g, '');
  const min = Math.min(...data);
  const max = Math.max(...data);
  const pad = 24;
  const pts = data.map((v, i) => [pad + (i / (data.length - 1)) * (width - pad * 2), pad + (1 - (v - min) / (max - min || 1)) * (height - pad * 2 - 40)] as [number, number]);
  const d = smoothPath(pts);
  const f = p * (pts.length - 1);
  const i0 = Math.min(Math.floor(f), pts.length - 2);
  const t = f - i0;
  const tx = pts[i0][0] + (pts[i0 + 1][0] - pts[i0][0]) * t;
  const ty = pts[i0][1] + (pts[i0 + 1][1] - pts[i0][1]) * (t * t * (3 - 2 * t));
  const bottom = height - 40;
  return (
    <div style={{position: 'relative', width, height}}>
      <svg width={width} height={height} style={{overflow: 'visible'}}>
        <defs>
          <linearGradient id={`fill${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={c} stopOpacity={tone === 'dark' ? 0.45 : 0.22} />
            <stop offset="100%" stopColor={c} stopOpacity={0} />
          </linearGradient>
          <clipPath id={`clip${id}`}>
            <rect x={0} y={-50} width={tx} height={height + 100} />
          </clipPath>
          <filter id={`glow${id}`} x="-20%" y="-50%" width="140%" height="200%">
            <feGaussianBlur stdDeviation={tone === 'dark' ? 8 : 4} result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {[0.25, 0.5, 0.75].map((k) => (
          <line key={k} x1={pad} x2={width - pad} y1={pad + k * (bottom - pad)} y2={pad + k * (bottom - pad)} stroke={ink.hairline} strokeWidth={2} strokeDasharray="2 10" strokeLinecap="round" />
        ))}
        <g clipPath={`url(#clip${id})`}>
          <path d={`${d} L ${pts[pts.length - 1][0]} ${bottom} L ${pts[0][0]} ${bottom} Z`} fill={`url(#fill${id})`} />
          <path d={d} fill="none" stroke={c} strokeWidth={5} strokeLinecap="round" filter={`url(#glow${id})`} />
        </g>
        {p > 0.02 ? (
          <>
            <line x1={tx} x2={tx} y1={ty + 16} y2={bottom} stroke={c} strokeOpacity={0.45} strokeWidth={2} />
            <circle cx={tx} cy={ty} r={20} fill={c} opacity={0.2} />
            <circle cx={tx} cy={ty} r={11} fill="#fff" stroke={c} strokeWidth={5} />
          </>
        ) : null}
      </svg>
      {tip && p > 0.6 ? (
        <div
          style={{
            position: 'absolute',
            left: tx,
            top: ty - 92,
            transform: `translateX(-50%) scale(${interpolate(p, [0.6, 0.85], [0.6, 1], clamp)})`,
            opacity: interpolate(p, [0.6, 0.8], [0, 1], clamp),
            padding: '10px 20px',
            borderRadius: 16,
            background: tone === 'dark' ? '#1c1c22' : ink.primary,
            border: tone === 'dark' ? `1px solid ${c}66` : 'none',
            color: '#fff',
            fontFamily: fontFamily(style.sansFont),
            fontWeight: 600,
            fontSize: 34,
            whiteSpace: 'nowrap',
            boxShadow: tone === 'dark' ? `0 10px 30px rgba(0,0,0,0.5), 0 0 30px ${c}44` : '0 10px 24px rgba(0,0,0,0.18)',
          }}
        >
          {tip}
        </div>
      ) : null}
      {labels ? (
        <div style={{position: 'absolute', left: pad, right: pad, bottom: 0, display: 'flex', justifyContent: 'space-between', fontFamily: fontFamily(style.sansFont), fontSize: 26, color: ink.tertiary, fontWeight: 500}}>
          {labels.map((l, i) => (
            <span key={i}>{l}</span>
          ))}
        </div>
      ) : null}
    </div>
  );
};

/** Bars grow in one after another; `highlight` bar is lit in the accent, the rest are quiet. */
export const BarChart: React.FC<{style: Style; data: number[]; highlight?: number; labels?: string[]; width?: number; height?: number; tone?: Tone; delay?: number; stagger?: number}> = ({
  style,
  data,
  highlight,
  labels,
  width = 760,
  height = 360,
  tone: own,
  delay = 0,
  stagger = 3,
}) => {
  const tone = useTone(own);
  const ink = INKS[tone];
  const frame = useCurrentFrame();
  const max = Math.max(...data);
  const gap = 18;
  const bw = (width - gap * (data.length - 1)) / data.length;
  const hi = highlight ?? data.indexOf(max);
  const a = style.accent;
  const quiet = tone === 'dark' ? 'linear-gradient(180deg, rgba(255,255,255,0.20) 0%, rgba(255,255,255,0.07) 100%)' : 'linear-gradient(180deg, rgba(0,0,0,0.11) 0%, rgba(0,0,0,0.05) 100%)';
  return (
    <div style={{width, fontFamily: fontFamily(style.sansFont)}}>
      <div style={{height, display: 'flex', alignItems: 'flex-end', gap}}>
        {data.map((v, i) => {
          const g = interpolate(frame, [delay + i * stagger, delay + i * stagger + 20], [0, 1], {...clamp, easing: EASE_OUT});
          const on = i === hi;
          return (
            <div
              key={i}
              style={{
                width: bw,
                height: Math.max(8, (v / max) * height * g),
                borderRadius: 14,
                background: on ? `linear-gradient(180deg, ${shade(a, 0.3)} 0%, ${a} 100%)` : quiet,
                boxShadow: on ? `${tone === 'dark' ? `0 0 40px ${a}aa` : `0 14px 30px ${a}55`}, inset 0 1px 0 rgba(255,255,255,0.5)` : tone === 'dark' ? 'inset 0 1px 0 rgba(255,255,255,0.15)' : undefined,
              }}
            />
          );
        })}
      </div>
      {labels ? (
        <div style={{display: 'flex', gap, marginTop: 18}}>
          {labels.map((l, i) => (
            <div key={i} style={{width: bw, textAlign: 'center', fontSize: 24, fontWeight: 600, letterSpacing: '0.04em', color: i === hi ? ink.primary : ink.tertiary}}>
              {l}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};

/** Thick round-cap progress ring (WHOOP / Garmin / Apple Fitness), value counts up in the middle. */
export const Ring: React.FC<{style: Style; value: number; size?: number; stroke?: number; color?: string; label?: string; suffix?: string; tone?: Tone; delay?: number; dur?: number}> = ({
  style,
  value,
  size = 300,
  stroke = 26,
  color,
  label,
  suffix = '%',
  tone: own,
  delay = 0,
  dur = 40,
}) => {
  const tone = useTone(own);
  const ink = INKS[tone];
  const p = useProgress(delay, dur, EASE_IN_OUT);
  const inP = useSpring(delay, 'default');
  const c = color ?? style.accent;
  const r = (size - stroke) / 2;
  const len = 2 * Math.PI * r;
  return (
    <div style={{position: 'relative', width: size, height: size, transform: `scale(${0.85 + 0.15 * inP})`, opacity: inP, fontFamily: fontFamily(style.sansFont)}}>
      <svg width={size} height={size} style={{transform: 'rotate(-90deg)', overflow: 'visible'}}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={c} strokeOpacity={tone === 'dark' ? 0.16 : 0.14} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={c}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${len * (value / 100) * p} ${len}`}
          style={{filter: tone === 'dark' ? `drop-shadow(0 0 14px ${c})` : `drop-shadow(0 6px 10px ${c}66)`}}
        />
      </svg>
      <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
        <div style={{fontSize: size * 0.27, fontWeight: 600, letterSpacing: '-0.04em', color: ink.primary, fontVariantNumeric: 'tabular-nums'}}>
          {Math.round(value * p)}
          <span style={{fontSize: '0.5em', color: ink.secondary}}>{suffix}</span>
        </div>
        {label ? <div style={{fontSize: size * 0.085, fontWeight: 600, letterSpacing: '0.08em', color: ink.secondary, textTransform: 'uppercase', marginTop: 4}}>{label}</div> : null}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ moments */

/** Success: ring sweeps around, check mark draws, colour blooms behind (Apple Wallet / Fresha). */
export const CheckBurst: React.FC<{style: Style; size?: number; color?: string; title?: string; subtitle?: string; tone?: Tone; delay?: number}> = ({
  style,
  size = 220,
  color,
  title,
  subtitle,
  tone: own,
  delay = 0,
}) => {
  const tone = useTone(own);
  const ink = INKS[tone];
  const ring = useProgress(delay, 18, EASE_IN_OUT);
  const tick = useProgress(delay + 14, 12);
  const txt = useProgress(delay + 20, 14);
  const c = color ?? ink.up;
  const r = size / 2 - 10;
  const len = 2 * Math.PI * r;
  return (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: fontFamily(style.sansFont), position: 'relative'}}>
      <Bloom color={c} y={size / 2} w={size * 2.6} h={size * 2.2} intensity={tone === 'dark' ? 0.5 : 0.22} delay={delay + 10} />
      <svg width={size} height={size} style={{position: 'relative', overflow: 'visible'}}>
        <circle cx={size / 2} cy={size / 2} r={r} fill={c} fillOpacity={(tone === 'dark' ? 0.12 : 1) * tick} stroke={c} strokeOpacity={0.18} strokeWidth={14} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={c}
          strokeWidth={14}
          strokeLinecap="round"
          strokeDasharray={`${len * ring} ${len}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{filter: tone === 'dark' ? `drop-shadow(0 0 12px ${c})` : `drop-shadow(0 10px 18px ${c}66)`}}
        />
        <path
          d={`M ${size * 0.3} ${size * 0.52} L ${size * 0.44} ${size * 0.65} L ${size * 0.71} ${size * 0.37}`}
          fill="none"
          stroke="#fff"
          strokeWidth={size * 0.075}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray={`${tick} 1`}
        />
      </svg>
      {title ? <div style={{position: 'relative', marginTop: 36, fontSize: 58, fontWeight: 600, letterSpacing: '-0.03em', color: ink.primary, opacity: txt, transform: `translateY(${(1 - txt) * 14}px)`}}>{title}</div> : null}
      {subtitle ? <div style={{position: 'relative', marginTop: 10, fontSize: 32, color: ink.secondary, opacity: txt}}>{subtitle}</div> : null}
    </div>
  );
};

/** 3D glossy app icon (squircle, gradient, glyph or image, soft glow). Works on light and dark. */
export const GlassIcon: React.FC<{color: string; size?: number; glyph?: React.ReactNode; src?: string; delay?: number; glow?: boolean}> = ({color, size = 180, glyph, src, delay = 0, glow = true}) => {
  const p = useSpring(delay, 'snappy');
  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        borderRadius: size * 0.27,
        background: `linear-gradient(160deg, ${shade(color, 0.35)} 0%, ${color} 45%, ${shade(color, -0.45)} 100%)`,
        boxShadow: [
          'inset 0 2px 1px rgba(255,255,255,0.55)',
          `inset 0 -${size * 0.08}px ${size * 0.15}px ${shade(color, -0.55)}`,
          '0 20px 40px rgba(0,0,0,0.28)',
          glow ? `0 ${size * 0.12}px ${size * 0.45}px ${color}77` : '',
        ]
          .filter(Boolean)
          .join(', '),
        transform: `scale(${p})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        color: '#fff',
        fontSize: size * 0.48,
      }}
    >
      <div style={{position: 'absolute', left: '-20%', right: '-20%', top: '-55%', height: '95%', borderRadius: '50%', background: 'linear-gradient(180deg, rgba(255,255,255,0.45), rgba(255,255,255,0))'}} />
      {src ? <Img src={asset(src)} style={{position: 'relative', width: '62%', height: '62%', objectFit: 'contain'}} /> : <div style={{position: 'relative', filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.3))'}}>{glyph}</div>}
    </div>
  );
};

/* ------------------------------------------------------------------ iOS system UI */

const sysSurface = (tone: Tone) =>
  tone === 'dark'
    ? {background: 'rgba(40,40,46,0.8)', boxShadow: '0 30px 70px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.12)'}
    : {background: 'rgba(255,255,255,0.86)', boxShadow: '0 1px 2px rgba(0,0,0,0.06), 0 14px 30px rgba(0,0,0,0.10), 0 34px 70px rgba(0,0,0,0.16), inset 0 1px 0 #fff'};

/** iOS notification banner sliding down from the top (app icon, app name, time, title, body). */
export const Notification: React.FC<{style: Style; app: string; title: string; body: string; icon?: string; iconColor?: string; time?: string; width?: number; tone?: Tone; delay?: number}> = ({
  style,
  app,
  title,
  body,
  icon,
  iconColor,
  time = 'sada',
  width = 900,
  tone: own,
  delay = 0,
}) => {
  const tone = useTone(own);
  const ink = INKS[tone];
  const p = useSpring(delay, 'snappy');
  return (
    <div
      style={{
        width,
        padding: '30px 34px',
        borderRadius: 52,
        display: 'flex',
        gap: 26,
        alignItems: 'flex-start',
        backdropFilter: 'blur(30px) saturate(1.6)',
        ...sysSurface(tone),
        fontFamily: fontFamily(style.sansFont),
        color: ink.primary,
        transform: `translateY(${(1 - p) * -160}px) scale(${0.94 + 0.06 * p})`,
        opacity: Math.min(1, p * 1.5),
      }}
    >
      <div style={{flex: 'none', width: 96, height: 96, borderRadius: 24, overflow: 'hidden', background: iconColor ?? style.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.06)'}}>
        {icon ? <Img src={asset(icon)} style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : <span style={{fontSize: 46, fontWeight: 700, color: luminance(iconColor ?? style.accent) > 0.6 ? '#1C1C1E' : '#fff'}}>{app[0]}</span>}
      </div>
      <div style={{flex: 1, minWidth: 0}}>
        <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 28, color: ink.secondary, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.02em'}}>
          <span>{app}</span>
          <span style={{textTransform: 'none'}}>{time}</span>
        </div>
        <div style={{fontSize: 36, fontWeight: 600, marginTop: 6, letterSpacing: '-0.01em'}}>{title}</div>
        <div style={{fontSize: 33, color: tone === 'dark' ? 'rgba(245,245,247,0.86)' : 'rgba(28,28,30,0.82)', marginTop: 4, lineHeight: 1.25}}>{body}</div>
      </div>
    </div>
  );
};

/** Lock-screen Live Activity: title + big coloured stat + progress tracker with step dots (talabat / Instacart / Lyft). */
export const LiveActivity: React.FC<{style: Style; title: string; subtitle?: string; steps?: number; at?: number; color?: string; right?: string; width?: number; tone?: Tone; delay?: number}> = ({
  style,
  title,
  subtitle,
  steps = 4,
  at = 3,
  color,
  right,
  width = 920,
  tone: own,
  delay = 0,
}) => {
  const tone = useTone(own);
  const ink = INKS[tone];
  const p = useSpring(delay, 'default');
  const run = useProgress(delay + 8, 40, EASE_IN_OUT);
  const c = color ?? style.accent;
  const cText = accentInk(c, tone);
  const fill = (at / (steps - 1)) * run;
  return (
    <div
      style={{
        width,
        padding: '40px 44px 44px',
        borderRadius: 56,
        backdropFilter: 'blur(30px)',
        ...sysSurface(tone),
        fontFamily: fontFamily(style.sansFont),
        color: ink.primary,
        transform: `translateY(${(1 - p) * 120}px)`,
        opacity: p,
      }}
    >
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end'}}>
        <div>
          <div style={{fontSize: 44, fontWeight: 700, letterSpacing: '-0.02em'}}>{title}</div>
          {subtitle ? <div style={{fontSize: 30, color: ink.secondary, marginTop: 6}}>{subtitle}</div> : null}
        </div>
        {right ? <div style={{fontSize: 56, fontWeight: 700, color: cText, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em'}}>{right}</div> : null}
      </div>
      <div style={{position: 'relative', height: 44, marginTop: 36}}>
        <div style={{position: 'absolute', left: 22, right: 22, top: 18, height: 8, borderRadius: 4, background: ink.track}} />
        <div style={{position: 'absolute', left: 22, top: 18, height: 8, borderRadius: 4, width: `calc((100% - 44px) * ${fill})`, background: c, boxShadow: tone === 'dark' ? `0 0 16px ${c}` : `0 4px 10px ${c}66`}} />
        {Array.from({length: steps}, (_, i) => {
          const on = fill >= i / (steps - 1) - 0.001;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `calc(22px + (100% - 44px) * ${i / (steps - 1)})`,
                top: 0,
                width: 44,
                height: 44,
                marginLeft: -22,
                borderRadius: '50%',
                background: on ? c : tone === 'dark' ? '#2a2a30' : '#ECEBE8',
                border: `3px solid ${on ? shade(c, 0.3) : ink.hairline}`,
                boxShadow: on ? (tone === 'dark' ? `0 0 18px ${c}` : `0 4px 12px ${c}66`) : undefined,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                fontWeight: 800,
                color: luminance(c) > 0.6 ? '#1C1C1E' : '#fff',
              }}
            >
              {on ? '✓' : ''}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/** Floating AI prompt bar (ChatGPT / Perplexity): types the prompt, send button lights up, optional "thinking" shimmer. */
export const PromptBar: React.FC<{style: Style; text: string; placeholder?: string; width?: number; tone?: Tone; delay?: number; perChar?: number; thinking?: string}> = ({
  style,
  text,
  placeholder = 'Pitaj bilo što…',
  width = 900,
  tone: own,
  delay = 0,
  perChar = 1.3,
  thinking,
}) => {
  const tone = useTone(own);
  const ink = INKS[tone];
  const frame = useCurrentFrame();
  const p = useSpring(delay, 'default');
  const typeStart = delay + 10;
  const n = Math.max(0, Math.min(text.length, Math.floor((frame - typeStart) / perChar)));
  const done = typeStart + text.length * perChar;
  const send = interpolate(frame, [done + 4, done + 10], [0, 1], clamp);
  const think = thinking ? interpolate(frame, [done + 12, done + 22], [0, 1], clamp) : 0;
  const shimmerX = ((frame - done) * 14) % 900;
  const a = style.accent;
  const btnOn = tone === 'dark' ? '#fff' : ink.primary;
  return (
    <div style={{width, fontFamily: fontFamily(style.sansFont), transform: `translateY(${(1 - p) * 60}px)`, opacity: p}}>
      {thinking ? (
        <div
          style={{
            fontSize: 34,
            fontWeight: 500,
            marginBottom: 28,
            marginLeft: 20,
            opacity: think,
            backgroundImage: `linear-gradient(90deg, ${ink.tertiary} 0px, ${ink.primary} ${shimmerX}px, ${ink.tertiary} ${shimmerX + 200}px)`,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          ✦ {thinking}
        </div>
      ) : null}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 22,
          padding: '22px 22px 22px 34px',
          borderRadius: 60,
          background: tone === 'dark' ? 'rgba(30,30,36,0.9)' : 'rgba(255,255,255,0.94)',
          border: `1.5px solid ${n > 0 ? a + '99' : ink.hairline}`,
          boxShadow: [
            tone === 'dark' ? '0 20px 50px rgba(0,0,0,0.5)' : '0 1px 2px rgba(0,0,0,0.06), 0 20px 50px rgba(0,0,0,0.14)',
            n > 0 ? `0 0 ${tone === 'dark' ? 40 : 30}px ${a}${tone === 'dark' ? '44' : '33'}` : '',
            tone === 'dark' ? 'inset 0 1px 0 rgba(255,255,255,0.08)' : 'inset 0 1px 0 #fff',
          ]
            .filter(Boolean)
            .join(', '),
        }}
      >
        <div style={{fontSize: 46, color: ink.secondary, lineHeight: 1}}>+</div>
        <div style={{flex: 1, fontSize: 38, color: n > 0 ? ink.primary : ink.tertiary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
          {n > 0 ? text.slice(0, n) : placeholder}
          {n > 0 && n < text.length ? <span style={{color: accentInk(a, tone)}}>|</span> : null}
        </div>
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            flex: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 40,
            fontWeight: 700,
            color: send > 0.5 ? (tone === 'dark' ? '#000' : '#fff') : ink.tertiary,
            background: send > 0.5 ? btnOn : ink.track,
            transform: `scale(${1 - 0.12 * Math.sin(send * Math.PI)})`,
            boxShadow: send > 0.5 ? (tone === 'dark' ? '0 0 30px rgba(255,255,255,0.5)' : '0 8px 18px rgba(0,0,0,0.22)') : undefined,
          }}
        >
          ↑
        </div>
      </div>
    </div>
  );
};

/** Segmented control (1M · 3M · 6M …); the active pill slides from `from` to `to` at `moveAt`. */
export const Segmented: React.FC<{style: Style; items: string[]; from?: number; to?: number; moveAt?: number; width?: number; tone?: Tone; delay?: number}> = ({
  style,
  items,
  from = 0,
  to,
  moveAt = 20,
  width = 760,
  tone: own,
  delay = 0,
}) => {
  const tone = useTone(own);
  const ink = INKS[tone];
  const p = useSpring(delay, 'snappy');
  const m = useProgress(moveAt, 12, EASE_IN_OUT);
  const idx = from + ((to ?? from) - from) * m;
  const w = (width - 12) / items.length;
  return (
    <div
      style={{
        position: 'relative',
        width,
        height: 84,
        padding: 6,
        borderRadius: 42,
        background: tone === 'dark' ? 'rgba(118,118,128,0.24)' : 'rgba(118,118,128,0.12)',
        display: 'flex',
        fontFamily: fontFamily(style.sansFont),
        opacity: p,
        transform: `scale(${0.95 + 0.05 * p})`,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 6,
          left: 6 + idx * w,
          width: w,
          height: 72,
          borderRadius: 36,
          background: tone === 'dark' ? '#636366' : '#fff',
          boxShadow: tone === 'dark' ? '0 3px 8px rgba(0,0,0,0.3)' : '0 3px 8px rgba(0,0,0,0.12), 0 1px 1px rgba(0,0,0,0.04)',
        }}
      />
      {items.map((it, i) => (
        <div key={i} style={{position: 'relative', width: w, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, fontWeight: 600, color: Math.abs(idx - i) < 0.5 ? ink.primary : ink.secondary}}>
          {it}
        </div>
      ))}
    </div>
  );
};

/* ------------------------------------------------------------------ real product UI */

/** iPhone with REAL app screenshots. Use RARELY: only when the scene is literally about using a specific app
 *  (typically at most once per edit). Never put our own UI pieces (cards, charts, numbers) inside it — show those bare.
 *  screens: image paths, shown in order; switchAt[i] = frame the (i+1)th screen pushes in from the right.
 *  taps: fingertip presses on the current screen, x/y = 0..1 of the screen. scroll: move a tall screenshot up
 *  (y = fraction of the screen height) between frames. Rises in on a `default` spring at `delay`. */
export const Phone: React.FC<{
  screens: string[];
  switchAt?: number[];
  taps?: {at: number; x: number; y: number}[];
  scroll?: {from: number; to: number; y: number}[];
  width?: number;
  tilt?: number; // degrees, e.g. -6 for a casual angle
  delay?: number;
  shadow?: boolean;
}> = ({screens, switchAt = [], taps = [], scroll = [], width = 560, tilt = 0, delay = 0, shadow = true}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = useSpring(delay, 'default');
  const h = width * 2.165;
  const bezel = width * 0.035;
  const r = width * 0.17;
  const sw = width - bezel * 2;
  const sh = h - bezel * 2;
  // how far each switch has travelled 0..1
  const sp = switchAt.map((at) => spring({frame: frame - at, fps, config: SPRINGS.default}));
  const current = sp.filter((v) => v > 0.5).length;
  const scrollY = scroll.reduce((acc, sc) => acc + sc.y * spring({frame: frame - sc.from, fps, config: SPRINGS.default, durationInFrames: Math.max(1, sc.to - sc.from)}), 0);
  return (
    <div
      style={{
        position: 'relative',
        width,
        height: h,
        transform: `translateY(${(1 - p) * 260}px) rotate(${tilt}deg) scale(${0.94 + 0.06 * p})`,
        opacity: Math.min(1, p * 1.8),
      }}
    >
      {/* body */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: r,
          background: 'linear-gradient(160deg, #3a3a3e 0%, #111114 40%, #0a0a0c 100%)',
          boxShadow: shadow
            ? '0 2px 3px rgba(0,0,0,0.25), 0 24px 40px rgba(0,0,0,0.22), 0 60px 120px rgba(0,0,0,0.28), inset 0 0 0 2px rgba(255,255,255,0.08)'
            : 'inset 0 0 0 2px rgba(255,255,255,0.08)',
        }}
      />
      {/* screen */}
      <div style={{position: 'absolute', left: bezel, top: bezel, width: sw, height: sh, borderRadius: r - bezel, overflow: 'hidden', background: '#fff'}}>
        {screens.map((src, i) => {
          const inT = i === 0 ? 1 : sp[i - 1] ?? 0; // this screen's push-in progress
          const outT = sp[i] ?? 0; // the next screen pushing it away
          if (inT <= 0.001 || outT >= 0.999) return null;
          const x = (1 - inT) * sw - outT * sw * 0.3;
          return (
            <div key={i} style={{position: 'absolute', inset: 0, transform: `translateX(${x}px)`, boxShadow: i > 0 ? '-20px 0 40px rgba(0,0,0,0.15)' : undefined}}>
              <Img src={asset(src)} style={{width: '100%', minHeight: sh, objectFit: 'cover', objectPosition: '50% 0', display: 'block', transform: i === current ? `translateY(${-scrollY * sh}px)` : undefined}} />
              <div style={{position: 'absolute', inset: 0, background: '#000', opacity: outT * 0.25}} />
            </div>
          );
        })}
        {/* fingertip taps */}
        {taps.map((t, i) => {
          const a = interpolate(frame, [t.at - 8, t.at - 1, t.at + 3, t.at + 12], [0, 1, 1, 0], clamp);
          if (a <= 0) return null;
          const press = interpolate(frame, [t.at - 2, t.at, t.at + 4], [1, 0.82, 1], clamp);
          const ring = interpolate(frame, [t.at, t.at + 12], [0, 1], {...clamp, easing: EASE_OUT});
          const d = width * 0.13;
          return (
            <div key={i} style={{position: 'absolute', left: t.x * sw - d / 2, top: t.y * sh - d / 2, width: d, height: d}}>
              <div style={{position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.9)', transform: `scale(${1 + ring * 0.9})`, opacity: (1 - ring) * 0.8}} />
              <div style={{position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(60,60,67,0.35)', border: '2px solid rgba(255,255,255,0.7)', boxShadow: '0 4px 12px rgba(0,0,0,0.25)', transform: `scale(${press})`, opacity: a}} />
            </div>
          );
        })}
      </div>
      {/* dynamic island */}
      <div style={{position: 'absolute', top: bezel + width * 0.025, left: '50%', width: width * 0.3, height: width * 0.085, transform: 'translateX(-50%)', borderRadius: 99, background: '#000'}} />
      {/* edge highlight */}
      <div style={{position: 'absolute', inset: 0, borderRadius: r, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25)', pointerEvents: 'none'}} />
    </div>
  );
};

/** A clip made elsewhere — e.g. a 9:16 render from the motion-reel kit — dropped in as a full-screen scene.
 *  Muted by default (our SFX layer carries the sound); pass volumeDb to keep the clip's own mix. */
export const MotionClip: React.FC<{src: string; startFrom?: number; volumeDb?: number; fit?: 'cover' | 'contain'; background?: string}> = ({
  src,
  startFrom = 0,
  volumeDb,
  fit = 'cover',
  background = '#000',
}) => (
  <AbsoluteFill style={{background}}>
    <OffthreadVideo
      src={asset(src)}
      startFrom={startFrom}
      muted={volumeDb === undefined}
      volume={volumeDb === undefined ? 0 : Math.pow(10, volumeDb / 20)}
      style={{width: '100%', height: '100%', objectFit: fit}}
    />
  </AbsoluteFill>
);

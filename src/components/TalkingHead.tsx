import React from 'react';
import {AbsoluteFill, Easing, interpolate, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {CameraMove, Edit} from '../types';

const EASE = Easing.bezier(0.45, 0, 0.2, 1);
const RAMP = 8; // frames for darken/blur and layout transitions

const cameraAt = (moves: CameraMove[] | undefined, frame: number) => {
  let zoom = 1;
  let fx = 0.5;
  let fy = 0.35;
  for (const m of moves ?? []) {
    if (frame < m.from || frame >= m.to) continue;
    const len = m.to - m.from;
    const r = m.hold ? 1 : Math.min(12, Math.floor(len / 3));
    const p = m.hold
      ? 1
      : interpolate(frame, [m.from, m.from + r, m.to - r, m.to], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE});
    zoom = 1 + (m.zoom - 1) * p;
    fx = m.focusX ?? 0.5;
    fy = m.focusY ?? 0.35;
  }
  return {zoom, fx, fy};
};

// 0..1 how much a given scene type is "on" at this frame, with RAMP-frame in/out
const sceneAmount = (edit: Edit, frame: number, type: string) => {
  let a = 0;
  for (const s of edit.scenes) {
    if (s.type !== type) continue;
    const v = interpolate(frame, [s.from - RAMP / 2, s.from + RAMP / 2, s.to - RAMP / 2, s.to + RAMP / 2], [0, 1, 1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: EASE,
    });
    a = Math.max(a, v);
  }
  return a;
};

export const TalkingHead: React.FC<{edit: Edit}> = ({edit}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const {zoom, fx, fy} = cameraAt(edit.camera, frame);
  const ui = sceneAmount(edit, frame, 'ui');
  const fullOn = edit.scenes.some((s) => s.type === 'fullscreen' && frame >= s.from && frame < s.to);
  const capShade = edit.captions.reduce(
    (m, g) => Math.max(m, interpolate(frame, [g.from - RAMP, g.from, g.to, g.to + RAMP], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})),
    0,
  );
  const halfScene = edit.scenes.find((s) => s.type === 'halfscreen' && frame >= s.from && frame < s.to);
  const faceY = halfScene?.faceY ?? 0.38;

  // halfscreen: the speaker jumps into the bottom half (cropped around the face) exactly on the scene's cut —
  // sliding over black before the scene appeared read as a dip to dark (critic round 2, Metro)
  const top = halfScene ? height / 2 : 0;
  const objY = halfScene ? faceY * 100 : 50;

  return (
    // full-screen scenes are HARD cuts: the speaker switches off exactly at the scene edge (a cross-ramp over
    // black read as a dip to dark on every full-screen cut — critic round 2, Metro)
    <AbsoluteFill style={{backgroundColor: '#000', opacity: fullOn ? 0 : 1}}>
      <div style={{position: 'absolute', left: 0, width, top, height: height - top, overflow: 'hidden'}}>
        <OffthreadVideo
          src={staticFile(edit.video)}
          muted
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: `50% ${objY}%`,
            transform: `scale(${zoom})`,
            transformOrigin: `${fx * 100}% ${fy * 100}%`,
          }}
        />
        {/* ui scenes: only the LOWER part (where the UI sits) darkens + blurs, feathered edge — the speaker's face stays sharp */}
        {ui > 0 ? (
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: height * 0.56,
              bottom: 0,
              backdropFilter: `blur(${ui * 12}px) brightness(${1 - 0.42 * ui})`,
              WebkitBackdropFilter: `blur(${ui * 12}px) brightness(${1 - 0.42 * ui})`,
              WebkitMaskImage: 'linear-gradient(180deg, transparent 0%, #000 22%)',
              maskImage: 'linear-gradient(180deg, transparent 0%, #000 22%)',
            }}
          />
        ) : null}
        {/* soft bottom gradient so lower-third captions read — only while a caption is on screen, so the footage
            keeps its original colours everywhere else (b-roll reels without captions never get it) */}
        {capShade > 0 ? <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,0.35) 100%)', opacity: capShade}} /> : null}
      </div>
    </AbsoluteFill>
  );
};

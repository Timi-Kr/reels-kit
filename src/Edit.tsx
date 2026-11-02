import React from 'react';
import {AbsoluteFill, interpolate, Sequence, useCurrentFrame, useVideoConfig} from 'remotion';
import {AudioLayer} from './components/Audio';
import {Captions} from './components/Captions';
import {EASE_OUT} from './components/design';
import {TalkingHead} from './components/TalkingHead';
import {registry} from './projects/registry';
import type {Edit as EditT, Scene} from './types';

export type EditProps = {slug: string; edit?: EditT};

const Missing: React.FC<{name: string}> = ({name}) => (
  <AbsoluteFill style={{background: '#222', color: '#f55', fontSize: 40, alignItems: 'center', justifyContent: 'center'}}>missing scene: {name}</AbsoluteFill>
);

/** Positions a scene by type: fullscreen = whole frame, halfscreen = top half, ui = lower half. */
const SceneFrame: React.FC<{scene: Scene; edit: EditT; slug: string}> = ({scene, edit, slug}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const len = scene.to - scene.from;
  const Comp = scene.component ? registry[slug]?.[scene.component] : undefined;
  const inP = interpolate(frame, [0, 8], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE_OUT});
  const outP = interpolate(frame, [len - 6, len], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const box =
    scene.type === 'halfscreen'
      ? {top: 0, height: height / 2, w: width, h: height / 2}
      : scene.type === 'ui'
        ? {top: height / 2, height: height / 2, w: width, h: height / 2}
        : {top: 0, height, w: width, h: height};
  // ui slides up in and down out (never a fade); half / full screens are hard cuts with a small push-in
  // (a fade over the black under them read as a dip to dark — critic round 2, Metro)
  const transform =
    scene.type === 'ui'
      ? `translateY(${(1 - inP) * box.h * 0.6 + (1 - outP) * box.h}px)`
      : `scale(${1.04 - 0.04 * inP})`;
  const opacity = 1; // ui slides in/out under the frame edge (overflow hidden) — no fades
  if (!scene.component) return null;
  return (
    <div style={{position: 'absolute', left: 0, top: box.top, width, height: box.height, overflow: 'hidden', opacity, transform}}>
      {Comp ? <Comp edit={edit} scene={scene} slug={slug} width={box.w} height={box.h} {...(scene.props ?? {})} /> : <Missing name={scene.component} />}
    </div>
  );
};

export const Edit: React.FC<EditProps> = ({slug, edit}) => {
  if (!edit) return <Missing name={`edit.json for ${slug}`} />;
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <TalkingHead edit={edit} />
      {edit.scenes.map((s) => (
        <Sequence key={s.id} from={s.from} durationInFrames={Math.max(1, s.to - s.from)} name={`${s.type} · ${s.id}`}>
          <SceneFrame scene={s} edit={edit} slug={slug} />
        </Sequence>
      ))}
      <Captions edit={edit} />
      <AudioLayer edit={edit} />
    </AbsoluteFill>
  );
};

import React from 'react';
import {Audio, Sequence, staticFile} from 'remotion';
import type {Edit} from '../types';

export const dbToGain = (db: number) => Math.pow(10, db / 20);

/** Voice (from cut.mp4) + all SFX cues + music. Each cue is a whole clip so it can be slid / swapped. */
export const AudioLayer: React.FC<{edit: Edit}> = ({edit}) => {
  const music = edit.music;
  const underTH = music?.onlyUnderTalkingHead !== false;
  const covered = edit.scenes.filter((s) => s.type !== 'captions');
  const fade = 8;
  return (
    <>
      <Audio src={staticFile(edit.video)} volume={dbToGain(edit.voiceVolumeDb ?? 0)} />
      {(edit.sfx ?? []).map((c, i) => (
        <Sequence key={i} from={Math.max(0, c.frame)} name={`${c.track} · ${c.file.split('/').pop()}`} layout="none">
          <Audio src={staticFile(c.file)} volume={dbToGain(c.volumeDb)} />
        </Sequence>
      ))}
      {music ? (
        <Audio
          src={staticFile(music.file)}
          startFrom={music.startFrom ?? 0}
          loop
          volume={(f) => {
            const g = dbToGain(music.volumeDb);
            if (!underTH) return g;
            // duck to silence under animations / graphics (never music under animations)
            let k = 1;
            for (const s of covered) {
              if (f >= s.from - fade && f < s.to + fade) {
                const d = Math.min(f - (s.from - fade), s.to + fade - f);
                k = Math.min(k, Math.max(0, 1 - d / fade));
              }
            }
            return g * k;
          }}
        />
      ) : null}
    </>
  );
};

import React from 'react';
import {CalculateMetadataFunction, Composition, staticFile} from 'remotion';
import {Edit, EditProps} from './Edit';
import './fonts';
import type {Edit as EditT} from './types';
import {PANEL, PANELS, UIKit} from './showcase/UIKit';

const calculateMetadata: CalculateMetadataFunction<EditProps> = async ({props}) => {
  const res = await fetch(staticFile(`projects/${props.slug}/edit.json`));
  const edit = (await res.json()) as EditT;
  return {
    durationInFrames: edit.durationInFrames,
    fps: edit.fps,
    width: edit.width,
    height: edit.height,
    props: {...props, edit},
  };
};

export const Root: React.FC = () => (
  <>
  <Composition id="UIKit" component={UIKit} durationInFrames={PANEL * PANELS} fps={30} width={1080} height={1920} />
  <Composition
    id="Edit"
    component={Edit}
    durationInFrames={300}
    fps={30}
    width={1080}
    height={1920}
    defaultProps={{slug: 'demo'} as EditProps}
    calculateMetadata={calculateMetadata}
  />
  </>
);

// Schema of public/projects/<slug>/edit.json — documented in
// .claude/skills/viral-talking-head-editor/references/edit-schema.md

export type Style = {
  accent: string; // special-word / accent color, e.g. "#F19A3E"
  sansFont: string; // key of FONTS in fonts.ts
  scriptFont: string; // key of FONTS in fonts.ts
  sansColor: string; // default "#F3F3F3"
  scriptColor?: string; // defaults to accent
  dark: string; // near-black of the 3-tone palette, e.g. "#2B2B2B"
  light: string; // off-white of the 3-tone palette, e.g. "#EEEBE6"
  bg?: 'mix' | 'paper' | 'white' | 'dark'; // overall look from the plan page; "mix" = vary per scene
};

/** Scene background look (glow.tsx SceneBackground). "auto" = Claude picks by the scene's role. */
export type Look = 'auto' | 'paper' | 'white' | 'grey' | 'dark' | 'accent';

export type CaptionWord = {
  text: string;
  at: number; // frame the word appears (spoken start)
  script?: boolean; // render in script font + accent + glow
  size?: number; // optional scale multiplier for this word
};

export type CaptionGroup = {
  from: number;
  to: number;
  words: CaptionWord[];
  y?: number; // 0..1 vertical center; default depends on active scene
  scale?: number;
  layout?: 'line' | 'stack'; // stack = script words on their own line, bigger
};

// overlay = full-frame layer drawn over the video WITHOUT darkening it (trackers, labels, cards in b-roll vlogs);
// it may overlap other scenes.
export type SceneType = 'captions' | 'ui' | 'halfscreen' | 'fullscreen' | 'overlay';

export type Scene = {
  id: string;
  type: SceneType;
  from: number;
  to: number;
  component?: string; // key in the project's scene registry
  props?: Record<string, unknown>;
  captions?: 'show' | 'hide'; // default: hide on fullscreen, show otherwise
  captionY?: number; // override caption y while this scene is active
  faceY?: number; // 0..1 object-position y for the speaker in halfscreen
  look?: Look; // background look chosen on the plan page (fullscreen / halfscreen)
};

export type CameraMove = {
  from: number;
  to: number;
  zoom: number; // 1 = no zoom
  focusX?: number; // 0..1, default 0.5
  focusY?: number; // 0..1, default 0.35 (face)
  hold?: boolean; // true = punch-in and hold (cut), false = smooth ease in/out
};

export type SfxTrack = 'WHOOSHES' | 'TEXTURES' | 'RISERS' | 'HITS' | 'MUSIC';

export type SfxCue = {
  track: SfxTrack;
  file: string; // relative to public/, e.g. "sfx/whooshes/hollow_02.wav"
  frame: number; // START frame of the clip (= event frame - peak offset)
  eventFrame?: number; // the visual frame the sound is locked to (documentation)
  volumeDb: number;
  note?: string;
};

export type Music = {
  file: string;
  volumeDb: number; // -19 / -20
  onlyUnderTalkingHead?: boolean; // default true: silent under ui/halfscreen/fullscreen scenes
  startFrom?: number; // frames to skip at the start of the song
};

export type Edit = {
  fps: number;
  width: number;
  height: number;
  durationInFrames: number;
  video: string; // relative to public/, e.g. "projects/demo/cut.mp4"
  style: Style;
  captions: CaptionGroup[];
  scenes: Scene[];
  camera?: CameraMove[];
  sfx?: SfxCue[];
  music?: Music;
  voiceVolumeDb?: number; // default 0
};

export type SceneProps = {
  edit: Edit;
  scene: Scene;
  slug: string;
  width: number;
  height: number;
  [key: string]: unknown;
};

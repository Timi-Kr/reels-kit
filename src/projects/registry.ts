// Every folder src/projects/<slug>/index.tsx that exports `scenes` is registered automatically as registry[slug].
// No manual step — and no merge conflicts when several people keep their own projects locally.
import type React from 'react';
import type {SceneProps} from '../types';

declare const require: {context: (dir: string, deep: boolean, re: RegExp) => {keys: () => string[]; (key: string): {scenes?: Record<string, React.FC<SceneProps>>}}};

const ctx = require.context('./', true, /^\.\/[^/]+\/index\.tsx$/);

export const registry: Record<string, Record<string, React.FC<SceneProps>>> = Object.fromEntries(
  ctx.keys().map((k) => [k.split('/')[1], ctx(k).scenes ?? {}]),
);

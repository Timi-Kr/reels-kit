import {loadFont as loadLocal} from '@remotion/fonts';
import {loadFont as cormorant} from '@remotion/google-fonts/CormorantGaramond';
import {loadFont as dmSans} from '@remotion/google-fonts/DMSans';
import {loadFont as ebGaramond} from '@remotion/google-fonts/EBGaramond';
import {loadFont as instrumentSerif} from '@remotion/google-fonts/InstrumentSerif';
import {loadFont as inter} from '@remotion/google-fonts/Inter';
import {loadFont as manrope} from '@remotion/google-fonts/Manrope';
import {loadFont as playfair} from '@remotion/google-fonts/PlayfairDisplay';
import {staticFile} from 'remotion';

// Keys used in edit.json style.sansFont / style.scriptFont and in the planning page.
export const FONTS: Record<string, {family: string; kind: 'sans' | 'script'; italic: boolean}> = {
  'Creato Display': {family: 'Creato Display', kind: 'sans', italic: false},
  Inter: {family: inter('normal', {weights: ['300', '400', '500', '600', '800'], subsets: ['latin', 'latin-ext']}).fontFamily, kind: 'sans', italic: false},
  Manrope: {family: manrope('normal', {weights: ['300', '400', '500', '600', '800'], subsets: ['latin', 'latin-ext']}).fontFamily, kind: 'sans', italic: false},
  'DM Sans': {family: dmSans('normal', {weights: ['300', '400', '500', '700'], subsets: ['latin', 'latin-ext']}).fontFamily, kind: 'sans', italic: false},
  'Cormorant Garamond': {family: cormorant('italic', {weights: ['500', '600', '700'], subsets: ['latin', 'latin-ext']}).fontFamily, kind: 'script', italic: true},
  'Playfair Display': {family: playfair('italic', {weights: ['500', '700', '800'], subsets: ['latin', 'latin-ext']}).fontFamily, kind: 'script', italic: true},
  'EB Garamond': {family: ebGaramond('italic', {weights: ['500', '600', '700'], subsets: ['latin', 'latin-ext']}).fontFamily, kind: 'script', italic: true},
  'Instrument Serif': {family: instrumentSerif('italic', {weights: ['400'], subsets: ['latin', 'latin-ext']}).fontFamily, kind: 'script', italic: true},
};

const creato: [string, string][] = [
  ['Thin', '100'], ['Light', '300'], ['Regular', '400'], ['Medium', '500'],
  ['Bold', '700'], ['ExtraBold', '800'], ['Black', '900'],
];
for (const [name, weight] of creato) {
  loadLocal({family: 'Creato Display', url: staticFile(`fonts/CreatoDisplay-${name}.otf`), weight, style: 'normal'}).catch(() => undefined);
  loadLocal({family: 'Creato Display', url: staticFile(`fonts/CreatoDisplay-${name}Italic.otf`), weight, style: 'italic'}).catch(() => undefined);
}


export const fontFamily = (key: string, fallback = 'Creato Display') => (FONTS[key] ?? FONTS[fallback]).family;
export const isItalic = (key: string) => FONTS[key]?.italic ?? false;

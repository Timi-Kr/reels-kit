// Catalogue of the lit / iOS UI pieces in components/glow.tsx — one 4 s panel per scene LOOK, so it also shows
// how the looks mix in one edit: grey (data) → dark (tech contrast) → over video → white (product) →
// paper (editorial statement) → accent (the one payoff). Render a still of any panel:
//   npx remotion still UIKit out/stills/uikit_1.png --frame=80 --scale=0.5
import React from 'react';
import {AbsoluteFill, OffthreadVideo, Series, staticFile} from 'remotion';
import {Drift, Title} from '../components/design';
import {BarChart, BigNumber, CheckBurst, GlassIcon, GlowCard, INKS, LineChart, LiveActivity, Notification, PromptBar, Ring, SceneBackground, Segmented} from '../components/glow';
import type {Style} from '../types';

export const PANEL = 120;

const BLUE: Style = {accent: '#3D6FE0', sansFont: 'Inter', scriptFont: 'Cormorant Garamond', sansColor: '#F3F3F3', dark: '#2B2B2B', light: '#ECE8E1'};
const VIOLET: Style = {...BLUE, accent: '#7C5CE0'};
const YELLOW: Style = {...BLUE, accent: '#F4DD04'};

/** grey — data: big number + self-drawing line chart + segmented control in a lit card. */
const Finance: React.FC = () => (
  <SceneBackground look="grey" style={BLUE}>
    <Drift>
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
        <GlowCard style={BLUE} width={900} padding={56} delay={4}>
          <BigNumber style={BLUE} label="Prihod ovaj mjesec" value={18420.5} decimals={2} prefix="€" delta="+42 % vs. prošli mjesec" size={128} align="left" delay={10} />
          <div style={{marginTop: 40}}>
            <LineChart style={BLUE} data={[3, 4, 3.6, 5, 4.4, 6.2, 5.8, 8.4]} width={788} height={340} tip="€18,4k" labels={['PON', 'UTO', 'SRI', 'ČET', 'PET', 'SUB', 'NED']} delay={16} />
          </div>
          <div style={{marginTop: 36}}>
            <Segmented style={BLUE} items={['1T', '1M', '3M', '1G']} from={0} to={1} moveAt={60} width={788} delay={22} />
          </div>
        </GlowCard>
      </AbsoluteFill>
    </Drift>
  </SceneBackground>
);

/** dark — tech / contrast moment: bare glowing rings + rim-lit bar chart card. */
const Stats: React.FC = () => (
  <SceneBackground look="dark" style={VIOLET} horizon={false} beams>
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', gap: 70}}>
      <div style={{display: 'flex', gap: 46}}>
        <Ring style={VIOLET} value={84} label="Konverzija" size={270} color="#8B5CF6" delay={6} />
        <Ring style={VIOLET} value={62} label="Retencija" size={270} color="#22D3EE" delay={12} />
        <Ring style={VIOLET} value={97} label="NPS" size={270} color="#34C759" delay={18} />
      </div>
      <GlowCard style={VIOLET} width={880} padding={50} delay={20}>
        <div style={{fontSize: 30, color: INKS.dark.secondary, fontWeight: 500, marginBottom: 30}}>Prijave po danu</div>
        <BarChart style={VIOLET} data={[40, 55, 48, 70, 62, 120, 88]} labels={['P', 'U', 'S', 'Č', 'P', 'S', 'N']} width={780} height={300} delay={26} />
      </GlowCard>
    </AbsoluteFill>
  </SceneBackground>
);

/** over video — Captions + UI: light iOS notification + prompt bar; only the lower half is darkened. */
const OverVideo: React.FC = () => (
  <AbsoluteFill style={{background: '#000'}}>
    <OffthreadVideo src={staticFile('projects/demo/cut.mp4')} startFrom={30} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
    <AbsoluteFill style={{background: 'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.45) 62%, rgba(0,0,0,0.6) 100%)'}} />
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 260, gap: 40}}>
      <Notification style={YELLOW} app="QuizMatch" title="Novi kandidat 🎉" body="Ana K. je riješila kviz za prodavača u Splitu — 94 % podudaranja." iconColor="#F4DD04" delay={6} />
      <PromptBar style={YELLOW} text="Nađi mi 10 prodavača u Splitu" delay={24} />
    </AbsoluteFill>
  </AbsoluteFill>
);

/** white — product / clean: glossy app icons + live activity breathing on pure white. */
const Product: React.FC = () => (
  <SceneBackground look="white" style={BLUE}>
    <Drift>
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', gap: 110}}>
        <div style={{display: 'flex', gap: 44, alignItems: 'center'}}>
          <GlassIcon color="#2F6BFF" size={170} glyph="in" delay={4} />
          <GlassIcon color="#7C5CE0" size={210} glyph="✦" delay={8} />
          <GlassIcon color="#FF4D6D" size={170} glyph="♥" delay={12} />
        </div>
        <LiveActivity style={BLUE} title="Zapošljavanje" subtitle="Kandidat stiže na razgovor" steps={4} at={2} right="12:30" delay={18} />
      </AbsoluteFill>
    </Drift>
  </SceneBackground>
);

/** paper — editorial statement: sans + script title, success tick underneath. */
const Statement: React.FC = () => (
  <SceneBackground look="paper" style={BLUE}>
    <Drift>
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', gap: 90}}>
        <div style={{width: 860}}>
          <Title text="pozicija popunjena za" style={BLUE} size={60} delay={2} />
          <div style={{marginTop: 18}}>
            <Title text="šest dana" script={['šest', 'dana']} style={BLUE} size={84} delay={12} />
          </div>
        </div>
        <CheckBurst style={BLUE} size={200} delay={26} />
      </AbsoluteFill>
    </Drift>
  </SceneBackground>
);

/** accent — the ONE payoff of the edit: one huge number on the brand colour. */
const Payoff: React.FC = () => (
  <SceneBackground look="accent" style={BLUE}>
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
      <BigNumber style={BLUE} label="Podudaranje kandidata" value={94} suffix="%" size={260} delta="vs. 31 % s oglasom" deltaColor="rgba(255,255,255,0.85)" delay={4} glow={false} />
    </AbsoluteFill>
  </SceneBackground>
);

const LIST = [Finance, Stats, OverVideo, Product, Statement, Payoff];
export const PANELS = LIST.length;

export const UIKit: React.FC = () => (
  <Series>
    {LIST.map((P, i) => (
      <Series.Sequence key={i} durationInFrames={PANEL} name={P.name}>
        <P />
      </Series.Sequence>
    ))}
  </Series>
);

import { useState } from 'react';
import type { Brand, MiyukiShape, ProjectType, StitchType } from '@/beads';

interface StartScreenProps {
  onStart: (config: {
    projectType: ProjectType;
    brand: Brand;
    miyukiShape: MiyukiShape;
    stitch: StitchType;
    width: number;
    height: number;
    name: string;
  }) => void;
}

type CanvasChoiceId = 'loom' | 'square' | 'brick' | 'circle';
type BeadChoiceId = 'rocailles' | 'delica' | 'toho' | 'unsure';

interface CanvasChoice {
  id: CanvasChoiceId;
  label: string;
  icon: string;
  bg: string;
  projectType: ProjectType;
  stitch: StitchType;
}

interface BeadChoice {
  id: BeadChoiceId;
  label: string;
  shape: string;
  icon: string;
  brand: Brand;
  miyukiShape: MiyukiShape;
}

const CANVAS_CHOICES: CanvasChoice[] = [
  { id: 'loom', label: 'Loom', icon: '/Loom-svg.svg', bg: 'bg-tama-sky', projectType: 'loom', stitch: 'brick' },
  { id: 'square', label: 'Square Stitch', icon: '/squarestitch-svg.svg', bg: 'bg-tama-yellow', projectType: 'freehand', stitch: 'brick' },
  { id: 'brick', label: 'Brick Stitch', icon: '/brickstitch-svg.svg', bg: 'bg-tama-pink', projectType: 'freehand', stitch: 'peyote' },
  { id: 'circle', label: 'Circle', icon: '/circle-svg.svg', bg: 'bg-tama-lavender', projectType: 'freehand', stitch: 'brick' },
];

const BEAD_CHOICES: BeadChoice[] = [
  { id: 'rocailles', label: 'Miyuki Rocailles', shape: 'circle', icon: '●', brand: 'miyuki', miyukiShape: 'rocailles' },
  { id: 'delica', label: 'Miyuki Delica', shape: 'square', icon: '■', brand: 'miyuki', miyukiShape: 'delica' },
  { id: 'toho', label: 'Toho Round', shape: 'circle', icon: '●', brand: 'toho', miyukiShape: 'delica' },
  { id: 'unsure', label: "I'm Not Sure!", shape: 'star', icon: '★', brand: 'miyuki', miyukiShape: 'rocailles' },
];

const DOT_COLORS = ['#FF9AAF', '#009959', '#1C7F96', '#FACC41', '#F9662F'];
const DOT_COLUMNS = 14;
const DOT_ROWS = 10;

function makeInitialDots(): Record<string, string> {
  const dots: Record<string, string> = {};
  const accents: Record<string, string> = {
    '2-2': '#009959',
    '2-9': '#009959',
    '3-4': '#F9662F',
    '3-7': '#FACC41',
    '3-11': '#009959',
    '3-12': '#F9662F',
    '6-5': '#1C7F96',
    '6-12': '#1C7F96',
    '7-2': '#009959',
    '7-9': '#FACC41',
    '8-4': '#F9662F',
    '8-5': '#F9662F',
    '9-1': '#FACC41',
  };
  for (let row = 0; row < DOT_ROWS; row += 1) {
    for (let column = 0; column < DOT_COLUMNS; column += 1) {
      dots[`${row}-${column}`] = accents[`${row}-${column}`] ?? DOT_COLORS[0];
    }
  }
  return dots;
}

export function StartScreen({ onStart }: StartScreenProps) {
  const [canvasId, setCanvasId] = useState<CanvasChoiceId>('loom');
  const [beadId, setBeadId] = useState<BeadChoiceId>('rocailles');
  const [widthStr, setWidthStr] = useState('12');
  const [heightStr, setHeightStr] = useState('12');
  const [name, setName] = useState('UNTITLED');
  const [dots, setDots] = useState<Record<string, string>>(makeInitialDots);

  const canvas = CANVAS_CHOICES.find((choice) => choice.id === canvasId) ?? CANVAS_CHOICES[0];
  const bead = BEAD_CHOICES.find((choice) => choice.id === beadId) ?? BEAD_CHOICES[0];
  const width = Math.max(1, Math.min(200, parseInt(widthStr, 10) || 1));
  const height = Math.max(1, Math.min(200, parseInt(heightStr, 10) || 1));

  const handleStart = () => {
    onStart({
      projectType: canvas.projectType,
      brand: bead.brand,
      miyukiShape: bead.miyukiShape,
      stitch: canvas.stitch,
      width,
      height,
      name: name.trim() || 'UNTITLED',
    });
  };

  const handleDotClick = (key: string) => {
    setDots((current) => {
      const currentColor = current[key];
      const colorIndex = DOT_COLORS.indexOf(currentColor);
      const nextColor = DOT_COLORS[(colorIndex + 1) % DOT_COLORS.length];
      return { ...current, [key]: nextColor };
    });
  };

  return (
    <main className="min-h-screen bg-tama-white text-tama-burgundy lg:flex">
      <section className="w-full bg-tama-white px-5 py-6 sm:px-10 lg:sticky lg:top-0 lg:h-screen lg:w-[35%] lg:max-w-[470px] lg:overflow-y-auto lg:px-6 lg:py-8 xl:px-10">
        <div className="mx-auto flex max-w-[390px] flex-col gap-5">
          <div className="flex justify-center pb-1">
            <img src="/Logo.svg" alt="Tama Studio" className="h-auto w-[112px]" />
          </div>

          <QuestionCard title="Project Name">
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value.toUpperCase())}
              maxLength={60}
              className="w-full rounded-24px bg-white px-5 py-3 text-center font-fredoka text-sm font-bold uppercase tracking-wide text-tama-burgundy outline-none ring-2 ring-transparent transition focus:ring-tama-lavender"
            />
          </QuestionCard>

          <QuestionCard title="What type of canvas do you need?">
            <div className="grid grid-cols-2 gap-2">
              {CANVAS_CHOICES.map((choice) => (
                <CanvasButton
                  key={choice.id}
                  choice={choice}
                  active={canvasId === choice.id}
                  onClick={() => setCanvasId(choice.id)}
                />
              ))}
            </div>
          </QuestionCard>

          <QuestionCard title="What kind of beads are you using?">
            <div className="grid grid-cols-2 gap-2">
              {BEAD_CHOICES.map((choice) => (
                <BeadButton
                  key={choice.id}
                  choice={choice}
                  active={beadId === choice.id}
                  onClick={() => setBeadId(choice.id)}
                />
              ))}
            </div>
          </QuestionCard>

          <QuestionCard title="Dimensions">
            <div className="grid grid-cols-2 gap-2">
              <DimInput value={widthStr} onChange={setWidthStr} label="Width:" />
              <DimInput value={heightStr} onChange={setHeightStr} label="Height:" />
            </div>
          </QuestionCard>

          <button
            onClick={handleStart}
            className="w-full rounded-24px bg-tama-red py-3.5 font-fredoka text-base font-bold uppercase text-white shadow-lg shadow-tama-red/25 transition hover:-translate-y-0.5 hover:bg-[#d92f31] active:translate-y-0"
          >
            Start Designing
          </button>
        </div>
      </section>

      <section className="relative flex min-h-[560px] flex-1 items-start justify-center overflow-hidden bg-tama-burgundy px-6 py-14 sm:px-12 sm:py-16 lg:sticky lg:top-0 lg:h-screen lg:min-h-screen lg:px-16 lg:py-16 xl:px-24">
        <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:radial-gradient(#ff9aaf_1px,transparent_1px)] [background-size:32px_32px]" />
        <div className="relative grid w-full max-w-[780px] grid-cols-[repeat(14,minmax(0,1fr))] gap-x-2 gap-y-5 sm:gap-x-4 sm:gap-y-7 lg:gap-x-5 lg:gap-y-8 xl:gap-x-6 xl:gap-y-9">
          {Object.entries(dots).map(([key, color]) => (
            <button
              key={key}
              type="button"
              aria-label={`Edit bead ${key}`}
              onClick={() => handleDotClick(key)}
              className="aspect-square w-full rounded-full transition duration-200 hover:scale-125 hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-white/80"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <p className="absolute bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap font-fredoka text-xs font-semibold uppercase tracking-[0.18em] text-tama-pink/70 sm:bottom-8">
          Click a bead to play
        </p>
      </section>
    </main>
  );
}

function QuestionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-24px bg-tama-pale/90 p-3">
      <h2 className="mb-3 text-center font-public text-[10px] font-black uppercase tracking-[0.08em] text-tama-burgundy/70">
        {title}
      </h2>
      {children}
    </section>
  );
}

function CanvasButton({ choice, active, onClick }: { choice: CanvasChoice; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex min-h-[92px] items-center justify-between gap-2 rounded-24px ${choice.bg} px-3 py-3 transition-all ${
        active ? 'ring-2 ring-tama-burgundy ring-offset-1' : 'hover:brightness-95'
      }`}
    >
      <span className="text-left font-fredoka text-xs font-bold uppercase leading-tight text-tama-burgundy">
        {choice.label}
      </span>
      <img src={choice.icon} alt="" className="h-12 w-auto max-w-[58px]" />
    </button>
  );
}

function BeadButton({ choice, active, onClick }: { choice: BeadChoice; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-24px px-3 py-2.5 text-left font-fredoka text-[10px] font-bold uppercase leading-tight transition-all ${
        active ? 'bg-tama-burgundy text-white ring-2 ring-tama-red/50' : 'bg-tama-burgundy/95 text-white hover:bg-tama-red'
      }`}
    >
      <span className="text-base leading-none text-tama-red">{choice.icon}</span>
      <span>{choice.label}</span>
    </button>
  );
}

function DimInput({ value, onChange, label }: { value: string; onChange: (value: string) => void; label: string }) {
  return (
    <label className="flex items-center justify-center gap-2 rounded-24px bg-white px-3 py-3 font-fredoka text-[10px] font-bold uppercase text-tama-burgundy">
      {label}
      <input
        type="number"
        min={1}
        max={200}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-8 bg-transparent text-center text-sm font-bold outline-none"
      />
    </label>
  );
}

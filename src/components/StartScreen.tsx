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

function getHoverColor(color: string): string {
  const colorIndex = DOT_COLORS.indexOf(color);
  return DOT_COLORS[(colorIndex + 1) % DOT_COLORS.length];
}

function getDotPoint(key: string): string {
  const [row, column] = key.split('-').map(Number);
  return `${column * 10 + 5},${row * 10 + 5}`;
}

export function StartScreen({ onStart }: StartScreenProps) {
  const [canvasId, setCanvasId] = useState<CanvasChoiceId>('loom');
  const [beadId, setBeadId] = useState<BeadChoiceId>('rocailles');
  const [widthStr, setWidthStr] = useState('12');
  const [heightStr, setHeightStr] = useState('12');
  const [name, setName] = useState('UNTITLED');
  const [dots] = useState<Record<string, string>>(makeInitialDots);
  const [selectedDots, setSelectedDots] = useState<string[]>([]);
  const [hoveredDot, setHoveredDot] = useState<string | null>(null);

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
    setSelectedDots((current) =>
      current.includes(key) ? current.filter((selectedKey) => selectedKey !== key) : [...current, key],
    );
  };

  return (
    <main className="min-h-screen bg-tama-white text-tama-burgundy lg:flex">
      <section className="w-full bg-tama-white px-5 py-6 sm:px-10 lg:sticky lg:top-0 lg:h-screen lg:w-[35%] lg:max-w-[520px] lg:overflow-y-auto lg:px-6 lg:py-8 xl:px-10">
        <div className="mx-auto flex max-w-[440px] flex-col gap-5">
          <div className="flex justify-center pb-1">
            <img src="/Logo.svg" alt="Tama Studio" className="h-auto w-[112px]" />
          </div>

          <QuestionCard title="Project Name">
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value.toUpperCase())}
              maxLength={60}
              className="w-full rounded-24px bg-white px-5 py-3.5 text-center font-fredoka text-base font-bold uppercase tracking-wide text-tama-burgundy outline-none ring-2 ring-transparent transition focus:ring-tama-lavender"
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
              <DimInput
                value={heightStr}
                onChange={setHeightStr}
                label="Height:"
                disabled={canvasId === 'loom'}
              />
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

      <section className="relative flex min-h-[560px] flex-1 items-stretch justify-center overflow-hidden bg-tama-burgundy p-3 lg:sticky lg:top-0 lg:h-screen lg:min-h-screen">
        <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:radial-gradient(#ff9aaf_1px,transparent_1px)] [background-size:32px_32px]" />
        <div className="relative grid h-full w-full max-w-none flex-1 grid-cols-[repeat(14,minmax(0,1fr))] grid-rows-[repeat(10,minmax(0,1fr))] place-items-center gap-0">
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox="0 0 140 100"
            preserveAspectRatio="none"
          >
            {selectedDots.length > 1 && (
              <polyline
                points={selectedDots.map(getDotPoint).join(' ')}
                fill="none"
                stroke="#FF9AAF"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </svg>
          {Object.entries(dots).map(([key, color]) => {
            const isHovered = hoveredDot === key;
            return (
              <button
                key={key}
                type="button"
                aria-label={`Select bead ${key}`}
                onClick={() => handleDotClick(key)}
                onMouseEnter={() => setHoveredDot(key)}
                onMouseLeave={() => setHoveredDot(null)}
                className="z-10 h-[clamp(28px,4vw,40px)] w-[clamp(28px,4vw,40px)] rounded-full border-0 p-0 outline-none transition duration-200 hover:scale-125 focus:outline-none focus:ring-0"
                style={{ backgroundColor: isHovered ? getHoverColor(color) : color }}
              />
            );
          })}
        </div>
      </section>
    </main>
  );
}

function QuestionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-24px bg-tama-pale/90 p-4">
      <h2 className="mb-3 text-center font-public text-xs font-black uppercase tracking-[0.08em] text-tama-burgundy/70">
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
      title={choice.id === 'loom' ? 'The loom layout auto extends the grid as you build your design, no need to set a fixed height.' : undefined}
      className={`relative flex min-h-[96px] items-center justify-between gap-2 rounded-24px ${choice.bg} px-3.5 py-3.5 transition-all ${
        active ? 'ring-2 ring-tama-burgundy ring-offset-1' : 'hover:brightness-95'
      }`}
    >
      <span className="text-left font-fredoka text-sm font-bold uppercase leading-tight text-tama-burgundy">
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
      className={`flex items-center gap-2 rounded-24px px-3.5 py-3 text-left font-fredoka text-xs font-bold uppercase leading-tight transition-all ${
        active ? 'bg-tama-burgundy text-white ring-2 ring-tama-red/50' : 'bg-tama-burgundy/95 text-white hover:bg-tama-red'
      }`}
    >
      <span className="text-lg leading-none text-tama-red">{choice.icon}</span>
      <span>{choice.label}</span>
    </button>
  );
}

function DimInput({
  value,
  onChange,
  label,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <label
      className={`flex items-center justify-center gap-2 rounded-24px px-3 py-3.5 font-fredoka text-xs font-bold uppercase transition ${
        disabled ? 'bg-tama-pale/70 text-tama-burgundy/35' : 'bg-white text-tama-burgundy'
      }`}
    >
      {label}
      <input
        type="number"
        min={1}
        max={200}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="w-10 bg-transparent text-center text-base font-bold outline-none disabled:cursor-not-allowed"
      />
    </label>
  );
}

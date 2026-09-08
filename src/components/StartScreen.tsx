import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { Brand, MiyukiShape, ProjectType, StitchType } from '@/beads';
import { StringCanvas } from '@/components/StringCanvas';

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
  { id: 'circle', label: 'Circle', icon: '/circle-svg.svg', bg: 'bg-tama-lavender', projectType: 'circle', stitch: 'peyote' },
];

const BEAD_CHOICES: BeadChoice[] = [
  { id: 'rocailles', label: 'Miyuki Rocailles', shape: 'circle', icon: '●', brand: 'miyuki', miyukiShape: 'rocailles' },
  { id: 'delica', label: 'Miyuki Delica', shape: 'square', icon: '■', brand: 'miyuki', miyukiShape: 'delica' },
  { id: 'toho', label: 'Toho Round', shape: 'circle', icon: '●', brand: 'toho', miyukiShape: 'delica' },
  { id: 'unsure', label: "I'm Not Sure!", shape: 'star', icon: '★', brand: 'miyuki', miyukiShape: 'rocailles' },
];

const DOT_COLORS = ['#FF9AAF', '#009959', '#1C7F96', '#FACC41', '#F9662F'];
const CLICK_COLORS = DOT_COLORS.filter((color) => color !== '#FF9AAF');
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
  const [nameFocused, setNameFocused] = useState(false);
  const [dots, setDots] = useState<Record<string, string>>(makeInitialDots);
  const [selectedDots, setSelectedDots] = useState<string[]>([]);
  const [hoveredDot, setHoveredDot] = useState<string | null>(null);
  const [hoverColors, setHoverColors] = useState<Record<string, string>>({});
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const canvas = CANVAS_CHOICES.find((choice) => choice.id === canvasId) ?? CANVAS_CHOICES[0];
  const bead = BEAD_CHOICES.find((choice) => choice.id === beadId) ?? BEAD_CHOICES[0];
  const width = Math.max(1, Math.min(200, parseInt(widthStr, 10) || 1));
  const height = canvasId === 'circle' ? width : Math.max(1, Math.min(200, parseInt(heightStr, 10) || 1));

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
    setDots((current) => ({
      ...current,
      [key]: CLICK_COLORS[Math.floor(Math.random() * CLICK_COLORS.length)],
    }));
    setSelectedDots((current) =>
      current.includes(key) ? current.filter((selectedKey) => selectedKey !== key) : [...current, key],
    );
  };

  const handleDotEnter = (key: string) => {
    setHoveredDot(key);
    setHoverColors((current) => ({
      ...current,
      [key]: DOT_COLORS[Math.floor(Math.random() * DOT_COLORS.length)],
    }));
  };

  const getDotCenter = useCallback(
    (key: string): { x: number; y: number } | null => {
      const container = containerRef.current;
      const button = container?.querySelector<HTMLButtonElement>(`[data-dot-key="${key}"]`);
      if (!container || !button) return null;
      const containerRect = container.getBoundingClientRect();
      const buttonRect = button.getBoundingClientRect();
      return {
        x: buttonRect.left - containerRect.left + buttonRect.width / 2,
        y: buttonRect.top - containerRect.top + buttonRect.height / 2,
      };
    },
    [],
  );

  const stringPoints = selectedDots
    .map(getDotCenter)
    .filter((p): p is { x: number; y: number } => p !== null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0].contentRect;
      setContainerSize({ width: rect.width, height: rect.height });
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);


  return (
    <main className="min-h-screen bg-tama-white text-tama-burgundy lg:flex">
      <section className="w-full bg-tama-white px-6 py-6 lg:sticky lg:top-0 lg:h-screen lg:w-[calc(35%+55px)] lg:max-w-[575px] lg:overflow-y-auto lg:px-6 lg:py-8 xl:px-6">
        <div className="flex w-full flex-col gap-3">
          <div className="flex justify-center">
            <img src="/Logo.svg" alt="Tama Studio" className="h-auto w-[112px]" />
          </div>

          <QuestionCard title="Project Name">
            <input
              type="text"
              value={name}
              onFocus={() => {
                setNameFocused(true);
                if (name === 'UNTITLED') setName('');
              }}
              onBlur={() => {
                setNameFocused(false);
                if (!name.trim()) setName('UNTITLED');
              }}
              onChange={(event) => setName(event.target.value.toUpperCase())}
              maxLength={60}
              className={`w-full rounded-24px bg-white px-4 py-2.5 text-center font-fredoka text-base font-bold uppercase tracking-[0.07em] outline-none ring-2 ring-transparent transition focus:ring-tama-lavender ${
                nameFocused ? 'text-tama-burgundy' : 'text-tama-lavender'
              }`}
            />
          </QuestionCard>

          <QuestionCard title="What type of canvas do you need?">
            <div className="grid grid-cols-2 gap-1.5">
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
            <div className="grid grid-cols-2 gap-1.5">
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
            <div className="grid grid-cols-2 gap-1.5">
              <DimInput value={widthStr} onChange={setWidthStr} label="Width:" />
              <DimInput
                value={heightStr}
                onChange={setHeightStr}
                label="Height:"
                disabled={canvasId === 'loom' || canvasId === 'circle'}
                tooltip={canvasId === 'loom' ? 'Loom auto-extends as you build, so height is set automatically.' : 'Circle designs are round, so height matches width automatically.'}
              />
            </div>
          </QuestionCard>

          <button
            onClick={handleStart}
            className="sticky bottom-0 z-10 w-full rounded-24px bg-tama-red py-5 font-fredoka text-base font-bold uppercase tracking-[0.07em] text-white shadow-lg shadow-tama-red/25 transition hover:-translate-y-0.5 hover:bg-[#d92f31] active:translate-y-0"
          >
            Start Designing
          </button>
        </div>
      </section>

      <section className="relative hidden min-h-[560px] flex-1 items-stretch justify-center overflow-hidden bg-tama-burgundy p-3 lg:sticky lg:top-0 lg:flex lg:h-screen lg:min-h-screen">
        <div
          ref={containerRef}
          className="relative grid h-full w-full max-w-none flex-1 place-content-center gap-y-[8px] p-[60px]"
          style={{
            gridTemplateColumns: 'repeat(14, clamp(28px, 4vw, 40px))',
            gridTemplateRows: 'repeat(10, clamp(28px, 4vw, 40px))',
            columnGap: '8px',
          }}
        >
          {stringPoints.length >= 2 && (
            <StringCanvas
              points={stringPoints}
              width={containerSize.width}
              height={containerSize.height}
            />
          )}
          {Object.entries(dots).map(([key, color]) => {
            const isHovered = hoveredDot === key;
            return (
              <button
                key={key}
                type="button"
                aria-label={`Select bead ${key}`}
                data-dot-key={key}
                onClick={() => handleDotClick(key)}
                onMouseEnter={() => handleDotEnter(key)}
                onMouseLeave={() => setHoveredDot(null)}
                className="relative z-10 flex h-[clamp(28px,4vw,40px)] w-[clamp(28px,4vw,40px)] items-center justify-center rounded-full border-0 p-0 outline-none shadow-[inset_0_-3px_5px_rgba(0,0,0,0.18),0_2px_5px_rgba(0,0,0,0.2)] transition duration-200 hover:scale-125 focus:outline-none focus:ring-0"
                style={{
                  background: `radial-gradient(circle, transparent 0 6px, ${isHovered ? hoverColors[key] : color} 6.5px 100%)`,
                }}
              >
                <span
                  aria-hidden="true"
                  className="h-3 w-3 rounded-full bg-transparent"
                />
              </button>
            );
          })}
        </div>
      </section>
    </main>
  );
}

function QuestionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-24px bg-tama-pale/90 p-3">
      <h2 className="mb-2 text-center font-public text-xs font-black uppercase tracking-[0.08em] text-tama-burgundy/70">
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
      className={`relative flex min-h-[128px] items-center justify-between gap-1 rounded-24px ${choice.bg} px-2.5 py-2.5 transition-all ${
        active ? 'ring-2 ring-tama-burgundy ring-offset-1' : 'hover:brightness-95'
      }`}
    >
      <span className="w-[52%] text-center font-fredoka text-[22px] font-bold uppercase tracking-[0.07em] leading-[23.5px] text-tama-burgundy">
        {choice.label}
      </span>
      <img
        src={choice.icon}
        alt=""
        className={choice.id === 'loom' ? 'my-[-10px] h-[calc(100%+20px)] w-[46%] max-w-none object-contain' : 'h-[80%] w-[46%] max-w-none object-contain'}
      />
    </button>
  );
}

function BeadButton({ choice, active, onClick }: { choice: BeadChoice; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-full px-[20px] py-[18px] text-left font-fredoka text-base font-bold uppercase tracking-[0.07em] leading-tight transition-all ${
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
  tooltip,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  disabled?: boolean;
  tooltip?: string;
}) {
  const clamp = (n: number) => Math.max(1, Math.min(200, n));
  const step = (dir: 1 | -1) => onChange(String(clamp((parseInt(value, 10) || 1) + dir)));

  return (
    <div className="group relative">
      <label
        className={`flex items-center justify-between gap-1 rounded-full px-[15px] py-[17.5px] font-fredoka text-xs font-bold uppercase tracking-[0.07em] transition ${
          disabled ? 'bg-tama-pale/70 text-tama-burgundy/35' : 'bg-white text-tama-burgundy'
        }`}
      >
        <span className="shrink-0">{label}</span>
        <input
          type="number"
          min={1}
          max={200}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className="w-8 bg-transparent text-center text-base font-bold outline-none [appearance:textfield] disabled:cursor-not-allowed [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <span className="flex shrink-0 flex-col gap-0.5">
          <button
            type="button"
            tabIndex={-1}
            disabled={disabled}
            onClick={() => step(1)}
            className="flex h-4 w-6 items-center justify-center rounded-full bg-tama-burgundy/10 text-tama-burgundy transition hover:bg-tama-red hover:text-white disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-tama-burgundy/10 disabled:hover:text-tama-burgundy"
          >
            <ChevronUp className="h-3 w-3" strokeWidth={3} />
          </button>
          <button
            type="button"
            tabIndex={-1}
            disabled={disabled}
            onClick={() => step(-1)}
            className="flex h-4 w-6 items-center justify-center rounded-full bg-tama-burgundy/10 text-tama-burgundy transition hover:bg-tama-red hover:text-white disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-tama-burgundy/10 disabled:hover:text-tama-burgundy"
          >
            <ChevronDown className="h-3 w-3" strokeWidth={3} />
          </button>
        </span>
      </label>
      {disabled && tooltip && (
        <span
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-[100px] -translate-x-1/2 rounded-2xl bg-tama-burgundy px-3 py-1.5 text-center font-public text-[11px] font-medium leading-tight text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100"
        >
          {tooltip}
        </span>
      )}
    </div>
  );
}

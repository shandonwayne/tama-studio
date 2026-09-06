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

interface CanvasChoice {
  id: CanvasChoiceId;
  label: string;
  icon: string;
  bg: string;
  projectType: ProjectType;
  stitch: StitchType;
}

const CANVAS_CHOICES: CanvasChoice[] = [
  { id: 'loom', label: 'Loom', icon: '/Loom-svg.svg', bg: 'bg-tama-sky', projectType: 'loom', stitch: 'brick' },
  { id: 'square', label: 'Square Stitch', icon: '/squarestitch-svg.svg', bg: 'bg-tama-yellow', projectType: 'freehand', stitch: 'brick' },
  { id: 'brick', label: 'Brick Stitch', icon: '/brickstitch-svg.svg', bg: 'bg-tama-lavender', projectType: 'freehand', stitch: 'peyote' },
  { id: 'circle', label: 'Circle', icon: '/circle-svg.svg', bg: 'bg-tama-orange', projectType: 'freehand', stitch: 'brick' },
];

type BeadChoiceId = 'rocailles' | 'delica' | 'toho' | 'unsure';

interface BeadChoice {
  id: BeadChoiceId;
  label: string;
  brand: Brand;
  shape: MiyukiShape;
}

const BEAD_CHOICES: BeadChoice[] = [
  { id: 'rocailles', label: 'Miyuki Rocailles', brand: 'miyuki', shape: 'rocailles' },
  { id: 'delica', label: 'Miyuki Delica', brand: 'miyuki', shape: 'delica' },
  { id: 'toho', label: 'Toho Round', brand: 'toho', shape: 'delica' },
  { id: 'unsure', label: "I'm Not Sure", brand: 'miyuki', shape: 'rocailles' },
];

const DEFAULT_CANVAS: CanvasChoiceId = 'loom';
const DEFAULT_BEAD: BeadChoiceId = 'rocailles';

export function StartScreen({ onStart }: StartScreenProps) {
  const [canvasId, setCanvasId] = useState<CanvasChoiceId>(DEFAULT_CANVAS);
  const [beadId, setBeadId] = useState<BeadChoiceId>(DEFAULT_BEAD);
  const [widthStr, setWidthStr] = useState('12');
  const [heightStr, setHeightStr] = useState('12');

  const canvas = CANVAS_CHOICES.find((c) => c.id === canvasId) ?? CANVAS_CHOICES[0];
  const bead = BEAD_CHOICES.find((b) => b.id === beadId) ?? BEAD_CHOICES[0];

  const width = Math.max(1, Math.min(200, parseInt(widthStr, 10) || 1));
  const height = Math.max(1, Math.min(200, parseInt(heightStr, 10) || 1));

  const handleStart = () => {
    onStart({
      projectType: canvas.projectType,
      brand: bead.brand,
      miyukiShape: bead.shape,
      stitch: canvas.stitch,
      width,
      height,
      name: 'UNTITLED',
    });
  };

  return (
    <div className="min-h-screen bg-tama-white flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-2xl">
        {/* Main container */}
        <div className="bg-white rounded-30px shadow-xl shadow-tama-pale/60 border border-tama-pale/40 p-6 sm:p-10 space-y-8 animate-fadein">
          {/* Logo */}
          <div className="flex justify-center">
            <img src="/Logo.svg" alt="Tama Studio" className="h-auto w-full max-w-[280px]" />
          </div>

          {/* Canvas type selection */}
          <div>
            <h2 className="font-fredoka font-bold text-tama-burgundy text-lg sm:text-xl text-center mb-4">
              What type of canvas do you need?
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {CANVAS_CHOICES.map((choice) => (
                <CanvasButton
                  key={choice.id}
                  choice={choice}
                  active={canvasId === choice.id}
                  onClick={() => setCanvasId(choice.id)}
                />
              ))}
            </div>
          </div>

          {/* Bead type selection */}
          <div>
            <h2 className="font-fredoka font-bold text-tama-burgundy text-lg sm:text-xl text-center mb-4">
              What kind of beads are you using?
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {BEAD_CHOICES.map((choice) => (
                <BeadButton
                  key={choice.id}
                  label={choice.label}
                  active={beadId === choice.id}
                  onClick={() => setBeadId(choice.id)}
                />
              ))}
            </div>
          </div>

          {/* Dimensions */}
          <div>
            <h2 className="font-fredoka font-bold text-tama-burgundy text-lg sm:text-xl text-center mb-4">
              Dimensions
            </h2>
            <div className="flex items-center justify-center gap-3 sm:gap-4">
              <DimInput
                value={widthStr}
                onChange={setWidthStr}
                label="Width"
              />
              <span className="font-fredoka font-bold text-tama-burgundy text-2xl">×</span>
              <DimInput
                value={heightStr}
                onChange={setHeightStr}
                label="Height"
              />
            </div>
          </div>

          {/* Start button */}
          <button
            onClick={handleStart}
            className="w-full py-4 rounded-24px bg-tama-red text-white font-fredoka font-bold text-lg shadow-lg shadow-tama-red/30 hover:shadow-xl hover:shadow-tama-red/40 hover:-translate-y-0.5 transition-all"
          >
            Start Designing
          </button>
        </div>
      </div>
    </div>
  );
}

function CanvasButton({
  choice,
  active,
  onClick,
}: {
  choice: CanvasChoice;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative rounded-24px ${choice.bg} p-4 sm:p-5 flex items-center justify-between gap-3 transition-all ${
        active
          ? 'ring-4 ring-tama-burgundy scale-[1.02]'
          : 'ring-0 hover:scale-[1.01] hover:brightness-95'
      }`}
    >
      <span className="font-fredoka font-semibold text-tama-burgundy text-sm sm:text-base text-left leading-tight flex-1">
        {choice.label}
      </span>
      <div className="flex items-center justify-center h-14 sm:h-16 flex-shrink-0">
        <img src={choice.icon} alt={choice.label} className="h-full w-auto" />
      </div>
    </button>
  );
}

function BeadButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-24px py-3.5 sm:py-4 px-4 font-fredoka font-semibold text-sm sm:text-base transition-all ${
        active
          ? 'bg-tama-burgundy text-white ring-4 ring-tama-burgundy/30 scale-[1.02]'
          : 'bg-tama-burgundy/90 text-tama-white hover:bg-tama-burgundy hover:brightness-110'
      }`}
    >
      {label}
    </button>
  );
}

function DimInput({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <input
        type="number"
        min={1}
        max={200}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-20 sm:w-24 px-3 py-3 rounded-24px bg-tama-pale border-2 border-tama-lavender/40 text-center font-fredoka font-bold text-xl text-tama-burgundy outline-none focus:border-tama-lavender transition"
      />
      <span className="font-fredoka font-semibold text-xs text-tama-burgundy/60 uppercase tracking-wide">
        {label}
      </span>
    </div>
  );
}

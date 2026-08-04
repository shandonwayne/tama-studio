import { useState } from 'react';
import { Grid2x2, Sparkles, ArrowRight, ChevronDown } from 'lucide-react';
import logoUrl from '/logo.svg';
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

const LOOM_START_HEIGHT = 16;

export function StartScreen({ onStart }: StartScreenProps) {
  const [projectType, setProjectType] = useState<ProjectType>('loom');
  const [brand, setBrand] = useState<Brand>('miyuki');
  const [miyukiShape, setMiyukiShape] = useState<MiyukiShape>('delica');
  const [brandOpen, setBrandOpen] = useState(false);
  const [stitch, setStitch] = useState<StitchType>('brick');
  const [widthStr, setWidthStr] = useState('24');
  const [heightStr, setHeightStr] = useState('24');
  const [name, setName] = useState('');

  const width = Math.max(1, Math.min(200, parseInt(widthStr, 10) || 1));
  const height = Math.max(1, Math.min(200, parseInt(heightStr, 10) || 1));

  const canStart = name.trim().length > 0;

  const handleTypeChange = (t: ProjectType) => {
    setProjectType(t);
  };

  const brandOptions: {
    value: string;
    label: string;
    icon: React.ReactNode;
    select: () => void;
  }[] = [
    {
      value: 'miyuki-delica',
      label: 'Miyuki Delica',
      icon: <div className="w-4 h-2.5 rounded-sm bg-amber-400" />,
      select: () => {
        setBrand('miyuki');
        setMiyukiShape('delica');
      },
    },
    {
      value: 'miyuki-rocailles',
      label: 'Miyuki Rocailles',
      icon: <div className="w-3 h-3 rounded-full bg-amber-400" />,
      select: () => {
        setBrand('miyuki');
        setMiyukiShape('rocailles');
      },
    },
    {
      value: 'toho',
      label: 'Toho',
      icon: <div className="w-3.5 h-3.5 rounded-full bg-sky-400" />,
      select: () => {
        setBrand('toho');
        setMiyukiShape('delica');
      },
    },
  ];

  const selectedBrandOption =
    brandOptions.find((o) =>
      brand === 'toho'
        ? o.value === 'toho'
        : o.value === `${brand}-${miyukiShape}`
    ) ?? brandOptions[0];

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="w-full max-w-xs">
        <div className="flex items-center gap-3 mb-6 justify-center">
          <img src={logoUrl} alt="Tama Studio" className="h-8 w-auto" />
        </div>

        <div className="bg-white rounded-2xl shadow-lg shadow-stone-200/60 border border-stone-100 p-5 sm:p-6 space-y-5">
          {/* Project name */}
          <div>
            <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">
              Project name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Bead Project"
              maxLength={60}
              className="w-full px-3.5 py-2.5 rounded-lg border border-stone-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition text-stone-800 text-sm"
            />
          </div>

          {/* Project type */}
          <div>
            <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">
              Type
            </label>
            <div className="flex gap-2">
              <Chip
                active={projectType === 'loom'}
                onClick={() => handleTypeChange('loom')}
                icon={<Grid2x2 className="w-4 h-4" />}
                label="Loom"
              />
              <Chip
                active={projectType === 'freehand'}
                onClick={() => handleTypeChange('freehand')}
                icon={<Sparkles className="w-4 h-4" />}
                label="Freehand"
              />
            </div>
          </div>

          {/* Brand */}
          <div className="relative">
            <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">
              Brand
            </label>
            <button
              type="button"
              onClick={() => setBrandOpen((v) => !v)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border border-stone-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition text-stone-800 text-sm bg-white"
            >
              <span className="flex items-center gap-2">
                {selectedBrandOption.icon}
                {selectedBrandOption.label}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-stone-400 transition-transform ${
                  brandOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
            {brandOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setBrandOpen(false)}
                />
                <ul className="absolute z-20 left-0 right-0 mt-1 bg-white border border-stone-200 rounded-lg shadow-lg overflow-hidden">
                  {brandOptions.map((opt) => (
                    <li key={opt.value}>
                      <button
                        type="button"
                        onClick={() => {
                          opt.select();
                          setBrandOpen(false);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm transition ${
                          selectedBrandOption.value === opt.value
                            ? 'bg-amber-50 text-amber-700 font-medium'
                            : 'text-stone-700 hover:bg-stone-50'
                        }`}
                      >
                        {opt.icon}
                        {opt.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          {/* Stitch type */}
          <div className="animate-fadein">
            <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">
              Stitch
            </label>
            <div className="flex gap-2">
              <Chip
                active={stitch === 'brick'}
                onClick={() => setStitch('brick')}
                label="Square"
              />
              <Chip
                active={stitch === 'peyote'}
                onClick={() => setStitch('peyote')}
                label="Brick"
              />
            </div>
          </div>

          {/* Size */}
          <div>
            <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">
              {projectType === 'loom' ? 'Width' : 'Dimensions'}
            </label>

            {projectType === 'loom' ? (
              <input
                type="number"
                min={1}
                max={200}
                value={widthStr}
                onChange={(e) => setWidthStr(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-stone-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition text-stone-800 text-sm"
              />
            ) : (
              <div className="flex items-center gap-2 w-full">
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={widthStr}
                  onChange={(e) => setWidthStr(e.target.value)}
                  className="flex-1 w-full px-2.5 py-1.5 rounded-lg border border-stone-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition text-stone-800 text-sm text-center"
                />
                <span className="text-stone-400 text-sm">×</span>
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={heightStr}
                  onChange={(e) => setHeightStr(e.target.value)}
                  className="flex-1 w-full px-2.5 py-1.5 rounded-lg border border-stone-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition text-stone-800 text-sm text-center"
                />
              </div>
            )}
          </div>

          {/* Start */}
          <button
            onClick={() =>
              canStart &&
              onStart({
                projectType,
                brand,
                miyukiShape,
                stitch,
                width,
                height: projectType === 'loom' ? LOOM_START_HEIGHT : height,
                name: name.trim(),
              })
            }
            disabled={!canStart}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition ${
              canStart
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40 hover:-translate-y-0.5'
                : 'bg-stone-100 text-stone-400 cursor-not-allowed'
            }`}
          >
            Start Designing
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition border ${
        active
          ? 'bg-amber-500 text-white border-amber-500'
          : 'bg-white text-stone-600 border-stone-200 hover:border-amber-300'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

import { useCallback, useRef, useState } from 'react';
import { Plus } from 'lucide-react';

interface ColorSpectrumPickerProps {
  onAdd: (hex: string) => void;
}

function hsvToHex(h: number, s: number, v: number): string {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }
  const toHex = (n: number) =>
    Math.round((n + m) * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToHsv(hex: string): { h: number; s: number; v: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: max === 0 ? 0 : d / max, v: max };
}

const HUE_HEIGHT = 12;
const SV_SIZE = 160;

export function ColorSpectrumPicker({ onAdd }: ColorSpectrumPickerProps) {
  const initial = hexToHsv('#ff8800');
  const [h, setH] = useState(initial.h);
  const [s, setS] = useState(initial.s);
  const [v, setV] = useState(initial.v);
  const svRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);

  const hex = hsvToHex(h, s, v);

  const handleSV = useCallback(
    (clientX: number, clientY: number) => {
      const el = svRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
      setS(x);
      setV(1 - y);
    },
    []
  );

  const handleHue = useCallback((clientX: number) => {
    const el = hueRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    setH(x * 360);
  }, []);

  const hueHex = hsvToHex(h, 1, 1);

  return (
    <div className="space-y-3">
      {/* SV square + preview */}
      <div className="flex gap-3">
        <div
          ref={svRef}
          className="relative rounded-lg overflow-hidden cursor-crosshair touch-none select-none"
          style={{
            width: SV_SIZE,
            height: SV_SIZE,
            backgroundColor: hueHex,
            backgroundImage: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent)`,
          }}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            handleSV(e.clientX, e.clientY);
          }}
          onPointerMove={(e) => {
            if (e.buttons === 1) handleSV(e.clientX, e.clientY);
          }}
        >
          {/* Cursor */}
          <div
            className="absolute w-3.5 h-3.5 rounded-full border-2 border-white shadow-md pointer-events-none -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${s * 100}%`,
              top: `${(1 - v) * 100}%`,
              backgroundColor: hex,
            }}
          />
        </div>

        <div className="flex flex-col gap-2 flex-1">
          <div
            className="flex-1 rounded-lg border border-stone-200"
            style={{ backgroundColor: hex }}
          />
          <p className="text-center text-xs font-mono text-stone-600 uppercase">
            {hex}
          </p>
          <button
            onClick={() => onAdd(hex)}
            className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition"
          >
            <Plus className="w-4 h-4" />
            Add to palette
          </button>
        </div>
      </div>

      {/* Hue slider */}
      <div
        ref={hueRef}
        className="relative rounded-lg cursor-pointer touch-none select-none"
        style={{
          height: HUE_HEIGHT,
          backgroundImage: `linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)`,
        }}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          handleHue(e.clientX);
        }}
        onPointerMove={(e) => {
          if (e.buttons === 1) handleHue(e.clientX);
        }}
      >
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-5 rounded-full border-2 border-white shadow-md pointer-events-none"
          style={{ left: `${(h / 360) * 100}%`, backgroundColor: hueHex }}
        />
      </div>
    </div>
  );
}

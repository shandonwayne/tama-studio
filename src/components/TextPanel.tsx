import {
  GLYPH_WIDTH,
  GLYPH_HEIGHT,
  CURSIVE_GLYPH_WIDTH,
  CURSIVE_GLYPH_HEIGHT,
  FONT_LIBRARIES,
  AVAILABLE_CHARS,
  type FontLibraryName,
} from '@/lib/oldEnglishFont';
import { ChevronDown } from 'lucide-react';

interface TextPanelProps {
  selectedLetter: string | null;
  onSelectLetter: (letter: string | null) => void;
  selectedColor: string | null;
  selectedColorHex: string | null;
  fontLibrary: FontLibraryName;
  onFontLibrary: (lib: FontLibraryName) => void;
}

const FONT_LABELS: Record<FontLibraryName, string> = {
  Gothic: 'Gothic',
  Sans: 'Sans',
  Cursive: 'Cursive',
};

export function TextPanel({
  selectedLetter,
  onSelectLetter,
  selectedColor,
  selectedColorHex,
  fontLibrary,
  onFontLibrary,
}: TextPanelProps) {
  const font = FONT_LIBRARIES[fontLibrary];
  const glyphW = fontLibrary === 'Cursive' ? CURSIVE_GLYPH_WIDTH : GLYPH_WIDTH;
  const glyphH = fontLibrary === 'Cursive' ? CURSIVE_GLYPH_HEIGHT : GLYPH_HEIGHT;

  const renderGlyph = (char: string) => {
    const key = fontLibrary === 'Cursive' ? char.toUpperCase() : char.toUpperCase();
    const glyph = font[key];
    if (!glyph) return null;
    const cellPx = 4;
    return (
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${glyphW}, ${cellPx}px)`,
          gridTemplateRows: `repeat(${glyphH}, ${cellPx}px)`,
        }}
      >
        {Array.from({ length: glyphH * glyphW }).map((_, i) => {
          const gx = i % glyphW;
          const gy = Math.floor(i / glyphW);
          const on = glyph.some(([cx, cy]) => cx === gx && cy === gy);
          return (
            <div
              key={i}
              style={{
                width: cellPx,
                height: cellPx,
                backgroundColor: on ? (selectedColorHex ?? '#d6d3d1') : 'transparent',
              }}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-stone-100">
        {/* Font library dropdown */}
        <div className="relative">
          <select
            value={fontLibrary}
            onChange={(e) => onFontLibrary(e.target.value as FontLibraryName)}
            className="w-full appearance-none px-3 py-2 pr-8 rounded-lg text-sm font-medium border border-stone-200 bg-white text-stone-700 cursor-pointer focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition"
          >
            {(Object.keys(FONT_LIBRARIES) as FontLibraryName[]).map((lib) => (
              <option key={lib} value={lib}>
                {FONT_LABELS[lib]}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
        </div>

        {selectedColor === null && (
          <p className="text-[11px] text-amber-600 mt-3">
            Pick a color from the Colors tab first.
          </p>
        )}
      </div>

      {/* Letter grid */}
      <div className="flex-1 overflow-y-auto p-3 min-h-0">
        <div className="grid grid-cols-4 gap-1.5">
          {AVAILABLE_CHARS.map((ch) => (
            <button
              key={ch}
              onClick={() => onSelectLetter(ch)}
              className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border transition ${
                selectedLetter === ch
                  ? 'border-amber-400 bg-amber-50'
                  : 'border-stone-200 hover:border-amber-300 hover:bg-amber-50/40'
              }`}
            >
              {renderGlyph(ch)}
              <span className="text-[10px] font-medium text-stone-500">{ch}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Footer hint */}
      <div className="px-3 py-2 border-t border-stone-100 bg-stone-50/60">
        <p className="text-[11px] text-stone-400 text-center">
          {selectedLetter
            ? 'Hover the canvas to preview, click to place'
            : 'Pick a letter to stamp on the canvas'}
        </p>
      </div>
    </div>
  );
}

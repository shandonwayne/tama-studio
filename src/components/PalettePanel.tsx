import { useMemo, useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, Plus, SlidersHorizontal, Droplet, Type, Check } from 'lucide-react';
import type { BeadColor, BeadType, Brand, MiyukiShape } from '@/beads';
import { getBrandColors, getBeadType, BEAD_TYPE_ORDER, shortName } from '@/beads';
import { ColorSpectrumPicker } from './ColorSpectrumPicker';

// Sort colors by hue (rainbow order), then by lightness, then by saturation.
// Neutrals (very low saturation) sort to the end.
function hueSortKey(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const lightness = (max + min) / 2;
  const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));
  let hue = 0;
  if (delta !== 0) {
    if (max === r) hue = ((g - b) / delta) % 6;
    else if (max === g) hue = (b - r) / delta + 2;
    else hue = (r - g) / delta + 4;
    hue *= 60;
    if (hue < 0) hue += 360;
  }
  // Neutrals (sat < 0.08) get hue 370 so they sort after all chromatic colors
  const hueBucket = saturation < 0.08 ? 370 : hue;
  return [hueBucket, lightness, saturation];
}

function sortColorsByHue(list: BeadColor[]): BeadColor[] {
  return [...list].sort((a, b) => {
    const [ha, la, sa] = hueSortKey(a.hex);
    const [hb, lb, sb] = hueSortKey(b.hex);
    if (ha !== hb) return ha - hb;
    if (la !== lb) return la - lb;
    return sb - sa;
  });
}

interface PalettePanelProps {
  brand: Brand;
  miyukiShape: MiyukiShape;
  selectedColor: string | null;
  onSelectColor: (code: string | null) => void;
  customColors: BeadColor[];
  onAddCustomColor: (color: BeadColor) => void;
}

export function PalettePanel({
  brand,
  miyukiShape,
  selectedColor,
  onSelectColor,
  customColors,
  onAddCustomColor,
}: PalettePanelProps) {
  const colors = useMemo(
    () => (brand === 'other' ? customColors : getBrandColors(brand, miyukiShape)),
    [brand, miyukiShape, customColors]
  );
  const [query, setQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [hovered, setHovered] = useState<BeadColor | null>(null);
  const [activeType, setActiveType] = useState<BeadType | 'All'>('All');
  const [tooltip, setTooltip] = useState<{
    color: BeadColor;
    swatchRect: DOMRect;
    placed?: { left: number; top: number };
  } | null>(null);

  const availableTypes = useMemo(() => {
    const set = new Set<BeadType>();
    colors.forEach((c) => set.add(getBeadType(c)));
    return BEAD_TYPE_ORDER.filter((t) => set.has(t));
  }, [colors]);

  const showTypeFilter = brand !== 'other' && availableTypes.length > 1;
  const showGrouped = activeType === 'All' && showTypeFilter;

  const filtered = useMemo(() => {
    let result = colors;
    if (activeType !== 'All') {
      result = result.filter((c) => getBeadType(c) === activeType);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (c) =>
          c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
      );
    }
    // Sort by hue within each type bucket (or globally if not grouped)
    if (showGrouped) {
      // Sort each bucket separately
      const buckets: Record<string, BeadColor[]> = {};
      for (const c of result) {
        const t = getBeadType(c);
        (buckets[t] ??= []).push(c);
      }
      for (const t of Object.keys(buckets)) {
        buckets[t] = sortColorsByHue(buckets[t]);
      }
      // Reassemble in BEAD_TYPE_ORDER
      result = BEAD_TYPE_ORDER.flatMap((t) => buckets[t] ?? []);
    } else {
      result = sortColorsByHue(result);
    }
    return result;
  }, [colors, query, activeType, showGrouped]);

  // After the tooltip mounts, measure it and compute a position that
  // keeps it fully inside the viewport.
  useEffect(() => {
    if (!tooltip || tooltip.placed) return;
    const el = document.getElementById('palette-tooltip');
    if (!el) return;
    const tw = el.offsetWidth;
    const th = el.offsetHeight;
    const margin = 8;
    const r = tooltip.swatchRect;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Preferred: centered above the swatch.
    let left = r.left + r.width / 2 - tw / 2;
    let top = r.top - th - margin;

    // Horizontal clamp
    if (left + tw > vw - margin) left = vw - tw - margin;
    if (left < margin) left = margin;

    // If not enough space above, flip below.
    if (top < margin && r.bottom + th + margin < vh) {
      top = r.bottom + margin;
    }
    // Vertical clamp as last resort.
    if (top + th > vh - margin) top = vh - th - margin;
    if (top < margin) top = margin;

    setTooltip((prev) =>
      prev ? { ...prev, placed: { left, top } } : prev
    );
  }, [tooltip]);

  const handleSwatchEnter = useCallback((c: BeadColor, el: HTMLElement) => {
    setHovered(c);
    setTooltip({ color: c, swatchRect: el.getBoundingClientRect() });
  }, []);

  const handleSwatchLeave = useCallback(() => {
    setHovered(null);
    setTooltip(null);
  }, []);

  const handleAdd = (hex: string) => {
    const code = `C-${(customColors.length + 1).toString().padStart(3, '0')}`;
    onAddCustomColor({
      code,
      name: `Custom ${code}`,
      hex,
    });
  };

  const selected = colors.find((col) => col.code === selectedColor);
  const displayColor = hovered ?? selected;

  const renderSwatch = (c: BeadColor) => (
    <button
      key={c.code}
      onClick={() => onSelectColor(c.code)}
      onMouseEnter={(e) => handleSwatchEnter(c, e.currentTarget)}
      onMouseLeave={handleSwatchLeave}
      title={`${c.code} — ${shortName(c)}`}
      className={`group relative aspect-square rounded-lg border-2 transition hover:scale-105 hover:z-10 ${
        selectedColor === c.code
          ? 'border-amber-500 ring-2 ring-amber-200 scale-105'
          : 'border-stone-200'
      }`}
      style={{ backgroundColor: c.hex }}
    >
      {selectedColor === c.code && (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="w-2 h-2 rounded-full bg-white shadow ring-1 ring-black/20" />
        </span>
      )}
    </button>
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-stone-100">
        {/* Toolbar: Add button (custom only) + filter/search toggle icons */}
        <div className="flex items-center justify-between gap-2">
          {brand === 'other' ? (
            <button
              onClick={() => setShowAdd(!showAdd)}
              className="flex items-center gap-1 text-xs font-medium text-amber-600 hover:text-amber-700"
            >
              {showAdd ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              {showAdd ? 'Cancel' : 'Add'}
            </button>
          ) : <span />}

          <div className="flex items-center gap-1">
            {showTypeFilter && (
              <button
                onClick={() => { setShowFilters(!showFilters); if (showFilters) setActiveType('All'); }}
                title="Filter by type"
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition ${
                  showFilters || activeType !== 'All'
                    ? 'bg-amber-100 text-amber-700'
                    : 'text-stone-500 hover:bg-stone-100'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                {activeType !== 'All' && <span>{activeType}</span>}
              </button>
            )}
            <button
              onClick={() => { setShowSearch(!showSearch); if (showSearch) setQuery(''); }}
              title="Search colors"
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition ${
                showSearch || query ? 'bg-amber-100 text-amber-700' : 'text-stone-500 hover:bg-stone-100'
              }`}
            >
              <Search className="w-4 h-4" />
              {query && <span className="max-w-[60px] truncate">{query}</span>}
            </button>
          </div>
        </div>

        {showAdd && brand === 'other' && (
          <div className="mt-3 p-3 rounded-xl bg-stone-50">
            <ColorSpectrumPicker onAdd={handleAdd} />
          </div>
        )}

        {showSearch && (
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search color or code..."
              autoFocus
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-stone-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition"
            />
          </div>
        )}

        {showFilters && showTypeFilter && (
          <div className="mt-3">
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setActiveType('All')}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition border ${
                  activeType === 'All'
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'bg-white text-stone-600 border-stone-200 hover:border-amber-300'
                }`}
              >
                All
              </button>
              {availableTypes.map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveType(t)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition border ${
                    activeType === t
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'bg-white text-stone-600 border-stone-200 hover:border-amber-300'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowFilters(false)}
              className="mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500 text-white hover:bg-amber-600 transition"
            >
              <Check className="w-3.5 h-3.5" />
              Apply
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 min-h-0">
        {filtered.length === 0 ? (
          <p className="text-center text-sm text-stone-400 py-8">
            {brand === 'other'
              ? 'No custom colors yet. Click Add to create one.'
              : 'No colors match your search.'}
          </p>
        ) : showGrouped ? (
          <div className="space-y-3">
            {BEAD_TYPE_ORDER.filter((t) =>
              filtered.some((c) => getBeadType(c) === t)
            ).map((t) => (
              <div key={t}>
                <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wide mb-1">
                  {t}
                </p>
                <div className="grid grid-cols-6 gap-1.5">
                  {filtered
                    .filter((c) => getBeadType(c) === t)
                    .map(renderSwatch)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-6 gap-1.5">
            {filtered.map(renderSwatch)}
          </div>
        )}
        {filtered.length > 0 && (
          <p className="text-center text-xs text-stone-400 mt-3 pb-1">
            {filtered.length} color{filtered.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Currently selected / hovered */}
      <div className="p-3 border-t border-stone-100 bg-stone-50/60">
        {displayColor ? (
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg border border-stone-200 flex-shrink-0 transition"
              style={{ backgroundColor: displayColor.hex }}
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-stone-700 truncate">
                {displayColor.code}
              </p>
              <p className="text-xs text-stone-500 truncate">
                {shortName(displayColor)}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-stone-400">No color selected</p>
        )}
      </div>

      {/* Tooltip rendered in a portal at the document body so it is never
          clipped by the panel's overflow or rounded corners. */}
      {tooltip &&
        createPortal(
          <div
            id="palette-tooltip"
            className="fixed z-[9999] pointer-events-none whitespace-nowrap rounded-md bg-stone-800 px-2 py-1 text-[10px] font-medium text-white shadow-lg"
            style={
              tooltip.placed
                ? { left: tooltip.placed.left, top: tooltip.placed.top, visibility: 'visible' }
                : { left: -9999, top: -9999, visibility: 'hidden' }
            }
          >
            <span className="font-mono">{tooltip.color.code}</span>
            <span className="mx-1 opacity-50">·</span>
            {shortName(tooltip.color)}
          </div>,
          document.body
        )}
    </div>
  );
}

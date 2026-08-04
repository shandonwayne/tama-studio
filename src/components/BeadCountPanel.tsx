import { useMemo } from 'react';
import { ShoppingBag, Hash } from 'lucide-react';
import type { BeadColor, Brand, MiyukiShape } from '@/beads';
import { findColor, shortName } from '@/beads';

interface BeadCountPanelProps {
  grid: (string | null)[][];
  brand: Brand;
  miyukiShape: MiyukiShape;
  customColors: BeadColor[];
}

interface CountRow {
  code: string;
  name: string;
  hex: string;
  count: number;
}

export function BeadCountPanel({
  grid,
  brand,
  miyukiShape,
  customColors,
}: BeadCountPanelProps) {
  const { rows, total, colorMap } = useMemo(() => {
    const map = new Map<string, number>();
    let t = 0;
    for (const row of grid) {
      for (const code of row) {
        if (code) {
          map.set(code, (map.get(code) ?? 0) + 1);
          t++;
        }
      }
    }
    const cm = new Map<string, string>();
    const all: CountRow[] = [];
    for (const [code, count] of map) {
      const c =
        findColor(brand, code, miyukiShape) ||
        customColors.find((col) => col.code === code);
      const hex = c ? c.hex : '#cccccc';
      cm.set(code, hex);
      if (c) {
        all.push({ code, name: c.name, hex, count });
      } else {
        all.push({ code, name: 'Unknown', hex, count });
      }
    }
    all.sort((a, b) => b.count - a.count);
    return { rows: all, total: t, colorMap: cm };
  }, [grid, brand, miyukiShape, customColors]);

  const cols = grid[0]?.length ?? 0;
  const gridRows = grid.length;

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-stone-100">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-amber-600" />
          <h2 className="font-semibold text-stone-800 text-sm">Bead List</h2>
        </div>
        <p className="text-xs text-stone-500 mt-1">
          {total} bead{total !== 1 ? 's' : ''} across {rows.length} color
          {rows.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Design preview — no grid lines, like Photoshop's navigator */}
      <div className="px-3 pt-3 pb-2 border-b border-stone-100">
        <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wide mb-1.5">
          Preview
        </p>
        <div className="rounded-lg overflow-hidden border border-stone-200 bg-stone-50 flex items-center justify-center" style={{ maxHeight: 120 }}>
          {cols > 0 && gridRows > 0 ? (
            <div
              className="grid"
              style={{
                gridTemplateColumns: `repeat(${cols}, 1fr)`,
                width: '100%',
                maxWidth: 220,
                aspectRatio: `${cols} / ${gridRows}`,
              }}
            >
              {grid.flatMap((row, y) =>
                row.map((code, x) => (
                  <div
                    key={`${x}-${y}`}
                    style={{
                      backgroundColor: code ? (colorMap.get(code) ?? '#cccccc') : 'transparent',
                    }}
                  />
                ))
              )}
            </div>
          ) : (
            <p className="text-xs text-stone-400 py-6">Nothing to preview</p>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {rows.length === 0 ? (
          <p className="text-center text-sm text-stone-400 py-10 px-4">
            Start painting to see your bead shopping list appear here.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white">
              <tr className="text-left text-xs text-stone-400 border-b border-stone-100">
                <th className="py-2 pl-3 pr-3 font-medium">Color</th>
                <th className="py-2 font-medium">Code</th>
                <th className="py-2 pl-3 pr-3 text-right font-medium">
                  <span className="inline-flex items-center gap-1">
                    <Hash className="w-3 h-3" /> Qty
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.code}
                  className="border-b border-stone-50 hover:bg-amber-50/40 transition"
                >
                  <td className="py-2 pl-3 pr-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded border border-stone-200 flex-shrink-0"
                        style={{ backgroundColor: r.hex }}
                      />
                      <span className="text-xs text-stone-600 truncate max-w-[100px]">
                        {shortName({ code: r.code, name: r.name, hex: r.hex })}
                      </span>
                    </div>
                  </td>
                  <td className="py-2">
                    <span className="text-xs font-mono text-stone-500">
                      {r.code}
                    </span>
                  </td>
                  <td className="py-2 pl-3 pr-3 text-right">
                    <span className="text-xs font-semibold text-stone-700">
                      {r.count}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

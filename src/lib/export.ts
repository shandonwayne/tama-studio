import { useCallback, useEffect, useRef, useState } from 'react';
import { findColor } from '@/beads';
import type { BeadColor, Brand, MiyukiShape } from '@/beads';

interface ExportOpts {
  brand: Brand;
  miyukiShape?: MiyukiShape;
  customColors: BeadColor[];
  rotations?: number[][];
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function getCellDimensions(
  brand: Brand,
  miyukiShape: MiyukiShape | undefined | null,
  baseSize: number
): { w: number; h: number } {
  const isDelica = brand === 'miyuki' && miyukiShape === 'delica';
  return { w: baseSize, h: isDelica ? Math.floor((baseSize * 2) / 3) : baseSize };
}

function getBeadRadius(
  brand: Brand,
  miyukiShape: MiyukiShape | undefined | null,
  cellW: number
): number {
  if (brand === 'miyuki' && miyukiShape === 'rocailles')
    return Math.floor(cellW / 3);
  if (brand === 'toho') return Math.floor(cellW / 3);
  return 2;
}

export function renderGridToCanvas(
  grid: (string | null)[][],
  { brand, miyukiShape, customColors, rotations }: ExportOpts,
  cellSize = 24,
  showGrid = true
): HTMLCanvasElement {
  const h = grid.length;
  const w = h > 0 ? grid[0].length : 0;
  const { w: cellW, h: cellH } = getCellDimensions(brand, miyukiShape, cellSize);
  const canvas = document.createElement('canvas');
  canvas.width = w * cellW;
  canvas.height = h * cellH;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const radius = getBeadRadius(brand, miyukiShape, cellW);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const code = grid[y][x];
      if (code) {
        const c =
          findColor(brand, code, miyukiShape) ||
          customColors.find((col) => col.code === code);
        if (c) {
          ctx.fillStyle = c.hex;
          const rot = rotations?.[y]?.[x] ?? 0;
          if (rot === 90) {
            const innerW = cellH;
            const innerH = cellW;
            const offsetX = x * cellW + (cellW - innerW) / 2;
            const offsetY = y * cellH + (cellH - innerH) / 2;
            roundedRect(ctx, offsetX, offsetY, innerW, innerH, radius);
          } else {
            roundedRect(ctx, x * cellW, y * cellH, cellW, cellH, radius);
          }
          ctx.fill();
        }
      }
    }
  }
  if (showGrid && cellSize >= 8) {
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= w; x++) {
      ctx.beginPath();
      ctx.moveTo(x * cellW + 0.5, 0);
      ctx.lineTo(x * cellW + 0.5, h * cellH);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * cellH + 0.5);
      ctx.lineTo(w * cellW, y * cellH + 0.5);
      ctx.stroke();
    }
  }
  return canvas;
}

export function useExportPNG() {
  const linkRef = useRef<HTMLAnchorElement | null>(null);
  if (!linkRef.current && typeof document !== 'undefined') {
    linkRef.current = document.createElement('a');
  }

  return useCallback(
    (grid: (string | null)[][], opts: ExportOpts, filename: string) => {
      const canvas = renderGridToCanvas(grid, opts, 32, true);
      canvas.toBlob((blob) => {
        if (!blob || !linkRef.current) return;
        const url = URL.createObjectURL(blob);
        linkRef.current.href = url;
        linkRef.current.download = `${filename.replace(/\.[^.]+$/, '')}.png`;
        linkRef.current.click();
        URL.revokeObjectURL(url);
      }, 'image/png');
    },
    []
  );
}

export function useThumbnail(
  grid: (string | null)[][],
  brand: Brand,
  miyukiShape: MiyukiShape | null,
  customColors: BeadColor[],
  rotations: number[][],
  size = 200
) {
  const [url, setUrl] = useState<string>('');

  useEffect(() => {
    if (!grid || grid.length === 0) {
      setUrl('');
      return;
    }
    const h = grid.length;
    const w = h > 0 ? grid[0].length : 0;
    if (w === 0) {
      setUrl('');
      return;
    }
    const { w: cellW, h: cellH } = getCellDimensions(brand, miyukiShape, 10);
    const aspect = (w * cellW) / (h * cellH);
    let baseSize: number;
    if (aspect >= 1) {
      baseSize = Math.max(1, Math.floor(size / w));
    } else {
      baseSize = Math.max(1, Math.floor(size / h));
    }
    const canvas = renderGridToCanvas(grid, { brand, miyukiShape: miyukiShape ?? undefined, customColors, rotations: rotations ?? undefined }, baseSize, false);
    canvas.toBlob((blob) => {
      if (!blob) return;
      setUrl(URL.createObjectURL(blob));
    }, 'image/png');
    return () => {
      setUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return '';
      });
    };
  }, [grid, brand, miyukiShape, customColors, rotations, size]);

  return url;
}

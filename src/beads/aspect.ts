import type { Brand, MiyukiShape } from '@/beads';

export type Orientation = 'landscape' | 'portrait';

export function getOrientation(width: number, height: number): Orientation {
  return width >= height ? 'landscape' : 'portrait';
}

/**
 * Base (portrait) cell dimensions for each bead type.
 * Rocailles: 1 : 1.2 (slightly taller than wide)
 * Delica:    1 : 0.75 (wider than tall)
 * Toho/other: 1 : 1
 */
function getBaseCellDimensions(
  brand: Brand,
  miyukiShape: MiyukiShape | null | undefined,
  baseSize: number
): { w: number; h: number } {
  const isRocailles = brand === 'miyuki' && miyukiShape === 'rocailles';
  const isDelica = brand === 'miyuki' && miyukiShape === 'delica';
  if (isRocailles) return { w: baseSize, h: Math.round(baseSize * 1.2) };
  if (isDelica) return { w: baseSize, h: Math.round(baseSize * 0.75) };
  return { w: baseSize, h: baseSize };
}

/**
 * Cell dimensions adjusted for grid orientation.
 * Landscape flips non-square aspect ratios; square beads stay square.
 */
export function getCellDimensions(
  brand: Brand,
  miyukiShape: MiyukiShape | null | undefined,
  baseSize: number,
  orientation: Orientation = 'portrait'
): { w: number; h: number } {
  const base = getBaseCellDimensions(brand, miyukiShape, baseSize);
  if (orientation === 'landscape' && base.w !== base.h) {
    return { w: base.h, h: base.w };
  }
  return base;
}

/**
 * Bead corner radius for the given bead type and cell size.
 */
export function getBeadRadius(
  brand: Brand,
  miyukiShape: MiyukiShape | null | undefined,
  cellW: number,
  cellH: number
): string | number {
  if (brand === 'miyuki' && miyukiShape === 'rocailles') return '38%';
  if (brand === 'miyuki' && miyukiShape === 'delica')
    return Math.round(Math.min(cellW, cellH) * 0.3);
  if (brand === 'toho') return Math.floor(cellW / 3);
  return 2;
}

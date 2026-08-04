import type { BeadColor } from './miyuki';
import { miyukiColors } from './miyuki';
import { miyukiRoundColors } from './miyuki-round';
import { tohoColors } from './toho';

export type { BeadColor };
export type Brand = 'miyuki' | 'toho' | 'other';
export type ProjectType = 'loom' | 'freehand';
export type MiyukiShape = 'delica' | 'rocailles';
export type StitchType = 'brick' | 'peyote';

export type BeadType =
  | 'Opaque'
  | 'Ceylon'
  | 'Silver-Lined'
  | 'Transparent'
  | 'Galvanized'
  | 'Metallic'
  | 'Matte'
  | 'Matte Metallic'
  | 'Duracoat'
  | 'Silk'
  | 'Opal'
  | 'Color-Lined'
  | 'Crystal'
  | 'Glazed'
  | 'Picasso'
  | 'Pearlized'
  | 'Luminous'
  | 'Special'
  | 'Other';

export const BEAD_TYPE_ORDER: BeadType[] = [
  'Opaque',
  'Ceylon',
  'Silver-Lined',
  'Transparent',
  'Galvanized',
  'Metallic',
  'Matte',
  'Matte Metallic',
  'Duracoat',
  'Silk',
  'Opal',
  'Color-Lined',
  'Crystal',
  'Glazed',
  'Picasso',
  'Pearlized',
  'Luminous',
  'Special',
  'Other',
];

export function getBeadType(c: BeadColor): BeadType {
  if (c.type) {
    const t = c.type as BeadType;
    if (BEAD_TYPE_ORDER.includes(t)) return t;
  }
  const d = c.name.toLowerCase();
  if (d.startsWith('matte') && d.includes('metallic')) return 'Matte Metallic';
  if (d.startsWith('matte') || d.includes('frost') || d.includes('frosted')) return 'Matte';
  if (d.includes('duracoat')) return 'Duracoat';
  if (d.includes('galvan') || d.includes('nickel-plated') || d.includes('gold-plated') || d.includes('palladium') || d.includes('copper-plated') || d.includes('silver plated') || d.includes('silver-plated')) return 'Galvanized';
  if (d.startsWith('opaque') || d.startsWith('opaque ')) return 'Opaque';
  if (d.startsWith('ceylon')) return 'Ceylon';
  if (d.includes('silver-lined') || d.includes('s/l') || d.includes('silverline')) return 'Silver-Lined';
  if (d.startsWith('transp') || d.startsWith('transparent')) return 'Transparent';
  if (d.includes('silk')) return 'Silk';
  if (d.includes('picasso')) return 'Picasso';
  if (d.includes('pearlized')) return 'Pearlized';
  if (d.includes('luminous')) return 'Luminous';
  if (d.includes('opal')) return 'Opal';
  if (d.includes('color lined') || d.includes('color-lined')) return 'Color-Lined';
  if (d.includes('metallic') || d.includes('iris')) return 'Metallic';
  if (d.includes('crystal') && d.includes('glazed')) return 'Glazed';
  if (d.includes('crystal')) return 'Crystal';
  if (d.includes('marea') || d.includes('vitrail') || d.includes('labrador') || d.includes('magic')) return 'Special';
  if (d.includes('glazed')) return 'Glazed';
  return 'Other';
}

export function getBrandColors(brand: Brand, miyukiShape?: MiyukiShape | null): BeadColor[] {
  if (brand === 'miyuki') {
    return miyukiShape === 'rocailles' ? miyukiRoundColors : miyukiColors;
  }
  if (brand === 'toho') return tohoColors;
  return [];
}

export function findColor(
  brand: Brand,
  code: string,
  miyukiShape?: MiyukiShape | null
): BeadColor | undefined {
  const colors = getBrandColors(brand, miyukiShape);
  return colors.find((c) => c.code === code);
}

export function shortName(c: BeadColor): string {
  const name = c.name;
  if (name.length <= 30) return name;
  return name.slice(0, 28) + '…';
}

// ── Color conversion helpers ──────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function colorDistance(a: string, b: string): number {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

function findClosestColor(
  hex: string,
  palette: BeadColor[]
): string {
  let best = palette[0];
  let bestDist = Infinity;
  for (const c of palette) {
    const d = colorDistance(hex, c.hex);
    if (d < bestDist) {
      bestDist = d;
      best = c;
    }
  }
  return best.code;
}

export function convertGridColors(
  grid: (string | null)[][],
  fromBrand: Brand,
  fromShape: MiyukiShape | null,
  toBrand: Brand,
  toShape: MiyukiShape,
  customColors: BeadColor[]
): (string | null)[][] {
  const fromColors = getBrandColors(fromBrand, fromShape);
  const toColors = getBrandColors(toBrand, toShape);

  return grid.map((row) =>
    row.map((code) => {
      if (!code) return null;
      const src =
        fromColors.find((c) => c.code === code) ||
        customColors.find((c) => c.code === code);
      if (!src) return null;
      return findClosestColor(src.hex, toColors);
    })
  );
}

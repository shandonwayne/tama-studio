// Miyuki Delica 11/0 seed beads — full official Miyuki color catalog.
// Generated from the official Miyuki Delica color listing with ~1300 entries.
// Hex values are estimated from color descriptions and finish modifiers.
import { delicaColors, type DelicaColor } from './delica-colors';

export interface BeadColor {
  code: string;
  name: string;
  hex: string;
  type?: string;
}

export const miyukiColors: BeadColor[] = delicaColors.map((c) => ({
  code: c.code,
  name: c.name,
  hex: c.hex,
  type: c.type,
}));

export const miyukiDelicaColors: DelicaColor[] = delicaColors;

export { type DelicaColor };

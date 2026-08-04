#!/usr/bin/env node
/**
 * Re-derive hex values for Delica colors based on their names.
 * Many auto-generated hex values were wrong (e.g. "Light Yellow" was red).
 * This script parses the name, identifies the base color and modifiers
 * (dark/light/pale/matte/iris/luster/AB/glazed/etc.), and produces a
 * sensible hex that actually matches the name.
 */

import fs from 'fs';
import path from 'path';

const inFile = path.join(process.cwd(), 'src/beads/delica-colors.ts');
const src = fs.readFileSync(inFile, 'utf8');

// ── Base color palette ──────────────────────────────────────────────
// Each entry: [keyword(s) that match, hex]
// Ordered so more specific matches come first.
const BASE_COLORS = [
  // Whites / creams / ivories
  ['crystal clear', '#e8e8e8'],
  ['crystal', '#e0e8e8'],
  ['white', '#f5f5f0'],
  ['pearl white', '#f8f4e8'],
  ['ivory', '#f0ebdb'],
  ['alabaster', '#e8e0d8'],
  ['cream', '#f2e9d8'],
  ['bisque', '#efe9de'],
  ['linen', '#e8e0d4'],
  ['bone', '#e0d8c8'],
  ['vanilla', '#f0e8d0'],
  ['buttercream', '#f5ead0'],
  ['oyster', '#d0c8b8'],
  ['navajo white', '#ffdead'],
  ['eggshell', '#f0ead6'],
  ['champagne', '#f7e7c4'],
  ['antique cream', '#e8d8b8'],

  // Yellows / golds
  ['canary', '#ffef00'],
  ['daffodil', '#f0d030'],
  ['yellow', '#e8c020'],
  ['gold', '#d4a020'],
  ['saffron', '#e8a820'],
  ['honey', '#d8a830'],
  ['butter', '#f0d860'],
  ['light yellow', '#f0e060'],
  ['pale yellow', '#f0e890'],
  ['dark yellow', '#c8a010'],
  ['goldenrod', '#d8a020'],
  ['mid. gold', '#e0b840'],
  ['light gold', '#d8b040'],
  ['dark gold', '#b88820'],

  // Oranges / peach / copper
  ['tangerine', '#e86820'],
  ['orange', '#e88030'],
  ['copper', '#b8683a'],
  ['peach', '#f0c8a8'],
  ['salmon', '#f0a890'],
  ['coral', '#e07060'],
  ['rust', '#a04020'],
  ['russet', '#8b3a1e'],
  ['terracotta', '#c67040'],
  ['pumpkin', '#e87030'],
  ['apricot', '#f0c890'],
  ['tarnished copper', '#a08070'],
  ['cinnamon', '#a85c32'],
  ['cocoa', '#6f4e37'],
  ['chocolate', '#5c3a22'],
  ['brown', '#6b4423'],
  ['mocha', '#8b6850'],
  ['coffee', '#5c3a1e'],
  ['root beer', '#5a3018'],
  ['amber', '#b18e56'],
  ['topaz', '#b57e41'],
  ['light topaz', '#d4b070'],
  ['pale topaz', '#e0c898'],
  ['dark topaz', '#855a29'],
  ['smoky topaz', '#7a5a30'],
  ['smoky quartz', '#908070'],
  ['taupe', '#908878'],
  ['antique beige', '#81736a'],
  ['beige', '#dcd2bc'],
  ['tan', '#c8a028'],
  ['khaki', '#b0a080'],
  ['saddle', '#8b4513'],

  // Reds / pinks
  ['crimson', '#dc143c'],
  ['cranberry', '#a94057'],
  ['raspberry', '#b0014e'],
  ['cherry', '#c01838'],
  ['cola', '#6a1e29'],
  ['ruby', '#c01838'],
  ['garnet', '#8d2424'],
  ['claret', '#7c1f17'],
  ['wine', '#722f37'],
  ['burgundy', '#800020'],
  ['maroon', '#800000'],
  ['barn red', '#7c1f17'],
  ['red', '#c8302a'],
  ['dark red', '#822424'],
  ['light siam', '#d86873'],
  ['siam', '#c0392f'],
  ['brick', '#a03828'],
  ['antique rose', '#cd5a85'],
  ['rose', '#e098b0'],
  ['dark rose', '#c0607a'],
  ['old rose', '#c8a0a8'],
  ['blush', '#f0d0d0'],
  ['pink champagne', '#f0d8d0'],
  ['pale rose', '#f0d8d8'],
  ['light salmon', '#f0a890'],
  ['salmon pink', '#f5a090'],
  ['bubblegum', '#ff90c0'],
  ['cotton candy', '#ffbcd9'],
  ['hot pink', '#ff1493'],
  ['magenta', '#c71585'],
  ['fuchsia', '#fd64ca'],
  ['mauve', '#a9809b'],
  ['dusty rose', '#c8a0a8'],
  ['antique rose', '#cd5a85'],
  ['pink', '#f098b8'],
  ['light pink', '#f5c0d4'],
  ['pale pink', '#f8d0dc'],
  ['medium pink', '#f2a7c2'],
  ['dark pink', '#e07090'],
  ['strawberry', '#e84858'],
  ['watermelon', '#e84858'],
  ['plum crazy', '#dd6090'],
  ['wild strawberry', '#e84858'],

  // Purples / violets
  ['violet', '#8a2be2'],
  ['purple', '#8b008b'],
  ['dark purple', '#5e2d8f'],
  ['plum', '#8b4513'],
  ['eggplant', '#614051'],
  ['grape', '#5e2d8f'],
  ['amethyst', '#9966cc'],
  ['dark amethyst', '#6e3380'],
  ['smoky amethyst', '#b08a93'],
  ['light amethyst', '#c8a0d8'],
  ['smoke amethyst', '#b08a93'],
  ['lilac', '#c8a2c8'],
  ['lavender', '#e0c0e0'],
  ['light lilac', '#d8c0d8'],
  ['light lavender', '#e8d0e8'],
  ['dark orchid', '#7b2da3'],
  ['dusty orchid', '#b898d8'],
  ['mulberry', '#c84098'],
  ['periwinkle', '#ccccff'],
  ['blueberry', '#5050a0'],

  // Greens
  ['emerald', '#1c8a3a'],
  ['forest green', '#1c5c28'],
  ['jungle green', '#2d8a3d'],
  ['kelly green', '#3cb371'],
  ['mint', '#a8d8a8'],
  ['mint green', '#a8d8a8'],
  ['light mint', '#c0e8c0'],
  ['seafoam', '#80d0c8'],
  ['sea foam', '#80d0c8'],
  ['aqua mist', '#b0e0d8'],
  ['aqua green', '#80d8c8'],
  ['chartreuse', '#d0dd4f'],
  ['lime', '#8cc840'],
  ['olive', '#6b7a28'],
  ['olive green', '#6b7a28'],
  ['dark olive', '#4a5a20'],
  ['sage', '#8a9a80'],
  ['dark sage', '#5a6a50'],
  ['light sage', '#b0c0a0'],
  ['peridot', '#829949'],
  ['dark peridot', '#6d8729'],
  ['cactus', '#5a8a3a'],
  ['mallard', '#2a6a4a'],
  ['avocado', '#568235'],
  ['jade', '#4ab371'],
  ['evergreen', '#2d5f2d'],
  ['army green', '#4b5d16'],
  ['moss', '#8a9a6a'],
  ['green', '#3a8a4a'],
  ['dark green', '#1f5937'],
  ['light green', '#6bc070'],
  ['pale green', '#a0d8a0'],
  ['golden olive', '#7a8937'],
  ['celadon', '#a0c8b0'],

  // Turquoise (before blue so "turquoise blue" doesn't match "blue" first)
  ['turquoise blue', '#40e0d0'],
  ['turquoise green', '#40d0a0'],
  ['turquoise', '#2cb8c8'],
  ['light turquoise', '#6bcdd8'],
  ['pale turquoise', '#a0e0e0'],
  ['dark turquoise', '#1a8898'],
  ['robins egg', '#70b0c0'],

  // Blues
  ['navy', '#1a2a5a'],
  ['midnight blue', '#191970'],
  ['cobalt', '#262ce7'],
  ['sapphire', '#1c4cc8'],
  ['lapis', '#2867bd'],
  ['capri', '#74b1b1'],
  ['capri blue', '#74b1b1'],
  ['denim', '#5070a0'],
  ['stone blue', '#7090b0'],
  ['ice blue', '#7090d0'],
  ['sky blue', '#6e9ad8'],
  ['light blue', '#6e9ad8'],
  ['light sky blue', '#8ab0e0'],
  ['dark sky blue', '#3060a0'],
  ['marine blue', '#3a5aca'],
  ['agate blue', '#3070c8'],
  ['aquamarine', '#60afc9'],
  ['teal', '#226a6a'],
  ['caribbean teal', '#27748d'],
  ['teal waters', '#3a8a8a'],
  ['cyan', '#40e0d0'],
  ['cyan blue', '#49618a'],
  ['blue', '#3070c8'],
  ['dark blue', '#1f4882'],
  ['pale blue', '#b0c8e0'],
  ['pastel blue', '#b0c8e0'],
  ['robin', '#7090c0'],
  ['robin egg', '#70b0c0'],
  ['agate', '#3070c8'],
  ['pewter', '#8a9ba8'],
  ['smoky pewter', '#bad1e2'],
  ['ghost grey', '#959595'],
  ['ghost gray', '#959595'],
  ['steel grey', '#86868a'],
  ['steel gray', '#86868a'],
  ['iron gray', '#4a4a4a'],
  ['slate gray', '#708090'],
  ['slate grey', '#708090'],
  ['charcoal', '#36454f'],
  ['smoke', '#7a7a8e'],
  ['smoke gray', '#7a7a8e'],
  ['smoke grey', '#7a7a8e'],
  ['shadow gray', '#909098'],
  ['shadow grey', '#909098'],
  ['ash gray', '#8a8a8a'],
  ['ash grey', '#8a8a8a'],
  ['soft gray', '#b0b0b0'],
  ['soft grey', '#b0b0b0'],
  ['silver gray', '#a0a0a8'],
  ['silver grey', '#a0a0a8'],
  ['gray', '#8a8a8a'],
  ['grey', '#8a8a8a'],
  ['light gray', '#b8b8b8'],
  ['light grey', '#b8b8b8'],
  ['pale gray', '#c8c8c8'],
  ['pale grey', '#c8c8c8'],
  ['dark gray', '#555555'],
  ['dark grey', '#555555'],
  ['blue gray', '#6b7888'],
  ['blue grey', '#6b7888'],
  ['silver', '#c8ccd0'],
  ['gunmetal', '#2a2a2e'],

  // Browns
  ['dark chocolate', '#3b2516'],
  ['light chocolate', '#6b4423'],
  ['chocolate brown', '#5c3a22'],
  ['dark brown', '#4f3925'],
  ['light brown', '#8b6850'],
  ['bronze', '#644a26'],
  ['light bronze', '#8a7038'],
  ['dark bronze', '#5a3e1a'],
  ['antique bronze', '#7a6038'],
  ['umber', '#8b6040'],
  ['sienna', '#a0522d'],

  // Blacks
  ['black', '#1a1a1a'],
  ['noir', '#2a2a2a'],
  ['jet', '#1a1a1a'],

  // Specials
  ['marea', '#3a4a6a'],
  ['vitrail', '#3b424f'],
  ['labrador', '#333338'],
  ['magic orchid', '#c878d8'],
  ['magic blue', '#4878d8'],
  ['magic wine', '#8a2858'],
];

// ── Modifier adjustments ────────────────────────────────────────────
function adjustColor(hex, modifiers) {
  let [r, g, b] = hexToRgb(hex);

  if (modifiers.has('dark') || modifiers.has('dk')) {
    r = Math.round(r * 0.65);
    g = Math.round(g * 0.65);
    b = Math.round(b * 0.65);
  }
  if (modifiers.has('light') || modifiers.has('lt') || modifiers.has('pale')) {
    r = Math.min(255, Math.round(r * 1.2 + 20));
    g = Math.min(255, Math.round(g * 1.2 + 20));
    b = Math.min(255, Math.round(b * 1.2 + 20));
  }
  if (modifiers.has('medium') || modifiers.has('med')) {
    // slight desaturate
    const avg = (r + g + b) / 3;
    r = Math.round(r * 0.85 + avg * 0.15);
    g = Math.round(g * 0.85 + avg * 0.15);
    b = Math.round(b * 0.85 + avg * 0.15);
  }
  if (modifiers.has('matte') || modifiers.has('frost') || modifiers.has('frosted')) {
    // desaturate
    const avg = (r + g + b) / 3;
    r = Math.round(r * 0.7 + avg * 0.3);
    g = Math.round(g * 0.7 + avg * 0.3);
    b = Math.round(b * 0.7 + avg * 0.3);
  }
  if (modifiers.has('luster') || modifiers.has('luster') || modifiers.has('glazed')) {
    // slight brighten + soft wash
    r = Math.min(255, Math.round(r * 0.95 + 18));
    g = Math.min(255, Math.round(g * 0.95 + 18));
    b = Math.min(255, Math.round(b * 0.95 + 18));
  }
  if (modifiers.has('iris')) {
    // shift hue slightly toward blue-purple
    const avg = (r + g + b) / 3;
    r = Math.round(r * 0.7 + avg * 0.1);
    g = Math.round(g * 0.7 + avg * 0.1);
    b = Math.min(255, Math.round(b * 1.1 + 10));
  }
  if (modifiers.has('ab')) {
    // iridescent coating — lighten slightly
    r = Math.min(255, Math.round(r * 1.1 + 15));
    g = Math.min(255, Math.round(g * 1.1 + 15));
    b = Math.min(255, Math.round(b * 1.1 + 15));
  }
  if (modifiers.has('silver-lined') || modifiers.has('silver lined') || modifiers.has('s/l')) {
    // silver lining brightens
    r = Math.min(255, Math.round(r * 1.15 + 20));
    g = Math.min(255, Math.round(g * 1.15 + 20));
    b = Math.min(255, Math.round(b * 1.15 + 20));
  }
  if (modifiers.has('gold-lined') || modifiers.has('gold lined') || modifiers.has('24kt')) {
    // warm gold tint
    r = Math.min(255, Math.round(r * 0.9 + 30));
    g = Math.min(255, Math.round(g * 0.85 + 20));
    b = Math.round(b * 0.7);
  }
  if (modifiers.has('copper-lined') || modifiers.has('copper lined')) {
    r = Math.min(255, Math.round(r * 0.85 + 25));
    g = Math.round(g * 0.8);
    b = Math.round(b * 0.65);
  }
  if (modifiers.has('opaque')) {
    // fully saturated, no change needed
  }
  if (modifiers.has('transparent') || modifiers.has('transp')) {
    // slightly desaturate to suggest translucency
    const avg = (r + g + b) / 3;
    r = Math.round(r * 0.85 + avg * 0.15);
    g = Math.round(g * 0.85 + avg * 0.15);
    b = Math.round(b * 0.85 + avg * 0.15);
  }
  if (modifiers.has('opal')) {
    // milky/whitish
    r = Math.min(255, Math.round(r * 0.6 + 80));
    g = Math.min(255, Math.round(g * 0.6 + 80));
    b = Math.min(255, Math.round(b * 0.6 + 80));
  }
  if (modifiers.has('ceylon')) {
    // soft pearly
    const avg = (r + g + b) / 3;
    r = Math.round(r * 0.75 + avg * 0.15 + 20);
    g = Math.round(g * 0.75 + avg * 0.15 + 20);
    b = Math.round(b * 0.75 + avg * 0.15 + 20);
  }
  if (modifiers.has('neon') || modifiers.has('luminous')) {
    // boost saturation
    const avg = (r + g + b) / 3;
    r = Math.min(255, Math.round(r * 1.4 - avg * 0.3));
    g = Math.min(255, Math.round(g * 1.4 - avg * 0.3));
    b = Math.min(255, Math.round(b * 1.4 - avg * 0.3));
  }
  if (modifiers.has('galvanized')) {
    // metallic flatness
    const avg = (r + g + b) / 3;
    r = Math.round(r * 0.8 + avg * 0.2);
    g = Math.round(g * 0.8 + avg * 0.2);
    b = Math.round(b * 0.8 + avg * 0.2);
  }
  if (modifiers.has('silk') || modifiers.has('satin')) {
    // soft, slightly desaturated
    const avg = (r + g + b) / 3;
    r = Math.round(r * 0.8 + avg * 0.2);
    g = Math.round(g * 0.8 + avg * 0.2);
    b = Math.round(b * 0.8 + avg * 0.2);
  }
  if (modifiers.has('duracoat')) {
    // durable opaque, keep as-is
  }

  return rgbToHex(clamp(r), clamp(g), clamp(b));
}

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

function clamp(v) {
  return Math.max(0, Math.min(255, v));
}

// ── Name parsing ────────────────────────────────────────────────────
function deriveHex(name) {
  const lower = name.toLowerCase();

  // Collect modifiers
  const modifiers = new Set();
  const modPatterns = [
    'dark', 'dk', 'light', 'lt', 'pale', 'medium', 'med',
    'matte', 'frost', 'frosted', 'luster', 'luster', 'glazed',
    'iris', 'ab', 'opaque', 'transparent', 'transp',
    'silver-lined', 'silver lined', 's/l', 'silverline',
    'gold-lined', 'gold lined', '24kt', '24kt',
    'copper-lined', 'copper lined',
    'opal', 'ceylon', 'neon', 'luminous',
    'galvanized', 'silk', 'satin', 'duracoat',
    'metallic', 'plated', 'nickel', 'palladium',
    'color lined', 'color-lined',
    'pearlized', 'pearl',
    'special',
  ];
  for (const p of modPatterns) {
    if (lower.includes(p)) modifiers.add(p);
  }

  // Find base color
  for (const [keyword, hex] of BASE_COLORS) {
    if (lower.includes(keyword)) {
      return adjustColor(hex, modifiers);
    }
  }

  // Fallback: gray
  return '#cccccc';
}

// ── Parse and regenerate file ───────────────────────────────────────
const lines = src.split('\n');
let count = 0;
const out = lines.map(line => {
  // Match: { code: 'DB0001', ... name: '...', hex: '#xxxxxx', ... },
  const m = line.match(/^(.*?\{[^}]*?name:\s*'([^']*)',\s*)hex:\s*'#[0-9a-fA-F]{6}'(.*\},?.*)$/);
  if (!m) return line;

  const [, prefix, name, suffix] = m;
  const newHex = deriveHex(name);
  count++;
  return `${prefix}hex: '${newHex}'${suffix}`;
});

fs.writeFileSync(inFile, out.join('\n'));
console.log(`Updated ${count} color entries in ${inFile}`);

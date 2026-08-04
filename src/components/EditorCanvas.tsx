import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Brush,
  Eraser,
  PaintBucket,
  Pipette,
  Minus,
  Square,
  Undo2,
  Redo2,
  Grid3x3,
  Plus,
  ZoomIn,
  ZoomOut,
  Maximize,
  RotateCw,
} from 'lucide-react';
import type { BeadColor, Brand, MiyukiShape, ProjectType, StitchType } from '@/beads';
import { findColor } from '@/beads';
import { textToCells } from '@/lib/oldEnglishFont';
import { FONT_LIBRARIES, type FontLibraryName } from '@/lib/oldEnglishFont';

type Tool = 'paint' | 'erase' | 'fill' | 'eyedropper' | 'line' | 'rect' | 'rotate';
type RectMode = 'filled' | 'outline';

interface EditorCanvasProps {
  grid: (string | null)[][];
  rotations: number[][];
  onRotationsChange: (r: number[][]) => void;
  width: number;
  height: number;
  brand: Brand;
  miyukiShape: MiyukiShape;
  projectType: ProjectType;
  stitch: StitchType;
  customColors: BeadColor[];
  selectedColor: string | null;
  onGridChange: (grid: (string | null)[][]) => void;
  onRotateGrid: () => void;
  onGrowRows: (count: number) => void;
  textMode: boolean;
  selectedLetter: string | null;
  fontLibrary: FontLibraryName;
  selectedColorHex: string | null;
}

const MAX_HISTORY = 60;
const GROW_BATCH = 12;

export function EditorCanvas({
  grid,
  rotations,
  onRotationsChange,
  width,
  height,
  brand,
  miyukiShape,
  projectType,
  stitch,
  customColors,
  selectedColor,
  onGridChange,
  onRotateGrid,
  onGrowRows,
  textMode,
  selectedLetter,
  fontLibrary,
  selectedColorHex,
}: EditorCanvasProps) {
  const [tool, setTool] = useState<Tool>('paint');
  const [isDrawing, setIsDrawing] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [startCell, setStartCell] = useState<[number, number] | null>(null);
  const [preview, setPreview] = useState<[number, number][] | null>(null);
  const [textPreviewPos, setTextPreviewPos] = useState<[number, number] | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rectMode, setRectMode] = useState<RectMode>('outline');
  const [rectHover, setRectHover] = useState(false);

  const historyRef = useRef<(string | null)[][][]>([]);
  const futureRef = useRef<(string | null)[][][]>([]);
  const [historyVersion, setHistoryVersion] = useState(0);
  const grownThisStroke = useRef(false);

  const isLoom = projectType === 'loom';

  const cloneGrid = useCallback(
    () => grid.map((row) => [...row]),
    [grid]
  );

  const maybeGrow = useCallback(
    (y: number) => {
      if (!isLoom) return;
      if (grownThisStroke.current) return;
      if (y >= height - 2) {
        grownThisStroke.current = true;
        onGrowRows(GROW_BATCH);
      }
    },
    [isLoom, height, onGrowRows]
  );

  const setCell = useCallback(
    (x: number, y: number, value: string | null, base: (string | null)[][]) => {
      if (x < 0 || x >= width) return;
      if (y < 0 || y >= base.length) return;
      base[y][x] = value;
    },
    [width]
  );

  const applyTool = useCallback(
    (x: number, y: number) => {
      if (tool === 'paint') {
        if (!selectedColor) return;
        const next = cloneGrid();
        if (next[y]?.[x] === selectedColor) return;
        setCell(x, y, selectedColor, next);
        onGridChange(next);
        maybeGrow(y);
      } else if (tool === 'erase') {
        const next = cloneGrid();
        if (next[y]?.[x] === null) return;
        setCell(x, y, null, next);
        onGridChange(next);
      } else if (tool === 'eyedropper') {
        const code = grid[y]?.[x];
        if (code) {
          window.dispatchEvent(new CustomEvent('beadpick', { detail: code }));
        }
      } else if (tool === 'fill') {
        const next = cloneGrid();
        floodFill(next, x, y, selectedColor, width, next.length);
        onGridChange(next);
        maybeGrow(y);
      } else if (tool === 'rotate') {
        onRotateGrid();
      } else if (tool === 'line' || tool === 'rect') {
        setStartCell([x, y]);
      }
    },
    [tool, selectedColor, grid, width, cloneGrid, setCell, onGridChange, onRotateGrid, maybeGrow],
  );

  const continueTool = useCallback(
    (x: number, y: number) => {
      if (tool === 'paint' && selectedColor) {
        const next = cloneGrid();
        if (next[y]?.[x] === selectedColor) return;
        setCell(x, y, selectedColor, next);
        onGridChange(next);
        maybeGrow(y);
      } else if (tool === 'erase') {
        const next = cloneGrid();
        if (next[y]?.[x] === null) return;
        setCell(x, y, null, next);
        onGridChange(next);
      } else if (textMode && textPreviewPos && selectedLetter && selectedColor) {
        const font = FONT_LIBRARIES[fontLibrary];
        const cells = textToCells(selectedLetter, textPreviewPos[0], textPreviewPos[1], font, 0);
        setPreview(cells);
      } else if (tool === 'line' && startCell) {
        const cells = bresenham(startCell[0], startCell[1], x, y);
        setPreview(cells);
      } else if (tool === 'rect' && startCell) {
        const cells = rectCells(startCell[0], startCell[1], x, y, rectMode);
        setPreview(cells);
      }
    },
    [tool, selectedColor, startCell, cloneGrid, setCell, onGridChange, maybeGrow, selectedLetter, textPreviewPos, textMode, fontLibrary]
  );

  const endShape = useCallback(
    (x: number, y: number) => {
      if (textMode) {
        setTextPreviewPos(null);
        setPreview(null);
      }
      if ((tool === 'line' || tool === 'rect') && startCell) {
        const next = cloneGrid();
        const cells =
          tool === 'line'
            ? bresenham(startCell[0], startCell[1], x, y)
            : rectCells(startCell[0], startCell[1], x, y, rectMode);
        if (selectedColor) {
          cells.forEach(([cx, cy]) => setCell(cx, cy, selectedColor, next));
        }
        onGridChange(next);
        maybeGrow(y);
        setStartCell(null);
        setPreview(null);
      }
    },
    [tool, startCell, selectedColor, cloneGrid, setCell, onGridChange, maybeGrow, textMode]
  );

  const snapshotBefore = useCallback(() => {
    historyRef.current.push(grid.map((row) => [...row]));
    if (historyRef.current.length > MAX_HISTORY) historyRef.current.shift();
    futureRef.current = [];
    setHistoryVersion((v) => v + 1);
  }, [grid]);

  const undo = useCallback(() => {
    if (historyRef.current.length === 0) return;
    const prev = historyRef.current.pop()!;
    futureRef.current.push(grid.map((row) => [...row]));
    onGridChange(prev);
    setHistoryVersion((v) => v + 1);
  }, [grid, onGridChange]);

  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return;
    const next = futureRef.current.pop()!;
    historyRef.current.push(grid.map((row) => [...row]));
    onGridChange(next);
    setHistoryVersion((v) => v + 1);
  }, [grid, onGridChange]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === 'y' || (e.key === 'z' && e.shiftKey))
      ) {
        e.preventDefault();
        redo();
      } else if (e.key === 'b') setTool('paint');
      else if (e.key === 'e') setTool('erase');
      else if (e.key === 'g') setTool('fill');
      else if (e.key === 'i') setTool('eyedropper');
      else if (e.key === 'l') setTool('line');
      else if (e.key === 'r') setTool('rect');
      else if (e.key === 'o') setTool('rotate');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo]);

  const handlePointerDown = (x: number, y: number, e: React.PointerEvent) => {
    e.preventDefault();
    if (textMode) {
      if (!selectedColor || !selectedLetter) return;
      snapshotBefore();
      const next = cloneGrid();
      const font = FONT_LIBRARIES[fontLibrary];
      const cells = textToCells(selectedLetter, x, y, font, 0);
      cells.forEach(([cx, cy]) => setCell(cx, cy, selectedColor, next));
      onGridChange(next);
      maybeGrow(y);
      setTextPreviewPos(null);
      setPreview(null);
      return;
    }
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    snapshotBefore();
    grownThisStroke.current = false;
    setIsDrawing(true);
    applyTool(x, y);
  };

  const handlePointerMove = (x: number, y: number) => {
    if (textMode && !isDrawing) {
      if (!selectedLetter || !selectedColor) return;
      const font = FONT_LIBRARIES[fontLibrary];
      const cells = textToCells(selectedLetter, x, y, font, 0);
      setTextPreviewPos([x, y]);
      setPreview(cells);
      return;
    }
    if (!isDrawing) return;
    continueTool(x, y);
  };

  const handlePointerLeave = () => {
    if (textMode && !isDrawing) {
      setTextPreviewPos(null);
      setPreview(null);
    }
  };

  const handlePointerUp = (x: number, y: number) => {
    if (!isDrawing) return;
    endShape(x, y);
    setIsDrawing(false);
  };

  const displayGrid = useMemo(() => {
    if (!preview || !selectedColor || textMode) return grid;
    const next = grid.map((row) => [...row]);
    preview.forEach(([x, y]) => {
      if (x >= 0 && x < width && y >= 0 && y < grid.length) {
        next[y][x] = selectedColor;
      }
    });
    return next;
  }, [grid, preview, selectedColor, width, textMode]);

  const previewCells = useMemo(() => {
    if (!preview || !selectedColor) return new Set<string>();
    return new Set(preview.map(([x, y]) => `${x},${y}`));
  }, [preview, selectedColor]);

  const cellSize = useMemo(() => {
    const isRocailles = brand === 'miyuki' && miyukiShape === 'rocailles';
    const isDelica = brand === 'miyuki' && miyukiShape === 'delica';
    if (isLoom) {
      const cw = Math.floor(Math.min(640 / width, 28));
      // Rocailles: portrait rounded square — slightly taller than wide
      // Delica: landscape rectangle — wider than tall (w:h ≈ 4:3)
      if (isRocailles) return { w: cw, h: Math.round(cw * 1.2) };
      if (isDelica)    return { w: cw, h: Math.round(cw * 0.75) };
      return { w: cw, h: cw };
    }
    const cw = Math.floor(Math.min(640 / width, 520 / height, 32));
    if (isRocailles) return { w: cw, h: Math.round(cw * 1.2) };
    if (isDelica)    return { w: cw, h: Math.round(cw * 0.75) };
    return { w: cw, h: cw };
  }, [width, height, isLoom, brand, miyukiShape]);

  const cellW = Math.round(cellSize.w * zoom);
  const cellH = Math.round(cellSize.h * zoom);

  // Rocailles: rounded square — generous but not full radius
  // Delica: rounded rectangle — moderate corner radius
  const beadRadius: string | number =
    brand === 'miyuki' && miyukiShape === 'rocailles'
      ? '38%'
      : brand === 'miyuki' && miyukiShape === 'delica'
      ? Math.round(Math.min(cellW, cellH) * 0.3)
      : brand === 'toho'
      ? Math.floor(cellW / 3)
      : 2;

  const isPeyote = stitch === 'peyote';
  const halfCellW = Math.floor(cellW / 2);

  const tools: { id: Tool; icon: React.ReactNode; label: string; key: string }[] = [
    { id: 'paint', icon: <Brush className="w-4 h-4" />, label: 'Paint', key: 'B' },
    { id: 'erase', icon: <Eraser className="w-4 h-4" />, label: 'Erase', key: 'E' },
    { id: 'fill', icon: <PaintBucket className="w-4 h-4" />, label: 'Fill', key: 'G' },
    { id: 'eyedropper', icon: <Pipette className="w-4 h-4" />, label: 'Pick', key: 'I' },
    { id: 'line', icon: <Minus className="w-4 h-4" />, label: 'Line', key: 'L' },
    { id: 'rect', icon: <Square className="w-4 h-4" />, label: 'Rect', key: 'R' },

    ...(projectType === 'freehand'
      ? [{ id: 'rotate' as Tool, icon: <RotateCw className="w-4 h-4" />, label: 'Rotate', key: 'O' }]
      : []),
  ];

  const canUndo = historyRef.current.length > 0;
  const canRedo = futureRef.current.length > 0;

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2.5 border-b border-stone-100 flex-wrap">
        {tools.map((t) =>
          t.id === 'rect' ? (
            <div
              key={t.id}
              className="relative"
              onMouseEnter={() => setRectHover(true)}
              onMouseLeave={() => setRectHover(false)}
            >
              <button
                onClick={() => setTool(t.id)}
                className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium transition ${
                  tool === t.id
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
                title={`${t.label} (${t.key})`}
              >
                {t.icon}
                <span className="hidden sm:inline">{t.label}</span>
              </button>
              {rectHover && (
                <div className="absolute top-full left-0 mt-1 z-50 bg-white rounded-lg border border-stone-200 shadow-lg overflow-hidden w-36">
                  <button
                    onClick={() => { setRectMode('filled'); setTool('rect'); setRectHover(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition ${
                      rectMode === 'filled'
                        ? 'bg-amber-50 text-amber-700 font-semibold'
                        : 'text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <Square className="w-3.5 h-3.5" style={{ fill: 'currentColor' }} />
                    Filled
                  </button>
                  <button
                    onClick={() => { setRectMode('outline'); setTool('rect'); setRectHover(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition ${
                      rectMode === 'outline'
                        ? 'bg-amber-50 text-amber-700 font-semibold'
                        : 'text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <Square className="w-3.5 h-3.5" style={{ fill: 'none', stroke: 'currentColor', strokeWidth: 1.5 }} />
                    Outline
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              key={t.id}
              onClick={() => setTool(t.id)}
              className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium transition ${
                tool === t.id
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
              title={`${t.label} (${t.key})`}
            >
              {t.icon}
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          )
        )}
        <div className="w-px h-6 bg-stone-200 mx-1" />
        <button
          onClick={() => setShowGrid(!showGrid)}
          className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium transition ${
            showGrid ? 'bg-stone-100 text-stone-700' : 'text-stone-500 hover:bg-stone-100'
          }`}
          title="Toggle grid lines"
        >
          <Grid3x3 className="w-4 h-4" />
          <span className="hidden sm:inline">Grid</span>
        </button>
        {isLoom && (
          <button
            onClick={() => onGrowRows(GROW_BATCH)}
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium text-amber-600 hover:bg-amber-50 transition"
            title={`Add ${GROW_BATCH} rows`}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Rows</span>
          </button>
        )}
        {/* Zoom controls */}
        <div className="flex items-center gap-1 ml-1">
          <button
            onClick={() => setZoom((z) => Math.max(0.25, +(z - 0.25).toFixed(2)))}
            className="p-2 rounded-lg text-stone-600 hover:bg-stone-100 transition"
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-medium text-stone-500 w-10 text-center tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(8, +(z + 0.25).toFixed(2)))}
            className="p-2 rounded-lg text-stone-600 hover:bg-stone-100 transition"
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom(1)}
            className="p-2 rounded-lg text-stone-600 hover:bg-stone-100 transition"
            title="Reset zoom"
          >
            <Maximize className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1" />
        <button
          onClick={undo}
          disabled={!canUndo}
          className="p-2 rounded-lg text-stone-600 hover:bg-stone-100 disabled:opacity-30 disabled:hover:bg-transparent transition"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          className="p-2 rounded-lg text-stone-600 hover:bg-stone-100 disabled:opacity-30 disabled:hover:bg-transparent transition"
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-4 h-4" />
        </button>
      </div>

      {/* Text mode banner */}
      {textMode && (
        <div className="px-3 py-2 border-b border-amber-200 bg-amber-50/60 flex items-center gap-2">
          <span className="text-xs font-semibold text-amber-700">
            Text stamp mode
          </span>
          {selectedLetter ? (
            <span className="text-xs text-amber-600">
              — {selectedLetter} ({fontLibrary}) — hover canvas to preview, click to place
            </span>
          ) : (
            <span className="text-xs text-amber-600">
              — pick a letter in the left panel
            </span>
          )}
        </div>
      )}

      {/* Canvas — scrollable container with ctrl+wheel zoom */}
      <div
        className="flex-1 overflow-auto p-4 sm:p-6 flex items-start justify-center bg-stone-50/40 min-h-0"
        onWheel={(e) => {
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setZoom((z) => {
              const next = z - e.deltaY * 0.002;
              return Math.max(0.25, Math.min(8, +next.toFixed(2)));
            });
          }
        }}
      >
        <div
          className="border border-stone-200 rounded-lg overflow-hidden shadow-sm bg-white inline-block"
          onPointerLeave={handlePointerLeave}
        >
          {displayGrid.map((row, y) => {
            const offset = isPeyote && y % 2 === 1 ? halfCellW : 0;
            return (
              <div
                key={`row-${y}`}
                className="flex"
                style={{ marginLeft: offset }}
              >
                {row.map((code, x) => {
                  const hex = code
                    ? (findColor(brand, code, miyukiShape)?.hex ||
                      customColors.find((c) => c.code === code)?.hex ||
                      '#e0e0e0')
                    : null;
                  const isPreview = textMode && previewCells.has(`${x},${y}`);
                  return (
                    <div
                      key={`${x}-${y}`}
                      onPointerDown={(e) => handlePointerDown(x, y, e)}
                      onPointerMove={() => handlePointerMove(x, y)}
                      onPointerUp={() => handlePointerUp(x, y)}
                      className={`relative cursor-pointer touch-none ${
                        showGrid ? 'border border-r border-b border-stone-200' : ''
                      }`}
                      style={{
                        width: cellW,
                        height: cellH,
                      }}
                    >
                      {hex && (() => {
                        const rot = rotations[y]?.[x] ?? 0;
                        const isRotated = rot === 90;
                        if (isRotated) {
                          const innerW = cellH;
                          const innerH = cellW;
                          const offsetX = (cellW - innerW) / 2;
                          const offsetY = (cellH - innerH) / 2;
                          return (
                            <div
                              className="absolute"
                              style={{
                                width: innerW,
                                height: innerH,
                                left: offsetX,
                                top: offsetY,
                                backgroundColor: hex,
                                borderRadius: beadRadius,
                              }}
                            />
                          );
                        }
                        return (
                          <div
                            className="w-full h-full"
                            style={{
                              backgroundColor: hex,
                              borderRadius: beadRadius,
                            }}
                          />
                        );
                      })()}
                      {isPreview && (
                        <div
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            backgroundColor: selectedColorHex ?? '#d6d3d1',
                            opacity: 0.3,
                            borderRadius: beadRadius,
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function floodFill(
  grid: (string | null)[][],
  x: number,
  y: number,
  fill: string | null,
  w: number,
  h: number
) {
  if (y < 0 || y >= h || x < 0 || x >= w) return;
  const target = grid[y][x];
  if (target === fill) return;
  const queue: [number, number][] = [[x, y]];
  while (queue.length) {
    const [cx, cy] = queue.shift()!;
    if (cx < 0 || cx >= w || cy < 0 || cy >= h) continue;
    if (grid[cy][cx] !== target) continue;
    grid[cy][cx] = fill;
    queue.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
  }
}

function bresenham(
  x0: number,
  y0: number,
  x1: number,
  y1: number
): [number, number][] {
  const cells: [number, number][] = [];
  let dx = Math.abs(x1 - x0);
  let dy = Math.abs(y1 - y0);
  let sx = x0 < x1 ? 1 : -1;
  let sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  let x = x0;
  let y = y0;
  while (true) {
    cells.push([x, y]);
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }
  return cells;
}

function rectCells(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  mode: RectMode
): [number, number][] {
  const cells: [number, number][] = [];
  const minX = Math.min(x0, x1);
  const maxX = Math.max(x0, x1);
  const minY = Math.min(y0, y1);
  const maxY = Math.max(y0, y1);
  if (mode === 'filled') {
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        cells.push([x, y]);
      }
    }
    return cells;
  }
  for (let x = minX; x <= maxX; x++) {
    cells.push([x, minY], [x, maxY]);
  }
  for (let y = minY + 1; y < maxY; y++) {
    cells.push([minX, y], [maxX, y]);
  }
  return cells;
}

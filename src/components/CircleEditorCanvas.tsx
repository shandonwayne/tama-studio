import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { Brush, Eraser, Undo2, Redo2, ZoomIn, ZoomOut, Maximize, CircleDot } from 'lucide-react';
import type { BeadColor, Brand, MiyukiShape } from '@/beads';
import { findColor } from '@/beads';

type Tool = 'paint' | 'erase';
type PeyoteMode = 'single' | 'double';

interface RingCell {
  ring: number;
  index: number;
  angle: number;
  radius: number;
}

interface CircleEditorCanvasProps {
  grid: (string | null)[][];
  rotations: number[][];
  onRotationsChange: (r: number[][]) => void;
  width: number;
  height: number;
  brand: Brand;
  miyukiShape: MiyukiShape;
  customColors: BeadColor[];
  selectedColor: string | null;
  onGridChange: (grid: (string | null)[][]) => void;
}

const MAX_HISTORY = 60;

export function CircleEditorCanvas({
  grid,
  width,
  height,
  brand,
  miyukiShape,
  customColors,
  selectedColor,
  onGridChange,
}: CircleEditorCanvasProps) {
  const [tool, setTool] = useState<Tool>('paint');
  const [peyoteMode, setPeyoteMode] = useState<PeyoteMode>('single');
  const [isDrawing, setIsDrawing] = useState(false);
  const [hoverCell, setHoverCell] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  const historyRef = useRef<(string | null)[][][]>([]);
  const futureRef = useRef<(string | null)[][][]>([]);

  const diameter = Math.min(width, height);
  const numRings = Math.max(1, Math.ceil(diameter / 2));

  const ringData = useMemo(() => {
    const rings: { count: number; radius: number; cellPositions: RingCell[] }[] = [];
    for (let r = 0; r < numRings; r++) {
      const radius = r;
      const circumference = Math.max(1, Math.ceil(2 * Math.PI * (r + 0.5)));
      const count = peyoteMode === 'double' ? circumference : Math.max(1, Math.ceil(circumference / 2));
      const cells: RingCell[] = [];
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        cells.push({ ring: r, index: i, angle, radius });
      }
      rings.push({ count, radius, cellPositions: cells });
    }
    return rings;
  }, [numRings, peyoteMode]);

  const allCells = useMemo(() => {
    const cells: { key: string; cell: RingCell }[] = [];
    for (const ring of ringData) {
      for (const cell of ring.cellPositions) {
        cells.push({ key: `${cell.ring}-${cell.index}`, cell });
      }
    }
    return cells;
  }, [ringData]);

  const getCellCode = useCallback(
    (key: string): string | null => {
      const [r, i] = key.split('-').map(Number);
      return grid[r]?.[i] ?? null;
    },
    [grid]
  );

  const cloneGrid = useCallback(() => grid.map((row) => [...row]), [grid]);

  const snapshotBefore = useCallback(() => {
    historyRef.current.push(grid.map((row) => [...row]));
    if (historyRef.current.length > MAX_HISTORY) historyRef.current.shift();
    futureRef.current = [];
  }, [grid]);

  const undo = useCallback(() => {
    if (historyRef.current.length === 0) return;
    const prev = historyRef.current.pop()!;
    futureRef.current.push(grid.map((row) => [...row]));
    onGridChange(prev);
  }, [grid, onGridChange]);

  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return;
    const next = futureRef.current.pop()!;
    historyRef.current.push(grid.map((row) => [...row]));
    onGridChange(next);
  }, [grid, onGridChange]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      } else if (e.key === 'b') setTool('paint');
      else if (e.key === 'e') setTool('erase');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo]);

  const applyTool = useCallback(
    (key: string) => {
      const [r, i] = key.split('-').map(Number);
      if (r >= grid.length) return;
      if (i >= (grid[r]?.length ?? 0)) return;
      if (tool === 'paint') {
        if (!selectedColor) return;
        if (grid[r]?.[i] === selectedColor) return;
        const next = cloneGrid();
        next[r][i] = selectedColor;
        onGridChange(next);
      } else if (tool === 'erase') {
        if (grid[r]?.[i] === null) return;
        const next = cloneGrid();
        next[r][i] = null;
        onGridChange(next);
      }
    },
    [tool, selectedColor, grid, cloneGrid, onGridChange]
  );

  const handlePointerDown = (key: string, e: React.PointerEvent) => {
    e.preventDefault();
    snapshotBefore();
    setIsDrawing(true);
    applyTool(key);
  };

  const handlePointerMove = (key: string) => {
    setHoverCell(key);
    if (isDrawing) applyTool(key);
  };

  const handlePointerUp = () => {
    setIsDrawing(false);
  };

  useEffect(() => {
    const up = () => setIsDrawing(false);
    window.addEventListener('pointerup', up);
    return () => window.removeEventListener('pointerup', up);
  }, []);

  const canvasSize = 520;
  const center = canvasSize / 2;
  const maxRadius = numRings;
  const pixelRadius = (canvasSize / 2 - 20) / maxRadius;
  const beadSize = Math.max(8, Math.min(28, pixelRadius * 0.8 * zoom));

  const getBeadColor = (code: string | null): string | null => {
    if (!code) return null;
    return findColor(brand, code, miyukiShape)?.hex ?? customColors.find((c) => c.code === code)?.hex ?? '#e0e0e0';
  };

  const isRocailles = brand === 'miyuki' && miyukiShape === 'rocailles';
  const beadRadius = isRocailles ? '50%' : '30%';

  const tools: { id: Tool; icon: React.ReactNode; label: string; key: string }[] = [
    { id: 'paint', icon: <Brush className="w-4 h-4" />, label: 'Paint', key: 'B' },
    { id: 'erase', icon: <Eraser className="w-4 h-4" />, label: 'Erase', key: 'E' },
  ];

  const canUndo = historyRef.current.length > 0;
  const canRedo = futureRef.current.length > 0;

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2.5 border-b border-stone-100 flex-wrap">
        {tools.map((t) => (
          <button
            key={t.id}
            onClick={() => setTool(t.id)}
            className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium transition ${
              tool === t.id ? 'bg-amber-500 text-white shadow-sm' : 'text-stone-600 hover:bg-stone-100'
            }`}
            title={`${t.label} (${t.key})`}
          >
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}

        <div className="w-px h-6 bg-stone-200 mx-1" />

        {/* Peyote mode toggle: single vs double bead */}
        <div className="flex items-center gap-1">
          <CircleDot className="w-3.5 h-3.5 text-stone-400" />
          {(['single', 'double'] as PeyoteMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setPeyoteMode(mode)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                peyoteMode === mode ? 'bg-amber-100 text-amber-700' : 'text-stone-500 hover:bg-stone-100'
              }`}
              title={mode === 'single' ? 'Single-bead peyote: beads spaced around each ring' : 'Double-bead peyote: denser bead placement around each ring'}
            >
              {mode === 'single' ? 'Single' : 'Double'}
            </button>
          ))}
        </div>

        <div className="flex-1" />

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

      {/* Mode banner */}
      <div className="px-3 py-2 border-b border-amber-200 bg-amber-50/60 flex items-center gap-2">
        <CircleDot className="w-3.5 h-3.5 text-amber-600" />
        <span className="text-xs font-semibold text-amber-700">Circle Ring Design</span>
        <span className="text-xs text-amber-600">
          — {peyoteMode === 'single' ? 'Single-bead' : 'Double-bead'} peyote — paint beads around concentric rings
        </span>
      </div>

      {/* Canvas */}
      <div
        className="flex-1 overflow-auto p-4 sm:p-6 flex items-center justify-center bg-stone-50/40 min-h-0"
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
          className="relative"
          style={{
            width: canvasSize * zoom,
            height: canvasSize * zoom,
          }}
          onPointerLeave={() => setHoverCell(null)}
        >
          <svg
            width={canvasSize * zoom}
            height={canvasSize * zoom}
            viewBox={`0 0 ${canvasSize} ${canvasSize}`}
            className="absolute inset-0"
          >
            {/* Ring guide circles */}
            {ringData.map((ring, r) => {
              const ringPixelRadius = (r + 0.5) * pixelRadius;
              return (
                <circle
                  key={`guide-${r}`}
                  cx={center}
                  cy={center}
                  r={ringPixelRadius}
                  fill="none"
                  stroke="rgba(0,0,0,0.06)"
                  strokeWidth={0.5}
                />
              );
            })}
          </svg>

          {/* Bead cells */}
          {allCells.map(({ key, cell }) => {
            const ringPixelRadius = (cell.radius + 0.5) * pixelRadius;
            const x = center + Math.cos(cell.angle) * ringPixelRadius;
            const y = center + Math.sin(cell.angle) * ringPixelRadius;
            const code = getCellCode(key);
            const hex = getBeadColor(code);
            const isHovered = hoverCell === key;
            const beadW = beadSize;
            const beadH = isRocailles ? beadSize * 1.2 : beadSize * 0.75;

            return (
              <div
                key={key}
                onPointerDown={(e) => handlePointerDown(key, e)}
                onPointerMove={() => handlePointerMove(key)}
                onPointerUp={handlePointerUp}
                className={`absolute cursor-pointer touch-none flex items-center justify-center transition-transform ${
                  isHovered ? 'z-10 scale-110' : 'z-0'
                }`}
                style={{
                  width: beadW,
                  height: beadH,
                  left: x * zoom - beadW / 2,
                  top: y * zoom - beadH / 2,
                }}
              >
                <div
                  className="w-full h-full border border-stone-200/40"
                  style={{
                    backgroundColor: hex ?? 'transparent',
                    borderRadius: beadRadius,
                    opacity: hex ? 1 : isHovered ? 0.4 : 0.15,
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

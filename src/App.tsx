import { useCallback, useEffect, useState } from 'react';
import {
  Save,
  Download,
  FolderOpen,
  Home,
  Grid2x2,
  Sparkles,
  Type,
  Droplet,
  PanelRightClose,
  PanelRightOpen,
  ChevronDown,
  Repeat,
  Image as ImageIcon,
  FileJson,
  Upload,
} from 'lucide-react';
import { StartScreen } from '@/components/StartScreen';
import { EditorCanvas } from '@/components/EditorCanvas';
import { PalettePanel } from '@/components/PalettePanel';
import { BeadCountPanel } from '@/components/BeadCountPanel';
import { GalleryPanel } from '@/components/GalleryPanel';
import { TextPanel } from '@/components/TextPanel';
import logoUrl from '/logo.svg';
import type { FontLibraryName } from '@/lib/oldEnglishFont';
import { FONT_LIBRARIES } from '@/lib/oldEnglishFont';
import { supabase, BeadProject } from '@/lib/supabase';
import { useExportPNG, downloadProjectFile, parseProjectFile } from '@/lib/export';
import { BeadColor, Brand, MiyukiShape, ProjectType, StitchType, findColor, convertGridColors } from '@/beads';

interface ProjectConfig {
  projectType: ProjectType;
  brand: Brand;
  miyukiShape: MiyukiShape;
  stitch: StitchType;
  width: number;
  height: number;
  name: string;
}

function emptyGrid(w: number, h: number): (string | null)[][] {
  return Array.from({ length: h }, () => Array<string | null>(w).fill(null));
}

function emptyRotations(w: number, h: number): number[][] {
  return Array.from({ length: h }, () => Array<number>(w).fill(0));
}

export default function App() {
  const [config, setConfig] = useState<ProjectConfig | null>(null);
  const [grid, setGrid] = useState<(string | null)[][]>([]);
  const [rotations, setRotations] = useState<number[][]>([]);
  const [customColors, setCustomColors] = useState<BeadColor[]>([]);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [leftTab, setLeftTab] = useState<'colors' | 'text'>('colors');
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [fontLibrary, setFontLibrary] = useState<FontLibraryName>('Gothic');
  const [saveState, setSaveState] = useState<
    'idle' | 'saving' | 'saved' | 'error'
  >('idle');
  const [toast, setToast] = useState<string | null>(null);
  const [rightRailOpen, setRightRailOpen] = useState(true);
  const [brandMenuOpen, setBrandMenuOpen] = useState(false);
  const [saveMenuOpen, setSaveMenuOpen] = useState(false);
  const [converting, setConverting] = useState(false);

  const exportPNG = useExportPNG();

  const miyukiShape = config?.miyukiShape ?? 'delica';

  // Pick a sensible default selected color on start or brand change
  useEffect(() => {
    if (!config) return;
    if (config.brand === 'miyuki')
      setSelectedColor(config.miyukiShape === 'rocailles' ? 'MR-2002' : 'DB0010');
    else if (config.brand === 'toho') setSelectedColor('TR-11-401');
    else if (customColors.length > 0) setSelectedColor(customColors[0].code);
  }, [config?.brand, config?.miyukiShape]); // eslint-disable-line react-hooks/exhaustive-deps

  // Eyedropper: listen for picks from the canvas
  useEffect(() => {
    const handler = (e: Event) => {
      setSelectedColor((e as CustomEvent<string>).detail);
      setToast('Color picked');
      setTimeout(() => setToast(null), 1200);
    };
    window.addEventListener('beadpick', handler);
    return () => window.removeEventListener('beadpick', handler);
  }, []);

  const handleStart = (c: ProjectConfig) => {
    setConfig(c);
    setGrid(emptyGrid(c.width, c.height));
    setRotations(emptyRotations(c.width, c.height));
    setProjectId(null);
  };

  const handleGrowRows = (count: number) => {
    setGrid((prev) => {
      const w = prev[0]?.length ?? config?.width ?? 0;
      const extra = Array.from({ length: count }, () =>
        Array<string | null>(w).fill(null)
      );
      const next = [...prev, ...extra];
      if (config) setConfig({ ...config, height: next.length });
      return next;
    });
    setRotations((prev) => {
      const w = prev[0]?.length ?? config?.width ?? 0;
      const extra = Array.from({ length: count }, () => Array<number>(w).fill(0));
      return [...prev, ...extra];
    });
  };

  const handleToggleOrientation = useCallback(() => {
    setGrid((prev) => {
      const h = prev.length;
      const w = prev[0]?.length ?? 0;
      if (w === h) return prev;
      // Transpose so landscape <-> portrait
      const transposed: (string | null)[][] = Array.from({ length: w }, () =>
        Array<string | null>(h).fill(null)
      );
      for (let r = 0; r < h; r++) {
        for (let c = 0; c < w; c++) {
          transposed[c][r] = prev[r][c];
        }
      }
      return transposed;
    });
    setRotations((prev) => {
      const h = prev.length;
      const w = prev[0]?.length ?? 0;
      if (w === h) return prev;
      const transposed: number[][] = Array.from({ length: w }, () =>
        Array<number>(h).fill(0)
      );
      for (let r = 0; r < h; r++) {
        for (let c = 0; c < w; c++) {
          transposed[c][r] = prev[r]?.[c] ?? 0;
        }
      }
      return transposed;
    });
    setConfig((prev) =>
      prev ? { ...prev, width: prev.height, height: prev.width } : prev
    );
  }, []);

  const handleLoad = (p: BeadProject) => {
    const shape: MiyukiShape =
      p.miyuki_shape === 'rocailles' ? 'rocailles' : 'delica';
    setConfig({
      projectType: p.project_type,
      brand: p.brand,
      miyukiShape: shape,
      stitch: p.stitch === 'peyote' ? 'peyote' : 'brick',
      width: p.width,
      height: p.height,
      name: p.name,
    });
    setGrid(
      Array.isArray(p.grid_data) ? (p.grid_data as (string | null)[][]) : emptyGrid(p.width, p.height)
    );
    const loadedRot = Array.isArray(p.rotations_data) ? (p.rotations_data as number[][]) : null;
    setRotations(
      loadedRot && loadedRot.length === p.height && loadedRot[0]?.length === p.width
        ? loadedRot
        : emptyRotations(p.width, p.height)
    );
    setProjectId(p.id);
    // For 'other' brand projects, restore any custom colors embedded in the grid
    if (p.brand === 'other') {
      const codes = new Set<string>();
      (p.grid_data as (string | null)[][]).forEach((row) =>
        row.forEach((c) => {
          if (c && c.startsWith('C-')) codes.add(c);
        })
      );
      // We can't reconstruct hex from code alone; keep current custom colors.
    }
  };

  const handleSave = useCallback(async () => {
    if (!config || !grid) return;
    setSaveState('saving');
    const payload = {
      name: config.name,
      project_type: config.projectType,
      brand: config.brand,
      miyuki_shape: config.brand === 'miyuki' ? config.miyukiShape : null,
      stitch: config.stitch,
      width: config.width,
      height: config.height,
      grid_data: grid as unknown as never,
      rotations_data: rotations as unknown as never,
      updated_at: new Date().toISOString(),
    };
    try {
      if (projectId) {
        const { error } = await supabase
          .from('bead_projects')
          .update(payload)
          .eq('id', projectId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('bead_projects')
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        setProjectId(data.id);
      }
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 1800);
    } catch (err) {
      setSaveState('error');
      setToast('Could not save project');
      setTimeout(() => {
        setSaveState('idle');
        setToast(null);
      }, 2500);
    }
  }, [config, grid, rotations, projectId]);

  const handleExportPNG = () => {
    if (!config || !grid) return;
    setSaveMenuOpen(false);
    exportPNG(grid, { brand: config.brand, miyukiShape, customColors, rotations }, config.name);
  };

  const handleExportProject = () => {
    if (!config || !grid) return;
    setSaveMenuOpen(false);
    downloadProjectFile(
      config.name,
      config.projectType,
      config.brand,
      config.brand === 'miyuki' ? config.miyukiShape : null,
      config.stitch,
      config.width,
      config.height,
      grid,
      rotations,
      customColors,
    );
  };

  const handleImportProject = (text: string) => {
    try {
      const f = parseProjectFile(text);
      const brand = (['miyuki', 'toho', 'other'].includes(f.brand) ? f.brand : 'other') as Brand;
      const shape: MiyukiShape = f.miyukiShape === 'rocailles' ? 'rocailles' : 'delica';
      const stitch: StitchType = f.stitch === 'peyote' ? 'peyote' : 'brick';
      const projectType = (f.projectType === 'loom' || f.projectType === 'freehand' ? f.projectType : 'freehand') as ProjectType;
      setConfig({
        projectType,
        brand,
        miyukiShape: shape,
        stitch,
        width: f.width,
        height: f.height,
        name: f.name,
      });
      setGrid(f.grid);
      setRotations(f.rotations ?? emptyRotations(f.width, f.height));
      setCustomColors(f.customColors ?? []);
      setProjectId(null);
      setToast('Project imported');
      setTimeout(() => setToast(null), 2000);
    } catch {
      setToast('Could not read this file');
      setTimeout(() => setToast(null), 2500);
    }
  };

  const handleConvertBrand = (target: Brand, targetShape?: MiyukiShape) => {
    if (!config) return;
    setBrandMenuOpen(false);
    setConverting(true);
    setToast(`Converting to ${target === 'toho' ? 'Toho' : target === 'miyuki' ? `Miyuki ${targetShape === 'rocailles' ? 'Rocailles' : 'Delica'}` : 'Custom'}…`);
    setTimeout(() => {
      const shape = targetShape ?? (target === 'miyuki' ? 'delica' : 'delica');
      const newGrid = convertGridColors(
        grid,
        config.brand,
        config.miyukiShape,
        target,
        shape,
        customColors
      );
      setGrid(newGrid);
      setConfig({ ...config, brand: target, miyukiShape: shape });
      setConverting(false);
      setToast('Design converted — colors matched to closest available beads');
      setTimeout(() => setToast(null), 2500);
    }, 400);
  };

  if (!config) {
    return <StartScreen onStart={handleStart} />;
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Top bar */}
      <header className="bg-white border-b border-stone-100 sticky top-0 z-30">
        <div className="px-3 sm:px-5 py-2.5 flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => {
              setConfig(null);
              setProjectId(null);
            }}
            className="flex items-center gap-2 text-stone-700 hover:text-amber-600 transition flex-shrink-0"
          >
            <img src={logoUrl} alt="Tama Studio" className="h-7 w-auto" />
          </button>

          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={config.name}
              onChange={(e) =>
                setConfig({ ...config, name: e.target.value })
              }
              className="w-full max-w-xs px-3 py-1.5 text-sm font-medium text-stone-700 bg-stone-50 rounded-lg border border-transparent hover:border-stone-200 focus:border-amber-300 focus:ring-2 focus:ring-amber-100 outline-none transition truncate"
            />
          </div>

          {/* Meta badges */}
          <div className="hidden md:flex items-center gap-2 mr-1">
            <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-stone-100 text-stone-600">
              {config.projectType === 'loom' ? (
                <Grid2x2 className="w-3 h-3" />
              ) : (
                <Sparkles className="w-3 h-3" />
              )}
              {config.projectType === 'loom' ? 'Loom' : 'Freehand'}
            </span>
            {/* Brand badge — click to convert */}
            <div className="relative">
              <button
                onClick={() => setBrandMenuOpen(!brandMenuOpen)}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-stone-100 text-stone-600 hover:bg-stone-200 transition"
              >
                {config.brand === 'miyuki'
                  ? `Miyuki ${config.miyukiShape === 'rocailles' ? 'Rocailles' : 'Delica'}`
                  : config.brand === 'toho'
                  ? 'Toho'
                  : 'Custom'}
                <ChevronDown className="w-3 h-3" />
              </button>
              {brandMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setBrandMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 z-50 w-56 bg-white rounded-xl border border-stone-200 shadow-lg overflow-hidden">
                    <div className="px-3 py-2 border-b border-stone-100 flex items-center gap-1.5">
                      <Repeat className="w-3.5 h-3.5 text-amber-600" />
                      <span className="text-xs font-semibold text-stone-700">Convert design to…</span>
                    </div>
                    <button
                      onClick={() => handleConvertBrand('miyuki', 'delica')}
                      disabled={config.brand === 'miyuki' && config.miyukiShape === 'delica'}
                      className="w-full flex items-center justify-between px-3 py-2.5 text-left text-sm text-stone-700 hover:bg-amber-50 disabled:opacity-40 disabled:hover:bg-transparent transition"
                    >
                      Miyuki Delica
                      {config.brand === 'miyuki' && config.miyukiShape === 'delica' && (
                        <span className="text-[10px] text-stone-400">current</span>
                      )}
                    </button>
                    <button
                      onClick={() => handleConvertBrand('miyuki', 'rocailles')}
                      disabled={config.brand === 'miyuki' && config.miyukiShape === 'rocailles'}
                      className="w-full flex items-center justify-between px-3 py-2.5 text-left text-sm text-stone-700 hover:bg-amber-50 disabled:opacity-40 disabled:hover:bg-transparent transition"
                    >
                      Miyuki Rocailles
                      {config.brand === 'miyuki' && config.miyukiShape === 'rocailles' && (
                        <span className="text-[10px] text-stone-400">current</span>
                      )}
                    </button>
                    <button
                      disabled
                      className="w-full flex items-center justify-between px-3 py-2.5 text-left text-sm text-stone-400 cursor-not-allowed transition"
                    >
                      Toho Treasure
                      <span className="text-[10px] font-medium text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded">Coming soon</span>
                    </button>
                    <div className="px-3 py-2 border-t border-stone-100 text-[10px] text-stone-400">
                      Colors matched to closest available bead
                    </div>
                  </div>
                </>
              )}
            </div>
            <span className="text-xs px-2 py-1 rounded-md bg-stone-100 text-stone-600">
              {config.width}×{config.height}
            </span>
          </div>

          {/* Right rail toggle */}
          <button
            onClick={() => setRightRailOpen(!rightRailOpen)}
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm font-medium text-stone-600 hover:bg-stone-100 transition"
            title={rightRailOpen ? 'Hide bead list' : 'Show bead list'}
          >
            {rightRailOpen ? (
              <PanelRightClose className="w-4 h-4" />
            ) : (
              <PanelRightOpen className="w-4 h-4" />
            )}
          </button>

          {/* Actions */}
          <button
            onClick={() => setGalleryOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-stone-600 hover:bg-stone-100 transition"
          >
            <FolderOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Open</span>
          </button>
          <div className="relative">
            <button
              onClick={() => setSaveMenuOpen(!saveMenuOpen)}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition shadow-sm ${
                saveState === 'saved'
                  ? 'bg-green-500 text-white'
                  : saveState === 'saving'
                  ? 'bg-amber-400 text-white'
                  : saveState === 'error'
                  ? 'bg-red-500 text-white'
                  : 'bg-amber-500 text-white hover:bg-amber-600'
              }`}
            >
              <Save className="w-4 h-4" />
              <span className="hidden sm:inline">
                {saveState === 'saving'
                  ? 'Saving…'
                  : saveState === 'saved'
                  ? 'Saved!'
                  : saveState === 'error'
                  ? 'Error'
                  : 'Save'}
              </span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {saveMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setSaveMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1 z-50 w-56 bg-white rounded-xl border border-stone-200 shadow-lg overflow-hidden">
                  <button
                    onClick={handleSave}
                    disabled={saveState === 'saving'}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm text-stone-700 hover:bg-amber-50 disabled:opacity-50 transition"
                  >
                    <Save className="w-4 h-4 text-amber-600" />
                    Save to gallery
                  </button>
                  <div className="border-t border-stone-100" />
                  <button
                    onClick={handleExportPNG}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm text-stone-700 hover:bg-amber-50 transition"
                  >
                    <ImageIcon className="w-4 h-4 text-amber-600" />
                    Download as PNG
                  </button>
                  <button
                    onClick={handleExportProject}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm text-stone-700 hover:bg-amber-50 transition"
                  >
                    <FileJson className="w-4 h-4 text-amber-600" />
                    Download project file
                  </button>
                  <div className="border-t border-stone-100" />
                  <label className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm text-stone-700 hover:bg-amber-50 transition cursor-pointer">
                    <Upload className="w-4 h-4 text-amber-600" />
                    Import project file
                    <input
                      type="file"
                      accept=".json,application/json"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = () => {
                          handleImportProject(String(reader.result));
                          setSaveMenuOpen(false);
                        };
                        reader.readAsText(file);
                        e.target.value = '';
                      }}
                    />
                  </label>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main editor layout */}
      <main className="flex-1 p-3 sm:px-4 sm:pb-4 overflow-hidden">
        <div className={`grid grid-cols-1 ${rightRailOpen ? 'lg:grid-cols-[240px_1fr_240px]' : 'lg:grid-cols-[240px_1fr]'} gap-3 sm:gap-4 h-[calc(100vh-58px)] max-w-full`}>
          {/* Left panel: Colors / Text tabs */}
          <div className="h-64 lg:h-full order-2 lg:order-1 flex flex-col min-h-0 min-w-0 bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
            {/* Tab strip */}
            <div className="flex gap-0.5 p-1.5 border-b border-stone-100 bg-stone-50/60 flex-shrink-0">
              {([
                { id: 'colors' as const, icon: <Droplet className="w-4 h-4" />, label: 'Colors' },
                { id: 'text'   as const, icon: <Type    className="w-4 h-4" />, label: 'Text'   },
              ]).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setLeftTab(t.id)}
                  title={t.label}
                  className={`flex items-center gap-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    leftTab === t.id
                      ? 'bg-amber-500 text-white shadow-sm px-3 py-2'
                      : 'text-stone-500 hover:bg-stone-100 px-2.5 py-2'
                  }`}
                >
                  {t.icon}
                  {leftTab === t.id && <span>{t.label}</span>}
                </button>
              ))}
            </div>
            {/* Tab content */}
            <div className="flex-1 min-w-0 min-h-0 overflow-hidden">
              {leftTab === 'colors' ? (
                <PalettePanel
                  brand={config.brand}
                  miyukiShape={miyukiShape}
                  selectedColor={selectedColor}
                  onSelectColor={setSelectedColor}
                  customColors={customColors}
                  onAddCustomColor={(c) => {
                    setCustomColors((prev) => [...prev, c]);
                    setSelectedColor(c.code);
                  }}
                />
              ) : (
                <TextPanel
                  selectedLetter={selectedLetter}
                  onSelectLetter={setSelectedLetter}
                  selectedColor={selectedColor}
                  selectedColorHex={
                    findColor(config.brand, selectedColor ?? '', miyukiShape)?.hex
                    ?? customColors.find((c) => c.code === selectedColor)?.hex
                    ?? null
                  }
                  fontLibrary={fontLibrary}
                  onFontLibrary={setFontLibrary}
                />
              )}
            </div>
          </div>
          {/* Canvas */}
          <div className="order-1 lg:order-2 min-h-[360px] min-w-0 overflow-hidden">
            <EditorCanvas
              grid={grid}
              rotations={rotations}
              onRotationsChange={setRotations}
              width={config.width}
              height={config.height}
              brand={config.brand}
              miyukiShape={miyukiShape}
              projectType={config.projectType}
              stitch={config.stitch}
              customColors={customColors}
              selectedColor={selectedColor}
              onGridChange={setGrid}
              onToggleOrientation={handleToggleOrientation}
              onGrowRows={handleGrowRows}
              textMode={leftTab === 'text'}
              selectedLetter={selectedLetter}
              fontLibrary={fontLibrary}
              selectedColorHex={
                findColor(config.brand, selectedColor ?? '', miyukiShape)?.hex
                ?? customColors.find((c) => c.code === selectedColor)?.hex
                ?? null
              }
            />
          </div>
          {/* Bead list — hideable right rail */}
          {rightRailOpen && (
            <div className="h-56 lg:h-full order-3 min-h-0 min-w-0">
              <BeadCountPanel
                grid={grid}
                brand={config.brand}
                miyukiShape={miyukiShape}
                customColors={customColors}
              />
            </div>
          )}
        </div>
      </main>

      {/* Gallery modal */}
      <GalleryPanel
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        currentCustomColors={customColors}
        onLoad={handleLoad}
        onDelete={(id) => {
          if (projectId === id) setProjectId(null);
        }}
      />

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg bg-stone-800 text-white text-sm shadow-lg animate-popin">
          {toast}
        </div>
      )}
    </div>
  );
}

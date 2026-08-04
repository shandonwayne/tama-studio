import { useEffect, useState } from 'react';
import { FolderOpen, Trash2, Clock, X } from 'lucide-react';
import { supabase, BeadProject } from '@/lib/supabase';
import { useThumbnail } from '@/lib/export';
import type { BeadColor, Brand, MiyukiShape } from '@/beads';

interface GalleryPanelProps {
  open: boolean;
  onClose: () => void;
  currentCustomColors: BeadColor[];
  onLoad: (project: BeadProject) => void;
  onDelete: (id: string) => void;
}

export function GalleryPanel({
  open,
  onClose,
  currentCustomColors,
  onLoad,
  onDelete,
}: GalleryPanelProps) {
  const [projects, setProjects] = useState<BeadProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    supabase
      .from('bead_projects')
      .select('*')
      .order('updated_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          setError(error.message);
        } else {
          setProjects((data as BeadProject[]) ?? []);
        }
        setLoading(false);
      });
  }, [open]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('bead_projects').delete().eq('id', id);
    if (error) {
      setError(error.message);
      return;
    }
    setProjects((prev) => prev.filter((p) => p.id !== id));
    onDelete(id);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm animate-fadein">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-popin">
        <div className="flex items-center justify-between p-5 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-amber-600" />
            <h2 className="font-semibold text-stone-800">My Projects</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-stone-400">
              <div className="w-8 h-8 border-2 border-amber-200 border-t-amber-500 rounded-full animate-spin mb-3" />
              <p className="text-sm">Loading projects…</p>
            </div>
          ) : error ? (
            <p className="text-center text-sm text-red-500 py-12">{error}</p>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-stone-400">
              <FolderOpen className="w-10 h-10 mb-3 opacity-40" />
              <p className="text-sm">No saved projects yet.</p>
              <p className="text-xs mt-1">
                Save your current design to see it here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {projects.map((p) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  customColors={currentCustomColors}
                  onLoad={() => {
                    onLoad(p);
                    onClose();
                  }}
                  onDelete={() => handleDelete(p.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProjectCard({
  project,
  customColors,
  onLoad,
  onDelete,
}: {
  project: BeadProject;
  customColors: BeadColor[];
  onLoad: () => void;
  onDelete: () => void;
}) {
  const thumb = useThumbnail(
    project.grid_data,
    project.brand as Brand,
    (project.miyuki_shape as MiyukiShape | null) ?? null,
    customColors,
    (Array.isArray(project.rotations_data) ? (project.rotations_data as number[][]) : [])
  );
  const brandLabel =
    project.brand === 'miyuki'
      ? `Miyuki ${project.miyuki_shape === 'rocailles' ? 'Rocailles' : 'Delica'}`
      : project.brand === 'toho'
      ? 'Toho'
      : 'Custom';
  const typeLabel = project.project_type === 'loom' ? 'Loom' : 'Freehand';

  return (
    <div className="group rounded-2xl border border-stone-100 overflow-hidden hover:border-amber-300 hover:shadow-lg transition bg-white">
      <button
        onClick={onLoad}
        className="block w-full aspect-square bg-stone-50 overflow-hidden"
      >
        {thumb ? (
          <img
            src={thumb}
            alt={project.name}
            className="w-full h-full object-contain group-hover:scale-105 transition"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-stone-300">
            <FolderOpen className="w-8 h-8" />
          </div>
        )}
      </button>
      <div className="p-3">
        <p className="text-sm font-semibold text-stone-800 truncate">
          {project.name}
        </p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">
            {typeLabel}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 font-medium">
            {brandLabel}
          </span>
          <span className="text-[10px] text-stone-400">
            {project.width}×{project.height}
          </span>
        </div>
        <div className="flex items-center justify-between mt-2.5">
          <span className="flex items-center gap-1 text-[10px] text-stone-400">
            <Clock className="w-3 h-3" />
            {new Date(project.updated_at).toLocaleDateString()}
          </span>
          <button
            onClick={onDelete}
            className="p-1.5 rounded text-stone-300 hover:text-red-500 hover:bg-red-50 transition opacity-0 group-hover:opacity-100"
            title="Delete project"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

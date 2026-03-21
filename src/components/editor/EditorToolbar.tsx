import {
  HiOutlineArrowLeft,
  HiOutlineSave,
  HiOutlineEye,
  HiOutlineRefresh,
} from "react-icons/hi";
import { Link } from "react-router-dom";
import type { Orientation } from "@shared/types/firestore-schema";

interface EditorToolbarProps {
  name: string;
  orientation: Orientation;
  resolution: { width: number; height: number };
  isDirty: boolean;
  saving: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onNameChange: (name: string) => void;
  onOrientationChange: (orientation: Orientation) => void;
  onSave: () => void;
  onPreview: () => void;
  onUndo: () => void;
  onRedo: () => void;
}

export default function EditorToolbar({
  name,
  orientation,
  resolution,
  isDirty,
  saving,
  canUndo,
  canRedo,
  onNameChange,
  onOrientationChange,
  onSave,
  onPreview,
  onUndo,
  onRedo,
}: EditorToolbarProps) {
  return (
    <div className="h-14 bg-white border-b border-slate-200 flex items-center px-4 gap-3">
      {/* Back */}
      <Link
        to="/templates"
        className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
      >
        <HiOutlineArrowLeft className="w-5 h-5" />
      </Link>

      {/* Name */}
      <input
        type="text"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        className="text-sm font-semibold text-slate-900 bg-transparent border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 max-w-xs"
      />

      {isDirty && <span className="w-2 h-2 rounded-full bg-amber-400" title="Unsaved changes" />}

      <div className="flex-1" />

      {/* Undo/Redo */}
      <div className="flex items-center gap-1 mr-2">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="p-1.5 text-slate-400 hover:text-slate-600 disabled:opacity-30 rounded"
          title="Undo"
        >
          <HiOutlineRefresh className="w-4 h-4 -scale-x-100" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="p-1.5 text-slate-400 hover:text-slate-600 disabled:opacity-30 rounded"
          title="Redo"
        >
          <HiOutlineRefresh className="w-4 h-4" />
        </button>
      </div>

      {/* Orientation */}
      <select
        value={orientation}
        onChange={(e) => onOrientationChange(e.target.value as Orientation)}
        className="px-2 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
      >
        <option value="landscape">Landscape</option>
        <option value="portrait">Portrait</option>
      </select>

      {/* Resolution */}
      <span className="text-xs text-slate-400">
        {resolution.width}x{resolution.height}
      </span>

      {/* Preview */}
      <button
        onClick={onPreview}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
      >
        <HiOutlineEye className="w-4 h-4" />
        Preview
      </button>

      {/* Save */}
      <button
        onClick={onSave}
        disabled={saving}
        className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        <HiOutlineSave className="w-4 h-4" />
        {saving ? "Saving..." : "Save"}
      </button>
    </div>
  );
}

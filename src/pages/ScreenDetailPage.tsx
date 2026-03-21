import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  HiOutlineArrowLeft,
  HiOutlineDesktopComputer,
  HiOutlineDeviceMobile,
  HiOutlineLocationMarker,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineRefresh,
  HiOutlineClock,
  HiOutlineTag,
  HiOutlineX,
  HiOutlineCheck,
  HiOutlineInformationCircle,
} from "react-icons/hi";
import { formatDistanceToNow, format } from "date-fns";
import { Timestamp } from "firebase/firestore";
import Badge from "../components/common/Badge";
import LoadingSpinner from "../components/common/LoadingSpinner";
import ConfirmDialog from "../components/common/ConfirmDialog";
import { useScreen, useScreenActions } from "../hooks/useScreens";
import { usePlaylists } from "../hooks/usePlaylists";
import type { Orientation, Screen } from "@shared/types/firestore-schema";

const ORIENTATION_OPTIONS: { value: Orientation; label: string }[] = [
  { value: "landscape", label: "Landscape" },
  { value: "portrait", label: "Portrait" },
  { value: "landscape-flipped", label: "Landscape (Flipped)" },
  { value: "portrait-flipped", label: "Portrait (Flipped)" },
];

function formatTimestamp(ts: Timestamp | null | undefined): string {
  if (!ts) return "Never";
  try {
    return format(ts.toDate(), "MMM d, yyyy h:mm a");
  } catch {
    return "Unknown";
  }
}

function formatHeartbeat(ts: Timestamp | null | undefined): string {
  if (!ts) return "Never";
  try {
    return formatDistanceToNow(ts.toDate(), { addSuffix: true });
  } catch {
    return "Unknown";
  }
}

// ============================================
// Edit Screen Modal
// ============================================
function EditScreenModal({
  screen,
  open,
  onClose,
  onSave,
}: {
  screen: Screen;
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<Screen>) => Promise<void>;
}) {
  const [form, setForm] = useState({
    name: screen.name,
    location: screen.location || "",
    orientation: screen.orientation,
    tags: screen.tags?.join(", ") || "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        name: screen.name,
        location: screen.location || "",
        orientation: screen.orientation,
        tags: screen.tags?.join(", ") || "",
      });
    }
  }, [open, screen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await onSave({
        name: form.name.trim(),
        location: form.location.trim(),
        orientation: form.orientation,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
      onClose();
    } catch (err) {
      console.error("Failed to update screen:", err);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">
            Edit Screen
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <HiOutlineX className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Screen Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Location
            </label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Orientation
            </label>
            <select
              value={form.orientation}
              onChange={(e) =>
                setForm({
                  ...form,
                  orientation: e.target.value as Orientation,
                })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              {ORIENTATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Tags
            </label>
            <input
              type="text"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="lobby, entrance, floor-1"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-slate-400 mt-1">
              Separate multiple tags with commas
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !form.name.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <HiOutlineCheck className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================
// Screen Detail Page
// ============================================
export default function ScreenDetailPage() {
  const { screenId } = useParams<{ screenId: string }>();
  const navigate = useNavigate();
  const { screen, loading } = useScreen(screenId);
  const { playlists } = usePlaylists();
  const { updateScreen, deleteScreen, assignPlaylist, sendCommand } =
    useScreenActions();

  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [assigningPlaylist, setAssigningPlaylist] = useState(false);

  const playlistMap = useMemo(() => {
    const map = new Map<string, string>();
    playlists.forEach((p) => map.set(p.id, p.name));
    return map;
  }, [playlists]);

  const handleDelete = async () => {
    if (!screenId) return;
    try {
      await deleteScreen(screenId);
      navigate("/screens");
    } catch (err) {
      console.error("Failed to delete screen:", err);
    }
  };

  const handleAssignPlaylist = async (playlistId: string) => {
    if (!screenId) return;
    setAssigningPlaylist(true);
    try {
      await assignPlaylist(screenId, playlistId || null);
    } catch (err) {
      console.error("Failed to assign playlist:", err);
    } finally {
      setAssigningPlaylist(false);
    }
  };

  const handleCommand = async (type: string) => {
    if (!screenId) return;
    try {
      await sendCommand(screenId, { type });
    } catch (err) {
      console.error("Failed to send command:", err);
    }
  };

  const handleSaveEdit = async (data: Partial<Screen>) => {
    if (!screenId) return;
    await updateScreen(screenId, data);
  };

  if (loading) {
    return (
      <div>
        <div className="mb-6">
          <Link
            to="/screens"
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
          >
            <HiOutlineArrowLeft className="w-4 h-4" />
            Back to Screens
          </Link>
        </div>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!screen) {
    return (
      <div>
        <div className="mb-6">
          <Link
            to="/screens"
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
          >
            <HiOutlineArrowLeft className="w-4 h-4" />
            Back to Screens
          </Link>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
          <p className="text-slate-500">Screen not found</p>
        </div>
      </div>
    );
  }

  const isOnline = screen.status === "online";
  const isPortrait =
    screen.orientation === "portrait" ||
    screen.orientation === "portrait-flipped";

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link
          to="/screens"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <HiOutlineArrowLeft className="w-4 h-4" />
          Back to Screens
        </Link>
      </div>

      {/* Header */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            {/* Screen Icon */}
            <div
              className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                isOnline
                  ? "bg-green-50 text-green-600"
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              {isPortrait ? (
                <HiOutlineDeviceMobile className="w-7 h-7" />
              ) : (
                <HiOutlineDesktopComputer className="w-7 h-7" />
              )}
            </div>

            {/* Info */}
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-slate-900">
                  {screen.name}
                </h1>
                <Badge variant={isOnline ? "online" : "offline"} dot>
                  {isOnline ? "Online" : "Offline"}
                </Badge>
                {!screen.isPaired && (
                  <Badge variant="warning">Not Paired</Badge>
                )}
              </div>
              {screen.location && (
                <div className="flex items-center gap-1.5 mt-1 text-sm text-slate-500">
                  <HiOutlineLocationMarker className="w-4 h-4" />
                  {screen.location}
                </div>
              )}
              <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                <span className="capitalize">{screen.orientation}</span>
                <span>
                  {screen.resolution.width}x{screen.resolution.height}
                </span>
                <span className="flex items-center gap-1">
                  <HiOutlineClock className="w-3.5 h-3.5" />
                  Last seen {formatHeartbeat(screen.lastHeartbeat)}
                </span>
              </div>
              {/* Tags */}
              {screen.tags && screen.tags.length > 0 && (
                <div className="flex items-center gap-1.5 mt-2">
                  <HiOutlineTag className="w-3.5 h-3.5 text-slate-400" />
                  {screen.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs font-medium rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEditModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <HiOutlinePencil className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
            >
              <HiOutlineTrash className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Assign Playlist */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">
              Assigned Playlist
            </h2>
            <div className="flex items-center gap-3">
              <select
                value={screen.currentPlaylistId || ""}
                onChange={(e) => handleAssignPlaylist(e.target.value)}
                disabled={assigningPlaylist}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              >
                <option value="">No playlist assigned</option>
                {playlists.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              {assigningPlaylist && (
                <div className="w-5 h-5 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin" />
              )}
            </div>
            {screen.currentPlaylistId && (
              <p className="text-xs text-slate-400 mt-2">
                Currently playing:{" "}
                <span className="text-slate-600 font-medium">
                  {playlistMap.get(screen.currentPlaylistId) || "Unknown"}
                </span>
              </p>
            )}
          </div>

          {/* Screen Actions */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">
              Screen Actions
            </h2>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => handleCommand("refresh")}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <HiOutlineRefresh className="w-4 h-4" />
                Refresh Content
              </button>
              <button
                onClick={() => handleCommand("restart")}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <HiOutlineRefresh className="w-4 h-4 rotate-180" />
                Restart Player
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-3">
              Commands are sent in real-time. The screen must be online to
              receive them.
            </p>
          </div>

          {/* Activity Log Placeholder */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">
              Activity Log
            </h2>
            <div className="flex flex-col items-center py-8 text-center">
              <HiOutlineClock className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-sm text-slate-500">
                Activity logging coming soon
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Screen events, command history, and playback logs will appear
                here.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column - Device Info */}
        <div className="space-y-6">
          {/* Device Info */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <HiOutlineInformationCircle className="w-4 h-4 text-slate-400" />
              Device Info
            </h2>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-xs text-slate-500">Status</dt>
                <dd>
                  <Badge variant={isOnline ? "online" : "offline"} dot>
                    {screen.status}
                  </Badge>
                </dd>
              </div>
              <div className="border-t border-slate-100" />
              <div className="flex justify-between">
                <dt className="text-xs text-slate-500">Paired</dt>
                <dd className="text-xs text-slate-900 font-medium">
                  {screen.isPaired ? "Yes" : "No"}
                </dd>
              </div>
              <div className="border-t border-slate-100" />
              <div className="flex justify-between">
                <dt className="text-xs text-slate-500">Orientation</dt>
                <dd className="text-xs text-slate-900 font-medium capitalize">
                  {screen.orientation}
                </dd>
              </div>
              <div className="border-t border-slate-100" />
              <div className="flex justify-between">
                <dt className="text-xs text-slate-500">Resolution</dt>
                <dd className="text-xs text-slate-900 font-medium">
                  {screen.resolution.width} x {screen.resolution.height}
                </dd>
              </div>
              {screen.deviceInfo?.model && (
                <>
                  <div className="border-t border-slate-100" />
                  <div className="flex justify-between">
                    <dt className="text-xs text-slate-500">Device Model</dt>
                    <dd className="text-xs text-slate-900 font-medium">
                      {screen.deviceInfo.model}
                    </dd>
                  </div>
                </>
              )}
              {screen.deviceInfo?.os && (
                <>
                  <div className="border-t border-slate-100" />
                  <div className="flex justify-between">
                    <dt className="text-xs text-slate-500">OS</dt>
                    <dd className="text-xs text-slate-900 font-medium">
                      {screen.deviceInfo.os}
                    </dd>
                  </div>
                </>
              )}
              {screen.deviceInfo?.appVersion && (
                <>
                  <div className="border-t border-slate-100" />
                  <div className="flex justify-between">
                    <dt className="text-xs text-slate-500">App Version</dt>
                    <dd className="text-xs text-slate-900 font-medium">
                      {screen.deviceInfo.appVersion}
                    </dd>
                  </div>
                </>
              )}
              {screen.deviceInfo?.ipAddress && (
                <>
                  <div className="border-t border-slate-100" />
                  <div className="flex justify-between">
                    <dt className="text-xs text-slate-500">IP Address</dt>
                    <dd className="text-xs text-slate-900 font-medium font-mono">
                      {screen.deviceInfo.ipAddress}
                    </dd>
                  </div>
                </>
              )}
              <div className="border-t border-slate-100" />
              <div className="flex justify-between">
                <dt className="text-xs text-slate-500">Last Heartbeat</dt>
                <dd className="text-xs text-slate-900 font-medium">
                  {formatHeartbeat(screen.lastHeartbeat)}
                </dd>
              </div>
              <div className="border-t border-slate-100" />
              <div className="flex justify-between">
                <dt className="text-xs text-slate-500">Created</dt>
                <dd className="text-xs text-slate-900 font-medium">
                  {formatTimestamp(screen.createdAt)}
                </dd>
              </div>
            </dl>
          </div>

          {/* Tags */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <HiOutlineTag className="w-4 h-4 text-slate-400" />
              Tags
            </h2>
            {screen.tags && screen.tags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {screen.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No tags added</p>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {screen && (
        <EditScreenModal
          screen={screen}
          open={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveEdit}
        />
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete Screen"
        message={`Are you sure you want to delete "${screen.name}"? This action cannot be undone.`}
        confirmLabel="Delete Screen"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}

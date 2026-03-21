import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  HiOutlineDesktopComputer,
  HiOutlinePlus,
  HiOutlineSearch,
  HiOutlineViewGrid,
  HiOutlineViewList,
  HiOutlineFilter,
  HiOutlineDeviceMobile,
  HiOutlineLocationMarker,
  HiOutlineX,
  HiOutlineRefresh,
  HiOutlineCheck,
  HiOutlineClock,
} from "react-icons/hi";
import { formatDistanceToNow } from "date-fns";
import { Timestamp } from "firebase/firestore";
import PageHeader from "../components/common/PageHeader";
import EmptyState from "../components/common/EmptyState";
import Badge from "../components/common/Badge";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { useScreens, useScreenActions } from "../hooks/useScreens";
import { usePlaylists } from "../hooks/usePlaylists";
import { usePairing } from "../hooks/usePairing";
import { RESOLUTION_PRESETS } from "@shared/constants";
import type { Orientation, Screen } from "@shared/types/firestore-schema";

type ViewMode = "grid" | "list";
type StatusFilter = "all" | "online" | "offline";

const ORIENTATION_OPTIONS: { value: Orientation; label: string }[] = [
  { value: "landscape", label: "Landscape" },
  { value: "portrait", label: "Portrait" },
  { value: "landscape-flipped", label: "Landscape (Flipped)" },
  { value: "portrait-flipped", label: "Portrait (Flipped)" },
];

const RESOLUTION_OPTIONS = Object.entries(RESOLUTION_PRESETS).map(
  ([key, preset]) => ({
    key,
    label: preset.name,
    width: preset.width,
    height: preset.height,
  })
);

function formatHeartbeat(lastHeartbeat: Timestamp | null): string {
  if (!lastHeartbeat) return "Never";
  try {
    const date = lastHeartbeat.toDate();
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return "Unknown";
  }
}

function OrientationIcon({
  orientation,
  className = "w-4 h-4",
}: {
  orientation: Orientation;
  className?: string;
}) {
  const isPortrait =
    orientation === "portrait" || orientation === "portrait-flipped";
  if (isPortrait) {
    return <HiOutlineDeviceMobile className={className} />;
  }
  return <HiOutlineDesktopComputer className={className} />;
}

// ============================================
// Screen Card (Grid View)
// ============================================
function ScreenCard({
  screen,
  playlistName,
}: {
  screen: Screen;
  playlistName: string;
}) {
  const isOnline = screen.status === "online";

  return (
    <Link
      to={`/screens/${screen.id}`}
      className="block bg-white rounded-lg border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all group"
    >
      {/* Card Header - Status Bar */}
      <div
        className={`h-1.5 rounded-t-lg ${isOnline ? "bg-green-500" : "bg-slate-300"}`}
      />

      <div className="p-5">
        {/* Title & Status */}
        <div className="flex items-start justify-between mb-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
              {screen.name}
            </h3>
            {screen.location && (
              <div className="flex items-center gap-1 mt-1 text-xs text-slate-500">
                <HiOutlineLocationMarker className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{screen.location}</span>
              </div>
            )}
          </div>
          <Badge variant={isOnline ? "online" : "offline"} dot>
            {isOnline ? "Online" : "Offline"}
          </Badge>
        </div>

        {/* Info Row */}
        <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
          <div className="flex items-center gap-1">
            <OrientationIcon orientation={screen.orientation} className="w-3.5 h-3.5" />
            <span className="capitalize">{screen.orientation}</span>
          </div>
          <span className="text-slate-300">|</span>
          <span>
            {screen.resolution.width}x{screen.resolution.height}
          </span>
        </div>

        {/* Playlist */}
        <div className="text-xs text-slate-500 mb-3">
          <span className="text-slate-400">Playlist:</span>{" "}
          <span className="text-slate-700 font-medium">
            {playlistName || "None assigned"}
          </span>
        </div>

        {/* Heartbeat */}
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <HiOutlineClock className="w-3.5 h-3.5" />
          <span>{formatHeartbeat(screen.lastHeartbeat)}</span>
        </div>

        {/* Tags */}
        {screen.tags && screen.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-slate-100">
            {screen.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-medium rounded-full"
              >
                {tag}
              </span>
            ))}
            {screen.tags.length > 3 && (
              <span className="px-2 py-0.5 text-slate-400 text-[10px]">
                +{screen.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

// ============================================
// Screen Row (List View)
// ============================================
function ScreenRow({
  screen,
  playlistName,
}: {
  screen: Screen;
  playlistName: string;
}) {
  const isOnline = screen.status === "online";

  return (
    <Link
      to={`/screens/${screen.id}`}
      className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors group"
    >
      {/* Status Dot + Icon */}
      <div className="relative flex-shrink-0">
        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
          <OrientationIcon
            orientation={screen.orientation}
            className="w-5 h-5 text-slate-500 group-hover:text-blue-600"
          />
        </div>
        <div
          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
            isOnline ? "bg-green-500" : "bg-slate-300"
          }`}
        />
      </div>

      {/* Name & Location */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-900 truncate group-hover:text-blue-600 transition-colors">
          {screen.name}
        </p>
        {screen.location && (
          <p className="text-xs text-slate-500 truncate">{screen.location}</p>
        )}
      </div>

      {/* Orientation */}
      <div className="hidden sm:block w-28 text-xs text-slate-500 capitalize">
        {screen.orientation}
      </div>

      {/* Resolution */}
      <div className="hidden md:block w-24 text-xs text-slate-500">
        {screen.resolution.width}x{screen.resolution.height}
      </div>

      {/* Playlist */}
      <div className="hidden lg:block w-36 text-xs text-slate-600 truncate">
        {playlistName || "—"}
      </div>

      {/* Status */}
      <div className="hidden sm:block w-20">
        <Badge variant={isOnline ? "online" : "offline"} dot>
          {isOnline ? "Online" : "Offline"}
        </Badge>
      </div>

      {/* Heartbeat */}
      <div className="hidden md:block w-28 text-xs text-slate-400 text-right">
        {formatHeartbeat(screen.lastHeartbeat)}
      </div>
    </Link>
  );
}

// ============================================
// Add Screen Modal
// ============================================
function AddScreenModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (screenId: string) => void;
}) {
  const { addScreen } = useScreenActions();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    location: "",
    orientation: "landscape" as Orientation,
    resolutionKey: "FHD_LANDSCAPE",
    tags: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    setSubmitting(true);
    try {
      const resolution = RESOLUTION_PRESETS[form.resolutionKey];
      const screenId = await addScreen({
        name: form.name.trim(),
        location: form.location.trim(),
        orientation: form.orientation,
        resolution: { width: resolution.width, height: resolution.height },
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      });
      onCreated(screenId);
    } catch (err) {
      console.error("Failed to create screen:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Add Screen</h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <HiOutlineX className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Screen Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Lobby Display"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              autoFocus
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Location
            </label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="e.g. Building A, Floor 1"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Orientation & Resolution */}
          <div className="grid grid-cols-2 gap-4">
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
                Resolution
              </label>
              <select
                value={form.resolutionKey}
                onChange={(e) =>
                  setForm({ ...form, resolutionKey: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                {RESOLUTION_OPTIONS.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Tags
            </label>
            <input
              type="text"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="lobby, entrance, floor-1 (comma separated)"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-slate-400 mt-1">
              Separate multiple tags with commas
            </p>
          </div>

          {/* Actions */}
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
              disabled={submitting || !form.name.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <HiOutlinePlus className="w-4 h-4" />
                  Create Screen
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
// Pairing Code Display Modal
// ============================================
function PairingModal({
  screenId,
  onClose,
}: {
  screenId: string;
  onClose: () => void;
}) {
  const { code, expiresAt, isPaired, loading, error, generateCode, reset } =
    usePairing(screenId);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  // Generate code on mount
  useEffect(() => {
    generateCode();
    return () => reset();
  }, [generateCode, reset]);

  // Countdown timer
  useEffect(() => {
    if (!expiresAt) return;

    const interval = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.floor((expiresAt.getTime() - Date.now()) / 1000)
      );
      setTimeLeft(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 1000);

    // Initial set
    setTimeLeft(
      Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000))
    );

    return () => clearInterval(interval);
  }, [expiresAt]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">
            {isPaired ? "Screen Paired!" : "Pair Your Screen"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <HiOutlineX className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 text-center">
          {isPaired ? (
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <HiOutlineCheck className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Successfully Paired
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Your screen is now connected and ready to display content.
                </p>
              </div>
              <button
                onClick={onClose}
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Done
              </button>
            </div>
          ) : loading ? (
            <div className="py-8">
              <LoadingSpinner />
              <p className="text-sm text-slate-500 mt-4">
                Generating pairing code...
              </p>
            </div>
          ) : error ? (
            <div className="space-y-4">
              <p className="text-sm text-red-600">{error}</p>
              <button
                onClick={generateCode}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              <p className="text-sm text-slate-500">
                Enter this code on your screen device to pair it
              </p>

              {/* Pairing Code Display */}
              <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl py-6 px-4">
                <p className="text-4xl font-mono font-bold tracking-[0.3em] text-slate-900">
                  {code}
                </p>
              </div>

              {/* Countdown */}
              {timeLeft > 0 ? (
                <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                  <HiOutlineClock className="w-4 h-4" />
                  <span>
                    Code expires in{" "}
                    <span className="font-medium text-slate-700">
                      {minutes}:{seconds.toString().padStart(2, "0")}
                    </span>
                  </span>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-red-500">Code has expired</p>
                  <button
                    onClick={generateCode}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                  >
                    <HiOutlineRefresh className="w-4 h-4" />
                    Generate New Code
                  </button>
                </div>
              )}

              <p className="text-xs text-slate-400">
                Waiting for device to connect...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// Screens Page
// ============================================
export default function ScreensPage() {
  const { screens, loading } = useScreens();
  const { playlists } = usePlaylists();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [orientationFilter, setOrientationFilter] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [pairingScreenId, setPairingScreenId] = useState<string | null>(null);

  // Build playlist lookup map
  const playlistMap = useMemo(() => {
    const map = new Map<string, string>();
    playlists.forEach((p) => map.set(p.id, p.name));
    return map;
  }, [playlists]);

  // Filtered screens
  const filteredScreens = useMemo(() => {
    return screens.filter((screen) => {
      // Status filter
      if (statusFilter !== "all" && screen.status !== statusFilter) return false;

      // Orientation filter
      if (
        orientationFilter !== "all" &&
        screen.orientation !== orientationFilter
      )
        return false;

      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = screen.name.toLowerCase().includes(q);
        const matchesLocation = screen.location?.toLowerCase().includes(q);
        if (!matchesName && !matchesLocation) return false;
      }

      return true;
    });
  }, [screens, statusFilter, orientationFilter, search]);

  // Counts for filter badges
  const onlineCount = screens.filter((s) => s.status === "online").length;
  const offlineCount = screens.filter((s) => s.status === "offline").length;

  const handleScreenCreated = (screenId: string) => {
    setShowAddModal(false);
    setPairingScreenId(screenId);
  };

  if (loading) {
    return (
      <div>
        <PageHeader
          title="Screens"
          description="Manage your digital signage screens"
        />
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Screens"
        description="Manage your digital signage screens"
        action={
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <HiOutlinePlus className="w-4 h-4" />
            Add Screen
          </button>
        }
      />

      {screens.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200">
          <EmptyState
            icon={<HiOutlineDesktopComputer className="w-12 h-12" />}
            title="No screens yet"
            description="Add your first screen to get started. Each screen represents a display device."
            action={
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Screen
              </button>
            }
          />
        </div>
      ) : (
        <>
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-5">
            {/* Search */}
            <div className="relative flex-1 w-full sm:max-w-xs">
              <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search screens..."
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <HiOutlineFilter className="w-3.5 h-3.5" />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as StatusFilter)
                }
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status ({screens.length})</option>
                <option value="online">Online ({onlineCount})</option>
                <option value="offline">Offline ({offlineCount})</option>
              </select>

              {/* Orientation Filter */}
              <select
                value={orientationFilter}
                onChange={(e) => setOrientationFilter(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Orientations</option>
                {ORIENTATION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-0.5 bg-slate-100 rounded-lg p-0.5 ml-auto">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === "grid"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
                title="Grid view"
              >
                <HiOutlineViewGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === "list"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
                title="List view"
              >
                <HiOutlineViewList className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Results count */}
          {filteredScreens.length !== screens.length && (
            <p className="text-xs text-slate-400 mb-3">
              Showing {filteredScreens.length} of {screens.length} screens
            </p>
          )}

          {/* Screen Grid/List */}
          {filteredScreens.length === 0 ? (
            <div className="bg-white rounded-lg border border-slate-200 py-12 text-center">
              <p className="text-sm text-slate-500">
                No screens match your filters
              </p>
              <button
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setOrientationFilter("all");
                }}
                className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear filters
              </button>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredScreens.map((screen) => (
                <ScreenCard
                  key={screen.id}
                  screen={screen}
                  playlistName={
                    screen.currentPlaylistId
                      ? playlistMap.get(screen.currentPlaylistId) || ""
                      : ""
                  }
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100">
              {/* List Header */}
              <div className="flex items-center gap-4 px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-50 rounded-t-lg">
                <div className="w-10" />
                <div className="flex-1">Name</div>
                <div className="hidden sm:block w-28">Orientation</div>
                <div className="hidden md:block w-24">Resolution</div>
                <div className="hidden lg:block w-36">Playlist</div>
                <div className="hidden sm:block w-20">Status</div>
                <div className="hidden md:block w-28 text-right">
                  Last Seen
                </div>
              </div>
              {filteredScreens.map((screen) => (
                <ScreenRow
                  key={screen.id}
                  screen={screen}
                  playlistName={
                    screen.currentPlaylistId
                      ? playlistMap.get(screen.currentPlaylistId) || ""
                      : ""
                  }
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Add Screen Modal */}
      <AddScreenModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCreated={handleScreenCreated}
      />

      {/* Pairing Modal */}
      {pairingScreenId && (
        <PairingModal
          screenId={pairingScreenId}
          onClose={() => setPairingScreenId(null)}
        />
      )}
    </div>
  );
}

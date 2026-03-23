import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  HiOutlineArrowLeft,
  HiOutlineSave,
  HiOutlineTrash,
  HiOutlinePlay,
  HiOutlinePause,
  HiOutlineChevronUp,
  HiOutlineChevronDown,
  HiOutlineX,
  HiOutlinePhotograph,
  HiOutlineTemplate,
  HiOutlinePlus,
} from "react-icons/hi";
import toast from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";
import { usePlaylist, usePlaylistActions } from "../hooks/usePlaylists";
import { useMedia } from "../hooks/useMedia";
import { useAuth } from "../contexts/AuthContext";
import { subscribeToCollection } from "../lib/api";
import { where } from "firebase/firestore";
import { formatDuration } from "@shared/utils";
import LoadingSpinner from "../components/common/LoadingSpinner";
import ConfirmDialog from "../components/common/ConfirmDialog";
import Badge from "../components/common/Badge";
import type {
  PlaylistItem,
  TransitionType,
  Orientation,
  Template,
  Media,
} from "@shared/types/firestore-schema";

const TRANSITIONS: { value: TransitionType; label: string }[] = [
  { value: "none", label: "None" },
  { value: "fade", label: "Fade" },
  { value: "slide-left", label: "Slide Left" },
  { value: "slide-right", label: "Slide Right" },
];

export default function PlaylistEditorPage() {
  const { playlistId } = useParams<{ playlistId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { playlist, loading: playlistLoading } = usePlaylist(playlistId);
  const { createPlaylist, updatePlaylist, deletePlaylist } = usePlaylistActions();
  const { media, loading: mediaLoading } = useMedia();

  const [name, setName] = useState("");
  const [orientation, setOrientation] = useState<Orientation>("landscape");
  const [items, setItems] = useState<PlaylistItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [addPanelTab, setAddPanelTab] = useState<"media" | "templates">("media");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  // Subscribe to templates
  useEffect(() => {
    if (!profile?.organizationId) return;
    const unsubscribe = subscribeToCollection<Template>(
      "templates",
      [where("organizationId", "==", profile.organizationId)],
      (data) => setTemplates(data)
    );
    return unsubscribe;
  }, [profile?.organizationId]);

  // Load existing playlist data
  useEffect(() => {
    if (playlist) {
      setName(playlist.name);
      setOrientation(playlist.orientation);
      setItems(playlist.items || []);
    }
  }, [playlist]);

  const totalDuration = items.reduce((sum, item) => sum + item.duration, 0);

  const filteredMedia = media.filter((m) => {
    // For landscape playlists, show landscape media; for portrait show portrait
    if (!m.dimensions) return true;
    if (orientation === "landscape" || orientation === "landscape-flipped") {
      return m.dimensions.width >= m.dimensions.height;
    }
    return m.dimensions.height >= m.dimensions.width;
  });

  const filteredTemplates = templates.filter((t) => {
    if (orientation === "landscape" || orientation === "landscape-flipped") {
      return t.orientation === "landscape" || t.orientation === "landscape-flipped";
    }
    return t.orientation === "portrait" || t.orientation === "portrait-flipped";
  });

  const addMediaItem = (mediaItem: Media) => {
    const newItem: PlaylistItem = {
      id: uuidv4(),
      type: "media",
      mediaId: mediaItem.id,
      duration: mediaItem.duration || 10,
      transition: "fade",
      order: items.length,
    };
    setItems([...items, newItem]);
  };

  const addTemplateItem = (template: Template) => {
    const newItem: PlaylistItem = {
      id: uuidv4(),
      type: "template",
      templateId: template.id,
      duration: 15,
      transition: "fade",
      order: items.length,
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id).map((item, i) => ({ ...item, order: i })));
  };

  const moveItem = (index: number, direction: "up" | "down") => {
    const newItems = [...items];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newItems.length) return;
    [newItems[index], newItems[swapIndex]] = [newItems[swapIndex], newItems[index]];
    setItems(newItems.map((item, i) => ({ ...item, order: i })));
  };

  const updateItem = (id: string, updates: Partial<PlaylistItem>) => {
    setItems(items.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const getItemName = (item: PlaylistItem): string => {
    if (item.type === "media" && item.mediaId) {
      const m = media.find((x) => x.id === item.mediaId);
      return m?.name || "Unknown Media";
    }
    if (item.type === "template" && item.templateId) {
      const t = templates.find((x) => x.id === item.templateId);
      return t?.name || "Unknown Template";
    }
    return "Unknown";
  };

  const getItemThumbnail = (item: PlaylistItem): string | undefined => {
    if (item.type === "media" && item.mediaId) {
      const m = media.find((x) => x.id === item.mediaId);
      return m?.thumbnailUrl || m?.downloadUrl;
    }
    if (item.type === "template" && item.templateId) {
      const t = templates.find((x) => x.id === item.templateId);
      return t?.thumbnail;
    }
    return undefined;
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Please enter a playlist name");
      return;
    }
    if (items.length === 0) {
      toast.error("Please add at least one item");
      return;
    }

    setSaving(true);
    try {
      const data = {
        name: name.trim(),
        orientation,
        items,
        totalDuration,
      };

      if (playlistId && playlist) {
        await updatePlaylist(playlistId, data);
        toast.success("Playlist updated");
      } else {
        const newId = await createPlaylist(data);
        toast.success("Playlist created");
        navigate(`/playlists/editor/${newId}`, { replace: true });
      }
    } catch {
      toast.error("Failed to save playlist");
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!playlistId) return;
    try {
      await deletePlaylist(playlistId);
      toast.success("Playlist deleted");
      navigate("/playlists");
    } catch {
      toast.error("Failed to delete playlist");
    }
    setShowDeleteConfirm(false);
  };

  if (playlistId && playlistLoading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/playlists")}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              <HiOutlineArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">
                {playlistId ? "Edit Playlist" : "Create Playlist"}
              </h1>
              <p className="text-sm text-slate-500">
                {items.length} items &middot; {formatDuration(totalDuration)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {playlistId && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
              >
                <HiOutlineTrash className="w-4 h-4" />
                Delete
              </button>
            )}
            <button
              onClick={() => setShowPreview(true)}
              disabled={items.length === 0}
              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50"
            >
              <HiOutlinePlay className="w-4 h-4" />
              Preview
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark disabled:opacity-50"
            >
              <HiOutlineSave className="w-4 h-4" />
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Main content - playlist items */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Name and orientation */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Playlist Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter playlist name"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Orientation
                </label>
                <select
                  value={orientation}
                  onChange={(e) => setOrientation(e.target.value as Orientation)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="landscape">Landscape</option>
                  <option value="portrait">Portrait</option>
                </select>
              </div>
            </div>
          </div>

          {/* Playlist items list */}
          <div className="bg-white rounded-lg border border-slate-200">
            <div className="px-4 py-3 border-b border-slate-200">
              <h2 className="text-sm font-medium text-slate-900">Playlist Items</h2>
            </div>

            {items.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                Add media or templates from the panel on the right.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50"
                  >
                    {/* Thumbnail */}
                    <div className="w-16 h-10 bg-slate-100 rounded overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {getItemThumbnail(item) ? (
                        <img
                          src={getItemThumbnail(item)}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : item.type === "media" ? (
                        <HiOutlinePhotograph className="w-5 h-5 text-slate-400" />
                      ) : (
                        <HiOutlineTemplate className="w-5 h-5 text-slate-400" />
                      )}
                    </div>

                    {/* Name and type */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {getItemName(item)}
                      </p>
                      <Badge variant={item.type === "media" ? "info" : "warning"}>
                        {item.type}
                      </Badge>
                    </div>

                    {/* Duration */}
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={3}
                        value={item.duration}
                        onChange={(e) =>
                          updateItem(item.id, {
                            duration: Math.max(3, parseInt(e.target.value) || 3),
                          })
                        }
                        className="w-16 px-2 py-1 border border-slate-300 rounded text-sm text-center"
                      />
                      <span className="text-xs text-slate-500">sec</span>
                    </div>

                    {/* Transition */}
                    <select
                      value={item.transition}
                      onChange={(e) =>
                        updateItem(item.id, {
                          transition: e.target.value as TransitionType,
                        })
                      }
                      className="px-2 py-1 border border-slate-300 rounded text-sm"
                    >
                      {TRANSITIONS.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>

                    {/* Move buttons */}
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => moveItem(index, "up")}
                        disabled={index === 0}
                        className="p-0.5 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                      >
                        <HiOutlineChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => moveItem(index, "down")}
                        disabled={index === items.length - 1}
                        className="p-0.5 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                      >
                        <HiOutlineChevronDown className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-1 text-slate-400 hover:text-red-600"
                    >
                      <HiOutlineX className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Summary bar */}
          {items.length > 0 && (
            <div className="mt-4 bg-white rounded-lg border border-slate-200 px-4 py-3 flex items-center justify-between text-sm">
              <span className="text-slate-600">
                <strong>{items.length}</strong> item{items.length !== 1 ? "s" : ""}
              </span>
              <span className="text-slate-600">
                Total duration: <strong>{formatDuration(totalDuration)}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Right panel - add items */}
        <div className="w-80 border-l border-slate-200 bg-white overflow-y-auto">
          <div className="p-4 border-b border-slate-200">
            <h2 className="text-sm font-medium text-slate-900 mb-3">Add Content</h2>
            <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setAddPanelTab("media")}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  addPanelTab === "media"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Media
              </button>
              <button
                onClick={() => setAddPanelTab("templates")}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  addPanelTab === "templates"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Templates
              </button>
            </div>
          </div>

          <div className="p-4">
            {addPanelTab === "media" ? (
              mediaLoading ? (
                <LoadingSpinner size="sm" />
              ) : filteredMedia.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">
                  No matching media found.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {filteredMedia.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => addMediaItem(m)}
                      className="text-left bg-slate-50 rounded-lg overflow-hidden hover:ring-2 hover:ring-primary transition-all group"
                    >
                      <div className="aspect-video bg-slate-200 relative">
                        {m.thumbnailUrl || m.downloadUrl ? (
                          <img
                            src={m.thumbnailUrl || m.downloadUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <HiOutlinePhotograph className="w-5 h-5 text-slate-400" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/20 transition-colors flex items-center justify-center">
                          <HiOutlinePlus className="w-5 h-5 text-white opacity-0 group-hover:opacity-100" />
                        </div>
                      </div>
                      <p className="text-xs text-slate-700 p-1.5 truncate">{m.name}</p>
                    </button>
                  ))}
                </div>
              )
            ) : filteredTemplates.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">
                No matching templates found.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {filteredTemplates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => addTemplateItem(t)}
                    className="text-left bg-slate-50 rounded-lg overflow-hidden hover:ring-2 hover:ring-primary transition-all group"
                  >
                    <div className="aspect-video bg-slate-200 relative">
                      {t.thumbnail ? (
                        <img
                          src={t.thumbnail}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <HiOutlineTemplate className="w-5 h-5 text-slate-400" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/20 transition-colors flex items-center justify-center">
                        <HiOutlinePlus className="w-5 h-5 text-white opacity-0 group-hover:opacity-100" />
                      </div>
                    </div>
                    <p className="text-xs text-slate-700 p-1.5 truncate">{t.name}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <PlaylistPreviewModal
          items={items}
          getItemName={getItemName}
          getItemThumbnail={getItemThumbnail}
          onClose={() => setShowPreview(false)}
        />
      )}

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete Playlist"
        message="Are you sure you want to delete this playlist? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}

// --------------- Preview Modal ---------------

function PlaylistPreviewModal({
  items,
  getItemName,
  getItemThumbnail,
  onClose,
}: {
  items: PlaylistItem[];
  getItemName: (item: PlaylistItem) => string;
  getItemThumbnail: (item: PlaylistItem) => string | undefined;
  onClose: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentItem = items[currentIndex];

  useEffect(() => {
    if (!isPlaying || items.length === 0) return;

    const duration = currentItem.duration * 1000;
    const interval = 50;
    let elapsed = 0;

    timerRef.current = setInterval(() => {
      elapsed += interval;
      setProgress((elapsed / duration) * 100);

      if (elapsed >= duration) {
        setCurrentIndex((prev) => (prev + 1) % items.length);
        elapsed = 0;
        setProgress(0);
      }
    }, interval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, currentIndex, items.length, currentItem?.duration]);

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/80" onClick={onClose} />
      <div className="relative bg-black rounded-xl overflow-hidden shadow-2xl w-full max-w-3xl mx-4">
        {/* Display area */}
        <div className="aspect-video bg-slate-900 relative flex items-center justify-center">
          {getItemThumbnail(currentItem) ? (
            <img
              src={getItemThumbnail(currentItem)}
              alt=""
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="text-white text-lg font-medium">{getItemName(currentItem)}</div>
          )}
        </div>

        {/* Controls */}
        <div className="bg-slate-900 px-4 py-3">
          {/* Progress bar */}
          <div className="w-full h-1 bg-slate-700 rounded-full mb-3">
            <div
              className="h-full bg-orange-500 rounded-full transition-all duration-75"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlayPause}
                className="p-2 text-white hover:bg-slate-800 rounded-lg"
              >
                {isPlaying ? (
                  <HiOutlinePause className="w-5 h-5" />
                ) : (
                  <HiOutlinePlay className="w-5 h-5" />
                )}
              </button>
              <span className="text-sm text-slate-400">
                {getItemName(currentItem)}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-400">
                {currentIndex + 1} / {items.length}
              </span>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
              >
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

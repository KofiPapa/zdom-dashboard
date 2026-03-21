import { useState, useMemo, useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import {
  HiOutlinePhotograph,
  HiOutlineUpload,
  HiOutlineSearch,
  HiOutlineFilter,
  HiOutlineTrash,
  HiOutlineEye,
  HiOutlineX,
  HiOutlineCheck,
  HiOutlineVideoCamera,
  HiOutlineViewGrid,
  HiOutlineSortDescending,
  HiOutlineChevronDown,
  HiOutlineCloudUpload,
  HiOutlineTag,
  HiOutlinePencil,
  HiOutlineExclamationCircle,
} from "react-icons/hi";
import PageHeader from "../components/common/PageHeader";
import EmptyState from "../components/common/EmptyState";
import ConfirmDialog from "../components/common/ConfirmDialog";
import LoadingSpinner from "../components/common/LoadingSpinner";
import Badge from "../components/common/Badge";
import { useMedia, useMediaActions } from "../hooks/useMedia";
import { useUpload } from "../hooks/useUpload";
import { formatFileSize } from "@shared/utils";
import {
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
} from "@shared/constants";
import type { Media } from "@shared/types/firestore-schema";

type SortOption = "newest" | "oldest" | "name" | "size";
type FilterOption = "all" | "images" | "videos";
type GridSize = "small" | "medium" | "large";

const gridSizeClasses: Record<GridSize, string> = {
  small: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8",
  medium: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5",
  large: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
};

const gridHeightClasses: Record<GridSize, string> = {
  small: "h-28",
  medium: "h-40",
  large: "h-56",
};

export default function MediaPage() {
  const { media, loading } = useMedia();
  const { updateMedia, deleteMedia, deleteMultipleMedia } = useMediaActions();
  const { uploadFiles, uploads, cancelUpload, clearCompleted } = useUpload();

  // UI state
  const [showUploadPanel, setShowUploadPanel] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterOption>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [gridSize, setGridSize] = useState<GridSize>("medium");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [previewItem, setPreviewItem] = useState<Media | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState("");
  const [editingTags, setEditingTags] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<{
    type: "single" | "bulk";
    item?: Media;
  } | null>(null);

  const nameInputRef = useRef<HTMLInputElement>(null);

  // Dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/*": ALLOWED_IMAGE_TYPES.map((t) => `.${t.split("/")[1]}`),
      "video/*": ALLOWED_VIDEO_TYPES.map((t) => `.${t.split("/")[1]}`),
    },
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        uploadFiles(acceptedFiles);
        setShowUploadPanel(true);
        toast.success(
          `${acceptedFiles.length} file${acceptedFiles.length > 1 ? "s" : ""} queued for upload`
        );
      }
    },
    noClick: false,
    noKeyboard: true,
  });

  // Filtered and sorted media
  const filteredMedia = useMemo(() => {
    let result = [...media];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (m) =>
          m.name.toLowerCase().includes(query) ||
          m.tags?.some((t) => t.toLowerCase().includes(query))
      );
    }

    // Type filter
    if (filterType === "images") {
      result = result.filter((m) => m.type === "image");
    } else if (filterType === "videos") {
      result = result.filter((m) => m.type === "video");
    }

    // Sort
    switch (sortBy) {
      case "newest":
        result.sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() ?? 0;
          const bTime = b.createdAt?.toMillis?.() ?? 0;
          return bTime - aTime;
        });
        break;
      case "oldest":
        result.sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() ?? 0;
          const bTime = b.createdAt?.toMillis?.() ?? 0;
          return aTime - bTime;
        });
        break;
      case "name":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "size":
        result.sort((a, b) => b.fileSize - a.fileSize);
        break;
    }

    return result;
  }, [media, searchQuery, filterType, sortBy]);

  // Selection handlers
  const toggleSelect = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Delete handlers
  const handleDeleteSingle = useCallback(
    async (item: Media) => {
      try {
        await deleteMedia(item.id, item.storageUrl);
        toast.success(`"${item.name}" deleted`);
        if (previewItem?.id === item.id) {
          setPreviewItem(null);
        }
      } catch {
        toast.error("Failed to delete media");
      }
      setConfirmDelete(null);
    },
    [deleteMedia, previewItem]
  );

  const handleDeleteBulk = useCallback(async () => {
    const items = media
      .filter((m) => selectedIds.has(m.id))
      .map((m) => ({ id: m.id, storageUrl: m.storageUrl }));
    try {
      await deleteMultipleMedia(items);
      toast.success(`${items.length} item${items.length > 1 ? "s" : ""} deleted`);
      setSelectedIds(new Set());
      if (previewItem && selectedIds.has(previewItem.id)) {
        setPreviewItem(null);
      }
    } catch {
      toast.error("Failed to delete some media");
    }
    setConfirmDelete(null);
  }, [media, selectedIds, deleteMultipleMedia, previewItem]);

  // Name editing
  const startEditName = useCallback((item: Media) => {
    setEditingName(true);
    setEditNameValue(item.name);
    setTimeout(() => nameInputRef.current?.focus(), 50);
  }, []);

  const saveName = useCallback(async () => {
    if (!previewItem || !editNameValue.trim()) return;
    try {
      await updateMedia(previewItem.id, { name: editNameValue.trim() } as Partial<Media>);
      setPreviewItem((prev) =>
        prev ? { ...prev, name: editNameValue.trim() } : null
      );
      toast.success("Name updated");
    } catch {
      toast.error("Failed to update name");
    }
    setEditingName(false);
  }, [previewItem, editNameValue, updateMedia]);

  // Tags
  const addTag = useCallback(async () => {
    if (!previewItem || !tagInput.trim()) return;
    const newTag = tagInput.trim().toLowerCase();
    const currentTags = previewItem.tags || [];
    if (currentTags.includes(newTag)) {
      setTagInput("");
      return;
    }
    const updatedTags = [...currentTags, newTag];
    try {
      await updateMedia(previewItem.id, { tags: updatedTags } as Partial<Media>);
      setPreviewItem((prev) =>
        prev ? { ...prev, tags: updatedTags } : null
      );
    } catch {
      toast.error("Failed to add tag");
    }
    setTagInput("");
  }, [previewItem, tagInput, updateMedia]);

  const removeTag = useCallback(
    async (tag: string) => {
      if (!previewItem) return;
      const updatedTags = (previewItem.tags || []).filter((t) => t !== tag);
      try {
        await updateMedia(previewItem.id, { tags: updatedTags } as Partial<Media>);
        setPreviewItem((prev) =>
          prev ? { ...prev, tags: updatedTags } : null
        );
      } catch {
        toast.error("Failed to remove tag");
      }
    },
    [previewItem, updateMedia]
  );

  // Format date safely
  const formatDate = (item: Media) => {
    try {
      if (item.createdAt?.toDate) {
        return formatDistanceToNow(item.createdAt.toDate(), {
          addSuffix: true,
        });
      }
    } catch {
      // ignore
    }
    return "Unknown date";
  };

  const hasActiveUploads = uploads.some(
    (u) => u.status === "pending" || u.status === "uploading" || u.status === "processing"
  );

  if (loading) {
    return (
      <div>
        <PageHeader title="Media Library" description="Upload and manage your images and videos" />
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Header */}
      <PageHeader
        title="Media Library"
        description="Upload and manage your images and videos"
        action={
          <button
            onClick={() => setShowUploadPanel(!showUploadPanel)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <HiOutlineUpload className="w-4 h-4" />
            Upload
            {hasActiveUploads && (
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            )}
          </button>
        }
      />

      {/* Upload Panel */}
      {showUploadPanel && (
        <div className="mb-6 bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-900">Upload Media</h3>
            <button
              onClick={() => setShowUploadPanel(false)}
              className="p-1 text-slate-400 hover:text-slate-600"
            >
              <HiOutlineX className="w-4 h-4" />
            </button>
          </div>

          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? "border-blue-400 bg-blue-50"
                : "border-slate-300 hover:border-slate-400"
            }`}
          >
            <input {...getInputProps()} />
            <HiOutlineCloudUpload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            {isDragActive ? (
              <p className="text-blue-600 font-medium">Drop files here...</p>
            ) : (
              <>
                <p className="text-slate-600 font-medium">
                  Drag and drop files here, or click to browse
                </p>
                <p className="text-slate-400 text-sm mt-1">
                  Images (JPEG, PNG, GIF, WebP) up to 20MB &middot; Videos (MP4, WebM)
                  up to 500MB
                </p>
              </>
            )}
          </div>

          {/* Upload Queue */}
          {uploads.length > 0 && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">
                  Upload Queue ({uploads.length})
                </span>
                {uploads.some((u) => u.status === "done" || u.status === "error") && (
                  <button
                    onClick={clearCompleted}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    Clear completed
                  </button>
                )}
              </div>
              {uploads.map((upload) => (
                <div
                  key={upload.id}
                  className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 truncate">
                      {upload.file.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            upload.status === "error"
                              ? "bg-red-500"
                              : upload.status === "done"
                                ? "bg-green-500"
                                : "bg-blue-500"
                          }`}
                          style={{ width: `${upload.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500 w-10 text-right">
                        {upload.progress}%
                      </span>
                    </div>
                    {upload.status === "error" && upload.error && (
                      <p className="text-xs text-red-500 mt-0.5">{upload.error}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {upload.status === "done" && (
                      <HiOutlineCheck className="w-4 h-4 text-green-500" />
                    )}
                    {upload.status === "error" && (
                      <HiOutlineExclamationCircle className="w-4 h-4 text-red-500" />
                    )}
                    {(upload.status === "pending" ||
                      upload.status === "uploading") && (
                      <button
                        onClick={() => cancelUpload(upload.id)}
                        className="p-1 text-slate-400 hover:text-red-500"
                      >
                        <HiOutlineX className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {upload.status === "processing" && (
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Toolbar */}
      {media.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 mb-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search media..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Type Filter */}
          <div className="relative">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as FilterOption)}
              className="appearance-none pl-8 pr-8 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="images">Images</option>
              <option value="videos">Videos</option>
            </select>
            <HiOutlineFilter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <HiOutlineChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Sort */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="appearance-none pl-8 pr-8 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="name">Name</option>
              <option value="size">Size</option>
            </select>
            <HiOutlineSortDescending className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <HiOutlineChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Grid Size */}
          <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden">
            {(["small", "medium", "large"] as GridSize[]).map((size) => (
              <button
                key={size}
                onClick={() => setGridSize(size)}
                className={`p-2 text-sm transition-colors ${
                  gridSize === size
                    ? "bg-blue-600 text-white"
                    : "bg-white text-slate-500 hover:bg-slate-50"
                }`}
                title={`${size.charAt(0).toUpperCase() + size.slice(1)} grid`}
              >
                <HiOutlineViewGrid className="w-4 h-4" />
              </button>
            ))}
          </div>

          {/* Media count */}
          <span className="text-sm text-slate-400 ml-auto">
            {filteredMedia.length} item{filteredMedia.length !== 1 ? "s" : ""}
          </span>
        </div>
      )}

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-4 mb-4 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="text-sm font-medium text-blue-700">
            {selectedIds.size} selected
          </span>
          <button
            onClick={() => setConfirmDelete({ type: "bulk" })}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
          >
            <HiOutlineTrash className="w-4 h-4" />
            Delete Selected
          </button>
          <button
            onClick={clearSelection}
            className="text-sm text-blue-600 hover:text-blue-700 ml-auto"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Media Grid */}
      {filteredMedia.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200">
          {media.length === 0 ? (
            <EmptyState
              icon={<HiOutlinePhotograph className="w-12 h-12" />}
              title="No media yet"
              description="Upload images and videos to use in your digital signage content."
              action={
                <button
                  onClick={() => setShowUploadPanel(true)}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Upload Media
                </button>
              }
            />
          ) : (
            <EmptyState
              icon={<HiOutlineSearch className="w-12 h-12" />}
              title="No results found"
              description="Try adjusting your search or filters."
              action={
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setFilterType("all");
                  }}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Clear Filters
                </button>
              }
            />
          )}
        </div>
      ) : (
        <div className={`grid ${gridSizeClasses[gridSize]} gap-4`}>
          {filteredMedia.map((item) => (
            <MediaCard
              key={item.id}
              item={item}
              gridSize={gridSize}
              heightClass={gridHeightClasses[gridSize]}
              isSelected={selectedIds.has(item.id)}
              onToggleSelect={(e) => toggleSelect(item.id, e)}
              onPreview={() => {
                setPreviewItem(item);
                setEditingName(false);
                setEditingTags(false);
              }}
              onDelete={() => setConfirmDelete({ type: "single", item })}
              formatDate={formatDate}
            />
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewItem && (
        <MediaPreviewModal
          item={previewItem}
          editingName={editingName}
          editNameValue={editNameValue}
          nameInputRef={nameInputRef}
          editingTags={editingTags}
          tagInput={tagInput}
          onClose={() => {
            setPreviewItem(null);
            setEditingName(false);
            setEditingTags(false);
          }}
          onStartEditName={() => startEditName(previewItem)}
          onEditNameChange={setEditNameValue}
          onSaveName={saveName}
          onCancelEditName={() => setEditingName(false)}
          onToggleEditTags={() => setEditingTags(!editingTags)}
          onTagInputChange={setTagInput}
          onAddTag={addTag}
          onRemoveTag={removeTag}
          onDelete={() => setConfirmDelete({ type: "single", item: previewItem })}
          formatDate={formatDate}
        />
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={confirmDelete !== null}
        title={
          confirmDelete?.type === "bulk"
            ? `Delete ${selectedIds.size} items?`
            : `Delete "${confirmDelete?.item?.name}"?`
        }
        message={
          confirmDelete?.type === "bulk"
            ? "This will permanently delete the selected media files. This action cannot be undone."
            : "This will permanently delete this media file. This action cannot be undone."
        }
        confirmLabel="Delete"
        onConfirm={() => {
          if (confirmDelete?.type === "bulk") {
            handleDeleteBulk();
          } else if (confirmDelete?.item) {
            handleDeleteSingle(confirmDelete.item);
          }
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}

// ============================================
// Media Card Component
// ============================================

interface MediaCardProps {
  item: Media;
  gridSize: GridSize;
  heightClass: string;
  isSelected: boolean;
  onToggleSelect: (e: React.MouseEvent) => void;
  onPreview: () => void;
  onDelete: () => void;
  formatDate: (item: Media) => string;
}

function MediaCard({
  item,
  gridSize,
  heightClass,
  isSelected,
  onToggleSelect,
  onPreview,
  onDelete,
  formatDate,
}: MediaCardProps) {
  const hasThumbnail = item.thumbnailUrl || item.downloadUrl;
  const isVideo = item.type === "video";

  return (
    <div
      className={`group relative bg-white rounded-lg border overflow-hidden transition-all ${
        isSelected
          ? "border-blue-500 ring-2 ring-blue-200"
          : "border-slate-200 hover:border-slate-300 hover:shadow-md"
      }`}
    >
      {/* Thumbnail */}
      <div className={`relative ${heightClass} bg-slate-100 overflow-hidden`}>
        {hasThumbnail ? (
          isVideo ? (
            <div className="w-full h-full flex items-center justify-center bg-slate-900">
              <img
                src={item.thumbnailUrl || item.downloadUrl}
                alt={item.name}
                className="w-full h-full object-cover opacity-60"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              <HiOutlineVideoCamera className="absolute w-10 h-10 text-white drop-shadow-lg" />
            </div>
          ) : (
            <img
              src={item.thumbnailUrl || item.downloadUrl}
              alt={item.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                const el = e.target as HTMLImageElement;
                el.style.display = "none";
                el.parentElement!.classList.add(
                  "flex",
                  "items-center",
                  "justify-center"
                );
                const placeholder = document.createElement("div");
                placeholder.className = "text-slate-300";
                placeholder.innerHTML = `<svg class="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>`;
                el.parentElement!.appendChild(placeholder);
              }}
            />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {isVideo ? (
              <HiOutlineVideoCamera className="w-10 h-10 text-slate-300" />
            ) : (
              <HiOutlinePhotograph className="w-10 h-10 text-slate-300" />
            )}
          </div>
        )}

        {/* Checkbox */}
        <button
          onClick={onToggleSelect}
          className={`absolute top-2 left-2 w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
            isSelected
              ? "bg-blue-600 border-blue-600 text-white"
              : "bg-white/80 border-slate-300 text-transparent group-hover:opacity-100 opacity-0"
          }`}
        >
          <HiOutlineCheck className="w-3.5 h-3.5" />
        </button>

        {/* Type badge */}
        <div className="absolute top-2 right-2">
          <Badge variant={isVideo ? "warning" : "info"}>
            {isVideo ? "Video" : "Image"}
          </Badge>
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPreview();
            }}
            className="p-2 bg-white rounded-full shadow-lg text-slate-700 hover:text-blue-600 transition-colors"
            title="Preview"
          >
            <HiOutlineEye className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-2 bg-white rounded-full shadow-lg text-slate-700 hover:text-red-600 transition-colors"
            title="Delete"
          >
            <HiOutlineTrash className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-2.5">
        <p className="text-sm font-medium text-slate-800 truncate" title={item.name}>
          {item.name}
        </p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-slate-400">
            {formatFileSize(item.fileSize)}
          </span>
          {gridSize !== "small" && (
            <span className="text-xs text-slate-400">{formatDate(item)}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// Media Preview Modal
// ============================================

interface MediaPreviewModalProps {
  item: Media;
  editingName: boolean;
  editNameValue: string;
  nameInputRef: React.RefObject<HTMLInputElement | null>;
  editingTags: boolean;
  tagInput: string;
  onClose: () => void;
  onStartEditName: () => void;
  onEditNameChange: (value: string) => void;
  onSaveName: () => void;
  onCancelEditName: () => void;
  onToggleEditTags: () => void;
  onTagInputChange: (value: string) => void;
  onAddTag: () => void;
  onRemoveTag: (tag: string) => void;
  onDelete: () => void;
  formatDate: (item: Media) => string;
}

function MediaPreviewModal({
  item,
  editingName,
  editNameValue,
  nameInputRef,
  editingTags,
  tagInput,
  onClose,
  onStartEditName,
  onEditNameChange,
  onSaveName,
  onCancelEditName,
  onToggleEditTags,
  onTagInputChange,
  onAddTag,
  onRemoveTag,
  onDelete,
  formatDate,
}: MediaPreviewModalProps) {
  const isVideo = item.type === "video";
  const hasThumbnail = item.thumbnailUrl || item.downloadUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex overflow-hidden">
        {/* Left: Media Preview */}
        <div className="flex-1 bg-slate-900 flex items-center justify-center min-h-[400px]">
          {isVideo ? (
            item.downloadUrl ? (
              <video
                src={item.downloadUrl}
                controls
                className="max-w-full max-h-[80vh] rounded"
              >
                Your browser does not support video playback.
              </video>
            ) : (
              <div className="text-slate-400 text-center">
                <HiOutlineVideoCamera className="w-16 h-16 mx-auto mb-2" />
                <p>Video preview unavailable</p>
              </div>
            )
          ) : hasThumbnail ? (
            <img
              src={item.downloadUrl || item.thumbnailUrl}
              alt={item.name}
              className="max-w-full max-h-[80vh] object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className="text-slate-400 text-center">
              <HiOutlinePhotograph className="w-16 h-16 mx-auto mb-2" />
              <p>Preview unavailable</p>
            </div>
          )}
        </div>

        {/* Right: Details Panel */}
        <div className="w-80 flex flex-col border-l border-slate-200 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200">
            <h3 className="text-sm font-semibold text-slate-900">Details</h3>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 rounded"
            >
              <HiOutlineX className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 space-y-5 flex-1">
            {/* Name */}
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Name
              </label>
              {editingName ? (
                <div className="flex items-center gap-1.5 mt-1">
                  <input
                    ref={nameInputRef}
                    type="text"
                    value={editNameValue}
                    onChange={(e) => onEditNameChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") onSaveName();
                      if (e.key === "Escape") onCancelEditName();
                    }}
                    className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={onSaveName}
                    className="p-1 text-green-600 hover:text-green-700"
                  >
                    <HiOutlineCheck className="w-4 h-4" />
                  </button>
                  <button
                    onClick={onCancelEditName}
                    className="p-1 text-slate-400 hover:text-slate-600"
                  >
                    <HiOutlineX className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 mt-1 group/name">
                  <p className="text-sm text-slate-800 truncate flex-1">
                    {item.name}
                  </p>
                  <button
                    onClick={onStartEditName}
                    className="p-1 text-slate-300 hover:text-blue-600 opacity-0 group-hover/name:opacity-100 transition-opacity"
                  >
                    <HiOutlinePencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Info Grid */}
            <div className="space-y-3">
              <DetailRow label="Type">
                <Badge variant={isVideo ? "warning" : "info"}>
                  {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                </Badge>
              </DetailRow>
              <DetailRow label="MIME Type">
                <span className="text-sm text-slate-700">{item.mimeType}</span>
              </DetailRow>
              <DetailRow label="Size">
                <span className="text-sm text-slate-700">
                  {formatFileSize(item.fileSize)}
                </span>
              </DetailRow>
              {item.dimensions &&
                (item.dimensions.width > 0 || item.dimensions.height > 0) && (
                  <DetailRow label="Dimensions">
                    <span className="text-sm text-slate-700">
                      {item.dimensions.width} x {item.dimensions.height}
                    </span>
                  </DetailRow>
                )}
              {item.duration != null && item.duration > 0 && (
                <DetailRow label="Duration">
                  <span className="text-sm text-slate-700">
                    {Math.floor(item.duration / 60)}:
                    {String(Math.floor(item.duration % 60)).padStart(2, "0")}
                  </span>
                </DetailRow>
              )}
              <DetailRow label="Uploaded">
                <span className="text-sm text-slate-700">
                  {formatDate(item)}
                </span>
              </DetailRow>
            </div>

            {/* Tags */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Tags
                </label>
                <button
                  onClick={onToggleEditTags}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  {editingTags ? "Done" : "Edit"}
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(item.tags || []).map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full"
                  >
                    <HiOutlineTag className="w-3 h-3" />
                    {tag}
                    {editingTags && (
                      <button
                        onClick={() => onRemoveTag(tag)}
                        className="text-slate-400 hover:text-red-500 ml-0.5"
                      >
                        <HiOutlineX className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                ))}
                {(item.tags || []).length === 0 && !editingTags && (
                  <span className="text-xs text-slate-400">No tags</span>
                )}
              </div>
              {editingTags && (
                <div className="flex items-center gap-1.5 mt-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => onTagInputChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        onAddTag();
                      }
                    }}
                    placeholder="Add tag..."
                    className="flex-1 px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={onAddTag}
                    className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
                  >
                    Add
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Footer: Delete */}
          <div className="p-4 border-t border-slate-200">
            <button
              onClick={onDelete}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
            >
              <HiOutlineTrash className="w-4 h-4" />
              Delete Media
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Detail Row Helper
// ============================================

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-500">{label}</span>
      {children}
    </div>
  );
}

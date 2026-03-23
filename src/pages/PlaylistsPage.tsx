import { useState } from "react";
import { Link } from "react-router-dom";
import {
  HiOutlineCollection,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlinePencil,
} from "react-icons/hi";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import PageHeader from "../components/common/PageHeader";
import EmptyState from "../components/common/EmptyState";
import ConfirmDialog from "../components/common/ConfirmDialog";
import LoadingSpinner from "../components/common/LoadingSpinner";
import Badge from "../components/common/Badge";
import { usePlaylists, usePlaylistActions } from "../hooks/usePlaylists";
import { formatDuration } from "@shared/utils";

export default function PlaylistsPage() {
  const { playlists, loading } = usePlaylists();
  const { deletePlaylist } = usePlaylistActions();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deletePlaylist(deleteId);
      toast.success("Playlist deleted");
    } catch {
      toast.error("Failed to delete playlist");
    }
    setDeleteId(null);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader
        title="Playlists"
        description="Create and manage content playlists"
        action={
          <Link
            to="/playlists/editor"
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors"
          >
            <HiOutlinePlus className="w-4 h-4" />
            Create Playlist
          </Link>
        }
      />

      {playlists.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200">
          <EmptyState
            icon={<HiOutlineCollection className="w-12 h-12" />}
            title="No playlists yet"
            description="Create playlists to organize your content and assign them to screens."
            action={
              <Link
                to="/playlists/editor"
                className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors"
              >
                Create Playlist
              </Link>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {playlists.map((playlist) => (
            <div
              key={playlist.id}
              className="bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-md transition-shadow group"
            >
              {/* Thumbnail area */}
              <div className="aspect-video bg-slate-100 relative flex items-center justify-center">
                <HiOutlineCollection className="w-10 h-10 text-slate-300" />
                <div className="absolute top-2 right-2">
                  <Badge variant={playlist.orientation === "landscape" ? "info" : "warning"}>
                    {playlist.orientation}
                  </Badge>
                </div>
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Link
                    to={`/playlists/editor/${playlist.id}`}
                    className="p-2 bg-white rounded-lg text-slate-700 hover:bg-orange-50 hover:text-primary"
                  >
                    <HiOutlinePencil className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => setDeleteId(playlist.id)}
                    className="p-2 bg-white rounded-lg text-slate-700 hover:bg-red-50 hover:text-red-600"
                  >
                    <HiOutlineTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="p-3">
                <h3 className="text-sm font-medium text-slate-900 truncate">
                  {playlist.name}
                </h3>
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                  <span>{playlist.items?.length || 0} items</span>
                  <span className="text-slate-300">|</span>
                  <span>{formatDuration(playlist.totalDuration || 0)}</span>
                </div>
                {playlist.updatedAt && (
                  <p className="text-[10px] text-slate-400 mt-1">
                    Updated{" "}
                    {formatDistanceToNow(playlist.updatedAt.toDate(), {
                      addSuffix: true,
                    })}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Playlist"
        message="Are you sure you want to delete this playlist? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}

import { useState } from "react";
import { Link } from "react-router-dom";
import {
  HiOutlineClock,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlinePencil,
} from "react-icons/hi";
import toast from "react-hot-toast";
import PageHeader from "../components/common/PageHeader";
import EmptyState from "../components/common/EmptyState";
import ConfirmDialog from "../components/common/ConfirmDialog";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { useSchedules, useScheduleActions } from "../hooks/useSchedules";
import { usePlaylists } from "../hooks/usePlaylists";

export default function SchedulesPage() {
  const { schedules, loading } = useSchedules();
  const { deleteSchedule } = useScheduleActions();
  const { playlists } = usePlaylists();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const getPlaylistName = (id: string) => {
    const p = playlists.find((x) => x.id === id);
    return p?.name || "Unknown";
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteSchedule(deleteId);
      toast.success("Schedule deleted");
    } catch {
      toast.error("Failed to delete schedule");
    }
    setDeleteId(null);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader
        title="Schedules"
        description="Set up content schedules for your screens"
        action={
          <Link
            to="/schedules/editor"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <HiOutlinePlus className="w-4 h-4" />
            Create Schedule
          </Link>
        }
      />

      {schedules.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200">
          <EmptyState
            icon={<HiOutlineClock className="w-12 h-12" />}
            title="No schedules yet"
            description="Create schedules to control when playlists play on your screens."
            action={
              <Link
                to="/schedules/editor"
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Schedule
              </Link>
            }
          />
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100">
          {schedules.map((schedule) => (
            <div
              key={schedule.id}
              className="flex items-center justify-between px-4 py-4 hover:bg-slate-50"
            >
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-medium text-slate-900">{schedule.name}</h3>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                  <span>{schedule.rules?.length || 0} rules</span>
                  <span className="text-slate-300">|</span>
                  <span>{schedule.screenIds?.length || 0} screens</span>
                  <span className="text-slate-300">|</span>
                  <span>
                    Default:{" "}
                    <span className="text-slate-700">
                      {schedule.defaultPlaylistId
                        ? getPlaylistName(schedule.defaultPlaylistId)
                        : "None"}
                    </span>
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  to={`/schedules/editor/${schedule.id}`}
                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  <HiOutlinePencil className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => setDeleteId(schedule.id)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <HiOutlineTrash className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Schedule"
        message="Are you sure you want to delete this schedule? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}

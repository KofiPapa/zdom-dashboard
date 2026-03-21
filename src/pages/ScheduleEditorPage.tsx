import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  HiOutlineArrowLeft,
  HiOutlineSave,
  HiOutlineTrash,
  HiOutlinePlus,
  HiOutlineX,
} from "react-icons/hi";
import toast from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";
import { useSchedule, useScheduleActions } from "../hooks/useSchedules";
import { usePlaylists } from "../hooks/usePlaylists";
import { useScreens } from "../hooks/useScreens";
import LoadingSpinner from "../components/common/LoadingSpinner";
import ConfirmDialog from "../components/common/ConfirmDialog";
import type { ScheduleRule } from "@shared/types/firestore-schema";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TIMELINE_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TIMELINE_DAY_MAP: Record<string, number> = {
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
  Sun: 0,
};

const RULE_COLORS = [
  "bg-blue-400",
  "bg-green-400",
  "bg-amber-400",
  "bg-purple-400",
  "bg-pink-400",
  "bg-teal-400",
  "bg-red-400",
  "bg-indigo-400",
];

function emptyRule(): ScheduleRule {
  return {
    id: uuidv4(),
    playlistId: "",
    priority: 1,
    startDate: null,
    endDate: null,
    startTime: "09:00",
    endTime: "17:00",
    daysOfWeek: [1, 2, 3, 4, 5],
    isRecurring: true,
  };
}

export default function ScheduleEditorPage() {
  const { scheduleId } = useParams<{ scheduleId: string }>();
  const navigate = useNavigate();
  const { schedule, loading: scheduleLoading } = useSchedule(scheduleId);
  const { createSchedule, updateSchedule, deleteSchedule } = useScheduleActions();
  const { playlists } = usePlaylists();
  const { screens } = useScreens();

  const [name, setName] = useState("");
  const [selectedScreenIds, setSelectedScreenIds] = useState<string[]>([]);
  const [defaultPlaylistId, setDefaultPlaylistId] = useState("");
  const [rules, setRules] = useState<ScheduleRule[]>([]);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Load existing schedule data
  useEffect(() => {
    if (schedule) {
      setName(schedule.name);
      setSelectedScreenIds(schedule.screenIds || []);
      setDefaultPlaylistId(schedule.defaultPlaylistId || "");
      setRules(schedule.rules || []);
    }
  }, [schedule]);

  const toggleScreen = (screenId: string) => {
    setSelectedScreenIds((prev) =>
      prev.includes(screenId)
        ? prev.filter((id) => id !== screenId)
        : [...prev, screenId]
    );
  };

  const addRule = () => {
    setRules([...rules, emptyRule()]);
  };

  const removeRule = (ruleId: string) => {
    setRules(rules.filter((r) => r.id !== ruleId));
  };

  const updateRule = (ruleId: string, updates: Partial<ScheduleRule>) => {
    setRules(rules.map((r) => (r.id === ruleId ? { ...r, ...updates } : r)));
  };

  const toggleDay = (ruleId: string, day: number) => {
    const rule = rules.find((r) => r.id === ruleId);
    if (!rule) return;
    const newDays = rule.daysOfWeek.includes(day)
      ? rule.daysOfWeek.filter((d) => d !== day)
      : [...rule.daysOfWeek, day];
    updateRule(ruleId, { daysOfWeek: newDays });
  };

  const setPresetDays = (ruleId: string, preset: "weekdays" | "weekend") => {
    if (preset === "weekdays") {
      updateRule(ruleId, { daysOfWeek: [1, 2, 3, 4, 5] });
    } else {
      updateRule(ruleId, { daysOfWeek: [0, 6] });
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Please enter a schedule name");
      return;
    }

    setSaving(true);
    try {
      const data = {
        name: name.trim(),
        screenIds: selectedScreenIds,
        defaultPlaylistId,
        rules,
      };

      if (scheduleId && schedule) {
        await updateSchedule(scheduleId, data);
        toast.success("Schedule updated");
      } else {
        const newId = await createSchedule(data);
        toast.success("Schedule created");
        navigate(`/schedules/editor/${newId}`, { replace: true });
      }
    } catch {
      toast.error("Failed to save schedule");
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!scheduleId) return;
    try {
      await deleteSchedule(scheduleId);
      toast.success("Schedule deleted");
      navigate("/schedules");
    } catch {
      toast.error("Failed to delete schedule");
    }
    setShowDeleteConfirm(false);
  };

  const getPlaylistName = (id: string) => {
    const p = playlists.find((x) => x.id === id);
    return p?.name || "Unknown";
  };

  if (scheduleId && scheduleLoading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/schedules")}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              <HiOutlineArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold text-slate-900">
              {scheduleId ? "Edit Schedule" : "Create Schedule"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {scheduleId && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
              >
                <HiOutlineTrash className="w-4 h-4" />
                Delete
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <HiOutlineSave className="w-4 h-4" />
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Schedule name */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Schedule Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter schedule name"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Assign screens */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h2 className="text-sm font-medium text-slate-900 mb-3">Assign Screens</h2>
          {screens.length === 0 ? (
            <p className="text-sm text-slate-500">No screens available.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {screens.map((screen) => (
                <label
                  key={screen.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedScreenIds.includes(screen.id)
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedScreenIds.includes(screen.id)}
                    onChange={() => toggleScreen(screen.id)}
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {screen.name}
                    </p>
                    {screen.location && (
                      <p className="text-xs text-slate-500 truncate">{screen.location}</p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Default playlist */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Default Playlist
          </label>
          <p className="text-xs text-slate-500 mb-2">
            Plays when no schedule rules match.
          </p>
          <select
            value={defaultPlaylistId}
            onChange={(e) => setDefaultPlaylistId(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">-- No default playlist --</option>
            {playlists.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Schedule rules */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-slate-900">Schedule Rules</h2>
            <button
              onClick={addRule}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
            >
              <HiOutlinePlus className="w-3.5 h-3.5" />
              Add Rule
            </button>
          </div>

          {rules.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">
              No rules yet. Add a rule to schedule playlists.
            </p>
          ) : (
            <div className="space-y-4">
              {rules.map((rule, ruleIndex) => (
                <div
                  key={rule.id}
                  className="border border-slate-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          RULE_COLORS[ruleIndex % RULE_COLORS.length]
                        }`}
                      />
                      <span className="text-sm font-medium text-slate-700">
                        Rule {ruleIndex + 1}
                      </span>
                    </div>
                    <button
                      onClick={() => removeRule(rule.id)}
                      className="p-1 text-slate-400 hover:text-red-600"
                    >
                      <HiOutlineX className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    {/* Playlist */}
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Playlist
                      </label>
                      <select
                        value={rule.playlistId}
                        onChange={(e) =>
                          updateRule(rule.id, { playlistId: e.target.value })
                        }
                        className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                      >
                        <option value="">-- Select playlist --</option>
                        {playlists.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Priority */}
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Priority
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={rule.priority}
                        onChange={(e) =>
                          updateRule(rule.id, {
                            priority: parseInt(e.target.value) || 1,
                          })
                        }
                        className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                      />
                    </div>
                  </div>

                  {/* Time range */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={rule.startTime}
                        onChange={(e) =>
                          updateRule(rule.id, { startTime: e.target.value })
                        }
                        className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        End Time
                      </label>
                      <input
                        type="time"
                        value={rule.endTime}
                        onChange={(e) =>
                          updateRule(rule.id, { endTime: e.target.value })
                        }
                        className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                      />
                    </div>
                  </div>

                  {/* Days of week */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-medium text-slate-600">
                        Days
                      </label>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setPresetDays(rule.id, "weekdays")}
                          className="px-2 py-0.5 text-[10px] text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
                        >
                          Weekdays
                        </button>
                        <button
                          onClick={() => setPresetDays(rule.id, "weekend")}
                          className="px-2 py-0.5 text-[10px] text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
                        >
                          Weekend
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {DAYS.map((label, dayIndex) => (
                        <button
                          key={dayIndex}
                          onClick={() => toggleDay(rule.id, dayIndex)}
                          className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors ${
                            rule.daysOfWeek.includes(dayIndex)
                              ? "bg-blue-600 text-white"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Visual weekly timeline */}
        {rules.length > 0 && (
          <WeeklyTimeline rules={rules} getPlaylistName={getPlaylistName} />
        )}
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete Schedule"
        message="Are you sure you want to delete this schedule? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}

// --------------- Weekly Timeline ---------------

function WeeklyTimeline({
  rules,
  getPlaylistName,
}: {
  rules: ScheduleRule[];
  getPlaylistName: (id: string) => string;
}) {
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getBlocksForDay = (dayIndex: number) => {
    return rules
      .filter((rule) => rule.daysOfWeek.includes(dayIndex))
      .map((rule) => {
        const startParts = rule.startTime.split(":").map(Number);
        const endParts = rule.endTime.split(":").map(Number);
        const startHour = startParts[0] + (startParts[1] || 0) / 60;
        const endHour = endParts[0] + (endParts[1] || 0) / 60;

        const top = (startHour / 24) * 100;
        const height =
          endHour > startHour
            ? ((endHour - startHour) / 24) * 100
            : ((24 - startHour + endHour) / 24) * 100;

        const colorIndex = rules.indexOf(rule) % RULE_COLORS.length;

        return {
          id: rule.id,
          top,
          height: Math.max(height, 2),
          color: RULE_COLORS[colorIndex],
          name: rule.playlistId ? getPlaylistName(rule.playlistId) : "No playlist",
          time: `${rule.startTime} - ${rule.endTime}`,
        };
      });
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <h2 className="text-sm font-medium text-slate-900 mb-4">Weekly Overview</h2>
      <div className="flex">
        {/* Hour labels */}
        <div className="w-10 flex-shrink-0">
          {hours.map((h) => (
            <div
              key={h}
              className="h-6 flex items-start justify-end pr-2 text-[10px] text-slate-400"
            >
              {h.toString().padStart(2, "0")}
            </div>
          ))}
        </div>

        {/* Day columns */}
        <div className="flex-1 grid grid-cols-7 gap-1">
          {TIMELINE_DAYS.map((dayLabel) => {
            const dayIndex = TIMELINE_DAY_MAP[dayLabel];
            const blocks = getBlocksForDay(dayIndex);

            return (
              <div key={dayLabel}>
                <div className="text-center text-xs font-medium text-slate-600 mb-1">
                  {dayLabel}
                </div>
                <div className="relative bg-slate-50 rounded" style={{ height: `${24 * 24}px` }}>
                  {/* Hour grid lines */}
                  {hours.map((h) => (
                    <div
                      key={h}
                      className="absolute w-full border-t border-slate-100"
                      style={{ top: `${(h / 24) * 100}%` }}
                    />
                  ))}
                  {/* Rule blocks */}
                  {blocks.map((block) => (
                    <div
                      key={block.id}
                      className={`absolute left-0.5 right-0.5 ${block.color} rounded opacity-80`}
                      style={{
                        top: `${block.top}%`,
                        height: `${block.height}%`,
                      }}
                      title={`${block.name}\n${block.time}`}
                    >
                      <span className="block text-[8px] text-white font-medium px-1 pt-0.5 truncate">
                        {block.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval } from "date-fns";
import {
  HiOutlinePlay,
  HiOutlineClock,
  HiOutlineDesktopComputer,
  HiOutlineFilm,
  HiOutlineDownload,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
} from "react-icons/hi";
import { useAuth } from "../contexts/AuthContext";
import { useScreens } from "../hooks/useScreens";
import { usePlaylists } from "../hooks/usePlaylists";
import { db } from "../lib/firebase";
import { formatDuration } from "@shared/utils";
import PageHeader from "../components/common/PageHeader";
import LoadingSpinner from "../components/common/LoadingSpinner";

// ---------- Types ----------

interface PlayLog {
  id: string;
  organizationId: string;
  screenId: string;
  screenName: string;
  playlistId: string;
  playlistName: string;
  contentId: string;
  contentName: string;
  contentType: string;
  duration: number;
  startedAt: Timestamp;
  endedAt: Timestamp | null;
}

type DateRangePreset = "today" | "7days" | "30days" | "custom";
type ActiveTab = "overview" | "proof";

const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];
const ROWS_PER_PAGE = 50;

// ---------- Component ----------

export default function AnalyticsPage() {
  const { profile } = useAuth();
  const { screens } = useScreens();
  const { playlists } = usePlaylists();

  // Date range state
  const [preset, setPreset] = useState<DateRangePreset>("7days");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [startDate, setStartDate] = useState<Date>(() => startOfDay(subDays(new Date(), 6)));
  const [endDate, setEndDate] = useState<Date>(() => endOfDay(new Date()));

  // Tab state
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");

  // Data state
  const [playLogs, setPlayLogs] = useState<PlayLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Proof of Play filters
  const [selectedScreenIds, setSelectedScreenIds] = useState<string[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);

  // Update date range when preset changes
  useEffect(() => {
    const now = new Date();
    switch (preset) {
      case "today":
        setStartDate(startOfDay(now));
        setEndDate(endOfDay(now));
        break;
      case "7days":
        setStartDate(startOfDay(subDays(now, 6)));
        setEndDate(endOfDay(now));
        break;
      case "30days":
        setStartDate(startOfDay(subDays(now, 29)));
        setEndDate(endOfDay(now));
        break;
      case "custom":
        if (customStart && customEnd) {
          setStartDate(startOfDay(new Date(customStart)));
          setEndDate(endOfDay(new Date(customEnd)));
        }
        break;
    }
  }, [preset, customStart, customEnd]);

  // Fetch play logs
  useEffect(() => {
    if (!profile?.organizationId) return;

    const fetchLogs = async () => {
      setLoading(true);
      try {
        const logsRef = collection(db, "playLogs");
        const q = query(
          logsRef,
          where("organizationId", "==", profile.organizationId),
          where("startedAt", ">=", Timestamp.fromDate(startDate)),
          where("startedAt", "<=", Timestamp.fromDate(endDate))
        );

        const snapshot = await getDocs(q);
        const logs: PlayLog[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as PlayLog[];

        setPlayLogs(logs);
      } catch (err) {
        console.error("Failed to fetch play logs:", err);
        setPlayLogs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [profile?.organizationId, startDate, endDate]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedScreenIds, selectedPlaylistId, startDate, endDate]);

  // ---------- Computed data ----------

  const totalPlays = playLogs.length;
  const totalPlayTime = useMemo(
    () => playLogs.reduce((sum, log) => sum + (log.duration || 0), 0),
    [playLogs]
  );

  const screenCount = useMemo(() => {
    const unique = new Set(playLogs.map((l) => l.screenId));
    return unique.size || 1;
  }, [playLogs]);

  const dayCount = useMemo(() => {
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    return days.length || 1;
  }, [startDate, endDate]);

  const avgPlaysPerScreenPerDay = useMemo(
    () => Math.round(totalPlays / screenCount / dayCount),
    [totalPlays, screenCount, dayCount]
  );

  const mostPlayedContent = useMemo(() => {
    if (playLogs.length === 0) return "N/A";
    const counts: Record<string, { name: string; count: number }> = {};
    playLogs.forEach((log) => {
      if (!counts[log.contentId]) {
        counts[log.contentId] = { name: log.contentName || log.contentId, count: 0 };
      }
      counts[log.contentId].count++;
    });
    const sorted = Object.values(counts).sort((a, b) => b.count - a.count);
    return sorted[0]?.name || "N/A";
  }, [playLogs]);

  // Chart: Plays over time
  const playsOverTimeData = useMemo(() => {
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const countMap: Record<string, number> = {};
    playLogs.forEach((log) => {
      const key = format(log.startedAt.toDate(), "yyyy-MM-dd");
      countMap[key] = (countMap[key] || 0) + 1;
    });
    return days.map((d) => ({
      date: format(d, "MMM dd"),
      plays: countMap[format(d, "yyyy-MM-dd")] || 0,
    }));
  }, [playLogs, startDate, endDate]);

  // Chart: Plays by screen
  const playsByScreenData = useMemo(() => {
    const map: Record<string, { name: string; plays: number }> = {};
    playLogs.forEach((log) => {
      if (!map[log.screenId]) {
        map[log.screenId] = { name: log.screenName || log.screenId, plays: 0 };
      }
      map[log.screenId].plays++;
    });
    return Object.values(map).sort((a, b) => b.plays - a.plays);
  }, [playLogs]);

  // Chart: Content breakdown by type
  const contentBreakdownData = useMemo(() => {
    const map: Record<string, number> = {};
    playLogs.forEach((log) => {
      const type = log.contentType || "unknown";
      map[type] = (map[type] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [playLogs]);

  // Chart: Peak hours
  const peakHoursData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({ hour: `${i}:00`, plays: 0 }));
    playLogs.forEach((log) => {
      const h = log.startedAt.toDate().getHours();
      hours[h].plays++;
    });
    return hours;
  }, [playLogs]);

  // Proof of play filtered data
  const filteredProofLogs = useMemo(() => {
    let filtered = playLogs;
    if (selectedScreenIds.length > 0) {
      filtered = filtered.filter((l) => selectedScreenIds.includes(l.screenId));
    }
    if (selectedPlaylistId) {
      filtered = filtered.filter((l) => l.playlistId === selectedPlaylistId);
    }
    return filtered;
  }, [playLogs, selectedScreenIds, selectedPlaylistId]);

  const totalPages = Math.max(1, Math.ceil(filteredProofLogs.length / ROWS_PER_PAGE));
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    return filteredProofLogs.slice(start, start + ROWS_PER_PAGE);
  }, [filteredProofLogs, currentPage]);

  // Export CSV
  const handleExportCSV = useCallback(() => {
    const header = "Date/Time,Screen Name,Playlist Name,Content Name,Duration (s)\n";
    const rows = filteredProofLogs
      .map(
        (log) =>
          `"${format(log.startedAt.toDate(), "yyyy-MM-dd HH:mm:ss")}","${log.screenName || ""}","${log.playlistName || ""}","${log.contentName || ""}",${log.duration || 0}`
      )
      .join("\n");
    const csv = header + rows;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `proof-of-play-${format(startDate, "yyyy-MM-dd")}-to-${format(endDate, "yyyy-MM-dd")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [filteredProofLogs, startDate, endDate]);

  // Screen multi-select toggle
  const toggleScreenFilter = (screenId: string) => {
    setSelectedScreenIds((prev) =>
      prev.includes(screenId) ? prev.filter((id) => id !== screenId) : [...prev, screenId]
    );
  };

  // ---------- Render ----------

  const hasData = playLogs.length > 0;

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Monitor content playback performance and generate reports"
      />

      {/* Date Range Picker */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-2">
          {(["today", "7days", "30days", "custom"] as DateRangePreset[]).map((p) => (
            <button
              key={p}
              onClick={() => setPreset(p)}
              className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
                preset === p
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {p === "today" ? "Today" : p === "7days" ? "7 Days" : p === "30days" ? "30 Days" : "Custom"}
            </button>
          ))}
          {preset === "custom" && (
            <div className="flex items-center gap-2 ml-2">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="border border-slate-300 rounded-md px-2 py-1.5 text-sm"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="border border-slate-300 rounded-md px-2 py-1.5 text-sm"
              />
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 mb-6">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "overview"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("proof")}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "proof"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Proof of Play Report
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : activeTab === "overview" ? (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={<HiOutlinePlay className="w-6 h-6 text-blue-600" />}
              label="Total Plays"
              value={totalPlays.toLocaleString()}
            />
            <StatCard
              icon={<HiOutlineClock className="w-6 h-6 text-green-600" />}
              label="Total Play Time"
              value={formatDuration(totalPlayTime)}
            />
            <StatCard
              icon={<HiOutlineDesktopComputer className="w-6 h-6 text-amber-600" />}
              label="Avg Plays/Screen/Day"
              value={avgPlaysPerScreenPerDay.toLocaleString()}
            />
            <StatCard
              icon={<HiOutlineFilm className="w-6 h-6 text-purple-600" />}
              label="Most Played Content"
              value={mostPlayedContent}
              truncate
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Plays Over Time */}
            <ChartCard title="Plays Over Time">
              {hasData ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={playsOverTimeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="plays"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      name="Plays"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart />
              )}
            </ChartCard>

            {/* Plays by Screen */}
            <ChartCard title="Plays by Screen">
              {hasData ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={playsByScreenData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="plays" fill="#3b82f6" name="Plays" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart />
              )}
            </ChartCard>

            {/* Content Breakdown */}
            <ChartCard title="Content Breakdown">
              {hasData ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={contentBreakdownData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) =>
                        `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`
                      }
                    >
                      {contentBreakdownData.map((_, idx) => (
                        <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart />
              )}
            </ChartCard>

            {/* Peak Hours */}
            <ChartCard title="Peak Hours">
              {hasData ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={peakHoursData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="plays" fill="#10b981" name="Plays" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart />
              )}
            </ChartCard>
          </div>
        </>
      ) : (
        /* Proof of Play Tab */
        <div>
          {/* Filters */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 mb-6">
            <div className="flex flex-wrap items-start gap-4">
              {/* Screen multi-select */}
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Screens
                </label>
                <div className="border border-slate-300 rounded-md max-h-32 overflow-y-auto p-2">
                  {screens.length === 0 ? (
                    <p className="text-sm text-slate-400">No screens</p>
                  ) : (
                    screens.map((screen) => (
                      <label
                        key={screen.id}
                        className="flex items-center gap-2 py-0.5 text-sm cursor-pointer hover:bg-slate-50 rounded px-1"
                      >
                        <input
                          type="checkbox"
                          checked={selectedScreenIds.includes(screen.id)}
                          onChange={() => toggleScreenFilter(screen.id)}
                          className="rounded border-slate-300"
                        />
                        <span className="truncate">{screen.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* Playlist selector */}
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Playlist
                </label>
                <select
                  value={selectedPlaylistId}
                  onChange={(e) => setSelectedPlaylistId(e.target.value)}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="">All Playlists</option>
                  {playlists.map((pl) => (
                    <option key={pl.id} value={pl.id}>
                      {pl.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Export */}
              <div className="flex items-end">
                <button
                  onClick={handleExportCSV}
                  disabled={filteredProofLogs.length === 0}
                  className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <HiOutlineDownload className="w-4 h-4" />
                  Export CSV
                </button>
              </div>
            </div>
          </div>

          {/* Results Table */}
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            {filteredProofLogs.length === 0 ? (
              <div className="p-12 text-center">
                <HiOutlinePlay className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No data yet</p>
                <p className="text-sm text-slate-400 mt-1">
                  Play logs will appear here once screens start playing content.
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="text-left px-4 py-3 font-medium text-slate-600">
                          Date/Time
                        </th>
                        <th className="text-left px-4 py-3 font-medium text-slate-600">
                          Screen Name
                        </th>
                        <th className="text-left px-4 py-3 font-medium text-slate-600">
                          Playlist Name
                        </th>
                        <th className="text-left px-4 py-3 font-medium text-slate-600">
                          Content Name
                        </th>
                        <th className="text-right px-4 py-3 font-medium text-slate-600">
                          Duration
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                            {format(log.startedAt.toDate(), "yyyy-MM-dd HH:mm:ss")}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {log.screenName || log.screenId}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {log.playlistName || log.playlistId || "-"}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {log.contentName || log.contentId}
                          </td>
                          <td className="px-4 py-3 text-slate-500 text-right whitespace-nowrap">
                            {formatDuration(log.duration || 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
                  <p className="text-sm text-slate-500">
                    Showing {(currentPage - 1) * ROWS_PER_PAGE + 1} -{" "}
                    {Math.min(currentPage * ROWS_PER_PAGE, filteredProofLogs.length)} of{" "}
                    {filteredProofLogs.length} results
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded-md border border-slate-300 disabled:opacity-40 hover:bg-slate-50 transition-colors"
                    >
                      <HiOutlineChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-slate-600">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-1.5 rounded-md border border-slate-300 disabled:opacity-40 hover:bg-slate-50 transition-colors"
                    >
                      <HiOutlineChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Sub-components ----------

function StatCard({
  icon,
  label,
  value,
  truncate,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  truncate?: boolean;
}) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5">
      <div className="flex items-center gap-3 mb-2">{icon}</div>
      <p className="text-sm text-slate-500">{label}</p>
      <p
        className={`text-xl font-semibold text-slate-900 mt-0.5 ${truncate ? "truncate" : ""}`}
        title={truncate ? value : undefined}
      >
        {value}
      </p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">{title}</h3>
      {children}
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex items-center justify-center h-[300px] text-slate-400">
      <div className="text-center">
        <HiOutlinePlay className="w-10 h-10 mx-auto mb-2 text-slate-300" />
        <p className="text-sm font-medium">No data yet</p>
        <p className="text-xs mt-1">Data will appear once screens start playing content.</p>
      </div>
    </div>
  );
}

import {
  HiOutlineDesktopComputer,
  HiOutlineStatusOnline,
  HiOutlinePhotograph,
  HiOutlineCollection,
  HiOutlinePlus,
  HiOutlineUpload,
} from "react-icons/hi";
import { Link } from "react-router-dom";
import { useScreens } from "../hooks/useScreens";
import { useMedia } from "../hooks/useMedia";
import { usePlaylists } from "../hooks/usePlaylists";
import Badge from "../components/common/Badge";

export default function DashboardHome() {
  const { screens } = useScreens();
  const { media } = useMedia();
  const { playlists } = usePlaylists();

  const onlineCount = screens.filter((s) => s.status === "online").length;

  const stats = [
    { label: "Total Screens", value: screens.length, icon: HiOutlineDesktopComputer, color: "text-primary bg-orange-50" },
    { label: "Online Screens", value: onlineCount, icon: HiOutlineStatusOnline, color: "text-green-600 bg-green-50" },
    { label: "Media Items", value: media.length, icon: HiOutlinePhotograph, color: "text-purple-600 bg-purple-50" },
    { label: "Playlists", value: playlists.length, icon: HiOutlineCollection, color: "text-amber-600 bg-amber-50" },
  ];

  const recentActivity = [
    { message: "Welcome to ZDOM! Add your first screen to get started.", time: "Just now" },
    { message: "Your account has been created successfully.", time: "Just now" },
  ];

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <Link
              to="/screens"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <div className="p-2 bg-orange-50 rounded-lg">
                <HiOutlinePlus className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm font-medium text-slate-700">Add Screen</span>
            </Link>
            <Link
              to="/media"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <div className="p-2 bg-purple-50 rounded-lg">
                <HiOutlineUpload className="w-4 h-4 text-purple-600" />
              </div>
              <span className="text-sm font-medium text-slate-700">Upload Media</span>
            </Link>
            <Link
              to="/playlists"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <div className="p-2 bg-amber-50 rounded-lg">
                <HiOutlineCollection className="w-4 h-4 text-amber-600" />
              </div>
              <span className="text-sm font-medium text-slate-700">Create Playlist</span>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {recentActivity.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                <div>
                  <p className="text-sm text-slate-600">{item.message}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Screen Status */}
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Screen Status</h3>
          {screens.length === 0 ? (
            <p className="text-sm text-slate-400">No screens registered yet.</p>
          ) : (
            <div className="space-y-2">
              {screens.slice(0, 5).map((screen) => (
                <div key={screen.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50">
                  <span className="text-sm text-slate-700">{screen.name}</span>
                  <Badge variant={screen.status === "online" ? "online" : screen.status === "error" ? "error" : "offline"} dot>
                    {screen.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

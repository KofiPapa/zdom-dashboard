import { useLocation } from "react-router-dom";
import { HiOutlineSearch, HiOutlineBell } from "react-icons/hi";
import { useAuth } from "../../contexts/AuthContext";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/screens": "Screens",
  "/media": "Media Library",
  "/templates": "Templates",
  "/playlists": "Playlists",
  "/schedules": "Schedules",
  "/analytics": "Analytics",
  "/settings": "Settings",
};

export default function TopBar() {
  const location = useLocation();
  const { profile, signOut } = useAuth();
  const title = pageTitles[location.pathname] || "Dashboard";

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search..."
            className="pl-9 pr-4 py-2 w-64 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* Notifications */}
        <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors">
          <HiOutlineBell className="w-5 h-5" />
        </button>

        {/* User dropdown */}
        <div className="relative group">
          <button className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-medium">
              {profile?.displayName?.charAt(0)?.toUpperCase() || "U"}
            </div>
          </button>
          <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 hidden group-hover:block">
            <div className="px-4 py-2 border-b border-slate-100">
              <p className="text-sm font-medium text-slate-900">{profile?.displayName}</p>
              <p className="text-xs text-slate-500">{profile?.email}</p>
            </div>
            <button
              onClick={signOut}
              className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

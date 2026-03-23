import { NavLink } from "react-router-dom";
import {
  HiOutlineHome,
  HiOutlineDesktopComputer,
  HiOutlinePhotograph,
  HiOutlineTemplate,
  HiOutlineCollection,
  HiOutlineClock,
  HiOutlineChartBar,
  HiOutlineCog,
} from "react-icons/hi";
import { useAuth } from "../../contexts/AuthContext";

const navItems = [
  { to: "/", icon: HiOutlineHome, label: "Dashboard" },
  { to: "/screens", icon: HiOutlineDesktopComputer, label: "Screens" },
  { to: "/media", icon: HiOutlinePhotograph, label: "Media" },
  { to: "/templates", icon: HiOutlineTemplate, label: "Templates" },
  { to: "/playlists", icon: HiOutlineCollection, label: "Playlists" },
  { to: "/schedules", icon: HiOutlineClock, label: "Schedules" },
  { to: "/analytics", icon: HiOutlineChartBar, label: "Analytics" },
  { to: "/settings", icon: HiOutlineCog, label: "Settings" },
];

export default function Sidebar() {
  const { profile, organization, signOut } = useAuth();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-slate-900 text-white flex flex-col z-30">
      {/* Logo */}
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-xl font-bold tracking-tight">ZDOM</h1>
        {organization && (
          <p className="text-sm text-slate-400 mt-1 truncate">{organization.name}</p>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-6 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary/10 text-white border-r-2 border-primary"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-sm font-medium">
            {profile?.displayName?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{profile?.displayName}</p>
            <p className="text-xs text-slate-400 truncate">{profile?.email}</p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="mt-3 w-full text-left text-xs text-slate-400 hover:text-white transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}

import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import TrialBanner from "../billing/TrialBanner";

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="ml-64">
        <TopBar />
        <main className="p-6">
          <TrialBanner />
          <Outlet />
        </main>
      </div>
    </div>
  );
}

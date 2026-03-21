import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import DashboardLayout from "./components/layout/DashboardLayout";
import LoginPage from "./components/auth/LoginPage";
import RegisterPage from "./components/auth/RegisterPage";
import DashboardHome from "./pages/DashboardHome";
import ScreensPage from "./pages/ScreensPage";
import ScreenDetailPage from "./pages/ScreenDetailPage";
import MediaPage from "./pages/MediaPage";
import TemplatesPage from "./pages/TemplatesPage";
import PlaylistsPage from "./pages/PlaylistsPage";
import SchedulesPage from "./pages/SchedulesPage";
import SettingsPage from "./pages/SettingsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import TemplateEditor from "./components/editor/TemplateEditor";
import PlaylistEditorPage from "./pages/PlaylistEditorPage";
import ScheduleEditorPage from "./pages/ScheduleEditorPage";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/templates/editor/:templateId?"
              element={
                <ProtectedRoute>
                  <TemplateEditor />
                </ProtectedRoute>
              }
            />
            <Route
              path="/playlists/editor/:playlistId?"
              element={
                <ProtectedRoute>
                  <PlaylistEditorPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/schedules/editor/:scheduleId?"
              element={
                <ProtectedRoute>
                  <ScheduleEditorPage />
                </ProtectedRoute>
              }
            />
            <Route
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<DashboardHome />} />
              <Route path="/screens" element={<ScreensPage />} />
              <Route path="/screens/:screenId" element={<ScreenDetailPage />} />
              <Route path="/media" element={<MediaPage />} />
              <Route path="/templates" element={<TemplatesPage />} />
              <Route path="/playlists" element={<PlaylistsPage />} />
              <Route path="/schedules" element={<SchedulesPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Routes>
          <Toaster position="top-right" />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

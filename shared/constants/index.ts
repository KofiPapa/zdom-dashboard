import type { ResolutionPreset, WidgetType } from "../types/firestore-schema";

export const RESOLUTION_PRESETS: Record<string, ResolutionPreset> = {
  FHD_LANDSCAPE: { name: "Full HD Landscape", width: 1920, height: 1080, orientation: "landscape" },
  FHD_PORTRAIT: { name: "Full HD Portrait", width: 1080, height: 1920, orientation: "portrait" },
  HD_LANDSCAPE: { name: "HD Landscape", width: 1280, height: 720, orientation: "landscape" },
  HD_PORTRAIT: { name: "HD Portrait", width: 720, height: 1280, orientation: "portrait" },
  UHD_LANDSCAPE: { name: "4K Landscape", width: 3840, height: 2160, orientation: "landscape" },
};

export const DEFAULT_TRANSITION_DURATION = 500; // ms
export const HEARTBEAT_INTERVAL = 60000; // ms (1 minute)
export const PAIRING_CODE_EXPIRY = 15 * 60 * 1000; // 15 minutes
export const MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20MB
export const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
export const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm"];
export const THUMBNAIL_WIDTH = 320;

export const WIDGET_DEFAULTS: Record<WidgetType, object> = {
  clock: { format: "12h", showDate: true, timezone: "auto" },
  weather: { location: "auto", units: "imperial", showForecast: false },
  ticker: { text: "", speed: 50, direction: "left", backgroundColor: "#000", textColor: "#fff" },
  rss: { feedUrl: "", maxItems: 5, showImages: true, refreshMinutes: 15 },
  youtube: { videoId: "", autoplay: true, mute: true, loop: true },
  webpage: { url: "", refreshMinutes: 0, scrollEnabled: false },
  qrcode: { data: "", size: 200, foreground: "#000", background: "#fff" },
  "social-media": { platform: "instagram", handle: "", showLatest: 5 },
  countdown: { targetDate: "", title: "", showDays: true, showHours: true },
  "google-slides": { presentationId: "", autoAdvance: true, intervalSeconds: 10 },
};

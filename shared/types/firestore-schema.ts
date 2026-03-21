import { Timestamp } from "firebase/firestore";

// ============================================
// Enums and Literal Types
// ============================================

export type UserRole = "owner" | "admin" | "editor" | "viewer";
export type PlanType = "free" | "starter" | "pro" | "enterprise";
export type Orientation = "landscape" | "portrait" | "landscape-flipped" | "portrait-flipped";
export type ScreenStatus = "online" | "offline" | "error";
export type MediaType = "image" | "video" | "document";
export type ZoneType = "media" | "widget" | "text";
export type TransitionType = "none" | "fade" | "slide-left" | "slide-right" | "slide-up" | "slide-down" | "zoom-in";
export type TemplateCategory = "menu" | "announcement" | "welcome" | "custom" | "retail" | "corporate" | "education" | "healthcare";
export type WidgetType = "clock" | "weather" | "ticker" | "rss" | "youtube" | "webpage" | "qrcode" | "social-media" | "countdown" | "google-slides";

// ============================================
// Shared Sub-types
// ============================================

export interface Resolution {
  width: number;
  height: number;
}

export interface DeviceInfo {
  model: string;
  os: string;
  appVersion: string;
  ipAddress: string;
  macAddress?: string;
}

export interface BrandColors {
  primary: string;
  secondary: string;
}

export interface OrganizationSettings {
  defaultOrientation: Orientation;
  defaultTimezone: string;
  brandColors: BrandColors;
}

export interface TextStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: "normal" | "bold";
  color: string;
  backgroundColor?: string;
  textAlign: "left" | "center" | "right";
  verticalAlign: "top" | "middle" | "bottom";
  padding: number;
  lineHeight: number;
  letterSpacing: number;
  textTransform?: "none" | "uppercase" | "lowercase";
  scrolling?: {
    enabled: boolean;
    speed: number;
    direction: "left" | "right" | "up" | "down";
  };
}

export interface ZoneContent {
  mediaId?: string;
  mediaUrl?: string;
  mediaThumbnail?: string;
  widgetType?: WidgetType;
  widgetConfig?: Record<string, unknown>;
  text?: string;
  textStyle?: TextStyle;
  objectFit?: "cover" | "contain" | "fill" | "none";
}

export interface Zone {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: ZoneType;
  content: ZoneContent;
  zIndex: number;
  backgroundColor?: string;
  borderRadius?: number;
  opacity?: number;
}

export interface PlaylistItem {
  id: string;
  type: "media" | "template";
  mediaId?: string;
  templateId?: string;
  duration: number;
  transition: TransitionType;
  order: number;
}

export interface ScheduleRule {
  id: string;
  playlistId: string;
  priority: number;
  startDate: Timestamp | null;
  endDate: Timestamp | null;
  startTime: string;
  endTime: string;
  daysOfWeek: number[];
  isRecurring: boolean;
}

// ============================================
// Firestore Document Types (Full — with id & timestamps)
// ============================================

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  organizationId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Organization {
  id: string;
  name: string;
  ownerId: string;
  plan: PlanType;
  maxScreens: number;
  createdAt: Timestamp;
  settings: OrganizationSettings;
}

export interface Screen {
  id: string;
  name: string;
  organizationId: string;
  pairingCode: string;
  pairingCodeExpiresAt: Timestamp;
  isPaired: boolean;
  orientation: Orientation;
  resolution: Resolution;
  currentPlaylistId: string | null;
  currentScheduleId: string | null;
  status: ScreenStatus;
  lastHeartbeat: Timestamp;
  deviceInfo: DeviceInfo;
  location: string;
  tags: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Media {
  id: string;
  name: string;
  organizationId: string;
  uploadedBy: string;
  type: MediaType;
  mimeType: string;
  fileSize: number;
  dimensions: Resolution;
  duration: number | null;
  storageUrl: string;
  downloadUrl: string;
  thumbnailUrl: string;
  tags: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Template {
  id: string;
  name: string;
  organizationId: string;
  createdBy: string;
  orientation: Orientation;
  resolution: Resolution;
  thumbnail: string;
  isPublic: boolean;
  category: TemplateCategory;
  zones: Zone[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Playlist {
  id: string;
  name: string;
  organizationId: string;
  createdBy: string;
  orientation: Orientation;
  items: PlaylistItem[];
  totalDuration: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Schedule {
  id: string;
  name: string;
  organizationId: string;
  screenIds: string[];
  rules: ScheduleRule[];
  defaultPlaylistId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface PlayLog {
  id: string;
  organizationId: string;
  screenId: string;
  playlistId: string;
  itemId: string;
  mediaId: string | null;
  templateId: string | null;
  startedAt: Timestamp;
  endedAt: Timestamp;
  duration: number;
}

// ============================================
// Create DTOs (without id and timestamps)
// ============================================

export type CreateUser = Omit<User, "id" | "createdAt" | "updatedAt">;
export type CreateOrganization = Omit<Organization, "id" | "createdAt">;
export type CreateScreen = Omit<Screen, "id" | "createdAt" | "updatedAt" | "pairingCode" | "pairingCodeExpiresAt" | "isPaired" | "status" | "lastHeartbeat" | "deviceInfo">;
export type CreateMedia = Omit<Media, "id" | "createdAt" | "updatedAt" | "downloadUrl" | "thumbnailUrl">;
export type CreateTemplate = Omit<Template, "id" | "createdAt" | "updatedAt">;
export type CreatePlaylist = Omit<Playlist, "id" | "createdAt" | "updatedAt">;
export type CreateSchedule = Omit<Schedule, "id" | "createdAt" | "updatedAt">;
export type CreatePlayLog = Omit<PlayLog, "id">;

// ============================================
// Player State
// ============================================

export interface PlayerState {
  screenId: string;
  currentPlaylistId: string | null;
  currentItemIndex: number;
  isPlaying: boolean;
  isOffline: boolean;
  orientation: Orientation;
  resolution: Resolution;
}

// ============================================
// API Types
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PairingRequest {
  code: string;
  deviceInfo: DeviceInfo;
}

export interface PairingResponse {
  screenId: string;
  customToken: string;
  organizationId: string;
  orientation: Orientation;
  resolution: Resolution;
}

export interface ResolutionPreset {
  name: string;
  width: number;
  height: number;
  orientation: Orientation;
}

export interface ScheduleResult {
  playlistId: string;
  ruleName: string;
  priority: number;
}

export interface WidgetConfig {
  type: WidgetType;
  config: Record<string, unknown>;
  refreshInterval?: number;
}

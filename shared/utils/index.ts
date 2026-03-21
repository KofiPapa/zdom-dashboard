import type { Schedule, ScheduleRule, ScheduleResult, Orientation, MediaType } from "../types/firestore-schema";

/**
 * Generates a random 6-digit numeric pairing code.
 */
export function generatePairingCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Evaluates a schedule and returns the playlist that should be playing now.
 */
export function evaluateSchedule(
  schedule: Schedule,
  currentDate: Date = new Date()
): ScheduleResult | null {
  const currentDay = currentDate.getDay();
  const currentTimeStr =
    currentDate.getHours().toString().padStart(2, "0") +
    ":" +
    currentDate.getMinutes().toString().padStart(2, "0");

  let bestMatch: { rule: ScheduleRule; priority: number } | null = null;

  for (const rule of schedule.rules) {
    // Check day of week
    if (rule.daysOfWeek.length > 0 && !rule.daysOfWeek.includes(currentDay)) {
      continue;
    }

    // Check date range (if set)
    if (rule.startDate) {
      const startDate = rule.startDate.toDate();
      if (currentDate < startDate) continue;
    }
    if (rule.endDate) {
      const endDate = rule.endDate.toDate();
      if (currentDate > endDate) continue;
    }

    // Check time range
    if (rule.startTime && rule.endTime) {
      if (rule.startTime <= rule.endTime) {
        // Normal range (e.g., 09:00 - 17:00)
        if (currentTimeStr < rule.startTime || currentTimeStr >= rule.endTime) {
          continue;
        }
      } else {
        // Overnight range (e.g., 22:00 - 06:00)
        if (currentTimeStr < rule.startTime && currentTimeStr >= rule.endTime) {
          continue;
        }
      }
    }

    // This rule matches — check priority
    if (!bestMatch || rule.priority > bestMatch.priority) {
      bestMatch = { rule, priority: rule.priority };
    }
  }

  if (bestMatch) {
    return {
      playlistId: bestMatch.rule.playlistId,
      ruleName: `Rule ${bestMatch.rule.id}`,
      priority: bestMatch.priority,
    };
  }

  return null;
}

/**
 * Returns correct width/height based on orientation.
 */
export function getOrientationDimensions(
  orientation: Orientation,
  baseWidth: number,
  baseHeight: number
): { width: number; height: number } {
  if (orientation === "portrait" || orientation === "portrait-flipped") {
    return { width: Math.min(baseWidth, baseHeight), height: Math.max(baseWidth, baseHeight) };
  }
  return { width: Math.max(baseWidth, baseHeight), height: Math.min(baseWidth, baseHeight) };
}

/**
 * Converts seconds to human-readable duration.
 */
export function formatDuration(seconds: number): string {
  if (seconds < 0) return "0s";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

/**
 * Converts bytes to human-readable file size.
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/**
 * Returns media type from MIME type string.
 */
export function getMediaType(mimeType: string): MediaType {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  return "document";
}

/**
 * Checks if MIME type is a video.
 */
export function isVideoFile(mimeType: string): boolean {
  return mimeType.startsWith("video/");
}

/**
 * Checks if MIME type is an image.
 */
export function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

/**
 * Returns the Firebase Storage path for a thumbnail.
 */
export function generateThumbnailPath(orgId: string, mediaId: string): string {
  return `organizations/${orgId}/thumbnails/${mediaId}_thumb.webp`;
}

/**
 * Returns effective resolution accounting for orientation.
 */
export function getEffectiveResolution(
  resolution: { width: number; height: number },
  orientation: Orientation
): { width: number; height: number } {
  if (orientation === "portrait" || orientation === "portrait-flipped") {
    return { width: resolution.height, height: resolution.width };
  }
  return resolution;
}

/**
 * Returns simplified aspect ratio string like "16:9".
 */
export function getAspectRatio(width: number, height: number): string {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const d = gcd(width, height);
  return `${width / d}:${height / d}`;
}

/**
 * Checks if content orientation is compatible with screen orientation.
 */
export function isOrientationCompatible(
  contentOrientation: Orientation,
  screenOrientation: Orientation
): boolean {
  const isContentPortrait = contentOrientation.includes("portrait");
  const isScreenPortrait = screenOrientation.includes("portrait");
  return isContentPortrait === isScreenPortrait;
}

/**
 * Removes special characters, keeps URL-safe.
 */
export function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .toLowerCase();
}

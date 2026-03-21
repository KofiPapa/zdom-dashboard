import { v4 as uuidv4 } from "uuid";
import type { Zone } from "@shared/types/firestore-schema";

interface LayoutPreset {
  name: string;
  description: string;
  zones: Omit<Zone, "id" | "zIndex" | "content">[];
}

export const LAYOUT_PRESETS: LayoutPreset[] = [
  {
    name: "Full Screen",
    description: "Single zone covering the entire screen",
    zones: [{ x: 0, y: 0, width: 100, height: 100, type: "media" }],
  },
  {
    name: "2-Column",
    description: "Two equal columns side by side",
    zones: [
      { x: 0, y: 0, width: 50, height: 100, type: "media" },
      { x: 50, y: 0, width: 50, height: 100, type: "media" },
    ],
  },
  {
    name: "Sidebar + Main",
    description: "30% sidebar with 70% main content",
    zones: [
      { x: 0, y: 0, width: 30, height: 100, type: "media" },
      { x: 30, y: 0, width: 70, height: 100, type: "media" },
    ],
  },
  {
    name: "3-Column",
    description: "Three equal columns",
    zones: [
      { x: 0, y: 0, width: 33.3, height: 100, type: "media" },
      { x: 33.3, y: 0, width: 33.4, height: 100, type: "media" },
      { x: 66.7, y: 0, width: 33.3, height: 100, type: "media" },
    ],
  },
  {
    name: "Header + Main",
    description: "15% header bar with main content",
    zones: [
      { x: 0, y: 0, width: 100, height: 15, type: "text" },
      { x: 0, y: 15, width: 100, height: 85, type: "media" },
    ],
  },
  {
    name: "Header + 2-Column + Footer",
    description: "Full layout with header, two columns, and footer",
    zones: [
      { x: 0, y: 0, width: 100, height: 12, type: "text" },
      { x: 0, y: 12, width: 50, height: 76, type: "media" },
      { x: 50, y: 12, width: 50, height: 76, type: "media" },
      { x: 0, y: 88, width: 100, height: 12, type: "text" },
    ],
  },
  {
    name: "L-Shape",
    description: "Large main area with sidebar and bottom bar",
    zones: [
      { x: 0, y: 0, width: 70, height: 70, type: "media" },
      { x: 70, y: 0, width: 30, height: 100, type: "widget" },
      { x: 0, y: 70, width: 70, height: 30, type: "text" },
    ],
  },
];

export function applyPreset(preset: LayoutPreset): Zone[] {
  return preset.zones.map((z, i) => ({
    ...z,
    id: uuidv4(),
    zIndex: i,
    content: {},
  }));
}

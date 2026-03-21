import { useState, useCallback, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import type { Zone, ZoneType, ZoneContent, Orientation } from "@shared/types/firestore-schema";
import { RESOLUTION_PRESETS } from "@shared/constants";

interface EditorState {
  name: string;
  orientation: Orientation;
  resolution: { width: number; height: number };
  zones: Zone[];
  selectedZoneId: string | null;
  isDirty: boolean;
}

const defaultResolution = { width: RESOLUTION_PRESETS.FHD_LANDSCAPE.width, height: RESOLUTION_PRESETS.FHD_LANDSCAPE.height };

export function useEditor(initial?: Partial<EditorState>) {
  const [state, setState] = useState<EditorState>({
    name: initial?.name || "Untitled Template",
    orientation: initial?.orientation || "landscape",
    resolution: initial?.resolution || defaultResolution,
    zones: initial?.zones || [],
    selectedZoneId: initial?.selectedZoneId || null,
    isDirty: false,
  });

  const undoStack = useRef<Zone[][]>([]);
  const redoStack = useRef<Zone[][]>([]);

  const pushUndo = useCallback(() => {
    undoStack.current.push(JSON.parse(JSON.stringify(state.zones)));
    redoStack.current = [];
  }, [state.zones]);

  const setName = useCallback((name: string) => {
    setState((s) => ({ ...s, name, isDirty: true }));
  }, []);

  const setOrientation = useCallback((orientation: Orientation) => {
    const preset = orientation.includes("portrait")
      ? RESOLUTION_PRESETS.FHD_PORTRAIT
      : RESOLUTION_PRESETS.FHD_LANDSCAPE;
    setState((s) => ({
      ...s,
      orientation,
      resolution: { width: preset.width, height: preset.height },
      isDirty: true,
    }));
  }, []);

  const addZone = useCallback(
    (type: ZoneType, content: ZoneContent = {}, overrides: Partial<Zone> = {}) => {
      pushUndo();
      const zone: Zone = {
        id: uuidv4(),
        x: 10,
        y: 10,
        width: 30,
        height: 30,
        type,
        content,
        zIndex: state.zones.length,
        ...overrides,
      };
      setState((s) => ({
        ...s,
        zones: [...s.zones, zone],
        selectedZoneId: zone.id,
        isDirty: true,
      }));
      return zone.id;
    },
    [state.zones.length, pushUndo]
  );

  const updateZone = useCallback(
    (zoneId: string, updates: Partial<Zone>) => {
      setState((s) => ({
        ...s,
        zones: s.zones.map((z) => (z.id === zoneId ? { ...z, ...updates } : z)),
        isDirty: true,
      }));
    },
    []
  );

  const updateZoneWithUndo = useCallback(
    (zoneId: string, updates: Partial<Zone>) => {
      pushUndo();
      updateZone(zoneId, updates);
    },
    [pushUndo, updateZone]
  );

  const removeZone = useCallback(
    (zoneId: string) => {
      pushUndo();
      setState((s) => ({
        ...s,
        zones: s.zones.filter((z) => z.id !== zoneId),
        selectedZoneId: s.selectedZoneId === zoneId ? null : s.selectedZoneId,
        isDirty: true,
      }));
    },
    [pushUndo]
  );

  const selectZone = useCallback((zoneId: string | null) => {
    setState((s) => ({ ...s, selectedZoneId: zoneId }));
  }, []);

  const duplicateZone = useCallback(
    (zoneId: string) => {
      pushUndo();
      setState((s) => {
        const zone = s.zones.find((z) => z.id === zoneId);
        if (!zone) return s;
        const newZone: Zone = {
          ...JSON.parse(JSON.stringify(zone)),
          id: uuidv4(),
          x: Math.min(zone.x + 5, 90),
          y: Math.min(zone.y + 5, 90),
          zIndex: s.zones.length,
        };
        return { ...s, zones: [...s.zones, newZone], selectedZoneId: newZone.id, isDirty: true };
      });
    },
    [pushUndo]
  );

  const reorderZone = useCallback(
    (zoneId: string, direction: "up" | "down" | "top" | "bottom") => {
      pushUndo();
      setState((s) => {
        const zones = [...s.zones];
        const idx = zones.findIndex((z) => z.id === zoneId);
        if (idx === -1) return s;
        if (direction === "top") {
          zones[idx] = { ...zones[idx], zIndex: Math.max(...zones.map((z) => z.zIndex)) + 1 };
        } else if (direction === "bottom") {
          zones[idx] = { ...zones[idx], zIndex: 0 };
          zones.forEach((z, i) => { if (i !== idx) zones[i] = { ...z, zIndex: z.zIndex + 1 }; });
        } else if (direction === "up") {
          zones[idx] = { ...zones[idx], zIndex: zones[idx].zIndex + 1 };
        } else {
          zones[idx] = { ...zones[idx], zIndex: Math.max(0, zones[idx].zIndex - 1) };
        }
        return { ...s, zones, isDirty: true };
      });
    },
    [pushUndo]
  );

  const setZones = useCallback(
    (zones: Zone[]) => {
      pushUndo();
      setState((s) => ({ ...s, zones, selectedZoneId: null, isDirty: true }));
    },
    [pushUndo]
  );

  const undo = useCallback(() => {
    if (undoStack.current.length === 0) return;
    redoStack.current.push(JSON.parse(JSON.stringify(state.zones)));
    const prev = undoStack.current.pop()!;
    setState((s) => ({ ...s, zones: prev, isDirty: true }));
  }, [state.zones]);

  const redo = useCallback(() => {
    if (redoStack.current.length === 0) return;
    undoStack.current.push(JSON.parse(JSON.stringify(state.zones)));
    const next = redoStack.current.pop()!;
    setState((s) => ({ ...s, zones: next, isDirty: true }));
  }, [state.zones]);

  const markSaved = useCallback(() => {
    setState((s) => ({ ...s, isDirty: false }));
  }, []);

  const selectedZone = state.zones.find((z) => z.id === state.selectedZoneId) || null;

  return {
    ...state,
    selectedZone,
    setName,
    setOrientation,
    addZone,
    updateZone,
    updateZoneWithUndo,
    removeZone,
    selectZone,
    duplicateZone,
    reorderZone,
    setZones,
    undo,
    redo,
    markSaved,
    canUndo: undoStack.current.length > 0,
    canRedo: redoStack.current.length > 0,
  };
}

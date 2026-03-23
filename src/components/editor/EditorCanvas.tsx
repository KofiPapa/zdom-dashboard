import { useRef, useCallback, useState } from "react";
import {
  HiOutlinePhotograph,
  HiOutlineChatAlt2,
  HiOutlinePuzzle,
} from "react-icons/hi";
import type { Zone, Orientation } from "@shared/types/firestore-schema";

interface EditorCanvasProps {
  zones: Zone[];
  selectedZoneId: string | null;
  orientation: Orientation;
  resolution: { width: number; height: number };
  onSelectZone: (id: string | null) => void;
  onUpdateZone: (id: string, updates: Partial<Zone>) => void;
  onUpdateZoneWithUndo: (id: string, updates: Partial<Zone>) => void;
}

const typeColors: Record<string, string> = {
  media: "rgba(59, 130, 246, 0.15)",
  text: "rgba(16, 185, 129, 0.15)",
  widget: "rgba(168, 85, 247, 0.15)",
};

const typeBorders: Record<string, string> = {
  media: "border-primary",
  text: "border-emerald-400",
  widget: "border-purple-400",
};

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  media: HiOutlinePhotograph,
  text: HiOutlineChatAlt2,
  widget: HiOutlinePuzzle,
};

export default function EditorCanvas({
  zones,
  selectedZoneId,
  orientation,
  resolution,
  onSelectZone,
  onUpdateZone,
  onUpdateZoneWithUndo,
}: EditorCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [_dragging, setDragging] = useState<{
    zoneId: string;
    startX: number;
    startY: number;
    startZoneX: number;
    startZoneY: number;
  } | null>(null);
  const [_resizing, setResizing] = useState<{
    zoneId: string;
    handle: string;
    startX: number;
    startY: number;
    startZone: { x: number; y: number; width: number; height: number };
  } | null>(null);

  // Calculate scale to fit canvas in container
  const isPortrait = orientation === "portrait" || orientation === "portrait-flipped";
  void (resolution.width / resolution.height);

  const getCanvasRect = useCallback(() => {
    return containerRef.current?.querySelector("[data-canvas]")?.getBoundingClientRect();
  }, []);

  void getCanvasRect;

  const handleMouseDown = (e: React.MouseEvent, zoneId: string) => {
    e.stopPropagation();
    onSelectZone(zoneId);
    const zone = zones.find((z) => z.id === zoneId);
    if (!zone) return;
    setDragging({
      zoneId,
      startX: e.clientX,
      startY: e.clientY,
      startZoneX: zone.x,
      startZoneY: zone.y,
    });

    const handleMove = (me: MouseEvent) => {
      const rect = getCanvasRect();
      if (!rect) return;
      const dx = ((me.clientX - e.clientX) / rect.width) * 100;
      const dy = ((me.clientY - e.clientY) / rect.height) * 100;
      const newX = Math.max(0, Math.min(100 - zone.width, zone.x + dx));
      const newY = Math.max(0, Math.min(100 - zone.height, zone.y + dy));
      onUpdateZone(zoneId, { x: Math.round(newX * 10) / 10, y: Math.round(newY * 10) / 10 });
    };

    const handleUp = () => {
      setDragging(null);
      onUpdateZoneWithUndo(zoneId, {});
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
    };

    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);
  };

  const handleResizeStart = (e: React.MouseEvent, zoneId: string, handle: string) => {
    e.stopPropagation();
    e.preventDefault();
    const zone = zones.find((z) => z.id === zoneId);
    if (!zone) return;

    const startZone = { x: zone.x, y: zone.y, width: zone.width, height: zone.height };
    setResizing({ zoneId, handle, startX: e.clientX, startY: e.clientY, startZone });

    const handleMove = (me: MouseEvent) => {
      const rect = getCanvasRect();
      if (!rect) return;
      const dx = ((me.clientX - e.clientX) / rect.width) * 100;
      const dy = ((me.clientY - e.clientY) / rect.height) * 100;

      let newX = startZone.x, newY = startZone.y;
      let newW = startZone.width, newH = startZone.height;

      if (handle.includes("e")) newW = Math.max(5, startZone.width + dx);
      if (handle.includes("s")) newH = Math.max(5, startZone.height + dy);
      if (handle.includes("w")) { newX = startZone.x + dx; newW = Math.max(5, startZone.width - dx); }
      if (handle.includes("n")) { newY = startZone.y + dy; newH = Math.max(5, startZone.height - dy); }

      newX = Math.max(0, Math.min(95, newX));
      newY = Math.max(0, Math.min(95, newY));
      newW = Math.min(100 - newX, newW);
      newH = Math.min(100 - newY, newH);

      onUpdateZone(zoneId, {
        x: Math.round(newX * 10) / 10,
        y: Math.round(newY * 10) / 10,
        width: Math.round(newW * 10) / 10,
        height: Math.round(newH * 10) / 10,
      });
    };

    const handleUp = () => {
      setResizing(null);
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
    };

    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);
  };

  const sortedZones = [...zones].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div
      ref={containerRef}
      className="flex-1 bg-slate-100 flex items-center justify-center p-8 overflow-hidden"
      onClick={() => onSelectZone(null)}
    >
      <div
        data-canvas
        className="relative bg-white shadow-xl border border-slate-300"
        style={{
          aspectRatio: `${resolution.width} / ${resolution.height}`,
          maxWidth: isPortrait ? "40%" : "85%",
          maxHeight: "90%",
          width: isPortrait ? undefined : "100%",
          height: isPortrait ? "100%" : undefined,
        }}
      >
        {/* Grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            backgroundImage: "linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)",
            backgroundSize: "10% 10%",
          }}
        />

        {/* Zones */}
        {sortedZones.map((zone) => {
          const isSelected = zone.id === selectedZoneId;
          const Icon = typeIcons[zone.type] || HiOutlinePuzzle;

          return (
            <div
              key={zone.id}
              className={`absolute cursor-move transition-shadow ${
                isSelected ? `ring-2 ring-primary ${typeBorders[zone.type]}` : `border border-dashed ${typeBorders[zone.type]}`
              }`}
              style={{
                left: `${zone.x}%`,
                top: `${zone.y}%`,
                width: `${zone.width}%`,
                height: `${zone.height}%`,
                backgroundColor: zone.backgroundColor || typeColors[zone.type],
                borderRadius: zone.borderRadius ? `${zone.borderRadius}px` : undefined,
                opacity: zone.opacity ?? 1,
                zIndex: zone.zIndex,
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => handleMouseDown(e, zone.id)}
            >
              {/* Zone content preview */}
              <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden p-1">
                {zone.type === "media" && zone.content.mediaUrl ? (
                  <img
                    src={zone.content.mediaThumbnail || zone.content.mediaUrl}
                    alt=""
                    className="w-full h-full object-cover rounded"
                  />
                ) : zone.type === "text" && zone.content.text ? (
                  <p
                    className="text-[10px] leading-tight overflow-hidden w-full px-1"
                    style={{
                      fontFamily: zone.content.textStyle?.fontFamily,
                      color: zone.content.textStyle?.color || "#000",
                      textAlign: zone.content.textStyle?.textAlign || "left",
                      fontWeight: zone.content.textStyle?.fontWeight || "normal",
                    }}
                  >
                    {zone.content.text}
                  </p>
                ) : (
                  <>
                    <Icon className="w-6 h-6 text-slate-400" />
                    <span className="text-[10px] text-slate-400 mt-1 capitalize">{zone.type}</span>
                  </>
                )}
              </div>

              {/* Resize handles (when selected) */}
              {isSelected && (
                <>
                  {["nw", "ne", "sw", "se", "n", "s", "e", "w"].map((handle) => {
                    const positions: Record<string, string> = {
                      nw: "top-0 left-0 cursor-nw-resize -translate-x-1/2 -translate-y-1/2",
                      ne: "top-0 right-0 cursor-ne-resize translate-x-1/2 -translate-y-1/2",
                      sw: "bottom-0 left-0 cursor-sw-resize -translate-x-1/2 translate-y-1/2",
                      se: "bottom-0 right-0 cursor-se-resize translate-x-1/2 translate-y-1/2",
                      n: "top-0 left-1/2 cursor-n-resize -translate-x-1/2 -translate-y-1/2",
                      s: "bottom-0 left-1/2 cursor-s-resize -translate-x-1/2 translate-y-1/2",
                      e: "top-1/2 right-0 cursor-e-resize translate-x-1/2 -translate-y-1/2",
                      w: "top-1/2 left-0 cursor-w-resize -translate-x-1/2 -translate-y-1/2",
                    };
                    return (
                      <div
                        key={handle}
                        className={`absolute w-3 h-3 bg-orange-500 border border-white rounded-sm z-50 ${positions[handle]}`}
                        onMouseDown={(e) => handleResizeStart(e, zone.id, handle)}
                      />
                    );
                  })}
                </>
              )}
            </div>
          );
        })}

        {zones.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-slate-300">
            <div className="text-center">
              <HiOutlinePhotograph className="w-12 h-12 mx-auto mb-2" />
              <p className="text-sm">Add zones from the left panel</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

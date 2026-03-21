import { HiOutlineX } from "react-icons/hi";
import type { Zone, Orientation } from "@shared/types/firestore-schema";

interface TemplatePreviewProps {
  zones: Zone[];
  resolution: { width: number; height: number };
  orientation: Orientation;
  onClose: () => void;
}

export default function TemplatePreview({ zones, resolution, orientation, onClose }: TemplatePreviewProps) {
  const sortedZones = [...zones].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white"
      >
        <HiOutlineX className="w-6 h-6" />
      </button>

      <div
        className="relative bg-black"
        style={{
          aspectRatio: `${resolution.width} / ${resolution.height}`,
          maxWidth: "95vw",
          maxHeight: "95vh",
          width: orientation.includes("portrait") ? undefined : "95vw",
          height: orientation.includes("portrait") ? "95vh" : undefined,
        }}
      >
        {sortedZones.map((zone) => (
          <div
            key={zone.id}
            className="absolute overflow-hidden"
            style={{
              left: `${zone.x}%`,
              top: `${zone.y}%`,
              width: `${zone.width}%`,
              height: `${zone.height}%`,
              backgroundColor: zone.backgroundColor || "transparent",
              borderRadius: zone.borderRadius ? `${zone.borderRadius}px` : undefined,
              opacity: zone.opacity ?? 1,
              zIndex: zone.zIndex,
            }}
          >
            {zone.type === "media" && zone.content.mediaUrl && (
              <img
                src={zone.content.mediaUrl}
                alt=""
                className="w-full h-full"
                style={{ objectFit: zone.content.objectFit || "cover" }}
              />
            )}
            {zone.type === "text" && zone.content.text && (
              <div
                className="w-full h-full flex"
                style={{
                  fontFamily: zone.content.textStyle?.fontFamily || "Arial",
                  fontSize: `${(zone.content.textStyle?.fontSize || 18) / 20}vw`,
                  fontWeight: zone.content.textStyle?.fontWeight || "normal",
                  color: zone.content.textStyle?.color || "#000",
                  textAlign: zone.content.textStyle?.textAlign || "left",
                  alignItems: zone.content.textStyle?.verticalAlign === "middle" ? "center" : zone.content.textStyle?.verticalAlign === "bottom" ? "flex-end" : "flex-start",
                  justifyContent: zone.content.textStyle?.textAlign === "center" ? "center" : zone.content.textStyle?.textAlign === "right" ? "flex-end" : "flex-start",
                  padding: `${zone.content.textStyle?.padding || 0}px`,
                  backgroundColor: zone.content.textStyle?.backgroundColor || "transparent",
                }}
              >
                <span>{zone.content.text}</span>
              </div>
            )}
            {zone.type === "widget" && (
              <div className="w-full h-full flex items-center justify-center bg-slate-800 text-white">
                <span className="text-sm capitalize">{zone.content.widgetType || "Widget"}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

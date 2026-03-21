import {
  HiOutlineTrash,
  HiOutlineDuplicate,
  HiOutlineArrowUp,
  HiOutlineArrowDown,
} from "react-icons/hi";
import type { Zone, TextStyle } from "@shared/types/firestore-schema";

interface RightPanelProps {
  zone: Zone | null;
  onUpdate: (id: string, updates: Partial<Zone>) => void;
  onRemove: (id: string) => void;
  onDuplicate: (id: string) => void;
  onReorder: (id: string, direction: "up" | "down" | "top" | "bottom") => void;
}

const FONTS = ["Arial", "Helvetica", "Georgia", "Times New Roman", "Courier New", "Verdana", "Impact", "Comic Sans MS"];

export default function RightPanel({ zone, onUpdate, onRemove, onDuplicate, onReorder }: RightPanelProps) {
  if (!zone) {
    return (
      <div className="w-64 bg-white border-l border-slate-200 flex items-center justify-center">
        <p className="text-sm text-slate-400">Select a zone to edit properties</p>
      </div>
    );
  }

  const updateContent = (updates: Record<string, unknown>) => {
    onUpdate(zone.id, { content: { ...zone.content, ...updates } });
  };

  const updateTextStyle = (updates: Partial<TextStyle>) => {
    onUpdate(zone.id, {
      content: {
        ...zone.content,
        textStyle: { ...zone.content.textStyle, ...updates } as TextStyle,
      },
    });
  };

  return (
    <div className="w-64 bg-white border-l border-slate-200 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900 capitalize">{zone.type} Zone</h3>
        <div className="flex items-center gap-1">
          <button onClick={() => onDuplicate(zone.id)} className="p-1 text-slate-400 hover:text-slate-600 rounded" title="Duplicate">
            <HiOutlineDuplicate className="w-4 h-4" />
          </button>
          <button onClick={() => onReorder(zone.id, "up")} className="p-1 text-slate-400 hover:text-slate-600 rounded" title="Move up">
            <HiOutlineArrowUp className="w-4 h-4" />
          </button>
          <button onClick={() => onReorder(zone.id, "down")} className="p-1 text-slate-400 hover:text-slate-600 rounded" title="Move down">
            <HiOutlineArrowDown className="w-4 h-4" />
          </button>
          <button onClick={() => onRemove(zone.id)} className="p-1 text-red-400 hover:text-red-600 rounded" title="Delete">
            <HiOutlineTrash className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Properties */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Position & Size */}
        <div>
          <h4 className="text-xs font-medium text-slate-500 uppercase mb-2">Position & Size</h4>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "X", key: "x" as const },
              { label: "Y", key: "y" as const },
              { label: "W", key: "width" as const },
              { label: "H", key: "height" as const },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className="text-[10px] text-slate-400">{label} (%)</label>
                <input
                  type="number"
                  value={Math.round(zone[key] * 10) / 10}
                  onChange={(e) => onUpdate(zone.id, { [key]: parseFloat(e.target.value) || 0 })}
                  className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  min={0}
                  max={100}
                  step={0.5}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Appearance */}
        <div>
          <h4 className="text-xs font-medium text-slate-500 uppercase mb-2">Appearance</h4>
          <div className="space-y-2">
            <div>
              <label className="text-[10px] text-slate-400">Opacity</label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={zone.opacity ?? 1}
                onChange={(e) => onUpdate(zone.id, { opacity: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400">Background</label>
              <input
                type="color"
                value={zone.backgroundColor || "#ffffff"}
                onChange={(e) => onUpdate(zone.id, { backgroundColor: e.target.value })}
                className="w-full h-8 rounded border border-slate-200 cursor-pointer"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400">Border Radius</label>
              <input
                type="range"
                min={0}
                max={50}
                value={zone.borderRadius || 0}
                onChange={(e) => onUpdate(zone.id, { borderRadius: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Media properties */}
        {zone.type === "media" && (
          <div>
            <h4 className="text-xs font-medium text-slate-500 uppercase mb-2">Media</h4>
            {zone.content.mediaUrl && (
              <img
                src={zone.content.mediaThumbnail || zone.content.mediaUrl}
                alt=""
                className="w-full aspect-video object-cover rounded mb-2"
              />
            )}
            <select
              value={zone.content.objectFit || "cover"}
              onChange={(e) => updateContent({ objectFit: e.target.value })}
              className="w-full px-2 py-1 text-xs border border-slate-200 rounded bg-white"
            >
              <option value="cover">Cover</option>
              <option value="contain">Contain</option>
              <option value="fill">Fill</option>
              <option value="none">None</option>
            </select>
          </div>
        )}

        {/* Text properties */}
        {zone.type === "text" && (
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-slate-500 uppercase mb-2">Text</h4>
            <textarea
              value={zone.content.text || ""}
              onChange={(e) => updateContent({ text: e.target.value })}
              rows={3}
              className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Enter text..."
            />
            <select
              value={zone.content.textStyle?.fontFamily || "Arial"}
              onChange={(e) => updateTextStyle({ fontFamily: e.target.value })}
              className="w-full px-2 py-1 text-xs border border-slate-200 rounded bg-white"
            >
              {FONTS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400">Size</label>
                <input
                  type="number"
                  value={zone.content.textStyle?.fontSize || 18}
                  onChange={(e) => updateTextStyle({ fontSize: parseInt(e.target.value) || 18 })}
                  className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                  min={8}
                  max={200}
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400">Weight</label>
                <select
                  value={zone.content.textStyle?.fontWeight || "normal"}
                  onChange={(e) => updateTextStyle({ fontWeight: e.target.value as "normal" | "bold" })}
                  className="w-full px-2 py-1 text-xs border border-slate-200 rounded bg-white"
                >
                  <option value="normal">Normal</option>
                  <option value="bold">Bold</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-[10px] text-slate-400">Color</label>
              <input
                type="color"
                value={zone.content.textStyle?.color || "#000000"}
                onChange={(e) => updateTextStyle({ color: e.target.value })}
                className="w-full h-8 rounded border border-slate-200 cursor-pointer"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400">Alignment</label>
              <div className="flex gap-1">
                {(["left", "center", "right"] as const).map((align) => (
                  <button
                    key={align}
                    onClick={() => updateTextStyle({ textAlign: align })}
                    className={`flex-1 py-1 text-xs rounded ${
                      zone.content.textStyle?.textAlign === align
                        ? "bg-blue-100 text-blue-600"
                        : "bg-slate-50 text-slate-500"
                    }`}
                  >
                    {align.charAt(0).toUpperCase() + align.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Widget properties */}
        {zone.type === "widget" && (
          <div>
            <h4 className="text-xs font-medium text-slate-500 uppercase mb-2">Widget</h4>
            <p className="text-xs text-slate-600 capitalize">{zone.content.widgetType || "Unknown"}</p>
            <p className="text-[10px] text-slate-400 mt-1">Widget configuration available in player view</p>
          </div>
        )}
      </div>
    </div>
  );
}

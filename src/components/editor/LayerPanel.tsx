import {
  HiOutlinePhotograph,
  HiOutlineChatAlt2,
  HiOutlinePuzzle,
  HiOutlineTrash,
} from "react-icons/hi";
import type { Zone } from "@shared/types/firestore-schema";

interface LayerPanelProps {
  zones: Zone[];
  selectedZoneId: string | null;
  onSelectZone: (id: string) => void;
  onRemoveZone: (id: string) => void;
}

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  media: HiOutlinePhotograph,
  text: HiOutlineChatAlt2,
  widget: HiOutlinePuzzle,
};

const typeColors: Record<string, string> = {
  media: "text-primary",
  text: "text-emerald-500",
  widget: "text-purple-500",
};

export default function LayerPanel({ zones, selectedZoneId, onSelectZone, onRemoveZone }: LayerPanelProps) {
  const sortedZones = [...zones].sort((a, b) => b.zIndex - a.zIndex);

  return (
    <div className="h-32 bg-white border-t border-slate-200 flex flex-col">
      <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-xs font-semibold text-slate-500 uppercase">Layers ({zones.length})</h3>
      </div>
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-1 p-2 h-full min-w-min">
          {sortedZones.map((zone) => {
            const Icon = typeIcons[zone.type] || HiOutlinePuzzle;
            const isSelected = zone.id === selectedZoneId;

            return (
              <div
                key={zone.id}
                onClick={() => onSelectZone(zone.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onSelectZone(zone.id); }}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg min-w-[80px] transition-colors cursor-pointer ${
                  isSelected ? "bg-orange-50 ring-1 ring-primary" : "bg-slate-50 hover:bg-slate-100"
                }`}
              >
                <Icon className={`w-5 h-5 ${typeColors[zone.type]}`} />
                <span className="text-[10px] text-slate-600 capitalize truncate max-w-[70px]">
                  {zone.type}
                  {zone.content.text ? `: ${zone.content.text.slice(0, 8)}` : ""}
                </span>
                <span className="text-[9px] text-slate-400">z:{zone.zIndex}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); onRemoveZone(zone.id); }}
                  className="p-0.5 text-slate-300 hover:text-red-500"
                >
                  <HiOutlineTrash className="w-3 h-3" />
                </button>
              </div>
            );
          })}
          {zones.length === 0 && (
            <div className="flex items-center justify-center w-full text-xs text-slate-400">
              No zones added yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

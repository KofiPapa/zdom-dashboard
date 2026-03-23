import { useState } from "react";
import {
  HiOutlinePhotograph,
  HiOutlineChatAlt2,
  HiOutlineViewGrid,
  HiOutlineClock,
  HiOutlineGlobe,
  HiOutlineRss,
  HiOutlineQrcode,
  HiOutlineCalendar,
} from "react-icons/hi";
import { useMedia } from "../../hooks/useMedia";
import { LAYOUT_PRESETS, applyPreset } from "./LayoutPresets";
import type { Zone, ZoneType, ZoneContent, WidgetType, TextStyle } from "@shared/types/firestore-schema";

interface LeftPanelProps {
  onAddZone: (type: ZoneType, content: ZoneContent, overrides?: Partial<Zone>) => void;
  onSetZones: (zones: Zone[]) => void;
  hasZones: boolean;
}

const TABS = ["Media", "Text", "Widgets", "Zones"] as const;

const TEXT_PRESETS: { label: string; style: Partial<TextStyle>; text: string }[] = [
  { label: "Heading", text: "Heading", style: { fontSize: 48, fontWeight: "bold", fontFamily: "Arial", color: "#1e293b", textAlign: "center", verticalAlign: "middle", padding: 16, lineHeight: 1.2, letterSpacing: 0 } },
  { label: "Subheading", text: "Subheading", style: { fontSize: 32, fontWeight: "normal", fontFamily: "Arial", color: "#475569", textAlign: "center", verticalAlign: "middle", padding: 12, lineHeight: 1.3, letterSpacing: 0 } },
  { label: "Body", text: "Body text", style: { fontSize: 18, fontWeight: "normal", fontFamily: "Arial", color: "#334155", textAlign: "left", verticalAlign: "top", padding: 12, lineHeight: 1.5, letterSpacing: 0 } },
  { label: "Ticker", text: "Breaking news ticker text...", style: { fontSize: 24, fontWeight: "bold", fontFamily: "Arial", color: "#ffffff", backgroundColor: "#1e293b", textAlign: "left", verticalAlign: "middle", padding: 8, lineHeight: 1.2, letterSpacing: 1, scrolling: { enabled: true, speed: 50, direction: "left" } } },
];

const WIDGET_LIST: { type: WidgetType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { type: "clock", label: "Clock", icon: HiOutlineClock },
  { type: "weather", label: "Weather", icon: HiOutlineGlobe },
  { type: "ticker", label: "Ticker", icon: HiOutlineChatAlt2 },
  { type: "rss", label: "RSS Feed", icon: HiOutlineRss },
  { type: "webpage", label: "Webpage", icon: HiOutlineGlobe },
  { type: "qrcode", label: "QR Code", icon: HiOutlineQrcode },
  { type: "countdown", label: "Countdown", icon: HiOutlineCalendar },
];

export default function LeftPanel({ onAddZone, onSetZones, hasZones }: LeftPanelProps) {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("Media");
  const { media } = useMedia();

  const handlePreset = (presetIndex: number) => {
    if (hasZones && !window.confirm("This will replace all existing zones. Continue?")) return;
    onSetZones(applyPreset(LAYOUT_PRESETS[presetIndex]));
  };

  return (
    <div className="w-64 bg-white border-r border-slate-200 flex flex-col overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${
              activeTab === tab
                ? "text-primary border-b-2 border-primary"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {activeTab === "Media" && (
          <div className="space-y-2">
            <p className="text-xs text-slate-400 mb-2">Click to add to canvas</p>
            {media.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">No media uploaded yet</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {media.map((item) => (
                  <button
                    key={item.id}
                    onClick={() =>
                      onAddZone("media", {
                        mediaId: item.id,
                        mediaUrl: item.downloadUrl,
                        mediaThumbnail: item.thumbnailUrl,
                        objectFit: "cover",
                      })
                    }
                    className="aspect-video bg-slate-100 rounded-lg overflow-hidden hover:ring-2 hover:ring-primary transition-all"
                  >
                    {item.thumbnailUrl || item.downloadUrl ? (
                      <img
                        src={item.thumbnailUrl || item.downloadUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <HiOutlinePhotograph className="w-6 h-6 text-slate-300" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "Text" && (
          <div className="space-y-2">
            <p className="text-xs text-slate-400 mb-2">Click a preset to add</p>
            {TEXT_PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() =>
                  onAddZone("text", { text: preset.text, textStyle: preset.style as TextStyle }, { width: 40, height: 15 })
                }
                className="w-full p-3 text-left bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <HiOutlineChatAlt2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-medium text-slate-700">{preset.label}</span>
                </div>
                <p className="text-xs text-slate-400 mt-1 truncate">{preset.text}</p>
              </button>
            ))}
          </div>
        )}

        {activeTab === "Widgets" && (
          <div className="space-y-2">
            <p className="text-xs text-slate-400 mb-2">Click to add widget</p>
            {WIDGET_LIST.map((widget) => (
              <button
                key={widget.type}
                onClick={() =>
                  onAddZone(
                    "widget",
                    { widgetType: widget.type, widgetConfig: {} },
                    { width: 25, height: 25 }
                  )
                }
                className="w-full flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <widget.icon className="w-5 h-5 text-purple-500" />
                <span className="text-sm font-medium text-slate-700">{widget.label}</span>
              </button>
            ))}
          </div>
        )}

        {activeTab === "Zones" && (
          <div className="space-y-2">
            <p className="text-xs text-slate-400 mb-2">Quick layout presets</p>
            {LAYOUT_PRESETS.map((preset, idx) => (
              <button
                key={preset.name}
                onClick={() => handlePreset(idx)}
                className="w-full p-3 text-left bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <HiOutlineViewGrid className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-slate-700">{preset.name}</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{preset.description}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

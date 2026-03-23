import {
  HiClock,
  HiCloud,
  HiNewspaper,
  HiPlay,
  HiGlobeAlt,
  HiQrcode,
  HiCalendar,
  HiPresentationChartBar,
  HiChat,
  HiTag,
} from "react-icons/hi";

type WidgetConfig = Record<string, unknown>;

interface WidgetConfigFormProps {
  widgetType: string;
  config: WidgetConfig;
  onChange: (config: WidgetConfig) => void;
}

/* ------------------------------------------------------------------ */
/*  Shared helpers                                                     */
/* ------------------------------------------------------------------ */

const labelClass = "block text-[10px] font-medium text-slate-500 mb-1";
const inputClass =
  "w-full rounded-md bg-white border border-slate-200 px-2 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-primary focus:ring-1 focus:ring-primary outline-none";
const checkboxWrapperClass = "flex items-center gap-2";
const checkboxClass =
  "h-3.5 w-3.5 rounded border-slate-300 bg-white text-primary focus:ring-primary";
const sectionClass = "space-y-3";
const headerClass = "flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-3";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Per-widget config forms                                            */
/* ------------------------------------------------------------------ */

function ClockConfig({
  config,
  onChange,
}: {
  config: WidgetConfig;
  onChange: (c: WidgetConfig) => void;
}) {
  return (
    <div className={sectionClass}>
      <div className={headerClass}>
        <HiClock className="w-5 h-5" /> Clock Settings
      </div>
      <Field label="Timezone">
        <input
          className={inputClass}
          type="text"
          placeholder="e.g. America/New_York (leave empty for local)"
          value={(config.timezone as string) ?? ""}
          onChange={(e) => onChange({ ...config, timezone: e.target.value })}
        />
      </Field>
      <div className={checkboxWrapperClass}>
        <input
          type="checkbox"
          className={checkboxClass}
          checked={(config.format24h as boolean) ?? false}
          onChange={(e) => onChange({ ...config, format24h: e.target.checked })}
        />
        <span className="text-xs text-slate-600">24-hour format</span>
      </div>
      <div className={checkboxWrapperClass}>
        <input
          type="checkbox"
          className={checkboxClass}
          checked={(config.showSeconds as boolean) ?? true}
          onChange={(e) =>
            onChange({ ...config, showSeconds: e.target.checked })
          }
        />
        <span className="text-xs text-slate-600">Show seconds</span>
      </div>
      <div className={checkboxWrapperClass}>
        <input
          type="checkbox"
          className={checkboxClass}
          checked={(config.showDate as boolean) ?? true}
          onChange={(e) => onChange({ ...config, showDate: e.target.checked })}
        />
        <span className="text-xs text-slate-600">Show date</span>
      </div>
    </div>
  );
}

function WeatherConfig({
  config,
  onChange,
}: {
  config: WidgetConfig;
  onChange: (c: WidgetConfig) => void;
}) {
  return (
    <div className={sectionClass}>
      <div className={headerClass}>
        <HiCloud className="w-5 h-5" /> Weather Settings
      </div>
      <Field label="Location">
        <input
          className={inputClass}
          type="text"
          placeholder="City name or coordinates"
          value={(config.location as string) ?? ""}
          onChange={(e) => onChange({ ...config, location: e.target.value })}
        />
      </Field>
      <Field label="Units">
        <select
          className={inputClass}
          value={(config.units as string) ?? "imperial"}
          onChange={(e) => onChange({ ...config, units: e.target.value })}
        >
          <option value="imperial">Imperial (F)</option>
          <option value="metric">Metric (C)</option>
        </select>
      </Field>
      <div className={checkboxWrapperClass}>
        <input
          type="checkbox"
          className={checkboxClass}
          checked={(config.showForecast as boolean) ?? false}
          onChange={(e) =>
            onChange({ ...config, showForecast: e.target.checked })
          }
        />
        <span className="text-xs text-slate-600">Show forecast</span>
      </div>
    </div>
  );
}

function TickerConfig({
  config,
  onChange,
}: {
  config: WidgetConfig;
  onChange: (c: WidgetConfig) => void;
}) {
  return (
    <div className={sectionClass}>
      <div className={headerClass}>
        <HiTag className="w-5 h-5" /> Ticker Settings
      </div>
      <Field label="Text">
        <textarea
          className={inputClass + " min-h-[80px]"}
          placeholder="Enter scrolling text..."
          value={(config.text as string) ?? ""}
          onChange={(e) => onChange({ ...config, text: e.target.value })}
        />
      </Field>
      <Field label="Speed">
        <input
          className={inputClass}
          type="range"
          min={10}
          max={100}
          value={(config.speed as number) ?? 50}
          onChange={(e) =>
            onChange({ ...config, speed: Number(e.target.value) })
          }
        />
        <div className="text-[10px] text-slate-400 mt-1">
          Speed: {(config.speed as number) ?? 50}
        </div>
      </Field>
      <Field label="Text Color">
        <input
          className={inputClass}
          type="color"
          value={(config.textColor as string) ?? "#ffffff"}
          onChange={(e) => onChange({ ...config, textColor: e.target.value })}
        />
      </Field>
      <Field label="Background Color">
        <input
          className={inputClass}
          type="color"
          value={(config.backgroundColor as string) ?? "#000000"}
          onChange={(e) =>
            onChange({ ...config, backgroundColor: e.target.value })
          }
        />
      </Field>
    </div>
  );
}

function RssConfig({
  config,
  onChange,
}: {
  config: WidgetConfig;
  onChange: (c: WidgetConfig) => void;
}) {
  return (
    <div className={sectionClass}>
      <div className={headerClass}>
        <HiNewspaper className="w-5 h-5" /> RSS Feed Settings
      </div>
      <Field label="Feed URL">
        <input
          className={inputClass}
          type="url"
          placeholder="https://example.com/feed.xml"
          value={(config.feedUrl as string) ?? ""}
          onChange={(e) => onChange({ ...config, feedUrl: e.target.value })}
        />
      </Field>
      <Field label="Max Items">
        <input
          className={inputClass}
          type="number"
          min={1}
          max={20}
          value={(config.maxItems as number) ?? 5}
          onChange={(e) =>
            onChange({ ...config, maxItems: Number(e.target.value) })
          }
        />
      </Field>
      <Field label="Layout">
        <select
          className={inputClass}
          value={(config.layout as string) ?? "list"}
          onChange={(e) => onChange({ ...config, layout: e.target.value })}
        >
          <option value="list">List</option>
          <option value="grid">Grid</option>
        </select>
      </Field>
      <div className={checkboxWrapperClass}>
        <input
          type="checkbox"
          className={checkboxClass}
          checked={(config.showImages as boolean) ?? true}
          onChange={(e) =>
            onChange({ ...config, showImages: e.target.checked })
          }
        />
        <span className="text-xs text-slate-600">Show images</span>
      </div>
    </div>
  );
}

function YoutubeConfig({
  config,
  onChange,
}: {
  config: WidgetConfig;
  onChange: (c: WidgetConfig) => void;
}) {
  return (
    <div className={sectionClass}>
      <div className={headerClass}>
        <HiPlay className="w-5 h-5" /> YouTube Settings
      </div>
      <Field label="Video ID">
        <input
          className={inputClass}
          type="text"
          placeholder="e.g. dQw4w9WgXcQ"
          value={(config.videoId as string) ?? ""}
          onChange={(e) => onChange({ ...config, videoId: e.target.value })}
        />
      </Field>
      <div className={checkboxWrapperClass}>
        <input
          type="checkbox"
          className={checkboxClass}
          checked={(config.autoplay as boolean) ?? true}
          onChange={(e) => onChange({ ...config, autoplay: e.target.checked })}
        />
        <span className="text-xs text-slate-600">Autoplay</span>
      </div>
      <div className={checkboxWrapperClass}>
        <input
          type="checkbox"
          className={checkboxClass}
          checked={(config.mute as boolean) ?? true}
          onChange={(e) => onChange({ ...config, mute: e.target.checked })}
        />
        <span className="text-xs text-slate-600">Mute</span>
      </div>
      <div className={checkboxWrapperClass}>
        <input
          type="checkbox"
          className={checkboxClass}
          checked={(config.loop as boolean) ?? true}
          onChange={(e) => onChange({ ...config, loop: e.target.checked })}
        />
        <span className="text-xs text-slate-600">Loop</span>
      </div>
    </div>
  );
}

function WebpageConfig({
  config,
  onChange,
}: {
  config: WidgetConfig;
  onChange: (c: WidgetConfig) => void;
}) {
  return (
    <div className={sectionClass}>
      <div className={headerClass}>
        <HiGlobeAlt className="w-5 h-5" /> Webpage Settings
      </div>
      <Field label="URL">
        <input
          className={inputClass}
          type="url"
          placeholder="https://example.com"
          value={(config.url as string) ?? ""}
          onChange={(e) => onChange({ ...config, url: e.target.value })}
        />
      </Field>
      <Field label="Auto-refresh (minutes)">
        <input
          className={inputClass}
          type="number"
          min={0}
          max={60}
          value={(config.refreshMinutes as number) ?? 0}
          onChange={(e) =>
            onChange({ ...config, refreshMinutes: Number(e.target.value) })
          }
        />
        <div className="text-[10px] text-slate-400 mt-1">
          Set to 0 to disable auto-refresh
        </div>
      </Field>
      <div className={checkboxWrapperClass}>
        <input
          type="checkbox"
          className={checkboxClass}
          checked={(config.scrollEnabled as boolean) ?? false}
          onChange={(e) =>
            onChange({ ...config, scrollEnabled: e.target.checked })
          }
        />
        <span className="text-xs text-slate-600">Enable scrolling</span>
      </div>
    </div>
  );
}

function QrCodeConfig({
  config,
  onChange,
}: {
  config: WidgetConfig;
  onChange: (c: WidgetConfig) => void;
}) {
  return (
    <div className={sectionClass}>
      <div className={headerClass}>
        <HiQrcode className="w-5 h-5" /> QR Code Settings
      </div>
      <Field label="Data / URL">
        <input
          className={inputClass}
          type="text"
          placeholder="https://example.com or any text"
          value={(config.data as string) ?? ""}
          onChange={(e) => onChange({ ...config, data: e.target.value })}
        />
      </Field>
      <Field label="Size (px)">
        <input
          className={inputClass}
          type="number"
          min={100}
          max={500}
          step={10}
          value={(config.size as number) ?? 200}
          onChange={(e) =>
            onChange({ ...config, size: Number(e.target.value) })
          }
        />
      </Field>
      <Field label="Foreground Color">
        <input
          className={inputClass}
          type="color"
          value={(config.foreground as string) ?? "#000000"}
          onChange={(e) => onChange({ ...config, foreground: e.target.value })}
        />
      </Field>
      <Field label="Background Color">
        <input
          className={inputClass}
          type="color"
          value={(config.background as string) ?? "#ffffff"}
          onChange={(e) => onChange({ ...config, background: e.target.value })}
        />
      </Field>
    </div>
  );
}

function CountdownConfig({
  config,
  onChange,
}: {
  config: WidgetConfig;
  onChange: (c: WidgetConfig) => void;
}) {
  return (
    <div className={sectionClass}>
      <div className={headerClass}>
        <HiCalendar className="w-5 h-5" /> Countdown Settings
      </div>
      <Field label="Title">
        <input
          className={inputClass}
          type="text"
          placeholder="Event name"
          value={(config.title as string) ?? ""}
          onChange={(e) => onChange({ ...config, title: e.target.value })}
        />
      </Field>
      <Field label="Target Date & Time">
        <input
          className={inputClass}
          type="datetime-local"
          value={(config.targetDate as string) ?? ""}
          onChange={(e) => onChange({ ...config, targetDate: e.target.value })}
        />
      </Field>
      <Field label="Expired Message">
        <input
          className={inputClass}
          type="text"
          placeholder="Event has started!"
          value={(config.expiredMessage as string) ?? ""}
          onChange={(e) =>
            onChange({ ...config, expiredMessage: e.target.value })
          }
        />
      </Field>
      <div className={checkboxWrapperClass}>
        <input
          type="checkbox"
          className={checkboxClass}
          checked={(config.showDays as boolean) ?? true}
          onChange={(e) => onChange({ ...config, showDays: e.target.checked })}
        />
        <span className="text-xs text-slate-600">Show days</span>
      </div>
      <div className={checkboxWrapperClass}>
        <input
          type="checkbox"
          className={checkboxClass}
          checked={(config.showHours as boolean) ?? true}
          onChange={(e) => onChange({ ...config, showHours: e.target.checked })}
        />
        <span className="text-xs text-slate-600">Show hours</span>
      </div>
    </div>
  );
}

function GoogleSlidesConfig({
  config,
  onChange,
}: {
  config: WidgetConfig;
  onChange: (c: WidgetConfig) => void;
}) {
  return (
    <div className={sectionClass}>
      <div className={headerClass}>
        <HiPresentationChartBar className="w-5 h-5" /> Google Slides Settings
      </div>
      <Field label="Presentation ID">
        <input
          className={inputClass}
          type="text"
          placeholder="Paste presentation ID from the URL"
          value={(config.presentationId as string) ?? ""}
          onChange={(e) =>
            onChange({ ...config, presentationId: e.target.value })
          }
        />
      </Field>
      <div className={checkboxWrapperClass}>
        <input
          type="checkbox"
          className={checkboxClass}
          checked={(config.autoAdvance as boolean) ?? true}
          onChange={(e) =>
            onChange({ ...config, autoAdvance: e.target.checked })
          }
        />
        <span className="text-xs text-slate-600">Auto-advance slides</span>
      </div>
      <Field label="Interval (seconds)">
        <input
          className={inputClass}
          type="number"
          min={1}
          max={120}
          value={(config.intervalSeconds as number) ?? 10}
          onChange={(e) =>
            onChange({ ...config, intervalSeconds: Number(e.target.value) })
          }
        />
      </Field>
    </div>
  );
}

function SocialMediaConfig({
  config,
  onChange,
}: {
  config: WidgetConfig;
  onChange: (c: WidgetConfig) => void;
}) {
  return (
    <div className={sectionClass}>
      <div className={headerClass}>
        <HiChat className="w-5 h-5" /> Social Media Settings
      </div>
      <Field label="Platform">
        <select
          className={inputClass}
          value={(config.platform as string) ?? "instagram"}
          onChange={(e) => onChange({ ...config, platform: e.target.value })}
        >
          <option value="instagram">Instagram</option>
          <option value="twitter">X / Twitter</option>
          <option value="facebook">Facebook</option>
          <option value="linkedin">LinkedIn</option>
          <option value="tiktok">TikTok</option>
        </select>
      </Field>
      <Field label="Embed URL">
        <input
          className={inputClass}
          type="url"
          placeholder="https://..."
          value={(config.embedUrl as string) ?? ""}
          onChange={(e) => onChange({ ...config, embedUrl: e.target.value })}
        />
      </Field>
      <Field label="Handle / Username">
        <input
          className={inputClass}
          type="text"
          placeholder="@username"
          value={(config.handle as string) ?? ""}
          onChange={(e) => onChange({ ...config, handle: e.target.value })}
        />
      </Field>
      <Field label="Show Latest Posts">
        <input
          className={inputClass}
          type="number"
          min={1}
          max={20}
          value={(config.showLatest as number) ?? 5}
          onChange={(e) =>
            onChange({ ...config, showLatest: Number(e.target.value) })
          }
        />
      </Field>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main export                                                        */
/* ------------------------------------------------------------------ */

const CONFIG_FORMS: Record<
  string,
  React.ComponentType<{ config: WidgetConfig; onChange: (c: WidgetConfig) => void }>
> = {
  clock: ClockConfig,
  weather: WeatherConfig,
  ticker: TickerConfig,
  rss: RssConfig,
  youtube: YoutubeConfig,
  webpage: WebpageConfig,
  qrcode: QrCodeConfig,
  countdown: CountdownConfig,
  "google-slides": GoogleSlidesConfig,
  "social-media": SocialMediaConfig,
};

export function WidgetConfigForm({
  widgetType,
  config,
  onChange,
}: WidgetConfigFormProps) {
  const FormComponent = CONFIG_FORMS[widgetType];

  if (!FormComponent) {
    return (
      <div className="text-xs text-slate-400">
        No configuration available for widget type: {widgetType}
      </div>
    );
  }

  return <FormComponent config={config} onChange={onChange} />;
}

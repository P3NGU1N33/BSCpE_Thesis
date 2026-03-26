import { Thermometer, CloudRain, Sun, CloudSun, Cloud, CloudLightning, CloudDrizzle, Droplets } from "lucide-react";

export type ForecastDay = {
  datetime: string;
  temp: number;
  precipprob: number;
  windspeed: number;
  winddir: number;
  icon?: string;
};

interface WeatherForecastPanelProps {
  days: ForecastDay[];
  loading?: boolean;
  error?: string | null;
}

function formatTopLabel(dateStr: string, index: number) {
  const d = new Date(dateStr);
  if (index === 0) return "Today";
  return d.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
  });
}

function getWeatherIcon(icon?: string) {
  const size = 40;
  const strokeWidth = 1.5;

  switch (icon) {
    case "clear-day":
      return <Sun size={size} strokeWidth={strokeWidth} className="text-yellow-400" />;
    case "partly-cloudy-day":
      return <CloudSun size={size} strokeWidth={strokeWidth} className="text-slate-300" />;
    case "rain":
      return <CloudRain size={size} strokeWidth={strokeWidth} className="text-slate-300" />;
    case "cloudy":
      return <Cloud size={size} strokeWidth={strokeWidth} className="text-slate-300" />;
    case "thunder-rain":
    case "thunderstorm":
      return <CloudLightning size={size} strokeWidth={strokeWidth} className="text-slate-300" />;
    case "drizzle":
      return <CloudDrizzle size={size} strokeWidth={strokeWidth} className="text-slate-300" />;
    default:
      return <CloudRain size={size} strokeWidth={strokeWidth} className="text-slate-300" />;
  }
}

export function WeatherForecastPanel({
  days,
  loading = false,
  error = null,
}: WeatherForecastPanelProps) {
  const safeDays = Array.isArray(days) ? days.slice(0, 7) : [];

  return (
    <div style={{ background: "linear-gradient(to bottom right, #4da8da, #0062a4)" }}
      className="rounded-xl p-3 shadow-lg text-white no-scroll">
      {/* Header matching the Wind History style */}
      <h2 className="text-lg font-bold text-blue mb-4 flex items-center gap-2">
        <span className="text-blue/100">☀️</span>
        Weather Forecast
      </h2>

      {loading && (
        <div className="rounded-xl bg-[#1e3a5f] p-6 text-white/70 text-center text-sm">
          Loading weather forecast...
        </div>
      )}

      {error && !loading && (
        <div className="rounded-xl bg-red-900/30 border border-red-500/30 p-6 text-white text-center text-sm">
          {error}
        </div>
      )}

      {!loading && !error && safeDays.length > 0 && (
        <div className="overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent no-scrollbar">
          <div className="flex gap-3 min-w-max">
            {safeDays.map((day, index) => (
              <div
                key={`${day.datetime}-${index}`}
                className="w-[120px] rounded-xl p-4 flex flex-col items-center text-center 
                           bg-[#1e3a5f] hover:bg-[#234b6e] transition-colors duration-200
                           border border-blue/50"
              >
                {/* Date Label */}
                <div className="text-sm font-bold text-cyan mb-3">
                  {formatTopLabel(day.datetime, index)}
                </div>

                {/* Weather Icon */}
                <div className="mb-3 h-[44px] flex items-center justify-center">
                  {getWeatherIcon(day.icon)}
                </div>

                {/* Temperature */}
                <div className="flex items-center gap-1.5 mb-3">
                  <Thermometer size={14} className="text-white/60" />
                  <span className="text-base font-bold text-cyan">
                    {Number.isFinite(day.temp) ? `${Math.round(day.temp)}°C` : "--"}
                  </span>
                </div>

                {/* Precipitation */}
                <div className="flex items-center gap-1.5 text-white/70">
                  <Droplets size={13} className="text-sky-400" />
                  <span className="text-xs font-bold">
                    {Number.isFinite(day.precipprob) ? `${Math.round(day.precipprob)}%` : "--"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && !error && safeDays.length === 0 && (
        <div className="rounded-xl bg-[#1e3a5f] p-6 text-white/70 text-center text-sm">
          No forecast data available.
        </div>
      )}
    </div>
  );
}

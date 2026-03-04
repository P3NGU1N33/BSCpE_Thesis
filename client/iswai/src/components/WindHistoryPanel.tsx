import { TrendingUp, Calendar, Clock, Navigation } from "lucide-react";
import type { HighestWind } from "../types/wind";
import { degToCompass } from "../utils/wind";

interface WindHistoryPanelProps {
  onNavigate?: () => void;
  highestWind: HighestWind | null;
  loading?: boolean;
  error?: string | null;
}

export function WindHistoryPanel({
  onNavigate,
  highestWind,
  loading = false,
  error = null,
}: WindHistoryPanelProps) {
  const directionText =
    highestWind == null
      ? "—"
      : `${Math.round(highestWind.directionDeg)}° ${degToCompass(highestWind.directionDeg)}`;

  return (
    <div
      style={{ background: "linear-gradient(to bottom right, #0062a4, #004a7c)" }}
      className="rounded-xl p-3 shadow-lg text-white"
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 mb-2 cursor-pointer hover:opacity-80 transition-opacity"
        onClick={onNavigate}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onNavigate?.();
        }}
      >
        <TrendingUp className="w-3.5 h-3.5" />
        <h3 className="text-blue-100 text-xs">Wind History</h3>
      </div>

      <h4 className="text-sm mb-2">Highest Recorded Wind</h4>

      {/* Loading / Error */}
      {loading && (
        <div className="bg-white/10 rounded-lg p-3 text-xs text-blue-100">
          Loading…
        </div>
      )}

      {!loading && error && (
        <div className="bg-white/10 rounded-lg p-3 text-xs text-red-200">
          {error}
        </div>
      )}

      {/* Main Info Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-2 gap-2 mb-2">
          {/* Wind Speed */}
          <div className="col-span-2 bg-white/10 rounded-lg p-2 text-center">
            <div className="text-3xl mb-0.5">
              {highestWind ? highestWind.speed.toFixed(1) : "—"}
            </div>
            <div className="text-xs text-blue-200">km/h</div>
          </div>

          {/* Date */}
          <div className="bg-white/10 rounded-lg p-2">
            <div className="flex items-center gap-1 mb-1">
              <Calendar className="w-3 h-3 text-blue-200" />
              <div className="text-xs text-blue-200">Date</div>
            </div>
            <div className="text-xs">{highestWind ? highestWind.date : "—"}</div>
          </div>

          {/* Time */}
          <div className="bg-white/10 rounded-lg p-2">
            <div className="flex items-center gap-1 mb-1">
              <Clock className="w-3 h-3 text-blue-200" />
              <div className="text-xs text-blue-200">Time</div>
            </div>
            <div className="text-xs">{highestWind ? highestWind.time : "—"}</div>
          </div>

          {/* Direction */}
          <div className="col-span-2 bg-white/10 rounded-lg p-2">
            <div className="flex items-center gap-1 mb-1">
              <Navigation className="w-3 h-3 text-blue-200" />
              <div className="text-xs text-blue-200">Direction</div>
            </div>
            <div className="text-xs">{directionText}</div>
          </div>
        </div>
      )}
    </div>
  );
}
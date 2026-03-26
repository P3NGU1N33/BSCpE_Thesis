import { useEffect, useMemo, useState } from "react";
import { TrendingUp, Calendar, Clock, Navigation } from "lucide-react";
import type { HighestWind } from "../types/wind";
import { degToCompass, safeDatePartsUTC } from "../utils/wind";
import { supabase } from "../lib/supabase";

interface WindHistoryPanelProps {
  onNavigate?: () => void;
}

type HighestWindRow = {
  timestamp: string;
  windspeed: string | number;
  winddir: string | number;
};

export function WindHistoryPanel({ onNavigate }: WindHistoryPanelProps) {
  const [highestWind, setHighestWind] = useState<HighestWind | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    const loadHighest = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from("iswai_data")
          .select("timestamp,windspeed,winddir")
          .order("windspeed", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        const row = data as HighestWindRow | null;

        if (!row) {
          setHighestWind(null);
          return;
        }

        const speed = Number(row.windspeed);
        const dirDeg = Number(row.winddir);
        const dt = safeDatePartsUTC(row.timestamp);

        if (!dt.valid || !Number.isFinite(speed)) {
          setHighestWind(null);
          return;
        }

        setHighestWind({
          speed,
          date: dt.date,
          time: dt.time,
          directionDeg: Number.isFinite(dirDeg) ? dirDeg : 0,
        });
      } catch (e: unknown) {
        if (!alive) return;
        setError(e instanceof Error ? e.message : "Failed to load highest wind");
      } finally {
        if (alive) setLoading(false);
      }
    };

    loadHighest();

    const channel = supabase
      .channel("iswai_data_highest_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "iswai_data" },
        () => {
          loadHighest();
        }
      )
      .subscribe();

    return () => {
      alive = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const directionText = useMemo(() => {
    if (highestWind == null) return "—";
    return `${Math.round(highestWind.directionDeg)}° ${degToCompass(highestWind.directionDeg)}`;
  }, [highestWind]);

  return (
    <div
      style={{ background: "linear-gradient(to bottom right, #0062a4, #004a7c)" }}
      className="rounded-xl p-3 shadow-lg text-white"
    >
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
        <h3 className="text-blue-100 text-xl font-bold">Wind History</h3>
      </div>

      <h4 className="text-l font-semibold mb-2">Highest Recorded Wind</h4>

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

      {!loading && !error && (
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div className="col-span-2 bg-white/10 rounded-lg p-2 text-center">
            <div className="text-3xl mb-0.5">
              {highestWind ? highestWind.speed.toFixed(1) : "—"}
            </div>
            <div className="text-xs text-blue-200">km/h</div>
          </div>

          <div className="bg-white/10 rounded-lg p-2">
            <div className="flex items-center gap-1 mb-1">
              <Calendar className="w-4 h-4 text-blue-200" />
              <div className="text-l font-semibold text-blue-200">Date</div>
            </div>
            <div className="text-m">{highestWind ? highestWind.date : "—"}</div>
          </div>

          <div className="bg-white/10 rounded-lg p-2">
            <div className="flex items-center gap-1 mb-1">
              <Clock className="w-4 h-4 text-blue-200" />
              <div className="text-l font-semibold text-blue-200">Time</div>
            </div>
            <div className="text-m">{highestWind ? highestWind.time : "—"}</div>
          </div>

          <div className="col-span-2 bg-white/10 rounded-lg p-2">
            <div className="flex items-center gap-1 mb-1">
              <Navigation className="w-4 h-4 text-blue-200" />
              <div className="text-l font-semibold text-blue-200">Direction</div>
            </div>
            <div className="text-m">{directionText}</div>
          </div>
        </div>
      )}
    </div>
  );
}
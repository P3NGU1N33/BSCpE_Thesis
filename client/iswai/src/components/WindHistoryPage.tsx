import { useEffect, useMemo, useState } from "react";
import {
  TrendingUp,
  Calendar,
  Clock,
  Navigation,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
} from "lucide-react";
import Papa from "papaparse";
import TimelineChart from "./TimelineChart";
import type { HighestWind } from "../types/wind";
import { degToCompass } from "../utils/wind";
import { supabase } from "../lib/supabase";

type Year = 2022 | 2023 | 2024 | 2025 | 2026;

const HIGH_ALERT_KMH = 22;
const ITEMS_PER_PAGE = 10;
const TABLE_NAME = "iswai_data";

type WindSpeedRow = {
  datetime: string;
  windspeed: string;
  pred_windspeed: string;
};

type WindDirRow = {
  datetime: string;
  winddir: string;
  pred_winddir: string;
};

type ApiRow = {
  id: number;
  timestamp: string;
  windspeed: number | string;
  pred_windspeed: number | string | null;
  winddir: number | string;
  pred_winddir: number | string | null;
};

type TableRow = {
  id: number;
  ts: number;
  date: string;
  time: string;
  currentSpeed: number;
  predictedSpeed: number | null;
  currentDirDeg: number;
  predictedDirDeg: number | null;
};

type SummaryState = {
  daysMonitored: number;
  avgWind: number;
  highAlerts: number;
  safeDaysPct: number;
};

async function loadCsv<T>(path: string): Promise<T[]> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to fetch ${path}`);
  const text = await res.text();

  return new Promise((resolve, reject) => {
    Papa.parse<T>(text, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data),
      error: (err: Error) => reject(err),
    });
  });
}

function safeDateParts(datetime: unknown) {
  const d = new Date(String(datetime));
  const t = d.getTime();

  if (!Number.isFinite(t)) {
    return { valid: false as const, date: "—", time: "—", ts: NaN };
  }

  const date = d.toLocaleDateString("en-CA", { timeZone: "UTC" });
  const time = d.toLocaleTimeString("en-US", {
    timeZone: "UTC",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return { valid: true as const, date, time, ts: t };
}

export function WindHistoryPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("date-desc");

  const [year, setYear] = useState<Year>(2026);
  const [speedRaw, setSpeedRaw] = useState<WindSpeedRow[]>([]);
  const [dirRaw, setDirRaw] = useState<WindDirRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [showCalendar, setShowCalendar] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [actionLoading, setActionLoading] = useState(false);
  const [actionLabel, setActionLabel] = useState("Loading...");

  const [apiRows, setApiRows] = useState<ApiRow[]>([]);
  const [tableLoading, setTableLoading] = useState(true);
  const [tableErr, setTableErr] = useState<string | null>(null);
  const [totalRecords, setTotalRecords] = useState(0);

  const [highestWind, setHighestWind] = useState<HighestWind | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summary, setSummary] = useState<SummaryState>({
    daysMonitored: 0,
    avgWind: 0,
    highAlerts: 0,
    safeDaysPct: 0,
  });

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setErr(null);

    Promise.all([
      loadCsv<WindSpeedRow>(`/data/windspeed_${year}_pred.csv`),
      loadCsv<WindDirRow>(`/data/winddirection_${year}_pred.csv`),
    ])
      .then(([s, d]) => {
        if (!alive) return;
        setSpeedRaw(s);
        setDirRaw(d);
      })
      .catch((e) => {
        if (!alive) return;
        setErr(e?.message ?? "Failed to load CSV");
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [year]);

  useEffect(() => {
    const fetchTablePage = async () => {
      try {
        setTableLoading(true);
        setTableErr(null);

        const from = (currentPage - 1) * ITEMS_PER_PAGE;
        const to = from + ITEMS_PER_PAGE - 1;

        let query = supabase
          .from(TABLE_NAME)
          .select(
            "id,timestamp,windspeed,pred_windspeed,winddir,pred_winddir",
            { count: "exact" }
          );

        if (startDate) {
          query = query.gte("timestamp", `${startDate}T00:00:00Z`);
        }

        if (endDate) {
          query = query.lte("timestamp", `${endDate}T23:59:59Z`);
        }

        if (sortBy === "date-asc") {
          query = query.order("timestamp", { ascending: true });
        } else if (sortBy === "date-desc") {
          query = query.order("timestamp", { ascending: false });
        } else if (sortBy === "speed-asc") {
          query = query.order("windspeed", { ascending: true });
        } else if (sortBy === "speed-desc") {
          query = query.order("windspeed", { ascending: false });
        }

        const { data, error, count } = await query.range(from, to);

        if (error) throw error;

        setApiRows((data as ApiRow[]) ?? []);
        setTotalRecords(count ?? 0);
      } catch (e: unknown) {
        const message =
          e instanceof Error ? e.message : "Failed to fetch paginated table data.";
        setTableErr(message);
      } finally {
        setTableLoading(false);
      }
    };

    fetchTablePage();
  }, [currentPage, sortBy, startDate, endDate]);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setSummaryLoading(true);

        const { data, error } = await supabase
          .from(TABLE_NAME)
          .select("timestamp,windspeed,winddir");

        if (error) throw error;

        const rows = (data ?? [])
          .map((r) => {
            const dt = safeDateParts(r.timestamp);
            const speed = Number(r.windspeed);
            const directionDeg = Number(r.winddir);

            if (!dt.valid || !Number.isFinite(speed) || !Number.isFinite(directionDeg)) {
              return null;
            }

            return {
              date: dt.date,
              time: dt.time,
              speed,
              directionDeg,
            };
          })
          .filter((r): r is NonNullable<typeof r> => r !== null);

        if (rows.length === 0) {
          setHighestWind(null);
          setSummary({
            daysMonitored: 0,
            avgWind: 0,
            highAlerts: 0,
            safeDaysPct: 0,
          });
          return;
        }

        let maxWind = rows[0];
        for (const row of rows) {
          if (row.speed > maxWind.speed) {
            maxWind = row;
          }
        }

        const totalWind = rows.reduce((sum, row) => sum + row.speed, 0);
        const avgWind = totalWind / rows.length;
        const highAlerts = rows.filter((row) => row.speed >= HIGH_ALERT_KMH).length;

        const dayMax = new Map<string, number>();
        for (const row of rows) {
          const prev = dayMax.get(row.date);
          if (prev == null || row.speed > prev) {
            dayMax.set(row.date, row.speed);
          }
        }

        const daysMonitored = dayMax.size;

        let safeDays = 0;
        for (const max of dayMax.values()) {
          if (max < HIGH_ALERT_KMH) safeDays++;
        }

        const safeDaysPct =
          daysMonitored === 0 ? 0 : (safeDays / daysMonitored) * 100;

        setHighestWind(maxWind);
        setSummary({
          daysMonitored,
          avgWind,
          highAlerts,
          safeDaysPct,
        });
      } catch (e) {
        console.error("Summary fetch failed:", e);
      } finally {
        setSummaryLoading(false);
      }
    };

    fetchSummary();
  }, []);

  const tableData: TableRow[] = useMemo(() => {
    return apiRows
      .map((r) => {
        const dt = safeDateParts(r.timestamp);
        if (!dt.valid) return null;

        const currentSpeed = Number(r.windspeed);
        const predictedSpeed =
          r.pred_windspeed == null ? null : Number(r.pred_windspeed);

        const currentDirDeg = Number(r.winddir);
        const predictedDirDeg =
          r.pred_winddir == null ? null : Number(r.pred_winddir);

        return {
          id: r.id,
          date: dt.date,
          time: dt.time,
          ts: dt.ts,
          currentSpeed,
          predictedSpeed,
          currentDirDeg,
          predictedDirDeg,
        };
      })
      .filter((record): record is NonNullable<typeof record> => record !== null);
  }, [apiRows]);

  const speedData = useMemo(() => {
    return speedRaw
      .map((r) => {
        const t = new Date(String(r.datetime)).getTime();
        const actual = Number(r.windspeed);
        const pred = Number(r.pred_windspeed);
        if (!Number.isFinite(t) || !Number.isFinite(actual) || !Number.isFinite(pred)) {
          return null;
        }
        return { t, windspeed: actual, pred_windspeed: pred };
      })
      .filter(
        (item): item is { t: number; windspeed: number; pred_windspeed: number } =>
          item !== null
      );
  }, [speedRaw]);

  const dirData = useMemo(() => {
    return dirRaw
      .map((r) => {
        const t = new Date(String(r.datetime)).getTime();
        const actual = Number(r.winddir);
        const pred = Number(r.pred_winddir);
        if (!Number.isFinite(t) || !Number.isFinite(actual) || !Number.isFinite(pred)) {
          return null;
        }
        return { t, winddir: actual, pred_winddir: pred };
      })
      .filter(
        (item): item is { t: number; winddir: number; pred_winddir: number } =>
          item !== null
      );
  }, [dirRaw]);

  const totalPages = Math.max(1, Math.ceil(totalRecords / ITEMS_PER_PAGE));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const currentData = tableData;

  const showingFrom =
    totalRecords === 0 ? 0 : (currentPageSafe - 1) * ITEMS_PER_PAGE + 1;
  const showingTo = Math.min(currentPageSafe * ITEMS_PER_PAGE, totalRecords);

  const getPageNumbers = () => {
    const pages: number[] = [];
    const start = Math.max(1, currentPageSafe - 2);
    const end = Math.min(totalPages, currentPageSafe + 2);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  };

  const runWithUiLoading = (label: string, action: () => void) => {
    setActionLabel(label);
    setActionLoading(true);

    action();

    setTimeout(() => {
      setActionLoading(false);
    }, 400);
  };

  return (
    // Wind Summary Section
    <div className="space-y-4">
      <div
        style={{ backgroundColor: "#0062a4" }}
        className="rounded-xl p-6 shadow-lg text-white"
      >
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp className="w-6 h-6" />
          <h2 className="text-white text-xl">Wind History Summary</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-5 border border-white/20">
            <div className="text-sm text-blue-200 mb-3">Highest Recorded Wind</div>
            <div className="flex items-end gap-2 mb-4">
              <div className="text-6xl">
                {summaryLoading || !highestWind ? "—" : highestWind.speed.toFixed(1)}
              </div>
              <div className="text-2xl text-blue-200 pb-1.5">km/h</div>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-blue-300" />
                <span className="text-blue-100">
                  {summaryLoading || !highestWind ? "—" : highestWind.date}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-blue-300" />
                <span className="text-blue-100">
                  {summaryLoading || !highestWind ? "—" : highestWind.time}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Navigation className="w-4 h-4 text-blue-300" />
                <span className="text-blue-100">
                  {summaryLoading || !highestWind
                    ? "—"
                    : `${Math.round(highestWind.directionDeg)}° ${degToCompass(
                        highestWind.directionDeg
                      )}`}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-lg p-4 text-center">
              <div className="text-4xl">
                {summaryLoading ? "—" : summary.daysMonitored}
              </div>
              <div className="text-sm text-blue-300 mt-1.5">Days Monitored</div>
            </div>

            <div className="bg-white/5 rounded-lg p-4 text-center">
              <div className="text-4xl">
                {summaryLoading ? "—" : summary.avgWind.toFixed(1)}
              </div>
              <div className="text-sm text-blue-300 mt-1.5">Avg Wind (km/h)</div>
            </div>

            <div className="bg-white/5 rounded-lg p-4 text-center">
              <div className="text-4xl">
                {summaryLoading ? "—" : summary.highAlerts}
              </div>
              <div className="text-sm text-blue-300 mt-1.5">High Alerts</div>
            </div>

            <div className="bg-white/5 rounded-lg p-4 text-center">
              <div className="text-4xl">
                {summaryLoading ? "—" : `${Math.round(summary.safeDaysPct)}%`}
              </div>
              <div className="text-sm text-blue-300 mt-1.5">Safe Days</div>
            </div>
          </div>
        </div>
      </div>
      {/* Filter Section */}
      <div className="flex items-center justify-between bg-white rounded-lg p-3 shadow-sm border border-blue-100">
        <div className="flex items-center gap-3">
          <label style={{ color: "#0062a4" }} className="text-sm">
            Sort by:
          </label>

          <select
            value={sortBy}
            disabled={actionLoading}
            onChange={(e) =>
              runWithUiLoading("Sorting records...", () => {
                setSortBy(e.target.value);
                setCurrentPage(1);
              })
            }
            style={{
              borderColor: "#0062a4",
              backgroundColor: "#e0f2fe",
              color: "#0062a4",
            }}
            className={`px-3 py-1.5 text-sm rounded-lg focus:outline-none focus:ring-2 transition-all ${
              actionLoading
                ? "opacity-60 cursor-not-allowed"
                : "hover:ring-2 hover:ring-blue-300"
            }`}
          >
            <option value="date-desc">Date (Newest First)</option>
            <option value="date-asc">Date (Oldest First)</option>
            <option value="speed-desc">Wind Speed (High to Low)</option>
            <option value="speed-asc">Wind Speed (Low to High)</option>
          </select>
        </div>

        <button
          disabled={actionLoading}
          onClick={() =>
            runWithUiLoading(
              showCalendar ? "Closing date filter..." : "Opening date filter...",
              () => setShowCalendar((prev) => !prev)
            )
          }
          style={{ backgroundColor: "#0062a4" }}
          className={`flex items-center gap-2 px-4 py-1.5 text-sm text-white rounded-lg transition-all ${
            actionLoading ? "opacity-60 cursor-not-allowed" : "hover:opacity-90"
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          Select Date Range
        </button>

        {showCalendar && (
        <div className="mt-3 bg-white rounded-lg p-4 shadow-sm border border-blue-100 flex items-end gap-4 flex-wrap">
          <div>
            <label className="text-xs" style={{ color: "#0062a4" }}>
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="block mt-1 px-3 py-1.5 text-sm rounded-lg border"
              style={{ borderColor: "#0062a4" }}
            />
          </div>

          <div>
            <label className="text-xs" style={{ color: "#0062a4" }}>
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="block mt-1 px-3 py-1.5 text-sm rounded-lg border"
              style={{ borderColor: "#0062a4" }}
            />
          </div>

          <button
            disabled={actionLoading}
            onClick={() =>
              runWithUiLoading("Clearing date filter...", () => {
                setStartDate("");
                setEndDate("");
                setCurrentPage(1);
              })
            }
            className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
              actionLoading ? "opacity-60 cursor-not-allowed" : "hover:opacity-90"
            }`}
            style={{ backgroundColor: "#e0f2fe", color: "#0062a4" }}
          >
            {actionLoading ? "Clearing..." : "Clear"}
          </button>

          <button
            disabled={actionLoading}
            onClick={() =>
              runWithUiLoading("Applying date filter...", () => {
                setShowCalendar(false);
                setCurrentPage(1);
              })
            }
            className={`px-4 py-1.5 text-sm rounded-lg text-white transition-all ${
              actionLoading ? "opacity-60 cursor-not-allowed" : "hover:opacity-90"
            }`}
            style={{
              backgroundColor: actionLoading ? "#93c5fd" : "#0062a4",
            }}
          >
            {actionLoading ? "Applying..." : "Apply"}
          </button>
        </div>
      )}

      </div>

      
      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-md border border-blue-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ backgroundColor: "#0062a4" }} className="text-white">
              <tr>
                <th className="px-4 py-3 text-left text-sm">Date</th>
                <th className="px-4 py-3 text-left text-sm">Time</th>
                <th className="px-4 py-3 text-center text-sm">Current Wind Speed</th>
                <th className="px-4 py-3 text-center text-sm">Predicted Wind Speed</th>
                <th className="px-4 py-3 text-center text-sm">Current Direction</th>
                <th className="px-4 py-3 text-center text-sm">Predicted Direction</th>
              </tr>
            </thead>

            <tbody>
              {(tableLoading || actionLoading) && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm">
                    <span style={{ color: "#0062a4" }}>
                      {tableLoading ? "Loading latest data..." : actionLabel}
                    </span>
                  </td>
                </tr>
              )}

              {!tableLoading && tableErr && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm">
                    <span className="text-red-600">{tableErr}</span>
                  </td>
                </tr>
              )}

              {!tableLoading && !actionLoading && !tableErr && currentData.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm">
                    <span style={{ color: "#0062a4" }}>No records found.</span>
                  </td>
                </tr>
              )}

              {!tableLoading &&
                !actionLoading &&
                !tableErr &&
                currentData.map((record, index) => (
                  <tr
                    key={record.id ?? `${record.date}-${record.time}-${index}`}
                    className={`${
                      index % 2 === 0 ? "bg-blue-50" : "bg-white"
                    } hover:bg-blue-100 transition-colors`}
                  >
                    <td style={{ color: "#0062a4" }} className="px-4 py-3 text-sm">
                      {record.date}
                    </td>

                    <td style={{ color: "#0062a4" }} className="px-4 py-3 text-sm">
                      {record.time}
                    </td>

                    <td
                      style={{ color: "#0062a4" }}
                      className="px-4 py-3 text-center text-sm"
                    >
                      {Number.isFinite(record.currentSpeed)
                        ? `${record.currentSpeed.toFixed(1)} km/h`
                        : "—"}
                    </td>

                    <td
                      style={{ color: "#0062a4" }}
                      className="px-4 py-3 text-center text-sm"
                    >
                      {record.predictedSpeed == null ||
                      !Number.isFinite(record.predictedSpeed)
                        ? "—"
                        : `${record.predictedSpeed.toFixed(1)} km/h`}
                    </td>

                    <td
                      style={{ color: "#0062a4" }}
                      className="px-4 py-3 text-center text-sm"
                    >
                      {Number.isFinite(record.currentDirDeg)
                        ? `${record.currentDirDeg.toFixed(1)} ° ${degToCompass(
                            record.currentDirDeg
                          )}`
                        : "—"}
                    </td>

                    <td
                      style={{ color: "#0062a4" }}
                      className="px-4 py-3 text-center text-sm"
                    >
                      {record.predictedDirDeg == null ||
                      !Number.isFinite(record.predictedDirDeg)
                        ? "—"
                        : `${record.predictedDirDeg.toFixed(1)} ° ${degToCompass(
                            record.predictedDirDeg
                          )}`}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {/* PAgination */}
        <div className="bg-blue-50 px-4 py-3 border-t border-blue-200">
          <div className="flex items-center justify-between">
            <div style={{ color: "#0062a4" }} className="text-sm">
              Showing {showingFrom} to {showingTo} of {totalRecords} records
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() =>
                  runWithUiLoading("Loading previous page...", () => {
                    setCurrentPage((prev) => Math.max(1, prev - 1));
                  })
                }
                disabled={currentPageSafe === 1 || actionLoading}
                style={{
                  backgroundColor:
                    currentPageSafe === 1 || actionLoading ? "#e0f2fe" : "white",
                  color:
                    currentPageSafe === 1 || actionLoading ? "#93c5fd" : "#0062a4",
                }}
                className={`px-3 py-1.5 text-sm rounded-lg flex items-center gap-1 ${
                  currentPageSafe === 1 || actionLoading
                    ? "cursor-not-allowed"
                    : "hover:opacity-80"
                } transition-colors`}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              {getPageNumbers().map((page) => (
                <button
                  disabled={actionLoading}
                  key={page}
                  onClick={() =>
                    runWithUiLoading(`Loading page ${page}...`, () => {
                      setCurrentPage(page);
                    })
                  }
                  style={{
                    backgroundColor:
                      currentPageSafe === page
                        ? "#0062a4"
                        : actionLoading
                        ? "#e0f2fe"
                        : "white",
                    color:
                      currentPageSafe === page
                        ? "white"
                        : actionLoading
                        ? "#93c5fd"
                        : "#0062a4",
                  }}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
                    actionLoading
                      ? "opacity-60 cursor-not-allowed"
                      : "hover:opacity-80"
                  }`}
                >
                  {actionLoading && currentPageSafe === page ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    page
                  )}
                </button>
              ))}

              <button
                onClick={() =>
                  runWithUiLoading("Loading next page...", () => {
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
                  })
                }
                disabled={currentPageSafe === totalPages || actionLoading}
                style={{
                  backgroundColor:
                    currentPageSafe === totalPages || actionLoading
                      ? "#e0f2fe"
                      : "white",
                  color:
                    currentPageSafe === totalPages || actionLoading
                      ? "#93c5fd"
                      : "#0062a4",
                }}
                className={`px-3 py-1.5 text-sm rounded-lg flex items-center gap-1 ${
                  currentPageSafe === totalPages || actionLoading
                    ? "cursor-not-allowed"
                    : "hover:opacity-80"
                } transition-colors`}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Chart Section */}
      <div className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <h2
            style={{ backgroundColor: "#0062a4" }}
            className="rounded-xl p-5 shadow-lg text-white"
          >
            Wind History
          </h2>

          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value) as Year)}
            style={{ backgroundColor: "#0062a4" }}
            className="rounded-xl p-3 shadow-lg text-white"
          >
            <option value={2022}>2022</option>
            <option value={2023}>2023</option>
            <option value={2024}>2024</option>
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
          </select>

          {loading && <span className="text-sm">Loading…</span>}
          {err && <span className="text-sm text-red-600">{err}</span>}
        </div>

        <div className="mb-10">
          <h3 className="text-lg font-semibold mb-2">
            Wind Speed (Actual vs Predicted)
          </h3>
          <TimelineChart
            data={speedData}
            series={{
              actualKey: "windspeed",
              predKey: "pred_windspeed",
              actualLabel: "Actual",
              predLabel: "Predicted",
              yLabel: "Wind Speed (km/h)",
            }}
            height={420}
          />
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">
            Wind Direction (Actual vs Predicted)
          </h3>
          <TimelineChart
            data={dirData}
            series={{
              actualKey: "winddir",
              predKey: "pred_winddir",
              actualLabel: "Actual",
              predLabel: "Predicted",
              yLabel: "Wind Direction (°)",
            }}
            height={420}
          />
        </div>
      </div>
    </div>
  );
}
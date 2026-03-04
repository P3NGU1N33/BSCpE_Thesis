import { useEffect, useMemo, useState } from "react";
import { TrendingUp, Calendar, Clock, Navigation, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import Papa from "papaparse";
import TimelineChart from "./TimelineChart";
import type { HighestWind } from "../types/wind";
import { degToCompass } from "../utils/wind";

type Year = 2022 | 2023 | 2024 | 2025;

const HIGH_ALERT_KMH = 22; // change this if your own rule is different

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
  ts: number;              // numeric timestamp for sorting
  date: string;            // YYYY-MM-DD (UTC)
  time: string;            // hh:mm AM/PM (UTC)
  currentSpeed: number;
  predictedSpeed: number | null;
  currentDirDeg: number;
  predictedDirDeg: number | null;
};

type WindHistoryPageProps = {
  apiRows: ApiRow[];
  tableLoading: boolean;
  tableErr: string | null;
  highestWind: HighestWind | null;
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
//Date Parsing Helper
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


export function WindHistoryPage({
  apiRows,
  tableLoading,
  tableErr,
  highestWind,
}: WindHistoryPageProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('date-desc');
  // For years ML chart
  const [year, setYear] = useState<Year>(2025);
  const [speedRaw, setSpeedRaw] = useState<WindSpeedRow[]>([]);
  const [dirRaw, setDirRaw] = useState<WindDirRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // For ML charts - load CSVs when year changes
  useEffect(() => {
    let alive = true;

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

  //For historical Data Table - sort whenever apiRows or sortBy changes
  const tableData: TableRow[] = useMemo(() => {
  return apiRows.map((r) => {
    const dt = safeDateParts(r.timestamp);

      // If invalid datetime, skip this row (recommended)
      if (!dt.valid) return null;

    const currentSpeed = Number(r.windspeed);
    const predictedSpeed = r.pred_windspeed == null ? null : Number(r.pred_windspeed);

    const currentDirDeg = Number(r.winddir);
    const predictedDirDeg = r.pred_winddir == null ? null : Number(r.pred_winddir);

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
  }).filter((record): record is NonNullable<typeof record> => record !== null);
}, [apiRows]);

  //Computes the summary of the table like stats 
  const summary = useMemo(() => {
  // Ignore invalid speeds
  const rows = tableData.filter(r => Number.isFinite(r.currentSpeed));

  if (rows.length === 0) {
    return {
      daysMonitored: 0,
      avgWind: 0,
      highAlerts: 0,
      safeDaysPct: 0,
    };
  }

  // Average wind across ALL records
  const sum = rows.reduce((acc, r) => acc + r.currentSpeed, 0);
  const avgWind = sum / rows.length;

  // Group by day and track max wind per day
  const dayMax = new Map<string, number>();
  let highAlerts = 0;

  for (const r of rows) {
    // count high-alert rows (events)
    if (r.currentSpeed >= HIGH_ALERT_KMH) highAlerts++;

    // max wind per date
    const prev = dayMax.get(r.date);
    if (prev == null || r.currentSpeed > prev) {
      dayMax.set(r.date, r.currentSpeed);
    }
  }

  const daysMonitored = dayMax.size;

  // safe day if max wind that day is below threshold
  let safeDays = 0;
  for (const maxV of dayMax.values()) {
    if (maxV < HIGH_ALERT_KMH) safeDays++;
  }

  const safeDaysPct = daysMonitored === 0 ? 0 : (safeDays / daysMonitored) * 100;

  return {
    daysMonitored,
    avgWind,
    highAlerts,
    safeDaysPct,
  };
}, [tableData]);


  // Date range + sort 
  const filteredSortedTableData = useMemo(() => {
    // 1) filter by date range
    let data = tableData;

    if (startDate) {
      data = data.filter((r) => r.date >= startDate);
    }
    if (endDate) {
      data = data.filter((r) => r.date <= endDate);
    }
      // Sort copy only when needed
      const sorted = [...data];
      // 2) sort
      switch (sortBy) {
        case "date-asc":
          sorted.sort((a, b) => a.ts - b.ts);
          break;
        case "date-desc":
          sorted.sort((a, b) => b.ts - a.ts);
          break;
        case "speed-asc":
          sorted.sort((a, b) => a.currentSpeed - b.currentSpeed);
          break;
        case "speed-desc":
          sorted.sort((a, b) => b.currentSpeed - a.currentSpeed);
          break;
      }

      return sorted;
  }, [tableData, sortBy, startDate, endDate]);

  // Recharts wants numeric x-axis (timestamp)
  const speedData = useMemo(() => {
    return speedRaw
      .map((r) => {
        const t = new Date(String(r.datetime)).getTime();
        const actual = Number(r.windspeed);
        const pred = Number(r.pred_windspeed);
        if (!Number.isFinite(t) || !Number.isFinite(actual) || !Number.isFinite(pred)) return null;
        return { t, windspeed: actual, pred_windspeed: pred };
      })
      .filter((item): item is { t: number; windspeed: number; pred_windspeed: number } => item !== null);
  }, [speedRaw]);

  const dirData = useMemo(() => {
    return dirRaw
      .map((r) => {
        const t = new Date(String(r.datetime)).getTime();
        const actual = Number(r.winddir);
        const pred = Number(r.pred_winddir);
        if (!Number.isFinite(t) || !Number.isFinite(actual) || !Number.isFinite(pred)) return null;
        return { t, winddir: actual, pred_winddir: pred };
      })
      .filter((item): item is { t: number; winddir: number; pred_winddir: number } => item !== null);
  }, [dirRaw]);
  
  const itemsPerPage = 10;

  
  const totalRecords = filteredSortedTableData.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / itemsPerPage));
  const currentPageSafe = useMemo(() => Math.min(currentPage, totalPages),[currentPage, totalPages]);
  const startIndex = (currentPageSafe - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = useMemo(() => filteredSortedTableData.slice(startIndex, endIndex),[filteredSortedTableData, startIndex, endIndex]);

  const showingFrom = totalRecords === 0 ? 0 : startIndex + 1;
  const showingTo = Math.min(endIndex, totalRecords);

  const getPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="space-y-4">
      {/* Wind History Summary Panel */}
      <div style={{ backgroundColor: '#0062a4' }} className="rounded-xl p-6 shadow-lg text-white">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp className="w-6 h-6" />
          <h2 className="text-white text-xl">Wind History Summary</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-5 border border-white/20">
            <div className="text-sm text-blue-200 mb-3">Highest Recorded Wind</div>
            <div className="flex items-end gap-2 mb-4">
              <div className="text-6xl">{highestWind ? highestWind.speed.toFixed(1) : "—"}</div>
              <div className="text-2xl text-blue-200 pb-1.5">km/h</div>
            </div>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-blue-300" />
                <span className="text-blue-100">{highestWind ? highestWind.date : "—"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-blue-300" />
                <span className="text-blue-100">{highestWind ? highestWind.time : "—"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Navigation className="w-4 h-4 text-blue-300" />
                <span className="text-blue-100">{highestWind
                  ? `${Math.round(highestWind.directionDeg)}° ${degToCompass(highestWind.directionDeg)}`
                  : "—"}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-lg p-4 text-center">
              <div className="text-4xl">{tableLoading ? "—" : summary.daysMonitored}</div>
              <div className="text-sm text-blue-300 mt-1.5">Days Monitored</div>
            </div>
            <div className="bg-white/5 rounded-lg p-4 text-center">
              <div className="text-4xl">{tableLoading ? "—" : summary.avgWind.toFixed(1)}</div>
              <div className="text-sm text-blue-300 mt-1.5">Avg Wind (km/h)</div>
            </div>
            <div className="bg-white/5 rounded-lg p-4 text-center">
              <div className="text-4xl">{tableLoading ? "—" : summary.highAlerts}</div>
              <div className="text-sm text-blue-300 mt-1.5">High Alerts</div>
            </div>
            <div className="bg-white/5 rounded-lg p-4 text-center">
              <div className="text-4xl">{tableLoading ? "—" : `${Math.round(summary.safeDaysPct)}%`}</div>
              <div className="text-sm text-blue-300 mt-1.5">Safe Days</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between bg-white rounded-lg p-3 shadow-sm border border-blue-100">
        <div className="flex items-center gap-3">
          <label style={{ color: '#0062a4' }} className="text-sm">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{ borderColor: '#0062a4', backgroundColor: '#e0f2fe', color: '#0062a4' }}
            className="px-3 py-1.5 text-sm rounded-lg focus:outline-none focus:ring-2"
          >
            <option value="date-desc">Date (Newest First)</option>
            <option value="date-asc">Date (Oldest First)</option>
            <option value="speed-desc">Wind Speed (High to Low)</option>
            <option value="speed-asc">Wind Speed (Low to High)</option>
          </select>
        </div>

        <button onClick={() => setShowCalendar((prev) => !prev)}
                style={{ backgroundColor: '#0062a4' }}
                className="flex items-center gap-2 px-4 py-1.5 text-sm text-white rounded-lg hover:opacity-90 transition-colors"
        >
          <CalendarDays className="w-4 h-4" />
          Select Date Range
        </button>
      </div>

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
            onClick={() => {
              setStartDate("");
              setEndDate("");
            }}
            className="px-3 py-1.5 text-sm rounded-lg"
            style={{ backgroundColor: "#e0f2fe", color: "#0062a4" }}
          >
            Clear
          </button>

          <button
            onClick={() => setShowCalendar(false)}
            className="px-4 py-1.5 text-sm rounded-lg text-white"
            style={{ backgroundColor: "#0062a4" }}
          >
            Apply
          </button>

        </div>
      )}

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-md border border-blue-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
          <thead style={{ backgroundColor: '#0062a4' }} className="text-white">
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
            {/* ✅ Loading */}
            {tableLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm">
                  <span style={{ color: "#0062a4" }}>Loading latest data…</span>
                </td>
              </tr>
            )}

            {/* ✅ Error */}
            {!tableLoading && tableErr && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm">
                  <span className="text-red-600">{tableErr}</span>
                </td>
              </tr>
            )}

            {/* ✅ Empty */}
            {!tableLoading && !tableErr && currentData.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm">
                  <span style={{ color: "#0062a4" }}>No records found.</span>
                </td>
              </tr>
            )}

            {/* ✅ Data */}
            {!tableLoading &&
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

                  <td style={{ color: "#0062a4" }} className="px-4 py-3 text-center text-sm">
                    {Number.isFinite(record.currentSpeed)
                      ? `${record.currentSpeed.toFixed(1)} km/h`
                      : "—"}
                  </td>

                  <td style={{ color: "#0062a4" }} className="px-4 py-3 text-center text-sm">
                    {record.predictedSpeed == null || !Number.isFinite(record.predictedSpeed)
                      ? "—"
                      : `${record.predictedSpeed.toFixed(1)} km/h`}
                  </td>

                  <td style={{ color: "#0062a4" }} className="px-4 py-3 text-center text-sm">
                    {Number.isFinite(record.currentDirDeg)
                      ? `${record.currentDirDeg.toFixed(1)} °`
                      : "—"}
                  </td>

                  <td style={{ color: "#0062a4" }} className="px-4 py-3 text-center text-sm">
                    {record.predictedDirDeg == null || !Number.isFinite(record.predictedDirDeg)
                      ? "—"
                      : `${record.predictedDirDeg.toFixed(1)} °`}
                  </td>
                </tr>
              ))}
          </tbody>
          </table>

          {/* <table className="w-full">
            <thead style={{ backgroundColor: '#0062a4' }} className="text-white">
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
              {currentData.map((record, index) => (
                <tr
                  key={index}
                  className={`${
                    index % 2 === 0 ? 'bg-blue-50' : 'bg-white'
                  } hover:bg-blue-100 transition-colors`}
                >
                  <td style={{ color: '#0062a4' }} className="px-4 py-3 text-sm">{record.date}</td>
                  <td style={{ color: '#0062a4' }} className="px-4 py-3 text-sm">{record.time}</td>
                  <td style={{ color: '#0062a4' }} className="px-4 py-3 text-center text-sm">
                    {record.currentSpeed} km/h
                  </td>
                  <td style={{ color: '#0062a4' }} className="px-4 py-3 text-center text-sm">
                    {record.predictedSpeed} km/h
                  </td>
                  <td style={{ color: '#0062a4' }} className="px-4 py-3 text-center text-sm">
                    {record.currentDir}
                  </td>
                  <td style={{ color: '#0062a4' }} className="px-4 py-3 text-center text-sm">
                    {record.predictedDir}
                  </td>
                </tr>
              ))}
            </tbody>
          </table> */}
        </div>

        {/* Pagination */}
        <div className="bg-blue-50 px-4 py-3 border-t border-blue-200">


          <div className="flex items-center justify-between">
            <div style={{ color: "#0062a4" }} className="text-sm">
              Showing {showingFrom} to {showingTo} of {totalRecords} records
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPageSafe === 1}
                style={{
                  backgroundColor: currentPageSafe === 1 ? "#e0f2fe" : "white",
                  color: currentPageSafe === 1 ? "#93c5fd" : "#0062a4",
                }}
                className={`px-3 py-1.5 text-sm rounded-lg flex items-center gap-1 ${
                  currentPageSafe === 1 ? "cursor-not-allowed" : "hover:opacity-80"
                } transition-colors`}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              {getPageNumbers().map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  style={{
                    backgroundColor: currentPageSafe === page ? "#0062a4" : "white",
                    color: currentPageSafe === page ? "white" : "#0062a4",
                  }}
                  className="px-3 py-1.5 text-sm rounded-lg transition-colors hover:opacity-80"
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPageSafe === totalPages}
                style={{
                  backgroundColor: currentPageSafe === totalPages ? "#e0f2fe" : "white",
                  color: currentPageSafe === totalPages ? "#93c5fd" : "#0062a4",
                }}
                className={`px-3 py-1.5 text-sm rounded-lg flex items-center gap-1 ${
                  currentPageSafe === totalPages ? "cursor-not-allowed" : "hover:opacity-80"
                } transition-colors`}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>


          {/* <div className="flex items-center justify-between">
            <div style={{ color: '#0062a4' }} className="text-sm">
              Showing {startIndex + 1} to {Math.min(endIndex, historicalData.length)} of{' '}
              {historicalData.length} records
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                style={{
                  backgroundColor: currentPage === 1 ? '#e0f2fe' : 'white',
                  color: currentPage === 1 ? '#93c5fd' : '#0062a4'
                }}
                className={`px-3 py-1.5 text-sm rounded-lg flex items-center gap-1 ${
                  currentPage === 1 ? 'cursor-not-allowed' : 'hover:opacity-80'
                } transition-colors`}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              {getPageNumbers().map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  style={{
                    backgroundColor: currentPage === page ? '#0062a4' : 'white',
                    color: currentPage === page ? 'white' : '#0062a4'
                  }}
                  className="px-3 py-1.5 text-sm rounded-lg transition-colors hover:opacity-80"
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                style={{
                  backgroundColor: currentPage === totalPages ? '#e0f2fe' : 'white',
                  color: currentPage === totalPages ? '#93c5fd' : '#0062a4'
                }}
                className={`px-3 py-1.5 text-sm rounded-lg flex items-center gap-1 ${
                  currentPage === totalPages ? 'cursor-not-allowed' : 'hover:opacity-80'
                } transition-colors`}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div> */}
        </div>
      </div>
      {/* Charts Sections */}
      <div className="p-4">
      <div className="flex items-center gap-3 mb-4">
        <h2 style={{ backgroundColor: '#0062a4' }} className="rounded-xl p-5 shadow-lg text-white">Wind History</h2>

        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value) as Year)}
          style={{ backgroundColor: '#0062a4' }} className="rounded-xl p-3 shadow-lg text-white"
        >
          <option value={2022}>2022</option>
          <option value={2023}>2023</option>
          <option value={2024}>2024</option>
          <option value={2025}>2025</option>
        </select>

        {loading && <span className="text-sm">Loading…</span>}
        {err && <span className="text-sm text-red-600">{err}</span>}
      </div>

      {/* WIND SPEED */}
      <div className="mb-10">
        <h3 className="text-lg font-semibold mb-2">Wind Speed (Actual vs Predicted)</h3>
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

      {/* WIND DIRECTION */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Wind Direction (Actual vs Predicted)</h3>
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
import { useEffect, useMemo, useState } from "react";
import { TrendingUp, Calendar, Clock, Navigation, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import Papa from "papaparse";
import TimelineChart from "./TimelineChart";

type Year = 2022 | 2023 | 2024 | 2025;

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


export function WindHistoryPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('date-desc');
  const [year, setYear] = useState<Year>(2025);
  const [speedRaw, setSpeedRaw] = useState<WindSpeedRow[]>([]);
  const [dirRaw, setDirRaw] = useState<WindDirRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

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

  // Recharts wants numeric x-axis (timestamp)
  const speedData = useMemo(() => {
    return speedRaw
      .map((r) => {
        const t = new Date(r.datetime).getTime();
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
        const t = new Date(r.datetime).getTime();
        const actual = Number(r.winddir);
        const pred = Number(r.pred_winddir);
        if (!Number.isFinite(t) || !Number.isFinite(actual) || !Number.isFinite(pred)) return null;
        return { t, winddir: actual, pred_winddir: pred };
      })
      .filter((item): item is { t: number; winddir: number; pred_winddir: number } => item !== null);
  }, [dirRaw]);
  
  const itemsPerPage = 10;

  // Mock data for highest recorded wind
  const highestWind = {
    speed: 42.8,
    date: 'November 15, 2025',
    time: '14:35',
    direction: '315° Northwest',
  };

  // Mock historical data
  const historicalData = [
    { date: '2025-11-22', time: '08:00', currentSpeed: 12.5, predictedSpeed: 15.2, currentDir: 'Northeast', predictedDir: 'East' },
    { date: '2025-11-22', time: '07:00', currentSpeed: 10.8, predictedSpeed: 12.5, currentDir: 'North', predictedDir: 'Northeast' },
    { date: '2025-11-21', time: '18:00', currentSpeed: 18.3, predictedSpeed: 20.1, currentDir: 'East', predictedDir: 'East' },
    { date: '2025-11-21', time: '17:00', currentSpeed: 16.7, predictedSpeed: 18.3, currentDir: 'East', predictedDir: 'East' },
    { date: '2025-11-21', time: '16:00', currentSpeed: 15.2, predictedSpeed: 16.7, currentDir: 'Northeast', predictedDir: 'East' },
    { date: '2025-11-21', time: '15:00', currentSpeed: 14.9, predictedSpeed: 15.2, currentDir: 'Northeast', predictedDir: 'Northeast' },
    { date: '2025-11-20', time: '12:00', currentSpeed: 22.4, predictedSpeed: 24.8, currentDir: 'Southeast', predictedDir: 'Southeast' },
    { date: '2025-11-20', time: '11:00', currentSpeed: 20.1, predictedSpeed: 22.4, currentDir: 'Southeast', predictedDir: 'Southeast' },
    { date: '2025-11-20', time: '10:00', currentSpeed: 19.5, predictedSpeed: 20.1, currentDir: 'East', predictedDir: 'Southeast' },
    { date: '2025-11-20', time: '09:00', currentSpeed: 17.8, predictedSpeed: 19.5, currentDir: 'East', predictedDir: 'East' },
    { date: '2025-11-19', time: '14:00', currentSpeed: 13.2, predictedSpeed: 14.6, currentDir: 'North', predictedDir: 'Northeast' },
    { date: '2025-11-19', time: '13:00', currentSpeed: 11.9, predictedSpeed: 13.2, currentDir: 'North', predictedDir: 'North' },
    { date: '2025-11-18', time: '16:30', currentSpeed: 25.6, predictedSpeed: 27.3, currentDir: 'Northwest', predictedDir: 'Northwest' },
    { date: '2025-11-18', time: '15:30', currentSpeed: 23.8, predictedSpeed: 25.6, currentDir: 'Northwest', predictedDir: 'Northwest' },
    { date: '2025-11-17', time: '09:15', currentSpeed: 14.3, predictedSpeed: 15.8, currentDir: 'Northeast', predictedDir: 'East' },
  ];

  const totalPages = Math.ceil(historicalData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = historicalData.slice(startIndex, endIndex);

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
              <div className="text-6xl">{highestWind.speed}</div>
              <div className="text-2xl text-blue-200 pb-1.5">km/h</div>
            </div>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-blue-300" />
                <span className="text-blue-100">{highestWind.date}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-blue-300" />
                <span className="text-blue-100">{highestWind.time}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Navigation className="w-4 h-4 text-blue-300" />
                <span className="text-blue-100">{highestWind.direction}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-lg p-4 text-center">
              <div className="text-4xl">156</div>
              <div className="text-sm text-blue-300 mt-1.5">Days Monitored</div>
            </div>
            <div className="bg-white/5 rounded-lg p-4 text-center">
              <div className="text-4xl">12.4</div>
              <div className="text-sm text-blue-300 mt-1.5">Avg Wind (km/h)</div>
            </div>
            <div className="bg-white/5 rounded-lg p-4 text-center">
              <div className="text-4xl">23</div>
              <div className="text-sm text-blue-300 mt-1.5">High Alerts</div>
            </div>
            <div className="bg-white/5 rounded-lg p-4 text-center">
              <div className="text-4xl">89%</div>
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

        <button style={{ backgroundColor: '#0062a4' }} className="flex items-center gap-2 px-4 py-1.5 text-sm text-white rounded-lg hover:opacity-90 transition-colors">
          <CalendarDays className="w-4 h-4" />
          Select Date Range
        </button>
      </div>

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
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-blue-50 px-4 py-3 border-t border-blue-200">
          <div className="flex items-center justify-between">
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
          </div>
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
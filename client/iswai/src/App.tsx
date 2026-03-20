import { useState, useMemo, useEffect } from 'react';
import { WindPredictionCard } from './components/WindPredictionCard';
import { WindHistoryPanel } from './components/WindHistoryPanel';
import { WindTipsPanel } from './components/WindTipsPanel';
import { WindMainTipsPanel } from './components/WindMainTipsPanel';
import { WindHistoryPage } from './components/WindHistoryPage';
import { Navigation } from 'lucide-react';
import { supabase } from "./lib/supabase";
import { degToCompass } from "./utils/wind";
import iswaiLogo from './assets/iSWAI_logo.png';
import schoolLogo from './assets/UC_logo.png';

interface HistoryRow {
  id: number;
  timestamp: string;
  windspeed: string | number;
  pred_windspeed: string | number | null;
  winddir: string | number;
  pred_winddir: string | number | null;
  pred_timestamp: string | null;
}

function App() {
  const [activeNav, setActiveNav] = useState('Wind Alert');
  //For Fetching
  const [latestRow, setLatestRow] = useState<HistoryRow | null>(null);
  const [latestLoading, setLatestLoading] = useState(false);
  const [latestErr, setLatestErr] = useState<string | null>(null);
 

  useEffect(() => {
      let alive = true;

      const loadLatest = async () => {
        try {
          setLatestLoading(true);
          setLatestErr(null);
          await fetch("http://127.0.0.1:8000/predict/latest", { method: "POST" });
          const { data, error } = await supabase
            .from("iswai_data")
            .select(`
              id,
              timestamp,
              windspeed,
              winddir,
              pred_windspeed,
              pred_winddir,
              pred_timestamp
            `)
            .order("timestamp", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (error) throw error;
          if (!alive) return;

          setLatestRow((data as HistoryRow | null) ?? null);
        } catch (e: unknown) {
          if (!alive) return;
          setLatestErr(e instanceof Error ? e.message : "Failed to load latest row");
        } finally {
          if (alive) setLatestLoading(false);
        }
      };

      loadLatest();

      const channel = supabase
        .channel("iswai_data_latest_changes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "iswai_data" },
          () => {
            loadLatest();
          }
        )
        .subscribe();

      return () => {
        alive = false;
        supabase.removeChannel(channel);
      };
    }, []);

  // Mock data for current conditions
  const currentWind = useMemo(() => {
    if (!latestRow) return null;

    const speed = Number(latestRow.windspeed);
    const dir = Number(latestRow.winddir);

    return {
      speed: Number.isFinite(speed) ? speed : null,
      direction:
        Number.isFinite(dir) ? `${dir.toFixed(0)}° ${degToCompass(dir)}` : null,
      timestamp: latestRow.timestamp,
    };
  }, [latestRow]);

  // Mock data for next hour prediction
  const nextHourWind = useMemo(() => {
    if (!latestRow) return null;
    
    // accept either key from API
    const rawPredTs =
    latestRow.pred_timestamp ??
    null;
    
    //fallback if pred_timestamp is missing or invalid
    const fallbackPredTs = (() => {
    const base = new Date(latestRow.timestamp);
    if (Number.isNaN(base.getTime())) return null;
    base.setHours(base.getHours() + 1);
    return base.toISOString();
    })();

    const ps = rawPredTs ?? fallbackPredTs;
    const speed = Number(latestRow.pred_windspeed);
    const dir = Number(latestRow.pred_winddir);

    return {
      speed: Number.isFinite(speed) ? speed : null,
      direction:
        Number.isFinite(dir) ? `${dir.toFixed(0)}° ${degToCompass(dir)}` : null,
      pred_timestamp: ps,
    };
  }, [latestRow]);

  const handleNavClick = (navItem: string) => {
    setActiveNav(navItem);
  };

  return (
    <div className="min-h-screen bg-[#b5e5ff] flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-blue-100 lg:rounded-b-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo Section */}
            <button 
              onClick={() => handleNavClick('Wind Alert')}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
              aria-label="Go to dashboard"
            >
              <img src={iswaiLogo} alt="iSWAI Logo" className="h-10" />
              <img src={schoolLogo} alt="University of Cebu" className="h-8" />
            </button>

            {/* Navigation - Desktop Only */}
            <nav className="hidden lg:flex gap-2">
              {['Wind Alert', 'Wind History', 'Wind Tips'].map((item) => (
                <button
                  key={item}
                  onClick={() => handleNavClick(item)}
                  style={{
                    backgroundColor: activeNav === item ? '#0062a4' : '#e0f2fe',
                    color: activeNav === item ? 'white' : '#0062a4'
                  }}
                  className={`px-3 py-1 rounded-lg transition-all text-l font-sm hover:opacity-90`}
                >
                  {item}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Tabs - Separate Panel */}
      <nav className="lg:hidden w-full" style={{ backgroundColor: '#0062a4' }}>
        <div className="grid grid-cols-3 gap-2 p-3">
          {['Wind Alert', 'Wind History', 'Wind Tips'].map((item) => (
            <button
              key={item}
              onClick={() => handleNavClick(item)}
              style={{
                backgroundColor: activeNav === item ? 'white' : 'transparent',
                color: activeNav === item ? '#0062a4' : 'white'
              }}
              className={`px-2 py-2 rounded-md transition-all text-xs hover:opacity-90`}
            >
              {item}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-2">
        {activeNav === 'Wind Alert' && (
          <div className="grid grid-cols-1 lg:grid-cols-7 gap-6 h-full">
            {/* Left Column - Wind Predictions */}
            <div className="lg:col-span-5">
              {/* Wind Forecast Panel */}
              <div
                className="rounded-2xl p-3 shadow-md h-full"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.45)', 
                  borderColor: '#0062a4',
                  borderWidth: '1px',
                  borderStyle: 'solid'
                }}
              >

                {/* Panel Header */}
                <div className="flex items-center gap-2 mb-1.5">
                  <Navigation className="w-5 h-5" style={{ color: '#0062a4' }} />
                  <h2 className="text-2xl font-bold" style={{ color: '#0062a4' }}>Wind Forecast</h2>
                </div>

                {latestLoading && (
                  <div className="mb-3 text-sm" style={{ color: "#0062a4" }}>
                    Loading latest wind data...
                  </div>
                )}

                {latestErr && (
                  <div className="mb-3 text-sm text-red-600">
                    {latestErr}
                  </div>
                )}


                {/* Current Conditions */}
                <div className="mb-2">
                  <h3 className="text-xl font-sm mb-1.5" style={{ color: '#0062a4' }}>Current Conditions</h3>
                  <WindPredictionCard
                    windSpeed={currentWind?.speed ?? null}
                    windDirection={currentWind?.direction ?? null}
                    timestamp ={currentWind?.timestamp ?? null}
                    isCurrent={true}
                  />
                </div>

                {/* Next Hour Prediction */}
                <div className="mb-2">
                  <h3 className="text-xl font-sm mb-1.5" style={{ color: '#0062a4' }}>Next Hour Prediction</h3>
                  <WindPredictionCard
                    windSpeed={nextHourWind?.speed ? Number(nextHourWind.speed.toFixed(2)) : null}
                    windDirection={nextHourWind?.direction ?? null}
                    timestamp={nextHourWind?.pred_timestamp ?? null}
                    isCurrent={false}
                  />  
                </div>

                {/* Safety Indicator Legend */}
                <div className="bg-white/60 rounded-lg p-2 border" style={{ borderColor: '#0062a4' }}>
                  <h4 className="text-xl font-bold mb-1.5" style={{ color: '#0062a4' }}>Safety Indicator Guidelines</h4>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 font-sm text-l">
                      <div className="w-4 h-4 rounded-full bg-green-500"></div>
                      <span className="text-gray-700"><span className="text-green-700 font-bold">Safe:</span> 0–28.8 km/h</span>
                    </div>
                    <div className="flex items-center gap-2 font-sm text-l">
                      <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                      <span className="text-gray-700"><span className="text-yellow-700 font-bold">Moderate:</span> 32.4–75.6 km/h</span>
                    </div>
                    <div className="flex items-center gap-2 font-sm text-l">
                      <div className="w-4 h-4  rounded-full bg-red-500"></div>
                      <span className="text-gray-700"><span className="text-red-700 font-bold">Unsafe:</span> ≥80 km/h</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - History & Tips */}
            <div className="lg:col-span-2 flex flex-col space-y-3">
              <WindHistoryPanel
                onNavigate={() => handleNavClick("Wind History")}
              />
              <div className="flex-1">
                <WindMainTipsPanel onNavigate={() => handleNavClick('Wind Tips')} />
              </div>
            </div>
          </div>
        )}

        {activeNav === "Wind History" && (
          <WindHistoryPage
          />
        )}

        {activeNav === 'Wind Tips' && (
          <div className="max-w-4xl mx-auto">
            <WindTipsPanel />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{ backgroundColor: '#0062a4' }} className="text-white rounded-t-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="text-center">
            <p className="text-m font-semibold text-blue-100">
              <span className="text-white font-bold">iSWAI</span> – Talisay, Daanbantayan, Cebu
            </p>
            <p className="text-sm text-blue-300 mt-0.5 italic">
              Protecting Fishermen, Saving Lives
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
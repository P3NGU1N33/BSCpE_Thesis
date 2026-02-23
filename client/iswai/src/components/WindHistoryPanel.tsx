import { TrendingUp, Calendar, Clock, Navigation } from 'lucide-react';

interface WindHistoryPanelProps {
  onNavigate?: () => void;
}

export function WindHistoryPanel({ onNavigate }: WindHistoryPanelProps) {
  // Mock data for highest recorded wind
  const highestWind = {
    speed: 42.8,
    date: 'November 15, 2025',
    time: '14:35',
    direction: '315° Northwest',
  };

  return (
    <div style={{ background: 'linear-gradient(to bottom right, #0062a4, #004a7c)' }} className="rounded-xl p-3 shadow-lg text-white">
      {/* Header */}
      <div 
        className="flex items-center gap-2 mb-2 cursor-pointer hover:opacity-80 transition-opacity" 
        onClick={onNavigate}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            onNavigate?.();
          }
        }}
      >
        <TrendingUp className="w-3.5 h-3.5" />
        <h3 className="text-blue-100 text-xs">Wind History</h3>
      </div>

      {/* Title */}
      <h4 className="text-sm mb-2">Highest Recorded Wind</h4>

      {/* Main Info Grid */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        {/* Wind Speed Display */}
        <div className="col-span-2 bg-white/10 rounded-lg p-2 text-center">
          <div className="text-3xl mb-0.5">{highestWind.speed}</div>
          <div className="text-xs text-blue-200">m/s</div>
        </div>

        {/* Date */}
        <div className="bg-white/10 rounded-lg p-2">
          <div className="flex items-center gap-1 mb-1">
            <Calendar className="w-3 h-3 text-blue-200" />
            <div className="text-xs text-blue-200">Date</div>
          </div>
          <div className="text-xs">{highestWind.date}</div>
        </div>

        {/* Time */}
        <div className="bg-white/10 rounded-lg p-2">
          <div className="flex items-center gap-1 mb-1">
            <Clock className="w-3 h-3 text-blue-200" />
            <div className="text-xs text-blue-200">Time</div>
          </div>
          <div className="text-xs">{highestWind.time}</div>
        </div>

        {/* Direction */}
        <div className="col-span-2 bg-white/10 rounded-lg p-2">
          <div className="flex items-center gap-1 mb-1">
            <Navigation className="w-3 h-3 text-blue-200" />
            <div className="text-xs text-blue-200">Direction</div>
          </div>
          <div className="text-xs">{highestWind.direction}</div>
        </div>
      </div>
    </div>
  );
}
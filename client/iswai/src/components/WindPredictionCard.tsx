import { Wind, Navigation, Radio } from 'lucide-react';

interface WindPredictionCardProps {
  windSpeed: number;
  windDirection: string;
  isCurrent: boolean;
}

export function WindPredictionCard({
  windSpeed,
  windDirection,
  isCurrent,
}: WindPredictionCardProps) {
  // Automatically determine status based on wind speed (m/s)
  const getStatus = (speed: number): 'safe' | 'moderate' | 'high' => {
    if (speed >= 0 && speed <= 8) return 'safe';
    if (speed >= 9 && speed <= 21) return 'moderate';
    return 'high'; // 22-33 m/s and above
  };

  const status = getStatus(windSpeed);

  const getStatusConfig = (status: 'safe' | 'moderate' | 'high') => {
    switch (status) {
      case 'safe':
        return {
          label: 'Safe',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-300',
          textColor: 'text-green-700',
          badgeColor: 'bg-green-500',
        };
      case 'moderate':
        return {
          label: 'Moderate Alert',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-300',
          textColor: 'text-yellow-700',
          badgeColor: 'bg-yellow-500',
        };
      case 'high':
        return {
          label: 'High Wind Alert',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-300',
          textColor: 'text-red-700',
          badgeColor: 'bg-red-500',
        };
    }
  };

  const statusConfig = getStatusConfig(status);

  return (
    <div
      className={`${statusConfig.bgColor} border-2 ${statusConfig.borderColor} rounded-xl p-2 shadow-md transition-all hover:shadow-lg`}
    >
      {/* Alert Badge */}
      <div className="flex justify-between items-start mb-1.5">
        <span
          className={`${statusConfig.badgeColor} text-white px-2 py-0.5 rounded-full text-xs`}
        >
          {statusConfig.label}
        </span>
        {isCurrent && (
          <span style={{ backgroundColor: '#0062a4' }} className="text-white px-2 py-0.5 rounded-full text-xs flex items-center gap-1">
            <Radio className="w-3 h-3" />
            LIVE
          </span>
        )}
      </div>

      {/* Wind Data - Horizontal Flexbox */}
      <div className="flex items-center justify-center gap-4 mb-1.5">
        {/* Wind Speed */}
        <div className="flex flex-col items-center">
          {/* icon + value + unit in one row */}
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Wind className={`w-4 h-4 ${statusConfig.textColor}`} />
            <span className="text-7xl font-bold text-gray-900 opacity-90">
              {windSpeed}
            </span>
            <span className="text-xs text-gray-600">m/s</span>
          </div>

          {/* label centered below */}
          <div className={`text-xs ${statusConfig.textColor}`}>Wind Speed</div>
        </div>

        {/* Vertical Divider */}
        <div className={`h-16 w-px ${statusConfig.borderColor} bg-current opacity-30`}></div>

        {/* Wind Direction */}
        <div className="flex flex-col items-center">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Navigation className={`w-4 h-4 ${statusConfig.textColor}`} />
            <span className="text-2xl text-gray-900">
              {windDirection}
            </span>
          </div>
          
          <div className={`text-xs ${statusConfig.textColor}`}>Wind Direction</div>
        </div>
      </div>

      {/* Status Message */}
      <div className={`mt-1.5 p-1.5 bg-white/50 rounded-lg text-center text-xs ${statusConfig.textColor}`}>
        {status === 'safe' && '✓ Conditions are safe for fishing'}
        {status === 'moderate' && '⚠ Exercise caution when going out'}
        {status === 'high' && '⚠ Dangerous conditions - stay ashore'}
      </div>
    </div>
  );
}
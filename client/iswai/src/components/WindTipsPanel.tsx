

import {
  Lightbulb,
  Phone,
  ShieldCheck,
  Waves,
  Compass,
  Sunrise,
  HeartHandshake,
  Send,
} from 'lucide-react';

interface WindTipsPanelProps {
  onNavigate?: () => void;
}

export function WindTipsPanel({ onNavigate }: WindTipsPanelProps) {
  const tips = [
    {
      title: 'Check Before You Go',
      description:
        'Always check wind conditions before heading out to sea. Safe fishing starts with being informed.',
      icon: <ShieldCheck className="w-5 h-5 text-blue-600" />,
    },
    {
      title: 'Wind Speed Guidelines',
      description:
        'Winds below 15 km/h are generally safe. 15–25 km/h requires caution. Above 25 km/h – stay ashore.',
      icon: <Waves className="w-5 h-5 text-cyan-600" />,
    },
    {
      title: 'Direction Matters',
      description:
        'Offshore winds can push you away from shore. Be extra careful when winds blow away from land.',
      icon: <Compass className="w-5 h-5 text-sky-600" />,
    },
    {
      title: 'Early Morning Safety',
      description:
        'Early morning usually has calmer winds. Plan your fishing trips during these safer hours.',
      icon: <Sunrise className="w-5 h-5 text-amber-500" />,
    },
    {
      title: 'Trust Your Instincts',
      description:
        'If conditions feel unsafe, they probably are. It’s better to miss a day of fishing than risk your life.',
      icon: <HeartHandshake className="w-5 h-5 text-yellow-500" />,
    },
    {
      title: 'Share Your Plans',
      description:
        'Always tell someone where you’re going and when you expect to return.',
      icon: <Send className="w-5 h-5 text-indigo-600" />,
    },
  ];

  const hotlines = [
    {
      name: 'Coast Guard Sub-Station Daanbantayan',
      number: '09678978712 / 09685863845',
      image: '..public/hotlines/CoastGuard_DB.jpg',
    },
    {
      name: 'Daanbantayan MDRRMO',
      number: '09268253800 / 09999897792',
      image: '..public/hotlines/MDRRMO_DB.jpg',
    },
    {
      name: 'Daanbantayan Police Station',
      number: '4373783 | 09164233121',
      image: '..public/hotlines/police_DB.jpg',
    },
    {
      name: 'Bureau of Fire Protection Daanbantayan',
      number: '4373788 | 09459663774',
      image: '..public/hotlines/BFP_DB.jpg',
    },
  ];

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* WIND TIPS PANEL */}
      <div
        className="rounded-xl p-4 shadow-md"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.45)',
          border: '1px solid #0062a4',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-2 mb-4 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={onNavigate}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') onNavigate?.();
          }}
        >
          <Lightbulb className="w-7 h-7 text-yellow-500" />
          <h3 className="text-xl font-bold" style={{ color: '#0062a4' }}>
            Wind Tips
          </h3>
        </div>

        {/* Tips List */}
        <div className="space-y-3">
          {tips.map((tip, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4"
            >
              <div className="flex items-start gap-3">
                {/* Left Icon */}
                <div className="mt-1 shrink-0 w-9 h-9 rounded-full bg-white shadow-sm border border-blue-100 flex items-center justify-center">
                  {tip.icon}
                </div>

                {/* Text Content */}
                <div>
                  <h4 className="text-base font-bold mb-1" style={{ color: '#0062a4' }}>
                    {tip.title}
                  </h4>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {tip.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* EMERGENCY HOTLINES PANEL */}
      <div
        className="rounded-xl p-4 shadow-md"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.45)',
          border: '1px solid #c53030',
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <Phone className="w-7 h-7 text-red-600" />
          <h3 className="text-xl font-bold" style={{ color: '#0062a4' }}>
            Emergency Hotlines
          </h3>
        </div>

        {/* Hotline List */}
        <div className="space-y-3">
          {hotlines.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-3 rounded-lg bg-red-50/70 p-3 border border-red-100"
            >
              {/* Left side: image slot + icon + label */}
              <div className="flex items-center gap-3 min-w-0">
                {/* Image Slot */}
                <div className="w-10 h-10 rounded-md overflow-hidden bg-white border border-red-200 flex items-center justify-center shrink-0">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>

                {/* Hotline name */}
                <span className="text-m font-bold text-gray-800 font-medium truncate">
                  {item.name}
                </span>
              </div>

              {/* Right side: number */}
              <span className="text-m font-semibold text-gray-999 ">
                {item.number}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


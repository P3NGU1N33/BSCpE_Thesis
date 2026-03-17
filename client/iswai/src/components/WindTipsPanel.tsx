// import { useState } from 'react';
// import { Lightbulb, ChevronLeft, ChevronRight } from 'lucide-react';

// interface WindTipsPanelProps {
//   onNavigate?: () => void;
// }

// export function WindTipsPanel({ onNavigate }: WindTipsPanelProps) {
//   const [currentTipIndex, setCurrentTipIndex] = useState(0);

//   const tips = [
//     {
//       title: 'Check Before You Go',
//       description: 'Always check wind conditions before heading out to sea. Safe fishing starts with being informed.',
//     },
//     {
//       title: 'Wind Speed Guidelines',
//       description: 'Winds below 15 km/h are generally safe. 15-25 km/h requires caution. Above 25 km/h - stay ashore.',
//     },
//     {
//       title: 'Direction Matters',
//       description: 'Offshore winds can push you away from shore. Be extra careful when winds blow away from land.',
//     },
//     {
//       title: 'Early Morning Safety',
//       description: 'Early morning usually has calmer winds. Plan your fishing trips during these safer hours.',
//     },
//     {
//       title: 'Trust Your Instincts',
//       description: 'If conditions feel unsafe, they probably are. It\'s better to miss a day of fishing than risk your life.',
//     },
//     {
//       title: 'Share Your Plans',
//       description: 'Always tell someone where you\'re going and when you expect to return. Safety in communication.',
//     },
//   ];

//   const handlePrevious = () => {
//     setCurrentTipIndex((prev) => (prev === 0 ? tips.length - 1 : prev - 1));
//   };

//   const handleNext = () => {
//     setCurrentTipIndex((prev) => (prev === tips.length - 1 ? 0 : prev + 1));
//   };

//   const currentTip = tips[currentTipIndex];

//   return (
//     <div className="rounded-xl p-3 shadow-md h-full flex flex-col"
//      style={{ 
//        backgroundColor: 'rgba(255, 255, 255, 0.45)',  // white with 45% opacity
//        borderColor: '#0062a4',
//        borderWidth: '1px',
//        borderStyle: 'solid' 
//      }}>

//       {/* Header */}
//       <div 
//         className="flex items-center gap-2 mb-2 cursor-pointer hover:opacity-80 transition-opacity" 
//         onClick={onNavigate}
//         role="button"
//         tabIndex={0}
//         onKeyDown={(e) => {
//           if (e.key === 'Enter' || e.key === ' ') {
//             onNavigate?.();
//           }
//         }}
//       >
//         <Lightbulb className="w-3.5 h-3.5 text-yellow-500" />
//         <h3 style={{ color: '#0062a4' }} className="text-xs">Wind Tips</h3>
//       </div>

//       {/* Tip Content */}
//       <div className="flex-1 flex flex-col">
//         {/* Current Tip */}
//         <div className="flex-1 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-3 mb-2">
//           <h4 className="text-sm mb-1.5" style={{ color: '#0062a4' }}>
//             {currentTip.title}
//           </h4>
//           <p className="text-xs text-gray-700 leading-relaxed">
//             {currentTip.description}
//           </p>
//         </div>

//         {/* Navigation Controls */}
//         <div className="flex items-center justify-between">
//           <button
//             onClick={handlePrevious}
//             className="p-1.5 rounded-lg hover:bg-blue-50 transition-colors"
//             style={{ color: '#0062a4' }}
//             aria-label="Previous tip"
//           >
//             <ChevronLeft className="w-4 h-4" />
//           </button>

//           {/* Tip Indicator */}
//           <div className="flex gap-1">
//             {tips.map((_, index) => (
//               <div
//                 key={index}
//                 className={`w-1.5 h-1.5 rounded-full transition-all ${
//                   index === currentTipIndex ? 'w-4' : ''
//                 }`}
//                 style={{
//                   backgroundColor: index === currentTipIndex ? '#0062a4' : '#cbd5e1',
//                 }}
//               />
//             ))}
//           </div>

//           <button
//             onClick={handleNext}
//             className="p-1.5 rounded-lg hover:bg-blue-50 transition-colors"
//             style={{ color: '#0062a4' }}
//             aria-label="Next tip"
//           >
//             <ChevronRight className="w-4 h-4" />
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }
// import { Lightbulb, Phone } from 'lucide-react';

// interface WindTipsPanelProps {
//   onNavigate?: () => void;
// }

// export function WindTipsPanel({ onNavigate }: WindTipsPanelProps) {
//   const tips = [
//     {
//       title: 'Check Before You Go',
//       description: 'Always check wind conditions before heading out to sea. Safe fishing starts with being informed.',
//     },
//     {
//       title: 'Wind Speed Guidelines',
//       description: 'Winds below 15 km/h are generally safe. 15–25 km/h requires caution. Above 25 km/h – stay ashore.',
//     },
//     {
//       title: 'Direction Matters',
//       description: 'Offshore winds can push you away from shore. Be extra careful when winds blow away from land.',
//     },
//     {
//       title: 'Early Morning Safety',
//       description: 'Early morning usually has calmer winds. Plan your fishing trips during these safer hours.',
//     },
//     {
//       title: 'Trust Your Instincts',
//       description: 'If conditions feel unsafe, they probably are. It’s better to miss a day of fishing than risk your life.',
//     },
//     {
//       title: 'Share Your Plans',
//       description: 'Always tell someone where you’re going and when you expect to return.',
//     },
//   ];

//   return (
//     <div className="flex flex-col gap-4 h-full">

//       {/* WIND TIPS PANEL */}
//       <div
//         className="rounded-xl p-3 shadow-md"
//         style={{
//           backgroundColor: 'rgba(255, 255, 255, 0.45)',
//           border: '1px solid #0062a4',
//         }}
//       >
//         {/* Header */}
//         <div
//           className="flex items-center gap-2 mb-3 cursor-pointer hover:opacity-80 transition-opacity"
//           onClick={onNavigate}
//           role="button"
//           tabIndex={0}
//         >
//           <Lightbulb className="w-4 h-4 text-yellow-500" />
//           <h3 className="text-xl font-bold" style={{ color: '#0062a4' }}>
//             Wind Tips
//           </h3>
//         </div>

//         {/* Tips List */}
//         <div className="space-y-3">
//           {tips.map((tip, index) => (
//             <div
//               key={index}
//               className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-3"
//             >
//               <h4 className="text-l font-medium mb-1" style={{ color: '#0062a4' }}>
//                 {tip.title}
//               </h4>
//               <p className="text-m text-gray-700 leading-relaxed">
//                 {tip.description}
//               </p>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* EMERGENCY HOTLINES PANEL */}
//       <div
//         className="rounded-xl p-3 shadow-md"
//         style={{
//           backgroundColor: 'rgba(255, 255, 255, 0.45)',
//           border: '1px solid #c53030',
//         }}
//       >
//         {/* Header */}
//         <div className="flex items-center gap-2 mb-3">
//           <Phone className="w-4 h-4 text-red-600" />
//           <h3 className="text-sm font-semibold text-red-600">
//             Emergency Hotlines
//           </h3>
//         </div>

//         {/* Hotline List */}
//         <div className="space-y-2 text-xs text-gray-800">
//           <div className="flex justify-between">
//             <span>Coast Guard</span>
//             <span className="font-medium">117 / 911</span>
//           </div>
//           <div className="flex justify-between">
//             <span>MARINA</span>
//             <span className="font-medium">(02) 8523-9078</span>
//           </div>
//           <div className="flex justify-between">
//             <span>Local DRRM Office</span>
//             <span className="font-medium">Contact LGU</span>
//           </div>
//           <div className="flex justify-between">
//             <span>Emergency</span>
//             <span className="font-medium">911</span>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

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
      image: '../hotlines/CoastGuard_DB.jpg',
    },
    {
      name: 'Daanbantayan MDRRMO',
      number: '09268253800 / 09999897792',
      image: '../hotlines/MDRRMO_DB.jpg',
    },
    {
      name: 'Daanbantayan Police Station',
      number: '4373783 | 09164233121',
      image: '../hotlines/police_DB.jpg',
    },
    {
      name: 'Bureau of Fire Protection Daanbantayan',
      number: '4373788 | 09459663774',
      image: '../hotlines/BFP_DB.jpg',
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


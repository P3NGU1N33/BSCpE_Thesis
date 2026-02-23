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
import { Lightbulb, Phone } from 'lucide-react';

interface WindTipsPanelProps {
  onNavigate?: () => void;
}

export function WindTipsPanel({ onNavigate }: WindTipsPanelProps) {
  const tips = [
    {
      title: 'Check Before You Go',
      description: 'Always check wind conditions before heading out to sea. Safe fishing starts with being informed.',
    },
    {
      title: 'Wind Speed Guidelines',
      description: 'Winds below 15 km/h are generally safe. 15–25 km/h requires caution. Above 25 km/h – stay ashore.',
    },
    {
      title: 'Direction Matters',
      description: 'Offshore winds can push you away from shore. Be extra careful when winds blow away from land.',
    },
    {
      title: 'Early Morning Safety',
      description: 'Early morning usually has calmer winds. Plan your fishing trips during these safer hours.',
    },
    {
      title: 'Trust Your Instincts',
      description: 'If conditions feel unsafe, they probably are. It’s better to miss a day of fishing than risk your life.',
    },
    {
      title: 'Share Your Plans',
      description: 'Always tell someone where you’re going and when you expect to return.',
    },
  ];

  return (
    <div className="flex flex-col gap-4 h-full">

      {/* WIND TIPS PANEL */}
      <div
        className="rounded-xl p-3 shadow-md"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.45)',
          border: '1px solid #0062a4',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-2 mb-3 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={onNavigate}
          role="button"
          tabIndex={0}
        >
          <Lightbulb className="w-4 h-4 text-yellow-500" />
          <h3 className="text-sm font-semibold" style={{ color: '#0062a4' }}>
            Wind Tips
          </h3>
        </div>

        {/* Tips List */}
        <div className="space-y-3">
          {tips.map((tip, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-3"
            >
              <h4 className="text-sm font-medium mb-1" style={{ color: '#0062a4' }}>
                {tip.title}
              </h4>
              <p className="text-xs text-gray-700 leading-relaxed">
                {tip.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* EMERGENCY HOTLINES PANEL */}
      <div
        className="rounded-xl p-3 shadow-md"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.45)',
          border: '1px solid #c53030',
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <Phone className="w-4 h-4 text-red-600" />
          <h3 className="text-sm font-semibold text-red-600">
            Emergency Hotlines
          </h3>
        </div>

        {/* Hotline List */}
        <div className="space-y-2 text-xs text-gray-800">
          <div className="flex justify-between">
            <span>Coast Guard</span>
            <span className="font-medium">117 / 911</span>
          </div>
          <div className="flex justify-between">
            <span>MARINA</span>
            <span className="font-medium">(02) 8523-9078</span>
          </div>
          <div className="flex justify-between">
            <span>Local DRRM Office</span>
            <span className="font-medium">Contact LGU</span>
          </div>
          <div className="flex justify-between">
            <span>Emergency</span>
            <span className="font-medium">911</span>
          </div>
        </div>
      </div>
    </div>
  );
}



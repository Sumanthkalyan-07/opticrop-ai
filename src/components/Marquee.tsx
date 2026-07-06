import React from 'react';

const TELUGU_SLOGANS = [
  "🌾 రైతే రాజు - వ్యవసాయమే మన దేశానికి వెన్నెముక!",
  "🌱 మట్టిని నమ్ముకున్నోడు ఎన్నడూ చెడిపోడు - రైతు సేవయే జగతికి జీవనాధారం!",
  "💧 చెమట చిందించి జగతికి అన్నం పెట్టే అన్నదాతకు కోటి వందనాలు!",
  "☀️ జై జవాన్ - జై కిసాన్! వ్యవసాయ రంగానికి ఆధునిక సాంకేతికతతో నూతన వెలుగులు!"
];

export const Marquee: React.FC = () => {
  return (
    <div className="w-full bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-amber-300 py-2 overflow-hidden border-b border-amber-500/20 shadow-sm relative z-10">
      <div className="flex whitespace-nowrap animate-marquee">
        {/* We double the slogans array to make sure the scroll is smooth and continuous without breaks */}
        {[...TELUGU_SLOGANS, ...TELUGU_SLOGANS].map((slogan, index) => (
          <span 
            key={index} 
            className="inline-block mx-12 text-sm font-medium tracking-wide font-display drop-shadow-md"
          >
            {slogan}
          </span>
        ))}
      </div>
    </div>
  );
};

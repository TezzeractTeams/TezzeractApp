import { Plus, BadgeCheck } from "lucide-react";

type TalentCardProps = {
  id: string;
  name: string;
  skills: string[];
  image_url: string;
  experience_years: number;
  availability: boolean;
  onPlusClick?: () => void;
  onMinusClick?: () => void;
  onCardClick?: () => void;
  isDisabled?: boolean;
};

export function TalentCard({
  id,
  name,
  skills,
  image_url,
  experience_years,
  availability,
  onPlusClick,
  onMinusClick,
  onCardClick,
  isDisabled = false,
}: TalentCardProps) {
  return (
    <div
      onClick={onCardClick}
      className="rounded-[30px] flex flex-col justify-end overflow-hidden relative group cursor-pointer w-full aspect-[3/4]"
    >
      {/* Background Image */}
      <img
        src={image_url || 'https://randomuser.me/api/portraits/men/32.jpg'}
        alt={name}
        className="absolute inset-0 w-full h-full object-cover"
      />
      
      {/* Gradient overlay at bottom */}
      <div 
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        style={{
          height: '70%',
          borderRadius: '0 0 30px 30px',
          background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.00) 0%, rgba(0, 0, 0, 0.90) 100%)',
        }}
      />
      
      {/* Gradient blur overlay */}
      <div 
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        style={{
          height: '60%',
          borderRadius: '0 0 30px 30px',
          backdropFilter: 'blur(100px)',
          maskImage: 'linear-gradient(to top, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0) 100%)',
          WebkitMaskImage: 'linear-gradient(to top, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0) 100%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 p-4">
        {/* Name and Badge */}
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-lg sm:text-lg md:text-xl text-white font-light tracking-tight">
            {name}
          </h3>
          <BadgeCheck className="text-white h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
        </div>

        {/* Skills */}
        <div className="flex w-[70%] flex-wrap gap-1 mb-3">
          {skills.slice(0, 3).map((skill, index) => (
            <span
              key={index}
              className="text-xs px-2 py-1 rounded-full bg-white/20 text-white font-light backdrop-blur-sm"
            >
              {skill}
            </span>
          ))}
          {skills.length > 3 && (
            <span className="text-xs px-2 py-1 rounded-full bg-white/20 text-white font-light backdrop-blur-sm">
              {skills.length - 3}+
            </span>
          )}
        </div>

        {/* Plus/Minus button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (isDisabled && onMinusClick) {
              onMinusClick();
            } else {
              onPlusClick?.();
            }
          }}
          className="absolute bottom-6 right-4 w-12 h-12 rounded-full transition-all duration-500 flex items-center justify-center shadow-lg overflow-hidden border border-blue-400 bg-white hover:bg-gray-50"
        >
          <div 
            className="w-6 h-6 flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
              WebkitMask: isDisabled 
                ? 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cline x1=\'5\' y1=\'12\' x2=\'19\' y2=\'12\'%3E%3C/line%3E%3C/svg%3E") center/contain no-repeat'
                : 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cline x1=\'12\' y1=\'5\' x2=\'12\' y2=\'19\'%3E%3C/line%3E%3Cline x1=\'5\' y1=\'12\' x2=\'19\' y2=\'12\'%3E%3C/line%3E%3C/svg%3E") center/contain no-repeat',
              mask: isDisabled 
                ? 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cline x1=\'5\' y1=\'12\' x2=\'19\' y2=\'12\'%3E%3C/line%3E%3C/svg%3E") center/contain no-repeat'
                : 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cline x1=\'12\' y1=\'5\' x2=\'12\' y2=\'19\'%3E%3C/line%3E%3Cline x1=\'5\' y1=\'12\' x2=\'19\' y2=\'12\'%3E%3C/line%3E%3C/svg%3E") center/contain no-repeat',
            }}
          />
        </button>
      </div>
    </div>
  );
}

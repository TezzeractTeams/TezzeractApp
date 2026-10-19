import { Plus, BadgeCheck } from "lucide-react";

type TalentCardProps = {
  id: string;
  name: string;
  skills: string[];
  image_url: string;
  experience_years: number;
  availability: boolean;
  onCardClick?: () => void;
  isDisabled?: boolean;
  showAddButton?: boolean;
  onAddClick?: () => void;
};

export function TalentCard({
  id,
  name,
  skills,
  image_url,
  onCardClick,
  isDisabled = false,
  showAddButton = false,
  onAddClick,
}: TalentCardProps) {
  return (
    <div
      onClick={onCardClick}
      className="rounded-[30px] flex flex-col justify-end overflow-hidden relative group w-full aspect-[3/4] cursor-pointer"
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

      {/* Add button */}
      {showAddButton && onAddClick && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddClick();
          }}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-all duration-200 shadow-md z-10"
        >
          <Plus className="w-4 h-4 text-gray-700" />
        </button>
      )}

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

        {/* No button - AI selected talents are fixed */}
      </div>
    </div>
  );
}

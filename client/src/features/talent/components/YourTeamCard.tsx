import { X, BadgeCheck } from "lucide-react";

interface YourTeamCardProps {
  id: string;
  image_url: string;
  name: string;
  skills: string[];
  experience_years: number;
  availability: boolean;
  onRemove: () => void;
}

export function YourTeamCard({
  image_url,
  name,
  skills,
  onRemove,
}: YourTeamCardProps) {
  return (
    <div
      className="rounded-2xl flex flex-col justify-end overflow-hidden relative group cursor-pointer w-full aspect-[3/4]"
    >
      {/* Background Image */}
      <img
        src={image_url || 'https://randomuser.me/api/portraits/men/32.jpg'}
        alt={name}
        className="absolute inset-0 w-full h-full object-cover"
      />
      
      {/* Gradient overlay */}
      <div 
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        style={{
          height: '60%',
          background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.00) 0%, rgba(0, 0, 0, 0.80) 100%)',
        }}
      />

      {/* Remove button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-all duration-200 shadow-md z-10"
      >
        <X className="w-4 h-4 text-gray-700" />
      </button>

      {/* Content */}
      <div className="relative z-10 p-3">
        {/* Name */}
        <div className="flex items-center gap-1 mb-1">
          <h3 className="text-sm text-white font-medium truncate">
            {name}
          </h3>
          <BadgeCheck className="text-white h-3 w-3 flex-shrink-0" />
        </div>

        {/* Skills */}
        <div className="flex flex-wrap gap-1">
          {skills.slice(0, 2).map((skill, index) => (
            <span
              key={index}
              className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 text-white font-light backdrop-blur-sm"
            >
              {skill}
            </span>
          ))}
          {skills.length > 2 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 text-white font-light backdrop-blur-sm">
              +{skills.length - 2}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

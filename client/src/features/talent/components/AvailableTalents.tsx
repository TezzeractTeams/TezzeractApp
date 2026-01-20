import { useState } from "react";
import { TalentCard } from "./TalentCard";
import { TalentPortfolio } from "./TalentPortfolio";

interface Talent {
  id: string;
  image_url: string;
  name: string;
  skills: string[];
  experience_years: number;
  availability: boolean;
}

interface AvailableTalentsProps {
  talents: Talent[];
  isLoading: boolean;
  yourTeam: Talent[];
  onAddToTeam: (talent: Talent) => void;
}

// Skeleton loader for talent cards
const TalentCardSkeleton = () => (
  <div className="border-white border-2 min-h-80 rounded-3xl flex flex-col justify-end p-4 bg-gray-100 animate-pulse">
    <div className="space-y-2">
      <div className="h-6 bg-gray-300 rounded w-3/4"></div>
      <div className="h-4 bg-gray-300 rounded w-1/2"></div>
    </div>
  </div>
);

export function AvailableTalents({
  talents,
  isLoading,
  yourTeam,
  onAddToTeam,
}: AvailableTalentsProps) {
  const [selectedTalent, setSelectedTalent] = useState<Talent | null>(null);
  
  // Grid columns for AI-selected talents
  const gridCols = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

  // If a talent is selected, show portfolio
  if (selectedTalent) {
    return (
      <div className="h-full rounded-3xl">
        <TalentPortfolio
          talent={selectedTalent}
          onBack={() => setSelectedTalent(null)}
        />
      </div>
    );
  }

  // Otherwise show talent cards
  return (
    <div className="h-full rounded-3xl animate-slide-in-right flex flex-col">
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {isLoading ? (
          <div className={`grid ${gridCols} gap-4`}>
            {Array.from({ length: 4 }).map((_, index) => (
              <TalentCardSkeleton key={index} />
            ))}
          </div>
        ) : talents.length > 0 ? (
          <div className={`grid ${gridCols} gap-4`}>
            {talents.map((talent, index) => (
              <div
                key={talent.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <TalentCard
                  id={talent.id}
                  image_url={talent.image_url}
                  name={talent.name}
                  skills={talent.skills}
                  experience_years={talent.experience_years}
                  availability={talent.availability}
                  onCardClick={() => setSelectedTalent(talent)}
                  isDisabled={false}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-gray-500 text-center">
              No talents found for the current request. Try refining your project description.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

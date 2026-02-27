import { useMemo } from "react";
import { TalentCard } from "./TalentCard";

interface Talent {
  id: string;
  image_url: string;
  name: string;
  skills: string[];
  experience_years: number;
  availability: boolean;
}

interface SuggestedTalentsProps {
  recommendedTalents: Talent[];
  allTalents: Talent[];
  onAddToTeam: (talent: Talent) => void;
}

export function SuggestedTalents({
  recommendedTalents,
  allTalents,
  onAddToTeam,
}: SuggestedTalentsProps) {
  const suggestedTalents = useMemo(() => {
    // Extract all unique skills from recommended talents
    const recommendedSkills = new Set<string>();
    recommendedTalents.forEach((talent) => {
      talent.skills?.forEach((skill) => {
        recommendedSkills.add(skill.toLowerCase().trim());
      });
    });

    // Filter out already recommended talents
    const recommendedIds = new Set(recommendedTalents.map((t) => t.id));
    const availableTalents = allTalents.filter(
      (talent) => !recommendedIds.has(talent.id)
    );

    if (availableTalents.length === 0) {
      return [];
    }

    let filteredTalents: Talent[] = [];

    // If skills exist, filter by matching skills
    if (recommendedSkills.size > 0) {
      filteredTalents = availableTalents
        .map((talent) => {
          const talentSkills = (talent.skills || []).map((s) =>
            s.toLowerCase().trim()
          );
          const matchingSkills = Array.from(recommendedSkills).filter(
            (skill) =>
              talentSkills.some(
                (ts) => ts.includes(skill) || skill.includes(ts)
              )
          );
          return {
            talent,
            matchCount: matchingSkills.length,
          };
        })
        .filter((item) => item.matchCount > 0)
        .sort((a, b) => b.matchCount - a.matchCount)
        .map((item) => item.talent);
    }

    // If no matching skills found or no skills in recommended talents, select random
    if (filteredTalents.length === 0) {
      // Shuffle array and take first 4
      const shuffled = [...availableTalents].sort(() => Math.random() - 0.5);
      filteredTalents = shuffled;
    }

    // Limit to maximum 4 talents
    return filteredTalents.slice(0, 4);
  }, [recommendedTalents, allTalents]);

  if (suggestedTalents.length === 0) {
    return null;
  }

  const gridCols =
    "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

  return (
    <div className="mt-8">
      <h2 className="text-[#27272A] text-xl font-light mb-4">
        Suggested Talents
      </h2>
      <div className={`grid ${gridCols} gap-4`}>
        {suggestedTalents.map((talent, index) => (
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
              showAddButton={true}
              onAddClick={() => onAddToTeam(talent)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TezzeractButton } from "@/shared/components/ui/TezzeractButton";
import { X, Plus, ArrowRight } from "lucide-react";
import { YourTeamCard } from "./YourTeamCard";

interface Talent {
  id: string;
  image_url: string;
  name: string;
  skills: string[];
  experience_years: number;
  availability: boolean;
}

interface YourTeamSidePanelProps {
  team: Talent[];
  onClose: () => void;
  onRemoveFromTeam: (talentId: string) => void;
}

export const YourTeamSidePanel: React.FC<YourTeamSidePanelProps> = ({
  team,
  onClose,
  onRemoveFromTeam,
}) => {
  const navigate = useNavigate();
  const [isClosing, setIsClosing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
  };

  useEffect(() => {
    // Trigger slide-in animation on mount
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 10);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isClosing) {
      const timer = setTimeout(() => {
        onClose();
      }, 300); // Match animation duration
      return () => clearTimeout(timer);
    }
  }, [isClosing, onClose]);

  // Trigger close animation when team becomes empty
  useEffect(() => {
    if (team.length === 0 && isVisible) {
      setIsClosing(true);
    }
  }, [team.length, isVisible]);

  return (
    <div 
      className={`h-full bg-white rounded-3xl p-6 border border-gray-200 shadow-lg transform transition-transform duration-300 ease-out ${
        isClosing ? "translate-x-full" : isVisible ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="pb-4">
          <h2 className="text-xl font-light text-gray-900">Your Team</h2>
        </div>
        
        {/* Team Members - Scrollable */}
        <div className="flex-1 overflow-y-auto pb-4">
          {team.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {team.map((talent, index) => (
                <div
                  key={talent.id}
                  className="animate-slide-up"
                  style={{ 
                    animationDelay: `${index * 50}ms`,
                    animationFillMode: 'both'
                  }}
                >
                  <YourTeamCard
                    id={talent.id}
                    image_url={talent.image_url}
                    name={talent.name}
                    skills={talent.skills}
                    experience_years={talent.experience_years}
                    availability={talent.availability}
                    onRemove={() => onRemoveFromTeam(talent.id)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No team members added yet.</p>
              <p className="text-sm text-gray-400 mt-1">Click the + icon on talent cards to add them.</p>
            </div>
          )}
        </div>
        
        {/* Create Meeting Button - Fixed at bottom */}
        <div className="pt-4 pb-4 border-t border-gray-200 space-y-3">
          <TezzeractButton 
            fullWidth={true}
            onClick={() => {
              if (team.length > 0) {
                navigate("/talent/create-meeting");
              }
            }}
            disabled={team.length === 0}
          >
            <Plus className="w-4 h-4" /> Create meeting
          </TezzeractButton>
        </div>
      </div>
    </div>
  );
};

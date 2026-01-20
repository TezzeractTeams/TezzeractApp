import React from "react";
import { Button } from "@/shared/components/ui/Button";
import { cn } from "@/shared/utils/cn";

interface SuggestedSkillButtonProps {
  skill: string;
  isSelected: boolean;
  isLoading: boolean;
  onClick: () => void;
}

export function SuggestedSkillButton({
  skill,
  isSelected,
  isLoading,
  onClick,
}: SuggestedSkillButtonProps) {
  if (isSelected) {
    return (
      <div
        className="rounded-2xl p-[1px]"
        style={{
          background: 'radial-gradient(93.12% 100% at 50.53% 0%, #009BE9 0%, #00378A 100%)',
        }}
      >
        <Button
          onClick={onClick}
          disabled={isLoading}
          className={cn(
            "rounded-2xl px-6 py-2 font-thin text-[#00378A] bg-white hover:bg-white transition-all duration-200 whitespace-nowrap w-full"
          )}
        >
          {skill}
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={onClick}
      disabled={isLoading}
      className={cn(
        "rounded-2xl px-6 py-2 font-thin text-[#A1A1AA] bg-white border border-transparent",
        "hover:border-[#B2DDEE] hover:text-[#00378A] hover:bg-white",
        "transition-all duration-200 whitespace-nowrap"
      )}
    >
      {skill}
    </Button>
  );
}

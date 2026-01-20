import { Check } from "lucide-react";
import { cn } from "@/shared/utils/cn";

export interface SuggestedTime {
  id: string;
  date: string; // e.g., "April 23, 2024"
  time: string; // e.g., "2:00 PM"
  datetime: Date;
}

interface SuggestedTimesSectionProps {
  suggestedTimes: SuggestedTime[];
  selectedTime: SuggestedTime | null;
  onTimeSelect: (time: SuggestedTime) => void;
}

export function SuggestedTimesSection({
  suggestedTimes,
  selectedTime,
  onTimeSelect,
}: SuggestedTimesSectionProps) {
  if (suggestedTimes.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-medium text-gray-900">Select a Date & Time</h3>
      <div className="grid grid-cols-2 gap-3">
        {suggestedTimes.map((time) => {
          const isSelected = selectedTime?.id === time.id;
          return (
            <button
              key={time.id}
              type="button"
              onClick={() => onTimeSelect(time)}
              className={cn(
                "relative p-4 rounded-xl border-2 transition-all duration-200 text-left",
                isSelected
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/50"
              )}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-900">{time.date}</p>
                <p className="text-sm text-gray-600">{time.time}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}






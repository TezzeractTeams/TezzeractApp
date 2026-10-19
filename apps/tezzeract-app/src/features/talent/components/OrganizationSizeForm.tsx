import { useState, useEffect } from "react";
import { useOrganizationStore } from "@/shared/stores/useOrganizationStore";

const companySizeOptions = [
  { value: "less-than-100", label: "Less than 100 employees" },
  { value: "100-1000", label: "100-1,000 employees" },
  { value: "1000+", label: "1,000+ employees" },
];

export function OrganizationSizeForm() {
  const {
    companySize,
    isLoading,
    error,
    setCompanySize,
    submitForm2,
  } = useOrganizationStore();

  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (error) {
      setLocalError(error);
    }
  }, [error]);

  const handleSelect = async (size: string) => {
    setLocalError(null);
    setCompanySize(size);
    
    // Auto-submit when selected
    // Note: This will only work if form1 was already submitted (organization exists)
    const success = await submitForm2();
    
    if (!success) {
      const errorMsg = error || 'Please complete the organization form first';
      setLocalError(errorMsg);
    }
  };

  return (
    <div className="space-y-3 w-[350px] pr-6">
      {localError && (
        <div className="text-red-500 text-sm mb-2">{localError}</div>
      )}
      
      <div className="space-y-2">
        {companySizeOptions.map((option) => {
          const isSelected = companySize === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              disabled={isLoading}
              className={`w-full text-left px-4 min-h-[50px] rounded-xl transition-all duration-200 relative ${
                isSelected
                  ? "text-gray-900"
                  : "text-[#71717A] hover:bg-gray-50"
              } ${isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              style={
                isSelected
                  ? {
                      border: "1px solid transparent",
                      borderRadius: "0.75rem", // rounded-xl
                      background: "linear-gradient(white, white) padding-box, radial-gradient(64.46% 80% at 50.53% 0%, #009BE9 0%, #00378A 100%) border-box",
                    }
                  : {
                      border: "1px solid #E4E4E7",
                      borderRadius: "0.75rem", // rounded-xl
                      background: "white",
                    }
              }
            >
              {option.label}
            </button>
          );
        })}
      </div>
      
      {isLoading && (
        <div className="text-sm text-gray-500 text-center mt-2">
          Saving...
        </div>
      )}
    </div>
  );
}


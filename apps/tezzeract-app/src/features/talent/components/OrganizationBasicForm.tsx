import { useState } from "react";
import { FormField } from "@/shared/components/ui/FormField";
import { Input } from "@/shared/components/ui/Input";
import { Select, SelectOption } from "@/shared/components/ui/Select";
import { TezzeractButton } from "@/shared/components/ui/TezzeractButton";
import { useOrganizationStore } from "@/shared/stores/useOrganizationStore";

const industryOptions: SelectOption[] = [
  { value: "technology", label: "Technology" },
  { value: "finance", label: "Finance" },
  { value: "healthcare", label: "Healthcare" },
  { value: "education", label: "Education" },
  { value: "retail", label: "Retail" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "consulting", label: "Consulting" },
  { value: "other", label: "Other" },
];

export function OrganizationBasicForm() {
  const {
    organizationName,
    industry,
    basedIn,
    isLoading,
    error,
    setForm1Data,
    submitForm1,
  } = useOrganizationStore();

  const [localErrors, setLocalErrors] = useState<{
    organizationName?: string;
  }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!organizationName.trim()) {
      setLocalErrors({ organizationName: "Organization name is required" });
      return;
    }

    setLocalErrors({});
    const success = await submitForm1();
    
    if (!success && error) {
      setLocalErrors({ organizationName: error });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-[350px] pr-6">
      <FormField
        required
        error={localErrors.organizationName}
      >
        <Input
          placeholder="Organization name"
          value={organizationName}
          onChange={(e) => setForm1Data({ name: e.target.value })}
          disabled={isLoading}
          className="border border-[#E4E4E7] placeholder:text-[#71717A] min-h-[50px] rounded-xl"
        />
      </FormField>

      <FormField>
        <Select
          options={industryOptions}
          placeholder="Industry"
          value={industry}
          onChange={(e) => setForm1Data({ industry: e.target.value })}
          disabled={isLoading}
          className="border-[#E4E4E7] text-[#71717A] min-h-[50px] rounded-xl"
        />
      </FormField>

      <FormField>
        <Input
          placeholder="Based in"
          value={basedIn}
          onChange={(e) => setForm1Data({ basedIn: e.target.value })}
          disabled={isLoading}
          className="border border-[#E4E4E7] placeholder:text-[#71717A] min-h-[50px] rounded-xl"
        />
      </FormField>

      <TezzeractButton
        type="submit"
        disabled={isLoading || !organizationName.trim()}
        fullWidth={false}
      >
        {isLoading ? "Submitting..." : "Submit"}
      </TezzeractButton>
    </form>
  );
}


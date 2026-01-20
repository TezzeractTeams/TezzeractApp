import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface OrganizationFormState {
  // Form 1 data
  organizationName: string;
  industry: string;
  basedIn: string;
  
  // Form 2 data
  companySize: string;
  
  // Flow state
  currentStep: 'idle' | 'form1' | 'form2' | 'completed';
  isLoading: boolean;
  error: string | null;
  
  // Local organization data (stored locally, not synced to DB yet)
  organization: {
    name: string;
    industry?: string;
    basedIn?: string;
    companySize?: string;
  } | null;
}

interface OrganizationStore extends OrganizationFormState {
  // Actions
  setForm1Data: (data: Partial<{ name: string; industry: string; basedIn: string }>) => void;
  setCompanySize: (size: string) => void;
  setCurrentStep: (step: OrganizationFormState['currentStep']) => void;
  submitForm1: () => Promise<boolean>;
  submitForm2: () => Promise<boolean>;
  setOrganization: (org: OrganizationFormState['organization']) => void;
  reset: () => void;
}

const initialState: OrganizationFormState = {
  organizationName: '',
  industry: '',
  basedIn: '',
  companySize: '',
  currentStep: 'idle',
  isLoading: false,
  error: null,
  organization: null,
};

export const useOrganizationStore = create<OrganizationStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      setForm1Data: (data) => {
        set((state) => ({
          organizationName: data.name ?? state.organizationName,
          industry: data.industry ?? state.industry,
          basedIn: data.basedIn ?? state.basedIn,
        }));
      },
      
      setCompanySize: (size) => set({ companySize: size }),
      
      setCurrentStep: (step) => set({ currentStep: step }),
      
      setOrganization: (org) => set({ organization: org }),
      
      submitForm1: async () => {
        set({ isLoading: true, error: null });
        try {
          const { organizationName, industry, basedIn } = get();
          
          if (!organizationName.trim()) {
            set({ error: 'Organization name is required', isLoading: false });
            return false;
          }
          
          // Store locally instead of making API call
          const localOrganization = {
            name: organizationName,
            industry: industry || undefined,
            basedIn: basedIn || undefined,
          };
          
          set({
            organization: localOrganization,
            currentStep: 'form2',
            isLoading: false,
            error: null,
          });
          return true;
        } catch (error: any) {
          const errorMessage = error.message || 'Failed to save organization';
          set({ error: errorMessage, isLoading: false });
          return false;
        }
      },
      
      submitForm2: async () => {
        set({ isLoading: true, error: null });
        try {
          const { companySize, organization } = get();
          
          if (!organization) {
            set({ error: 'Organization not found. Please complete form 1 first.', isLoading: false });
            return false;
          }
          
          if (!companySize) {
            set({ error: 'Please select a company size', isLoading: false });
            return false;
          }
          
          // Update local organization data instead of making API call
          const updatedOrganization = {
            ...organization,
            companySize,
          };
          
          set({
            organization: updatedOrganization,
            currentStep: 'completed',
            isLoading: false,
            error: null,
          });
          return true;
        } catch (error: any) {
          const errorMessage = error.message || 'Failed to save organization';
          set({ error: errorMessage, isLoading: false });
          return false;
        }
      },
      
      reset: () => set(initialState),
    }),
    {
      name: 'tezzeract-organization-store',
      partialize: (state) => ({
        organization: state.organization,
        currentStep: state.currentStep,
        organizationName: state.organizationName,
        industry: state.industry,
        basedIn: state.basedIn,
        companySize: state.companySize,
      }),
    }
  )
);


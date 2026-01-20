import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Talent {
  id: string;
  image_url: string;
  name: string;
  skills: string[];
  experience_years: number;
  availability: boolean;
  role?: string;
}

interface TeamStore {
  team: Talent[];
  
  // Actions
  addToTeam: (talent: Talent) => void;
  removeFromTeam: (talentId: string) => void;
  clearTeam: () => void;
  setTeam: (talents: Talent[]) => void;
  updateTeam: (talents: Talent[]) => void; // Replace entire team
}

export const useTeamStore = create<TeamStore>()(
  persist(
    (set) => ({
      team: [],
      
      addToTeam: (talent) => set((state) => {
        if (state.team.some((t) => t.id === talent.id)) {
          return state; // Already in team
        }
        return { team: [...state.team, talent] };
      }),
      
      removeFromTeam: (talentId) => set((state) => ({
        team: state.team.filter((t) => t.id !== talentId),
      })),
      
      clearTeam: () => set({ team: [] }),
      
      setTeam: (talents) => set({ team: talents }),
      
      updateTeam: (talents) => set({ team: talents }),
    }),
    {
      name: 'tezzeract-team-store',
    }
  )
);


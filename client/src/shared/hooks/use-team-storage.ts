import { useState, useEffect } from 'react';

interface Talent {
  id: string;
  image_url: string;
  name: string;
  skills: string[];
  experience_years: number;
  availability: boolean;
}

export function useTeamStorage() {
  const [team, setTeam] = useState<Talent[]>(() => {
    const stored = localStorage.getItem('yourTeam');
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem('yourTeam', JSON.stringify(team));
  }, [team]);

  const addToTeam = (talent: Talent) => {
    setTeam((prev) => {
      if (prev.some((t) => t.id === talent.id)) {
        return prev;
      }
      return [...prev, talent];
    });
  };

  const removeFromTeam = (talentId: string) => {
    setTeam((prev) => prev.filter((t) => t.id !== talentId));
  };

  const clearTeam = () => {
    setTeam([]);
  };

  return { team, addToTeam, removeFromTeam, clearTeam };
}

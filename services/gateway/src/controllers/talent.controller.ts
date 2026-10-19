import { Request, Response } from 'express';
import { supabase } from '../config/supabase.js';

interface Talent {
  id: string;
  name: string;
  skills: string[];
  experience_years: number;
  availability: boolean;
  image_url: string;
  created_at?: string;
  updated_at?: string;
}

// Get all talents with optional search and filters
export const getTalents = async (req: Request, res: Response) => {
  try {
    const { search, skills, availability, minExperience, maxExperience } = req.query;

    let query = supabase
      .from('talents')
      .select('*')
      .order('created_at', { ascending: false });

    // Search by name
    if (search && typeof search === 'string') {
      query = query.ilike('name', `%${search}%`);
    }

    // Filter by availability
    if (availability !== undefined) {
      query = query.eq('availability', availability === 'true');
    }

    // Filter by experience years
    if (minExperience) {
      query = query.gte('experience_years', parseInt(minExperience as string));
    }
    if (maxExperience) {
      query = query.lte('experience_years', parseInt(maxExperience as string));
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to fetch talents' });
    }

    // Filter by skills if provided (since Supabase doesn't support array contains with ilike)
    let talents = data as Talent[];
    if (skills && typeof skills === 'string') {
      const skillsArray = skills.split(',').map(s => s.trim().toLowerCase());
      talents = talents.filter(talent => 
        talent.skills && talent.skills.some(skill => 
          skillsArray.some(searchSkill => 
            skill.toLowerCase().includes(searchSkill)
          )
        )
      );
    }

    res.json({
      talents,
      total: talents.length,
    });
  } catch (error) {
    console.error('Get talents error:', error);
    res.status(500).json({ error: 'Failed to fetch talents' });
  }
};

// Get a single talent by ID
export const getTalentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('talents')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(404).json({ error: 'Talent not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Get talent by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch talent' });
  }
};

// Create a new talent
export const createTalent = async (req: Request, res: Response) => {
  try {
    const { name, skills, experience_years, availability, image_url } = req.body;

    // Validate required fields
    if (!name || !skills || experience_years === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data, error } = await supabase
      .from('talents')
      .insert([
        {
          name,
          skills,
          experience_years,
          availability: availability !== undefined ? availability : true,
          image_url: image_url || null,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to create talent' });
    }

    res.status(201).json(data);
  } catch (error) {
    console.error('Create talent error:', error);
    res.status(500).json({ error: 'Failed to create talent' });
  }
};

// Update a talent
export const updateTalent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from('talents')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to update talent' });
    }

    res.json(data);
  } catch (error) {
    console.error('Update talent error:', error);
    res.status(500).json({ error: 'Failed to update talent' });
  }
};

// Delete a talent
export const deleteTalent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('talents')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to delete talent' });
    }

    res.json({ message: 'Talent deleted successfully' });
  } catch (error) {
    console.error('Delete talent error:', error);
    res.status(500).json({ error: 'Failed to delete talent' });
  }
};

// Legacy endpoints for backward compatibility
export const getCandidates = getTalents;
export const getJobs = async (req: Request, res: Response) => {
  // Mock jobs data for now
  const mockJobs = [
    { id: '1', title: 'Senior React Developer', department: 'Engineering', status: 'Open', applicants: 23 },
    { id: '2', title: 'Product Manager', department: 'Product', status: 'Open', applicants: 15 },
    { id: '3', title: 'UX Designer', department: 'Design', status: 'Open', applicants: 31 },
  ];
  
  res.json({
    jobs: mockJobs,
    total: mockJobs.length,
  });
};

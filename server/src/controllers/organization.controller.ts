import { Request, Response } from 'express';
import { supabase } from '../config/supabase.js';

interface Organization {
  id: string;
  user_id: string;
  name: string;
  industry?: string;
  website?: string;
  description?: string;
  based_in?: string;
  company_size?: string;
  created_at?: string;
  updated_at?: string;
}

// Get organization for the authenticated user
export const getOrganization = async (req: Request, res: Response) => {
  try {
    if (!req.auth?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('user_id', req.auth.userId)
      .maybeSingle();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to fetch organization' });
    }

    // Return null if no organization exists (not an error)
    res.json({ organization: data || null });
  } catch (error) {
    console.error('Get organization error:', error);
    res.status(500).json({ error: 'Failed to fetch organization' });
  }
};

// Helper function to generate slug from name
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

// Create a new organization
export const createOrganization = async (req: Request, res: Response) => {
  try {
    if (!req.auth?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { name, industry, website, description, based_in, company_size } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: 'Organization name is required' });
    }

    // Check if user already has an organization
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('user_id', req.auth.userId)
      .maybeSingle();

    if (existingOrg) {
      return res.status(400).json({ error: 'User already has an organization. Use PUT to update.' });
    }

    // Generate slug from name
    const slug = generateSlug(name);
    
    // Ensure slug is unique by appending a number if needed
    let finalSlug = slug;
    let counter = 1;
    while (true) {
      const { data: existingSlug } = await supabase
        .from('organizations')
        .select('id')
        .eq('slug', finalSlug)
        .maybeSingle();
      
      if (!existingSlug) {
        break; // Slug is unique
      }
      finalSlug = `${slug}-${counter}`;
      counter++;
    }

    const { data, error } = await supabase
      .from('organizations')
      .insert([
        {
          user_id: req.auth.userId,
          name,
          slug: finalSlug,
          industry: industry || null,
          website: website || null,
          description: description || null,
          based_in: based_in || null,
          company_size: company_size || null,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to create organization' });
    }

    res.status(201).json({ organization: data });
  } catch (error) {
    console.error('Create organization error:', error);
    res.status(500).json({ error: 'Failed to create organization' });
  }
};

// Update organization for the authenticated user
export const updateOrganization = async (req: Request, res: Response) => {
  try {
    if (!req.auth?.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { name, industry, website, description, based_in, company_size } = req.body;

    // Check if organization exists
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('user_id', req.auth.userId)
      .maybeSingle();

    if (!existingOrg) {
      return res.status(404).json({ error: 'Organization not found. Create one first.' });
    }

    const updates: Partial<Organization> = {};
    if (name !== undefined) updates.name = name;
    if (industry !== undefined) updates.industry = industry || null;
    if (website !== undefined) updates.website = website || null;
    if (description !== undefined) updates.description = description || null;
    if (based_in !== undefined) updates.based_in = based_in || null;
    if (company_size !== undefined) updates.company_size = company_size || null;

    const { data, error } = await supabase
      .from('organizations')
      .update(updates)
      .eq('user_id', req.auth.userId)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to update organization' });
    }

    res.json({ organization: data });
  } catch (error) {
    console.error('Update organization error:', error);
    res.status(500).json({ error: 'Failed to update organization' });
  }
};


import { Request, Response } from 'express';
import OpenAI from 'openai';
import { supabase } from '../config/supabase.js';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

if (!OPENAI_API_KEY) {
  console.warn('[AI Controller] Missing OPENAI_API_KEY environment variable.');
}

const openaiClient = OPENAI_API_KEY
  ? new OpenAI({ apiKey: OPENAI_API_KEY })
  : null;

const skillExtractionPrompt = `
You are a talent recruiter AI. Your goal is to help users find the perfect team members. Based on the *entire conversation history provided*, identify required skills/technologies from the latest user request or overall project description. When you respond, be helpful and conversational.

When extracting skills, respond with a brief natural language response first, followed by a JSON array of skills.

Format your response as:

RESPONSE: [brief response here]

SKILLS: ["skill1", "skill2", "skill3"]

Example:
User: "I need help building a mobile app"
RESPONSE: For a mobile app, you'll need mobile developers and UI/UX designers.
SKILLS: ["Mobile Development", "UI/UX Design", "iOS Development", "Android Development", "React Native", "Flutter"]

Example:
User: "web ui ux"
RESPONSE: Great! For web UI/UX, you'll need designers with web design expertise.
SKILLS: ["UI/UX Design", "Web Design", "Figma", "Adobe XD", "HTML", "CSS", "JavaScript", "Responsive Design"]

Always include the SKILLS array even if you're not 100% certain. Make educated guesses based on the context.
`;

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const parseAiResponse = (content: string) => {
  const responseMatch = content.match(/RESPONSE:\s*(.*?)(?=SKILLS:|$)/s);
  const skillsMatch = content.match(/SKILLS:\s*(\[.*?\])/s);

  const naturalResponse = responseMatch ? responseMatch[1].trim() : content;
  let extractedSkills: string[] = [];

  if (skillsMatch) {
    try {
      extractedSkills = JSON.parse(skillsMatch[1]);
    } catch (error) {
      console.error('Error parsing skills from AI response:', error);
    }
  }

  return { naturalResponse, extractedSkills };
};

export const handleTalentChat = async (req: Request, res: Response) => {
  try {
    if (!openaiClient) {
      return res.status(500).json({ error: 'OpenAI client is not configured' });
    }

    const { messages } = req.body as { messages: ChatMessage[] };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const openaiMessages: ChatMessage[] = [
      { role: 'system', content: skillExtractionPrompt },
      ...messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    ];

    const completion = await openaiClient.chat.completions.create({
      model: OPENAI_MODEL,
      messages: openaiMessages,
      temperature: 0.7,
    });

    const aiContent = completion.choices[0]?.message?.content ?? '';
    const { naturalResponse, extractedSkills } = parseAiResponse(aiContent);

    let talents: any[] = [];

    if (extractedSkills.length > 0) {
      const { data, error } = await supabase
        .from('talents')
        .select('*')
        .overlaps('skills', extractedSkills)
        .limit(5);

      if (error) {
        console.error('Supabase talent query error:', error);
      } else if (data) {
        talents = data;
      }
    } else {
      const { data, error } = await supabase
        .from('talents')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Supabase fallback query error:', error);
      } else if (data) {
        talents = data;
      }
    }

    return res.json({
      content: naturalResponse,
      talents,
      skills: extractedSkills,
    });
  } catch (error) {
    console.error('handleTalentChat error:', error);
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : 'Failed to process AI request',
    });
  }
};



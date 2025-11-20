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
You are a talent recruiter AI. Your goal is to help users find the perfect team members. Based on the *entire conversation history provided*, identify required skills/technologies from the latest user request or overall project description. 

IMPORTANT: Your response should be brief and conversational. DO NOT list talents, DO NOT mention how many talents were found, and DO NOT include specific talent names or details in your response. The talents will be displayed separately on the UI.

When extracting skills, respond with a brief natural language response first, followed by a JSON array of skills.

Format your response as:

RESPONSE: [brief conversational response - DO NOT mention specific talents or counts]

SKILLS: ["skill1", "skill2", "skill3"]

Example:
User: "I need help building a mobile app"
RESPONSE: For a mobile app, you'll need mobile developers and UI/UX designers. I'll find the right experts for you.
SKILLS: ["Mobile Development", "UI/UX Design", "iOS Development", "Android Development", "React Native", "Flutter"]

Example:
User: "software development team"
RESPONSE: For software development, you'll want a team with expertise in programming languages, frameworks, and modern development practices.
SKILLS: ["Software Development", "Java", "Python", "JavaScript", "React", "Node.js", "DevOps", "Agile"]

Always include the SKILLS array even if you're not 100% certain. Make educated guesses based on the context. Keep responses short and friendly.
`;

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const parseAiResponse = (content: string) => {
  const responseMatch = content.match(/RESPONSE:\s*(.*?)(?=SKILLS:|$)/s);
  const skillsMatch = content.match(/SKILLS:\s*(\[.*?\])/s);

  let naturalResponse = responseMatch ? responseMatch[1].trim() : content;
  let extractedSkills: string[] = [];

  if (skillsMatch) {
    try {
      extractedSkills = JSON.parse(skillsMatch[1]);
      // Remove the SKILLS line from the natural response if it somehow got included
      naturalResponse = naturalResponse.replace(/SKILLS:\s*\[.*?\]/s, '').trim();
    } catch (error) {
      console.error('Error parsing skills from AI response:', error);
    }
  }

  // Additional cleanup: remove any remaining "SKILLS:" mentions
  naturalResponse = naturalResponse
    .replace(/SKILLS:\s*\[[\s\S]*?\]/g, '')
    .replace(/RESPONSE:\s*/g, '')
    .trim();

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



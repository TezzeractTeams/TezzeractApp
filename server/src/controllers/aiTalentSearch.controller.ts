import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '../config/supabase.js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

if (!GEMINI_API_KEY) {
  console.warn('[AI Controller] Missing GEMINI_API_KEY environment variable.');
}

const geminiClient = GEMINI_API_KEY
  ? new GoogleGenerativeAI(GEMINI_API_KEY)
  : null;

// Helper function to list available models
export const listGeminiModels = async (req: Request, res: Response) => {
  try {
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        error: `Failed to fetch models: ${response.status} ${response.statusText}`,
        details: errorText,
      });
    }

    const data = await response.json() as {
      models?: Array<{
        name: string;
        displayName?: string;
        description?: string;
        supportedGenerationMethods?: string[];
      }>;
    };

    // Filter models that support generateContent
    const availableModels = data.models?.filter((model) =>
      model.supportedGenerationMethods?.includes('generateContent')
    ) || [];

    console.log('\n=== Available Gemini Models (generateContent) ===');
    availableModels.forEach((model) => {
      console.log(`✓ ${model.name}`);
      console.log(`  Display: ${model.displayName || 'N/A'}`);
      console.log(`  Description: ${model.description || 'N/A'}`);
      console.log('---');
    });

    return res.json({
      allModels: data.models || [],
      availableForGenerateContent: availableModels,
      message: `Found ${availableModels.length} model(s) supporting generateContent`,
    });
  } catch (error) {
    console.error('Error listing models:', error);
    return res.status(500).json({
      error: 'Failed to list models',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

const skillExtractionPrompt = `You are a talent recruiter AI helping to build a team. Each user request REPLACES the previous team with a new team based on their current request.

IMPORTANT: Extract roles ONLY from the user's CURRENT message. Do NOT include roles from previous messages. Each request builds a fresh team.

You MUST respond in this EXACT format every time:

RESPONSE: [your message here]

ROLES: ["Role1", "Role2", "Role3"]

SKILLS: {
  "Role1": ["skill1", "skill2", "skill3"],
  "Role2": ["skill1", "skill2", "skill3"],
  "Role3": ["skill1", "skill2", "skill3"]
}

DO NOT deviate from this format. ALWAYS start with "RESPONSE:" followed by "ROLES:" and then "SKILLS:" with a JSON object mapping each role to its relevant skills.

For SKILLS, extract the key technical skills, tools, technologies, and competencies mentioned in the user's request or that are typically needed for each role. Be specific and include technologies, frameworks, tools, and domain knowledge.

CRITICAL: In ROLES, ONLY include roles from the user's CURRENT message. Ignore any roles mentioned in previous conversation history.

Examples:

User: "uiux"
RESPONSE: For a UI/UX focused project, I recommend this team of 3:

1. UI/UX Designer: Expert in user interface and user experience design with Figma/Sketch proficiency.
2. Frontend Developer: Brings designs to life with React/Vue and responsive design skills.
3. Product Manager: Ensures the UX aligns with business goals and user needs.

ROLES: ["UI/UX Designer", "Frontend Developer", "Product Manager"]

SKILLS: {
  "UI/UX Designer": ["UI/UX", "Design", "User Experience", "Figma", "Sketch", "Prototyping", "Wireframing"],
  "Frontend Developer": ["React", "Vue", "JavaScript", "TypeScript", "HTML", "CSS", "Responsive Design"],
  "Product Manager": ["Product Management", "Agile", "Scrum", "Strategy", "User Research"]
}

---

User: "mobile app development"
RESPONSE: For a mobile app, I recommend this initial team of 4:

1. Mobile Developer: Expert in iOS/Android development with React Native or Flutter.
2. UI/UX Designer: Specializes in mobile app design, ensuring intuitive user experience.
3. Backend Developer: Handles API development and database management.
4. QA Tester: Tests the app across different devices and operating systems.

ROLES: ["Mobile Developer", "UI/UX Designer", "Backend Developer", "QA Tester"]

SKILLS: {
  "Mobile Developer": ["React Native", "Flutter", "iOS", "Android", "Mobile Development", "Swift", "Kotlin"],
  "UI/UX Designer": ["UI/UX", "Mobile Design", "Figma", "User Experience", "Prototyping"],
  "Backend Developer": ["Node.js", "Python", "API", "Database", "PostgreSQL", "REST API"],
  "QA Tester": ["QA", "Testing", "Mobile Testing", "Automation", "Selenium", "Quality Assurance"]
}

CRITICAL RULES:
1. Your response MUST start with "RESPONSE:"
2. Your response MUST include "ROLES:" followed by a valid JSON array
3. Your response MUST include "SKILLS:" followed by a valid JSON object mapping each role to an array of skills
4. Extract skills from the user's message context - what technologies, tools, or competencies are mentioned or implied?
5. Include 3-6 relevant skills per role
6. Skills should be specific (e.g., "React" not just "Frontend", "Figma" not just "Design Tools")
7. No additional text after the SKILLS object
`;

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const parseAiResponse = (content: string) => {
  console.log('[parseAiResponse] Parsing AI content...');
  
  // Try to extract RESPONSE: section
  const responseMatch = content.match(/RESPONSE:\s*(.*?)(?=ROLES:|$)/s);
  const rolesMatch = content.match(/ROLES:\s*(\[.*?\])/s);
  const skillsMatch = content.match(/SKILLS:\s*(\{[\s\S]*?\})/s);

  let naturalResponse = responseMatch ? responseMatch[1].trim() : content;
  let extractedRoles: string[] = [];
  let extractedSkills: Record<string, string[]> = {};

  if (rolesMatch) {
    try {
      extractedRoles = JSON.parse(rolesMatch[1]);
      console.log('[parseAiResponse] Successfully parsed roles from JSON:', extractedRoles);
    } catch (error) {
      console.error('[parseAiResponse] Error parsing roles JSON:', error);
    }
  }

  if (skillsMatch) {
    try {
      extractedSkills = JSON.parse(skillsMatch[1]);
      console.log('[parseAiResponse] Successfully parsed skills from JSON:', extractedSkills);
    } catch (error) {
      console.error('[parseAiResponse] Error parsing skills JSON:', error);
    }
  }
  
  // FALLBACK: If JSON parsing failed or no roles found, try to extract from numbered list
  if (extractedRoles.length === 0) {
    console.log('[parseAiResponse] Attempting fallback extraction from numbered list...');
    // Match lines starting with "1. **Role**:" or "1. Role:"
    const roleRegex = /\d+\.\s*\*\*?([^\*:]+)\*\*?:/g;
    let match;
    while ((match = roleRegex.exec(content)) !== null) {
      if (match[1]) {
        extractedRoles.push(match[1].trim());
      }
    }
    
    if (extractedRoles.length > 0) {
      console.log('[parseAiResponse] Successfully extracted roles from list:', extractedRoles);
    } else {
      console.warn('[parseAiResponse] Failed to extract roles from list as well');
    }
  }

  // Additional cleanup: remove any remaining "ROLES:" and "SKILLS:" mentions
  naturalResponse = naturalResponse
    .replace(/ROLES:\s*\[[\s\S]*?\]/g, '')
    .replace(/SKILLS:\s*\{[\s\S]*?\}/g, '')
    .replace(/RESPONSE:\s*/g, '')
    .trim();

  return { naturalResponse, extractedRoles, extractedSkills };
};

export const handleTalentChat = async (req: Request, res: Response) => {
  try {
    if (!geminiClient) {
      return res.status(500).json({ error: 'Gemini client is not configured' });
    }

    const { messages } = req.body as { messages: ChatMessage[] };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // Build conversation history for Gemini
    // Gemini doesn't use system messages the same way, so we'll prepend the system prompt
    const conversationHistory: string[] = [skillExtractionPrompt];
    
    // Convert messages to conversation format
    messages.forEach((message) => {
      if (message.role === 'user') {
        conversationHistory.push(`User: ${message.content}`);
      } else if (message.role === 'assistant') {
        conversationHistory.push(`Assistant: ${message.content}`);
      }
    });

    const model = geminiClient.getGenerativeModel({ 
      model: GEMINI_MODEL,
      generationConfig: {
        temperature: 0.3, // Lower temperature for more consistent formatting
      },
    });
    
    const prompt = conversationHistory.join('\n\n');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiContent = response.text() ?? '';
    console.log('[AI Talent Search] Raw AI response:', aiContent);
    const { naturalResponse, extractedRoles, extractedSkills } = parseAiResponse(aiContent);
    console.log('[AI Talent Search] Parsed natural response:', naturalResponse);
    console.log('[AI Talent Search] Extracted roles:', extractedRoles);
    console.log('[AI Talent Search] Extracted skills:', extractedSkills);

    // Helper function to find skills for a role using AI-extracted skills
    const findSkillsForRole = (role: string): string[] => {
      // First, try to get skills from AI-extracted skills map
      if (extractedSkills[role]) {
        return extractedSkills[role];
      }
      
      // Case-insensitive match in extracted skills
      const roleKey = Object.keys(extractedSkills).find(
        (key) => key.toLowerCase() === role.toLowerCase()
      );
      if (roleKey) {
        return extractedSkills[roleKey];
      }
      
      // Partial match in extracted skills
      const partialKey = Object.keys(extractedSkills).find((key) =>
        role.toLowerCase().includes(key.toLowerCase()) ||
        key.toLowerCase().includes(role.toLowerCase())
      );
      if (partialKey) {
        return extractedSkills[partialKey];
      }
      
      // Fallback: use the role itself as a skill if AI didn't extract skills
      return [role];
    };

    // Match talents to roles
    const recommendedTalents: Array<{ talent: any; role: string }> = [];
    const allSkills: string[] = [];

    console.log('[AI Talent Search] Extracted roles from AI:', extractedRoles);

    // Extract all relevant skills from roles
    extractedRoles.forEach((role) => {
      const skills = findSkillsForRole(role);
      allSkills.push(...skills);
    });

    // Get all talents from database for flexible matching
    const { data: allTalentsData, error: allTalentsError } = await supabase
      .from('talents')
      .select('*')
      .limit(1000);

    if (allTalentsError) {
      console.error('[AI Talent Search] Error fetching talents:', allTalentsError);
      return res.status(500).json({ error: 'Failed to fetch talents from database' });
    }

    const allAvailableTalents = allTalentsData || [];
    console.log(`[AI Talent Search] Found ${allAvailableTalents.length} total talents in database`);

    // For each role, find the best matching talent
    for (const role of extractedRoles) {
      const roleSkills = findSkillsForRole(role);
      console.log(`[AI Talent Search] Searching for role: ${role}, with skills: ${roleSkills.join(', ')}`);
      
      // Score all talents based on skill overlap with flexible matching
      const scoredTalents = allAvailableTalents.map((talent) => {
        const talentSkills = (talent.skills || []).map((s: string) => s.toLowerCase());
        const roleSkillsLower = roleSkills.map((s: string) => s.toLowerCase());
        
        // Calculate match score with flexible partial matching
        let score = 0;
        talentSkills.forEach((ts: string) => {
          roleSkillsLower.forEach((rs: string) => {
            // Check if either skill contains the other
            if (ts.includes(rs) || rs.includes(ts)) {
              score++;
            }
          });
        });
        
        return { talent, score };
      });

      // Filter out talents with score 0 and sort by score
      const matchedTalents = scoredTalents
        .filter((st) => st.score > 0)
        .sort((a, b) => b.score - a.score);

      console.log(`[AI Talent Search] Found ${matchedTalents.length} matching talents for role: ${role}`);

      if (matchedTalents.length > 0) {
        // Get top 5 candidates and pick one that hasn't been recommended yet
        const topCandidates = matchedTalents.slice(0, 5);
        const availableCandidate = topCandidates.find(
          (candidate) => !recommendedTalents.some((rt) => rt.talent.id === candidate.talent.id)
        );

        if (availableCandidate) {
          console.log(`[AI Talent Search] Selected ${availableCandidate.talent.name} for ${role} (score: ${availableCandidate.score})`);
          recommendedTalents.push({ talent: availableCandidate.talent, role });
        } else if (matchedTalents.length > 0) {
          // Fallback: try to find any non-duplicate from the full list
          const anyAvailable = matchedTalents.find(
            (candidate) => !recommendedTalents.some((rt) => rt.talent.id === candidate.talent.id)
          );
          if (anyAvailable) {
            console.log(`[AI Talent Search] Selected ${anyAvailable.talent.name} for ${role} (fallback, score: ${anyAvailable.score})`);
            recommendedTalents.push({ talent: anyAvailable.talent, role });
          }
        }
      } else {
        console.log(`[AI Talent Search] No matching talents found for role: ${role} - SKIPPING`);
      }
      
      // Stop if we have reached 4 talents
      if (recommendedTalents.length >= 4) {
        console.log('[AI Talent Search] Reached maximum of 4 talents, stopping search');
        break;
      }
    }

    // STRICT MATCHING: Removed the fallback logic that fills with random talents
    // If we have fewer than 4 talents, we just return what we found
    
    console.log(`[AI Talent Search] Recommended ${recommendedTalents.length} talents for ${extractedRoles.length} roles`);
    console.log(`[AI Talent Search] Roles: ${extractedRoles.join(', ')}`);
    console.log(`[AI Talent Search] Talent IDs: ${recommendedTalents.map(rt => rt.talent.id).join(', ')}`);

    // Detect confirmation intent in the last user message
    const lastUserMessage = messages[messages.length - 1];
    const userMessageLower = (lastUserMessage?.content?.toLowerCase() || '').trim();
    
    // Check for "all forms" request first (more specific - must be checked before general confirmation)
    const allFormsKeywords = [
      'all forms',
      'show all forms',
      'give all forms',
      'show forms',
      'give forms',
      'both forms',
      'show both',
      'all at once',
      'fill all',
      'complete all',
      'give me all',
      'show me all',
      'all the forms'
    ];
    
    const showBothForms = allFormsKeywords.some(keyword => 
      userMessageLower.includes(keyword)
    );
    
    // Strong confirmation keywords (explicit confirmations - these always trigger)
    const strongConfirmationKeywords = [
      'that\'s better',
      'thats better',
      'that better',
      'confirm',
      'confirmed',
      'ready to move',
      'ready to proceed',
      'ready',
      'let\'s go',
      'lets go',
      'proceed',
      'continue',
      'go ahead',
      'let\'s do it',
      'lets do it',
      'move forward',
      'next step',
      'process'
    ];
    
    // Weak confirmation keywords (need to be short messages to avoid false positives)
    const weakConfirmationKeywords = [
      'sounds good',
      'sounds great',
      'perfect',
      'great',
      'yes',
      'yeah',
      'yep',
      'okay',
      'ok',
      'sure',
      'that works',
      'looks good',
      'better'
    ];
    
    const isShortMessage = userMessageLower.split(/\s+/).length <= 4;
    const matchesStrongConfirmation = strongConfirmationKeywords.some(keyword => 
      userMessageLower.includes(keyword)
    );
    const matchesWeakConfirmation = weakConfirmationKeywords.some(keyword => 
      userMessageLower.includes(keyword)
    );
    
    // Check if there are previous assistant messages (user might be confirming existing team)
    const hasPreviousAssistantMessages = messages.some((msg, idx) => 
      idx < messages.length - 1 && 
      msg.role === 'assistant'
    );
    
    // Check if user is confirming with existing team (they mention "this team" or similar)
    const isConfirmingExistingTeam = userMessageLower.includes('this team') || 
                                     userMessageLower.includes('with this') ||
                                     userMessageLower.includes('process with') ||
                                     userMessageLower.includes('proceed with');
    
    // Only treat as confirmation if:
    // 1. Matches strong confirmation keywords (always triggers), OR
    // 2. It's a short message AND matches weak confirmation keywords AND (we have talents OR previous messages)
    const isConfirmation = matchesStrongConfirmation || 
                          (isShortMessage && matchesWeakConfirmation && (recommendedTalents.length > 0 || hasPreviousAssistantMessages));
    
    // Show form if:
    // 1. User confirmed AND we have new talents, OR
    // 2. User is confirming existing team (they want to proceed with previously selected team)
    const shouldShowForm = (isConfirmation && recommendedTalents.length > 0) || 
                          (isConfirmation && isConfirmingExistingTeam && hasPreviousAssistantMessages);
    
    console.log('[AI Talent Search] Confirmation detection:', {
      userMessage: userMessageLower,
      isConfirmation,
      showBothForms,
      shouldShowForm,
      hasTalents: recommendedTalents.length > 0,
      isConfirmingExistingTeam,
      hasPreviousAssistantMessages,
      isShortMessage,
      matchesStrongConfirmation,
      matchesWeakConfirmation
    });

    return res.json({
      content: naturalResponse,
      recommendedTalents: recommendedTalents.map((rt) => ({
        ...rt.talent,
        role: rt.role,
      })),
      talents: recommendedTalents.map((rt) => rt.talent),
      roles: extractedRoles,
      skills: extractedSkills, // AI-extracted skills for each role
      showOrganizationForm: shouldShowForm,
      showBothForms: showBothForms && shouldShowForm,
    });
  } catch (error) {
    console.error('handleTalentChat error:', error);
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : 'Failed to process AI request',
    });
  }
};

export const swapTalent = async (req: Request, res: Response) => {
  try {
    const { talentId, role, excludeIds } = req.body as {
      talentId: string;
      role?: string;
      excludeIds?: string[];
    };

    if (!talentId) {
      return res.status(400).json({ error: 'Talent ID is required' });
    }

    // Get the current talent to understand their skills
    const { data: currentTalent, error: currentError } = await supabase
      .from('talents')
      .select('*')
      .eq('id', talentId)
      .single();

    if (currentError || !currentTalent) {
      return res.status(404).json({ error: 'Talent not found' });
    }

    const currentSkills = currentTalent.skills || [];
    const excludeIdsList = excludeIds || [];

    // Use the current talent's skills to find similar talents
    // This makes sense - we want to swap with someone who has similar skills
    const searchSkills = currentSkills.length > 0
      ? currentSkills
      : role
      ? [role] // If no skills but role provided, use role as a skill
      : ['Developer']; // Final fallback

    // Query talents with similar skills
    const { data: allCandidates, error: candidatesError } = await supabase
      .from('talents')
      .select('*')
      .overlaps('skills', searchSkills)
      .limit(50);

    if (candidatesError) {
      console.error('Supabase talent query error:', candidatesError);
      return res.status(500).json({ error: 'Failed to find alternative talents' });
    }

    // Filter out excluded IDs in JavaScript
    const candidates = (allCandidates || []).filter(
      (talent) => talent.id !== talentId && !excludeIdsList.includes(talent.id)
    );

    if (!candidates || candidates.length === 0) {
      // Fallback: get any available talent
      const { data: allFallbackData, error: fallbackError } = await supabase
        .from('talents')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (fallbackError) {
        return res.status(500).json({ error: 'Failed to find alternative talents' });
      }

      // Filter out excluded IDs
      const fallbackData = (allFallbackData || []).filter(
        (talent) => talent.id !== talentId && !excludeIdsList.includes(talent.id)
      );

      if (!fallbackData || fallbackData.length === 0) {
        return res.status(404).json({ error: 'No alternative talent found' });
      }

      return res.json({ talent: fallbackData[0] });
    }

    // Score candidates based on skill overlap
    const scoredCandidates = candidates.map((talent) => {
      const talentSkills = (talent.skills || []).map((s: string) => s.toLowerCase());
      const searchSkillsLower = searchSkills.map((s: string) => s.toLowerCase());
      const matches = talentSkills.filter((s: string) =>
        searchSkillsLower.some((ss: string) => s.includes(ss) || ss.includes(s))
      ).length;
      return { talent, score: matches };
    });

    // Sort by score and return best match
    scoredCandidates.sort((a, b) => b.score - a.score);
    const bestMatch = scoredCandidates[0].talent;

    return res.json({ talent: bestMatch });
  } catch (error) {
    console.error('swapTalent error:', error);
    return res.status(500).json({
      error:
        error instanceof Error ? error.message : 'Failed to swap talent',
    });
  }
};




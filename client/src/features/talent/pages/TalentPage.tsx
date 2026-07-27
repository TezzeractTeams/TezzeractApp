import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/shared/contexts/AuthContext";
import { useTeamStore } from "@/shared/stores/useTeamStore";
import { useChatStoreHydrated, type ChatMessage } from "@/shared/stores/useChatStore";
import { useOrganizationStore } from "@/shared/stores/useOrganizationStore";
import { ChatPanel } from "../components/ChatPanel";
import { AvailableTalents } from "../components/AvailableTalents";
import { SuggestedTalents } from "../components/SuggestedTalents";
import { getTalents } from "@/shared/services/talentService";
import { useChatService } from "@/shared/services/chatService";
import LoginSidePanel from "@/features/auth/components/LoginSidePanel";


interface Talent {
  id: string;
  image_url: string;
  name: string;
  skills: string[];
  experience_years: number;
  availability: boolean;
  role?: string;
}

/** Returns true if the message looks like a talent search (e.g. "I need backend developers"), false for casual messages (e.g. "good morning"). */
function looksLikeTalentSearch(message: string): boolean {
  const m = message.toLowerCase().trim().replace(/[.!?]+$/, "");
  const words = m.split(/\s+/).filter(Boolean);

  const casualPhrases = [
    "good morning", "good afternoon", "good evening", "good night",
    "hi", "hello", "hey", "thanks", "thank you", "ok", "okay",
    "bye", "goodbye", "yes", "no", "sure", "what's up", "how are you",
  ];
  if (casualPhrases.some((p) => m === p || m.startsWith(p + " "))) return false;

  const talentKeywords = ["developer", "designer", "engineer", "team", "need", "want", "looking for", "hire", "role", "position", "backend", "frontend", "fullstack", "mobile", "ui", "ux"];
  if (talentKeywords.some((k) => m.includes(k))) return true;

  if (words.length <= 2) return false;
  return true;
}

export default function TalentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const initialSearchQuery =
    (location.state as { searchQuery?: string } | undefined)?.searchQuery || "";
  const [allTalents, setAllTalents] = useState<Talent[]>([]);
  const [isFetchingTalents, setIsFetchingTalents] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const hasProcessedInitialQueryRef = useRef(false);
  const lastProcessedStepRef = useRef<string | null>(null);
  
  // Use Zustand stores (hydrated to ensure Date objects)
  const {
    messages,
    input,
    isResponding,
    suggestedSkills,
    selectedSkillFilters,
    recommendedTalents,
    setMessages,
    addMessage,
    setInput,
    setIsResponding,
    setSuggestedSkills,
    setSelectedSkillFilters,
    setRecommendedTalents,
    toggleSkillFilter,
    removeMessagesByType,
    clearAll,
  } = useChatStoreHydrated();
  
  const { team: yourTeam, addToTeam, removeFromTeam, updateTeam, clearTeam } = useTeamStore();
  
  const {
    currentStep,
    setCurrentStep,
  } = useOrganizationStore();
  
  const { sendTalentChat } = useChatService();

  // Fetch talents from API on component mount
  useEffect(() => {
    const fetchTalents = async () => {
      try {
        setIsFetchingTalents(true);
        const response = await getTalents();
        setAllTalents(response.talents);
      } catch (error) {
        console.error('Failed to fetch talents:', error);
        // Fallback to empty array if API fails
        setAllTalents([]);
      } finally {
        setIsFetchingTalents(false);
      }
    };

    fetchTalents();
  }, []);

  const handleSendMessage = useCallback(
    async (overrideInput?: string) => {
      const messageText = (overrideInput ?? input).trim();
      if (!messageText || isResponding) return;

      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "user",
        content: messageText,
        timestamp: new Date(),
      };

      addMessage(userMessage);
      if (!overrideInput) {
        setInput("");
      }
      setIsResponding(true);

      try {
        const payloadMessages = [...messages, userMessage].map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

        const response = await sendTalentChat(payloadMessages);

        // Check if AI wants to show organization form
        const showForm = (response as any).showOrganizationForm || false;
        const showBothForms = (response as any).showBothForms || false;

        // Use recommendedTalents if available, otherwise fallback to talents
        const newTalents = response.recommendedTalents || response.talents || [];
        const isTalentSearch = response.isTalentSearch === true;

        // Create AI response message
        const aiResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: response.content,
          talents: newTalents,
          timestamp: new Date(),
        };

        addMessage(aiResponse);

        // Only refresh talents/team when AI interpreted the message as a talent search
        // Casual messages like "good morning" should not clear or replace the team
        if (isTalentSearch) {
          // Replace recommended talents with new ones (user wants to replace team, not add)
          setRecommendedTalents(newTalents);

          // Replace team: Remove old talents and add new ones
          const newTalentIds = new Set(newTalents.map(t => t.id));
          const updatedTeam = yourTeam.filter(t => newTalentIds.has(t.id));
          newTalents.forEach((talent) => {
            if (!updatedTeam.some((t) => t.id === talent.id)) {
              updatedTeam.push(talent);
            }
          });
          updateTeam(updatedTeam);

          // Update suggested skills from AI response (if available)
          if (response.skills && response.skills.length > 0) {
            setSuggestedSkills(response.skills.slice(0, 4)); // Show top 4 skills
            setSelectedSkillFilters([]); // Reset filters when new skills arrive
          } else if (response.roles && response.roles.length > 0) {
            // Use roles as suggested skills if available
            setSuggestedSkills(response.roles.slice(0, 4));
            setSelectedSkillFilters([]);
          }
        }

        // Handle organization form flow
        if (showForm) {
          console.log('[TalentPage] Showing organization form:', { showForm, showBothForms });
          
          // Message 1: Introduction text
          const introMessage: ChatMessage = {
            id: (Date.now() + 2).toString(),
            role: "assistant",
            type: "text",
            content: "Take just 10 seconds to fill these, so we can get to know you.",
            timestamp: new Date(),
          };
          addMessage(introMessage);

          if (showBothForms) {
            // Show both forms instantly (user requested all forms at once)
            console.log('[TalentPage] Showing both forms instantly');
            const formMessage1: ChatMessage = {
              id: (Date.now() + 3).toString(),
              role: "assistant",
              type: "organization_form",
              content: "",
              timestamp: new Date(),
            };
            const formMessage2: ChatMessage = {
              id: (Date.now() + 4).toString(),
              role: "assistant",
              type: "company_size",
              content: "Company size?",
              timestamp: new Date(),
            };
            addMessage(formMessage1);
            addMessage(formMessage2);
            // Don't set step - forms are shown but user still needs to fill them sequentially
          } else {
            // Normal flow: Show form 1 first, form 2 will appear after submission
            console.log('[TalentPage] Showing form 1 only (normal flow)');
            const formMessage: ChatMessage = {
              id: (Date.now() + 3).toString(),
              role: "assistant",
              type: "organization_form",
              content: "",
              timestamp: new Date(),
            };
            addMessage(formMessage);
            setCurrentStep('form1');
          }
        }
      } catch (error) {
        console.error('AI chat error:', error);
        const errorResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "I'm having trouble searching for talents right now. Please try again.",
          timestamp: new Date(),
        };
        addMessage(errorResponse);
      } finally {
        setIsResponding(false);
      }
    },
    [input, isResponding, messages, yourTeam, addMessage, setInput, setIsResponding, setRecommendedTalents, setSuggestedSkills, setSelectedSkillFilters, updateTeam, sendTalentChat, setCurrentStep]
  );

  // Process initial search query coming from Home page (if any)
  useEffect(() => {
    if (!initialSearchQuery || hasProcessedInitialQueryRef.current) {
      return;
    }

    hasProcessedInitialQueryRef.current = true;
    handleSendMessage(initialSearchQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSearchQuery]);

  // Extract talents from saved messages on page load
  useEffect(() => {
    if (messages.length > 0 && recommendedTalents.length === 0) {
      const latestAiMessage = messages
        .slice()
        .reverse()
        .find((m) => m.role === "assistant" && m.talents && m.talents.length > 0);
      
      if (latestAiMessage && latestAiMessage.talents) {
        setRecommendedTalents(latestAiMessage.talents);
        // Auto-add to team storage
        const talentsToAdd = latestAiMessage.talents.filter(
          (talent) => !yourTeam.some((t) => t.id === talent.id)
        );
        talentsToAdd.forEach((talent) => addToTeam(talent));
      }
    }
  }, [messages, recommendedTalents.length, yourTeam, addToTeam, setRecommendedTalents]);

  // Watch for organization form flow step changes
  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/0b0f08c3-d177-414e-9c2d-ee1698ed7d28',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TalentPage.tsx:245',message:'useEffect triggered',data:{currentStep,lastProcessedStep:lastProcessedStepRef.current,user:!!user},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    // Skip if we've already processed this step
    if (lastProcessedStepRef.current === currentStep) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/0b0f08c3-d177-414e-9c2d-ee1698ed7d28',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TalentPage.tsx:250',message:'skipping already processed step',data:{currentStep},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      return;
    }
    
    if (currentStep === 'form2') {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/0b0f08c3-d177-414e-9c2d-ee1698ed7d28',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TalentPage.tsx:253',message:'form2 branch entered',data:{hasCompanySizeMsg:messages.some(m=>m.type==='company_size')},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      // Check if company_size message already exists before adding
      const hasCompanySizeMessage = messages.some((msg) => msg.type === 'company_size');
      if (!hasCompanySizeMessage) {
        // Form 1 submitted, show company size message
        const companySizeMessage: ChatMessage = {
          id: Date.now().toString(),
          role: "assistant",
          type: "company_size",
          content: "Company size?",
          timestamp: new Date(),
        };
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/0b0f08c3-d177-414e-9c2d-ee1698ed7d28',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TalentPage.tsx:264',message:'calling addMessage for company_size',data:{messageId:companySizeMessage.id},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        addMessage(companySizeMessage);
      }
      lastProcessedStepRef.current = currentStep;
    } else if (currentStep === 'completed') {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/0b0f08c3-d177-414e-9c2d-ee1698ed7d28',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TalentPage.tsx:272',message:'completed branch entered',data:{user:!!user,hasLoginMsg:messages.some(m=>m.type==='login_button')},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      // Form 2 submitted - show team confirmation in chat; redirect only when user clicks "Continue to meeting setup"
      if (user) {
        // User is already logged in - add login_button so they see team confirmation and can confirm before redirect
        const hasLoginMessage = messages.some((msg) => msg.type === 'login_button');
        if (!hasLoginMessage) {
          const loginMessage: ChatMessage = {
            id: Date.now().toString(),
            role: "assistant",
            type: "login_button",
            content: "Great! Now let's get onboard. Confirm your team and continue to meeting setup.",
            timestamp: new Date(),
          };
          addMessage(loginMessage);
        }
      } else {
        // User is not logged in, check if login message already exists
        const hasLoginMessage = messages.some((msg) => msg.type === 'login_button');
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/0b0f08c3-d177-414e-9c2d-ee1698ed7d28',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TalentPage.tsx:280',message:'checking hasLoginMessage',data:{hasLoginMessage},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        if (!hasLoginMessage) {
          // Only add login button message if one doesn't already exist
          const loginMessage: ChatMessage = {
            id: Date.now().toString(),
            role: "assistant",
            type: "login_button",
            content: "Great! Now let's get onboard. We need you to log into your Tezzeract account. Create your account here so I can log you in.",
            timestamp: new Date(),
          };
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/0b0f08c3-d177-414e-9c2d-ee1698ed7d28',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TalentPage.tsx:290',message:'calling addMessage for login_button',data:{messageId:loginMessage.id},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
          // #endregion
          addMessage(loginMessage);
        }
      }
      lastProcessedStepRef.current = currentStep;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, addMessage, user, navigate, removeMessagesByType]);
  
  // When user logs in after form completion: keep login_button visible so they see team confirmation.
  // Redirect happens only when user clicks "Continue to meeting setup" in chat.
  useEffect(() => {
    if (user && yourTeam.length === 0) {
      // User logged in but has no team - remove login_button (nothing to confirm)
      removeMessagesByType('login_button');
    }
  }, [user, yourTeam.length, removeMessagesByType]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleAddToTeam = (talent: Talent) => {
    if (!yourTeam.some((t) => t.id === talent.id)) {
      addToTeam(talent);
      // Also add to recommendedTalents so it appears in "This is the best team for you"
      if (!recommendedTalents.some((t) => t.id === talent.id)) {
        setRecommendedTalents([...recommendedTalents, talent]);
      }
    }
  };

  const handleRemoveFromTeam = (talentId: string) => {
    // Removed - AI selections are fixed, no manual removal
  };

  const hasUserMessage = messages.some(m => m.role === "user");

  // Show only AI-recommended talents (never show all talents)
  const filteredTalents = recommendedTalents;

  const lastUserMessage = [...messages].filter((m) => m.role === "user").pop()?.content ?? "";
  const shouldShowTalentLoading = isResponding && looksLikeTalentSearch(lastUserMessage);

  const handleSkillFilterToggle = (skill: string) => {
    toggleSkillFilter(skill);
  };

  const handleClearChat = () => {
    clearAll(); // Clear chat store
    clearTeam(); // Clear team store
  };

  return (
    <div className="flex flex-col  h-screen bg-global-bg-white transition-all duration-500 ease-in-out overflow-hidden">
      <div className="flex-1 animate-fade-in flex gap-4 min-h-0">
        {/* Chat Panel */}
        <div className="flex-shrink-0  transition-all duration-300 ease-out" style={{ width: '28%' }}>
          <ChatPanel
            messages={messages}
            input={input}
            isLoading={isResponding}
            onInputChange={setInput}
            onSendMessage={handleSendMessage}
            onKeyPress={handleKeyPress}
            hasUserMessage={hasUserMessage}
            suggestedSkills={suggestedSkills}
            selectedSkillFilters={selectedSkillFilters}
            onSkillFilterToggle={handleSkillFilterToggle}
            onLoginClick={() => setIsAuthModalOpen(true)}
            onClearChat={handleClearChat}
          />
        </div>

        {/* AI Selected Talents */}
        <div className="flex-1 transition-all rounded-3xl duration-300 ease-out flex flex-col py-4 overflow-y-auto">
          {filteredTalents.length > 0 && (
            <h1 className="text-[#27272A] text-xl font-light mb-4 flex-shrink-0">This is the best team for you</h1>
          )}
          <div className="flex-1 min-h-0">
            <AvailableTalents
              talents={filteredTalents}
              isLoading={shouldShowTalentLoading}
              hasUserMessage={hasUserMessage}
              yourTeam={yourTeam}
              onAddToTeam={handleAddToTeam}
            />
          </div>
          {filteredTalents.length > 0 && allTalents.length > filteredTalents.length && (
            <SuggestedTalents
              recommendedTalents={filteredTalents}
              allTalents={allTalents}
              onAddToTeam={handleAddToTeam}
            />
          )}
        </div>
      </div>
      
      {/* Login Side Panel */}
      <LoginSidePanel
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}
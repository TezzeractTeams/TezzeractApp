import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/shared/contexts/AuthContext";
import { useTeamStore } from "@/shared/stores/useTeamStore";
import { useChatStoreHydrated, type ChatMessage } from "@/shared/stores/useChatStore";
import { useOrganizationStore } from "@/shared/stores/useOrganizationStore";
import { useChatService } from "@/shared/services/chatService";
import { ChatPanel } from "../components/ChatPanel";
import { YourTeamCard } from "../components/YourTeamCard";
import { FormField } from "@/shared/components/ui/FormField";
import { Input } from "@/shared/components/ui/Input";
import { Select, SelectOption } from "@/shared/components/ui/Select";
import { TezzeractButton } from "@/shared/components/ui/TezzeractButton";
import { Plus, Check, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { bookMeeting } from "@/shared/services/meetingService";
import AuthModal from "@/features/auth/components/AuthModal";

interface OrganizationFormData {
  organizationName: string;
  industry: string;
  basedIn: string;
  companySize: string;
}

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

const companySizeOptions = [
  { value: "less-than-100", label: "Less than 100 employees" },
  { value: "100-1000", label: "100-1,000 employees" },
  { value: "1000+", label: "1,000+ employees" },
];

// Generate AI-suggested times (formatted for display)
function generateSuggestedTimes(): Array<{ id: string; label: string; datetime: Date }> {
  const times: Array<{ id: string; label: string; datetime: Date }> = [];
  const now = new Date();
  
  // Generate time slots: Today, Tomorrow, Thursday
  const timeSlots = [
    { days: 0, time: "12:00 pm", label: "12:00 pm Today" },
    { days: 1, time: "10:00 am", label: "10:00 am Tomorrow" },
    { days: 3, time: "2:30 pm", label: "2:30 pm Thursday" },
  ];
  
  timeSlots.forEach((slot, index) => {
    const date = new Date(now);
    date.setDate(date.getDate() + slot.days);
    
    // Parse time (simplified - assumes format like "12:00 pm")
    const [timePart, period] = slot.time.split(" ");
    const [hours, minutes] = timePart.split(":").map(Number);
    let hour24 = hours;
    if (period === "pm" && hours !== 12) hour24 = hours + 12;
    if (period === "am" && hours === 12) hour24 = 0;
    
    const datetime = new Date(date);
    datetime.setHours(hour24, minutes || 0, 0, 0);
    
    times.push({
      id: `time-${index}`,
      label: slot.label,
      datetime,
    });
  });
  
  return times;
}

export default function CreateMeetingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { team, updateTeam, clearTeam } = useTeamStore();
  const {
    messages,
    input,
    isResponding,
    suggestedSkills,
    selectedSkillFilters,
    recommendedTalents,
    addMessage,
    setInput,
    setIsResponding,
    setRecommendedTalents,
    setSuggestedSkills,
    setSelectedSkillFilters,
    toggleSkillFilter,
    clearAll,
    removeMessagesByType,
  } = useChatStoreHydrated();
  const { organization, organizationName, industry, basedIn, companySize, setCompanySize, setForm1Data, currentStep, setCurrentStep } = useOrganizationStore();
  const { sendTalentChat } = useChatService();
  
  const [colleagues, setColleagues] = useState<Array<{ email: string; role: string }>>([
    { email: "", role: "" },
  ]);
  
  const [selectedTime, setSelectedTime] = useState<{ id: string; label: string; datetime: Date } | null>(null);
  const [suggestedTimes] = useState(generateSuggestedTimes());
  const [orgSectionExpanded, setOrgSectionExpanded] = useState(true);
  const [dateSectionExpanded, setDateSectionExpanded] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingBooking, setPendingBooking] = useState<{ orgData: typeof orgData; selectedTime: typeof selectedTime; colleagues: typeof colleagues } | null>(null);
  const lastProcessedStepRef = useRef<string | null>(null);
  
  // Auto-fill organization data from store (editable)
  const [orgData, setOrgData] = useState({
    name: organization?.name || organizationName || "",
    industry: organization?.industry || industry || "",
    basedIn: organization?.basedIn || basedIn || "",
    companySize: organization?.companySize || companySize || "",
  });
  
  // Update local state when store changes
  useEffect(() => {
    setOrgData({
      name: organization?.name || organizationName || "",
      industry: organization?.industry || industry || "",
      basedIn: organization?.basedIn || basedIn || "",
      companySize: organization?.companySize || companySize || "",
    });
  }, [organization, organizationName, industry, basedIn, companySize]);
  
  const handleOrgFieldChange = (field: 'name' | 'industry' | 'basedIn', value: string) => {
    setOrgData(prev => ({ ...prev, [field]: value }));
    if (field === 'name') {
      setForm1Data({ name: value });
    } else {
      setForm1Data({ [field]: value });
    }
  };
  
  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  
  // Show form if team already exists (user came from TalentPage with team)
  // This ensures the form is visible when user navigates here with a team
  useEffect(() => {
    if (team.length > 0) {
      console.log('[CreateMeetingPage] Team selected, showing form', { teamLength: team.length });
      setShowForm(true);
    }
  }, [team.length]);

  // Redirect if no team members and no messages (user hasn't started chat)
  useEffect(() => {
    if (team.length === 0 && messages.length <= 1) {
      // Only redirect if there's no chat history (just initial message)
      // Don't redirect if user is in the middle of chatting
      const hasUserMessages = messages.some((m) => m.role === "user");
      if (!hasUserMessages) {
        navigate("/talent");
      }
    }
  }, [team.length, messages.length, navigate, messages]);
  
  const handleSendMessage = useCallback(async () => {
    const messageText = input.trim();
    if (!messageText || isResponding) return;
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };
    
    addMessage(userMessage);
    setInput("");
    setIsResponding(true);
    
    try {
      const payloadMessages = [...messages, userMessage].map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await sendTalentChat(payloadMessages);
      
      // Use recommendedTalents if available, otherwise fallback to talents
      const newTalents = response.recommendedTalents || response.talents || [];
      
      // If team already exists and API returned new talents, prevent team change
      if (team.length > 0 && newTalents.length > 0) {
        // User tried to search for new talents, show polite message instead
        const politeMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "I understand you'd like to change your team. You've already selected a team for your meeting. If you'd like to modify your team selection, please contact our support team and they'll be happy to assist you. For now, let's proceed with scheduling your meeting with the current team.",
          timestamp: new Date(),
        };
        addMessage(politeMessage);
        setIsResponding(false);
        return;
      }

      // Check if AI wants to show organization form
      const shouldShowForm = (response as any).showOrganizationForm || false;
      
      // Create AI response message (only if we didn't already show polite message)
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.content,
        talents: newTalents,
        timestamp: new Date(),
      };

      addMessage(aiResponse);
      
      // Only update team if we're not on CreateMeetingPage with existing team
      // On CreateMeetingPage, team is locked and shouldn't be changed
      if (team.length === 0 && newTalents.length > 0) {
        // Replace recommended talents with new ones (user wants to replace team, not add)
        setRecommendedTalents(newTalents);
        
        // Update team: Replace old talents with new ones
        updateTeam(newTalents);
      }
      // If team already exists, don't update it (team is locked on CreateMeetingPage)
      
      // Update suggested skills from AI response (if available)
      if (response.skills && response.skills.length > 0) {
        setSuggestedSkills(response.skills.slice(0, 4)); // Show top 4 skills
        setSelectedSkillFilters([]); // Reset filters when new skills arrive
      } else if (response.roles && response.roles.length > 0) {
        // Use roles as suggested skills if available
        setSuggestedSkills(response.roles.slice(0, 4));
        setSelectedSkillFilters([]);
      }

      // Handle organization form flow
      if (shouldShowForm) {
        console.log('[CreateMeetingPage] Showing organization form');
        setShowForm(true);
        
        // Message: Introduction text
        const introMessage: ChatMessage = {
          id: (Date.now() + 2).toString(),
          role: "assistant",
          type: "text",
          content: "Take just 10 seconds to fill these, so we can get to know you.",
          timestamp: new Date(),
        };
        addMessage(introMessage);

        // Normal flow: Show form 1 first, form 2 will appear after submission
        console.log('[CreateMeetingPage] Showing form 1 only (normal flow)');
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
  }, [input, isResponding, messages, addMessage, setInput, setIsResponding, setRecommendedTalents, setSuggestedSkills, setSelectedSkillFilters, updateTeam, sendTalentChat, setCurrentStep]);
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSkillFilterToggle = (skill: string) => {
    toggleSkillFilter(skill);
  };

  const handleClearChat = () => {
    clearAll(); // Clear chat store
    clearTeam(); // Clear team store
    setShowForm(false); // Hide form
  };

  // Watch for organization form flow step changes
  useEffect(() => {
    if (currentStep === 'form2' && lastProcessedStepRef.current !== 'form2') {
      // Form 1 submitted, show company size message
      const companySizeMessage: ChatMessage = {
        id: Date.now().toString(),
        role: "assistant",
        type: "company_size",
        content: "Company size?",
        timestamp: new Date(),
      };
      addMessage(companySizeMessage);
      lastProcessedStepRef.current = 'form2';
    } else if (currentStep === 'completed' && lastProcessedStepRef.current !== 'completed') {
      // Form 2 submitted, form is ready
      setShowForm(true);
      lastProcessedStepRef.current = 'completed';
      
      // If user is not logged in, show login message
      if (!user) {
        const hasLoginMessage = messages.some((m) => m.type === 'login_button');
        if (!hasLoginMessage) {
          const loginMessage: ChatMessage = {
            id: Date.now().toString(),
            role: "assistant",
            type: "login_button",
            content: "Great! Now let's get onboard. We need you to log into your Tezzeract account. Create your account here so I can log you in.",
            timestamp: new Date(),
          };
          addMessage(loginMessage);
        }
      }
    }
  }, [currentStep, addMessage, user, messages]);
  
  // Watch for user login - remove login messages and proceed with booking if pending
  useEffect(() => {
    if (user) {
      // Remove login_button messages when user logs in
      removeMessagesByType('login_button');
      
      if (pendingBooking) {
        console.log('[CreateMeetingPage] User logged in, proceeding with pending booking');
        // User just logged in and has pending booking, proceed with booking
        const proceedWithBooking = async () => {
        setIsBooking(true);
        try {
          const { orgData: pendingOrgData, selectedTime: pendingSelectedTime, colleagues: pendingColleagues } = pendingBooking;
          
          // Get user's timezone (default to UTC if not available)
          const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
          
          // Format the selected time as ISO 8601
          const startTime = pendingSelectedTime!.datetime.toISOString();
          
          // Get guest emails from colleagues
          const guestEmails = pendingColleagues
            .filter((c) => c.email && c.email.trim())
            .map((c) => c.email.trim());

          // Prepare meeting booking request
          const meetingRequest = {
            start: startTime,
            attendee: {
              name: userName,
              email: user.email!,
              timeZone: timeZone,
            },
            eventTypeSlug: '30min',
            username: 'tezzearct',
            guests: guestEmails.length > 0 ? guestEmails : undefined,
            metadata: {
              organization: (pendingOrgData.name || "").substring(0, 500),
              industry: (pendingOrgData.industry || "").substring(0, 500),
              basedIn: (pendingOrgData.basedIn || "").substring(0, 500),
              companySize: (pendingOrgData.companySize || "").substring(0, 500),
              teamMembers: JSON.stringify(team.map((m) => ({ id: m.id, name: m.name }))).substring(0, 500),
            },
          };

          const result = await bookMeeting(meetingRequest);
          alert(`Meeting booked successfully! ${result.message}`);
          setPendingBooking(null);
        } catch (error: any) {
          console.error('Error booking meeting:', error);
          alert(`Failed to book meeting: ${error.message || 'Unknown error'}`);
        } finally {
          setIsBooking(false);
        }
      };
      
      proceedWithBooking();
      }
    }
  }, [user, pendingBooking, userName, team, removeMessagesByType]);
  
  const handleCompanySizeSelect = (size: string) => {
    setCompanySize(size);
  };
  
  const handleTimeSelect = (time: { id: string; label: string; datetime: Date }) => {
    setSelectedTime(time);
  };
  
  const handleAddColleague = () => {
    setColleagues((prev) => [...prev, { email: "", role: "" }]);
  };
  
  const handleColleagueChange = (index: number, field: "email" | "role", value: string) => {
    setColleagues((prev) =>
      prev.map((colleague, i) => (i === index ? { ...colleague, [field]: value } : colleague))
    );
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[CreateMeetingPage] Submit button clicked', { orgData, selectedTime, user: user?.email, team: team.length });
    
    // Basic validation
    if (!orgData.name.trim()) {
      alert("Organization name is required");
      return;
    }
    if (!selectedTime) {
      alert("Please select a meeting time");
      return;
    }
    
    // If user is not logged in, save form data and show login message
    if (!user?.email) {
      console.log('[CreateMeetingPage] User not logged in, saving form data and showing login message');
      setPendingBooking({ orgData, selectedTime, colleagues });
      
      // Check if login message already exists
      const hasLoginMessage = messages.some((m) => m.type === 'login_button');
      if (!hasLoginMessage) {
        const loginMessage: ChatMessage = {
          id: Date.now().toString(),
          role: "assistant",
          type: "login_button",
          content: "Great! Now let's get onboard. We need you to log into your Tezzeract account. Create your account here so I can log you in.",
          timestamp: new Date(),
        };
        addMessage(loginMessage);
      }
      return;
    }

    console.log('[CreateMeetingPage] Validation passed, starting booking...');
    setIsBooking(true);
    
    try {
      // Get user's timezone (default to UTC if not available)
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      
      // Format the selected time as ISO 8601
      const startTime = selectedTime.datetime.toISOString();
      
      // Get guest emails from colleagues
      const guestEmails = colleagues
        .filter((c) => c.email && c.email.trim())
        .map((c) => c.email.trim());

      // Prepare meeting booking request
      const meetingRequest = {
        start: startTime,
        attendee: {
          name: userName,
          email: user.email,
          timeZone: timeZone,
        },
        eventTypeSlug: '30min', // Your Cal.com event type slug
        username: 'tezzearct', // Your Cal.com username
        guests: guestEmails.length > 0 ? guestEmails : undefined,
        metadata: {
          organization: (orgData.name || "").substring(0, 500),
          industry: (orgData.industry || "").substring(0, 500),
          basedIn: (orgData.basedIn || "").substring(0, 500),
          companySize: (orgData.companySize || "").substring(0, 500),
          teamMembers: JSON.stringify(team.map((m) => ({ id: m.id, name: m.name }))).substring(0, 500),
        },
      };

      const result = await bookMeeting(meetingRequest);
      
      alert(`Meeting booked successfully! ${result.message}`);
      
      // Optionally navigate to a success page or reset the form
      // navigate('/talent');
    } catch (error: any) {
      console.error('Error booking meeting:', error);
      alert(`Failed to book meeting: ${error.message || 'Unknown error'}`);
    } finally {
      setIsBooking(false);
    }
  };
  
  const hasUserMessage = messages.some((m) => m.role === "user");
  
  return (
    <div className="flex flex-col h-screen bg-[#F2F2F2] transition-all duration-500 ease-in-out">
      <div className="flex-1 overflow-hidden animate-fade-in flex gap-4">
      {/* Chat Panel - Left */}
        <div className="flex-shrink-0 transition-all duration-300 ease-out" style={{ width: "28%" }}>
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
            onClearChat={handleClearChat}
            onLoginClick={() => setIsAuthModalOpen(true)}
          />
        </div>
        
      {/* Meeting Form Panel - Right */}
        <div className="flex-1 overflow-y-auto ">
          <div className="max-w-full mx-auto space-y-8">
            {/* Welcome Header */}
            <h1 className="text-3xl pt-6 font-light text-gray-900 mb-2">
                Hello {userName}, welcome to Tezzeract!
            </h1>
            <div className="p-4 bg-white rounded-3xl w-fit">
              
              {/* Your Team Section */}
              {team.length > 0 && (
              <div>
                <h2 className="text-lg font-[400] text-[#3F3F46] mb-4">Your team is ready to start action!</h2>
                <div className="flex gap-3 flex-wrap">
                  {team.map((member) => (
                    <div key={member.id} className="w-32">
                      <YourTeamCard
                        id={member.id}
                        image_url={member.image_url}
                        name={member.name}
                        skills={member.skills}
                        experience_years={member.experience_years}
                        availability={member.availability}
                        showRemoveButton={false}
                        showSkills={false}
                        className="rounded-2xl"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
            </div>
            
          
            
            {/* Organization and Date/Time Sections */}
            {(showForm || team.length > 0) && (
            <form id="meeting-form" onSubmit={handleSubmit} className="space-y-6">
              {/* Both sections side by side */}
              <div className="flex gap-6 flex-col items-center">
                {/* Section 1: Let us know more about your organization */}
                <div className="p-4 bg-white rounded-3xl w-full">
                  <button
                    type="button"
                    onClick={() => setOrgSectionExpanded(!orgSectionExpanded)}
                    className="w-full flex items-center justify-between mb-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Check className="w-4 h-4 text-blue-600" />
                      </div>
                      <h2 className="text-[24px] font-light text-[#3F3F46]">Let us know more about your organization</h2>
                    </div>
                    {orgSectionExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  
                  {orgSectionExpanded && (
                    <div className="space-y-4 w-full">
                      {/* Organization Data Fields */}
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <FormField>
                          <Input
                            placeholder="Organization name"
                            value={orgData.name}
                            onChange={(e) => handleOrgFieldChange('name', e.target.value)}
                            className="border border-[#E4E4E7] placeholder:text-[#71717A] min-h-[50px] rounded-xl"
                          />
                        </FormField>
                        <FormField>
                          <Select
                            options={industryOptions}
                            placeholder="Industry"
                            value={orgData.industry}
                            onChange={(e) => handleOrgFieldChange('industry', e.target.value)}
                            className="border-[#E4E4E7] text-[#71717A] min-h-[50px] rounded-xl"
                          />
                        </FormField>
                        <FormField>
                          <Input
                            placeholder="Based in"
                            value={orgData.basedIn}
                            onChange={(e) => handleOrgFieldChange('basedIn', e.target.value)}
                            className="border border-[#E4E4E7] placeholder:text-[#71717A] min-h-[50px] rounded-xl"
                          />
                        </FormField>
                      </div>
                      
                      {/* Company Size Selection */}
                      <div className="flex gap-3">
                        {companySizeOptions.map((option) => {
                          const isSelected = orgData.companySize === option.value;
                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => handleCompanySizeSelect(option.value)}
                              className={cn(
                                "flex-1 text-center px-4 min-h-[50px] rounded-xl transition-all duration-200 relative",
                                isSelected
                                  ? "text-gray-900"
                                  : "text-[#71717A] hover:bg-gray-50"
                              )}
                              style={
                                isSelected
                                  ? {
                                      border: "1px solid transparent",
                                      borderRadius: "0.75rem",
                                      background: "linear-gradient(white, white) padding-box, radial-gradient(64.46% 80% at 50.53% 0%, #009BE9 0%, #00378A 100%) border-box",
                                    }
                                  : {
                                      border: "1px solid #E4E4E7",
                                      borderRadius: "0.75rem",
                                      background: "white",
                                    }
                              }
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Section 2: Pick a date & time */}
                <div className="p-4 bg-white rounded-3xl w-full">
                  <button
                    type="button"
                    onClick={() => setDateSectionExpanded(!dateSectionExpanded)}
                    className="w-full flex items-center justify-between mb-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Check className="w-4 h-4 text-blue-600" />
                      </div>
                      <h2 className="text-[24px] font-light text-[#3F3F46]">Pick a date & time</h2>
                    </div>
                    {dateSectionExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  
                  {dateSectionExpanded && (
                    <div className="w-full">
                      <div className="flex gap-3 flex-wrap">
                        {suggestedTimes.map((time) => {
                          const isSelected = selectedTime?.id === time.id;
                          return (
                            <button
                              key={time.id}
                              type="button"
                              onClick={() => handleTimeSelect(time)}
                              className={cn(
                                "flex-1 text-center px-4 min-h-[50px] rounded-xl transition-all duration-200 relative min-w-[150px]",
                                isSelected
                                  ? "text-gray-900"
                                  : "text-[#71717A] hover:bg-gray-50"
                              )}
                              style={
                                isSelected
                                  ? {
                                      border: "1px solid transparent",
                                      borderRadius: "0.75rem",
                                      background: "linear-gradient(white, white) padding-box, radial-gradient(64.46% 80% at 50.53% 0%, #009BE9 0%, #00378A 100%) border-box",
                                    }
                                  : {
                                      border: "1px solid #E4E4E7",
                                      borderRadius: "0.75rem",
                                      background: "white",
                                    }
                              }
                            >
                              {time.label}
                            </button>
                          );
                        })}
                        <button
                          type="button"
                          className="flex-1 text-center px-4 min-h-[50px] rounded-xl transition-all duration-200 text-[#71717A] hover:bg-gray-50 border border-[#E4E4E7] min-w-[150px]"
                        >
                          Request new time
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
          
              {/* Submit Button */}
              <div className="flex justify-end pt-4 pr-4">
                <TezzeractButton 
                  type="submit" 
                  fullWidth={false} 
                  className="w-[200px]" 
                  disabled={isBooking}
                >
                  {isBooking ? "Booking..." : "Book a call"}
                </TezzeractButton>
              </div>
            </form>
            )}
          </div>
        </div>
      </div>
      
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode="signin"
      />
    </div>
  );
}


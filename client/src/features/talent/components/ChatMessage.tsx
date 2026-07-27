import { OrganizationBasicForm } from "./OrganizationBasicForm";
import { OrganizationSizeForm } from "./OrganizationSizeForm";
import { TezzeractButton } from "@/shared/components/ui/TezzeractButton";
import { useAuth } from "@/shared/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useTeamStore } from "@/shared/stores/useTeamStore";
import type { ChatMessage as ChatMessageType } from "@/shared/stores/useChatStore";

interface ChatMessageProps {
  id: string;
  role: "user" | "assistant";
  content: string;
  type?: "text" | "organization_form" | "company_size" | "login_button";
  timestamp: Date;
  onLoginClick?: () => void;
}

export function ChatMessage({ role, content, type = "text", onLoginClick }: ChatMessageProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { team } = useTeamStore();
  
  const handleContinueToMeeting = () => {
    navigate('/talent/create-meeting');
  };
  
  // Render different content based on message type
  const renderContent = () => {
    switch (type) {
      case "organization_form":
        return <OrganizationBasicForm />;
      case "company_size":
        return <OrganizationSizeForm />;
      case "login_button":
        // Don't show login button if user is already logged in
        if (user) {
          // User is logged in - show team confirmation and require user to confirm before redirect
          if (team.length > 0) {
            const teamNames = team.map((t) => t.name).join(", ");
            return (
              <div className="space-y-3">
                <p className="whitespace-pre-wrap" style={{ color: '#27272A' }}>
                  Great! You&apos;re logged in. Your team: {teamNames}. Ready to set up your meeting with them?
                </p>
                <TezzeractButton onClick={handleContinueToMeeting} fullWidth={false}>
                  Continue to meeting setup
                </TezzeractButton>
              </div>
            );
          }
          return (
            <div className="space-y-3">
              <p className="whitespace-pre-wrap" style={{ color: '#27272A' }}>
                You&apos;re already logged in! Continue with your team selection.
              </p>
            </div>
          );
        }
        // User is not logged in, show login button
        return (
          <div className="space-y-3">
            <p className="whitespace-pre-wrap" style={{ color: '#27272A' }}>
              {content}
            </p>
            <TezzeractButton onClick={onLoginClick || (() => {})} fullWidth={false}>
              Log in to Tezzeract
            </TezzeractButton>
          </div>
        );
      case "text":
      default:
        return (
          <p className="whitespace-pre-wrap" style={{ color: '#27272A' }}>
            {content}
          </p>
        );
    }
  };

  const isFormType = type === 'organization_form' || type === 'company_size';
  const maxWidth = role === 'assistant' 
    ? (isFormType ? '95%' : '80%')
    : undefined;

  return (
    <div className={`flex items-start animate-fade-in ${role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div>
        <div
          className="p-3 inline-block"
          style={{
            fontFamily: 'Figtree, system-ui, sans-serif',
            fontWeight: 400,
            fontSize: '14px',
            backgroundColor: role === 'user' ? '#F2F2F2' : 'white',
            color: '#27272A',
            borderRadius: '20px',
            ...(maxWidth && { maxWidth })
          }}
        >
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

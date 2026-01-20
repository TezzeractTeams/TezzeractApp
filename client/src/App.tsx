import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './shared/components/ProtectedRoute';
import PlatformLayout from './shared/layouts/PlatformLayout';
import HomePage from './features/home/pages/HomePage';
import TalentPage from './features/talent/pages/TalentPage';
import CreateMeetingPage from './features/talent/pages/CreateMeetingPage';
import DashboardPage from './features/social/pages/DashboardPage';
import SettingsPage from './features/social/pages/SettingsPage';
import ContentCalendarPage from './features/social/pages/ContentCalendarPage';
import ContentSuggestionsPage from './features/social/pages/ContentSuggestionsPage';
import ChatPage from './features/chat/pages/ChatPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Home Route */}
        <Route path="/" element={<HomePage />} />
        
        {/* Public Social Dashboard Routes - No Auth Required */}
        <Route element={<PlatformLayout />}>
          <Route path="/social" element={<DashboardPage />} />
          <Route path="/social/calendar" element={<ContentCalendarPage />} />
          <Route path="/social/suggestions" element={<ContentSuggestionsPage />} />
          <Route path="/social/settings" element={<SettingsPage />} />
        </Route>
        
        {/* Public Talent Routes - No Auth Required */}
        <Route element={<PlatformLayout />}>
          <Route path="/talent" element={<TalentPage />} />
          <Route path="/talent/create-meeting" element={<CreateMeetingPage />} />
        </Route>
        
        {/* Protected Platform Routes - Auth Required */}
        <Route element={
          <ProtectedRoute>
            <PlatformLayout />
          </ProtectedRoute>
        }>
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;


import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PlatformLayout from './shared/layouts/PlatformLayout';
import HomePage from './features/home/pages/HomePage';
import LoginPage from './features/auth/pages/LoginPage';
import TalentPage from './features/talent/pages/TalentPage';
import SocialPage from './features/social/pages/SocialPage';
import ChatPage from './features/chat/pages/ChatPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Home Route - Landing Page */}
        <Route path="/" element={<HomePage />} />
        
        {/* Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Platform Routes with Layout */}
        <Route element={<PlatformLayout />}>
          <Route path="/talent" element={<TalentPage />} />
          <Route path="/social" element={<SocialPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/settings" element={<div className="p-8"><h1 className="text-3xl font-bold">Settings</h1></div>} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;


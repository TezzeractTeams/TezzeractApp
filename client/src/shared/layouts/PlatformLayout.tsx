import { Outlet } from 'react-router-dom';
import VerticalSidebar from './VerticalSidebar';

export default function PlatformLayout() {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Vertical Sidebar - VS Code style */}
      <VerticalSidebar />
      
      {/* Main Content Area */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}


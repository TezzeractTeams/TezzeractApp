import { NavLink } from 'react-router-dom';
import { useClerk, useUser } from '@clerk/clerk-react';
import { Users, BarChart3, MessageSquare, Settings, LogOut } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

const navItems = [
  { path: '/talent', icon: Users, label: 'Talent Search' },
  { path: '/social', icon: BarChart3, label: 'Social Media' },
  { path: '/chat', icon: MessageSquare, label: 'Chat' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function VerticalSidebar() {
  const { signOut } = useClerk();
  const { user } = useUser();

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/';
  };

  return (
    <aside className="w-16 bg-gray-900 flex flex-col items-center py-4 space-y-2">
      {/* Logo */}
      <div className="mb-6">
        <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center text-white font-bold text-xl">
          T
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 flex flex-col space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 group relative',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className="w-6 h-6" />
                
                {/* Active Indicator */}
                {isActive && (
                  <div className="absolute left-0 w-1 h-8 bg-blue-400 rounded-r-full" />
                )}
                
                {/* Tooltip */}
                <div className="absolute left-16 ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                  {item.label}
                </div>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Profile & Logout */}
      <div className="flex flex-col items-center space-y-2">
        {/* User Avatar */}
        {user && (
          <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-gray-800 text-white text-sm font-medium relative group">
            {user.imageUrl ? (
              <img 
                src={user.imageUrl} 
                alt={user.fullName || 'User'} 
                className="w-full h-full rounded-lg object-cover"
              />
            ) : (
              <span>{user.firstName?.charAt(0) || user.emailAddresses[0]?.emailAddress.charAt(0).toUpperCase()}</span>
            )}
            
            {/* Tooltip */}
            <div className="absolute left-16 ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
              {user.fullName || user.emailAddresses[0]?.emailAddress}
            </div>
          </div>
        )}
        
        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-12 h-12 rounded-lg flex items-center justify-center text-gray-400 hover:bg-red-600 hover:text-white transition-all duration-200 group relative"
        >
          <LogOut className="w-6 h-6" />
          
          {/* Tooltip */}
          <div className="absolute left-16 ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
            Logout
          </div>
        </button>
      </div>
    </aside>
  );
}


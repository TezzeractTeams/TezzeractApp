import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/shared/contexts/AuthContext';
import { Users, BarChart3, MessageSquare, Settings, LogOut } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import sidebarBg from '@/assets/images/Side Bar.png';
import tezzeractIcon from '@/assets/images/tezzeract-icon.png';
import tezzeractIconWhite from '@/assets/images/tezzeractIconWhite.png';

const navItems = [
  { path: '/talent', icon: Users, label: 'Talent' },
  { path: '/social', icon: BarChart3, label: 'Contelli' },
  { path: '/chat', icon: MessageSquare, label: 'Chat' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function VerticalSidebar() {
  const { user, signOut } = useAuth();
  const location = useLocation();

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <aside 
      className="relative overflow-hidden w-[80px] bg-[#F2F2F2] h-full flex flex-col items-center py-4 space-y-2"
    >
      {/* Blurred Background Layer */}
      <div 
        data-debug="sidebar-blur"
        className=" inset-0"
        style={{
          backgroundImage: `url(${sidebarBg})`,
          width: '100%',
          position: 'absolute',
          left: -130,
          top: -250,
          right: 0,
          bottom: 0,
          backgroundRepeat: 'no-repeat',
          filter: 'blur(200px)',
          transform: 'scale(1)',
            zIndex: 0,
        }}
      />
      
      {/* Content Layer - stays sharp */}
      <div className="relative z-20 flex flex-col items-center  flex-1">
        {/* Logo */}
        <div className="mb-6">
          <img
            src={tezzeractIcon}
            alt="Tezzeract"
            className="w-10 h-10 object-contain"
          />
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 flex items-center flex-col w-full gap-4">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path !== '/talent'}
              className={({ isActive }) => {
                const isTalentPath = item.path === '/talent';
                const isTalentActive = isTalentPath && (isActive || location.pathname.startsWith('/talent'));
                
                return cn(
                  isTalentPath
                    ? 'w-[70px] !rounded-xl flex flex-col items-center justify-center transition-all duration-200 group relative py-2'
                    : 'w-[70px] h-20 rounded-xl flex flex-col items-center justify-center transition-all duration-200 group relative py-2',
                  isTalentActive
                    ? ''
                    : isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-black hover:bg-gray-800 hover:text-white'
                );
              }}
              style={
                item.path === '/talent' && location.pathname.startsWith('/talent')
                  ? {
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #00378A 0%, #00A9EE 100%)',
                    }
                  : undefined
              }
            >
              {({ isActive }) => {
                const isTalentPath = item.path === '/talent';
                const isTalentActive = isTalentPath && (isActive || location.pathname.startsWith('/talent'));
                const isActiveState = isTalentPath ? isTalentActive : isActive;
                
                return (
                  <>
                    {isTalentPath ? (
                      <img 
                        src={tezzeractIconWhite} 
                        alt={item.label} 
                        className="w-10 h-10 object-contain" 
                      />
                    ) : (
                      <item.icon className="w-6 h-6" />
                    )}
                    <span 
                      className={cn(
                        "text-center text-xs -pt-2 font-normal leading-4",
                        isActiveState ? "text-white" : "text-black group-hover:text-white"
                      )}
                      style={{
                        fontFamily: 'Figtree, sans-serif',
                      }}
                    >
                      {item.label}
                    </span>
                  </>
                );
              }}
            </NavLink>
          ))}
          
        </nav>


        {/* User Profile & Logout */}
        <div className="flex flex-col items-center space-y-2">
          {/* User Avatar */}
          {user && (
            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-gray-800 text-white text-sm font-medium relative group">
              {user.user_metadata?.avatar_url ? (
                <img 
                  src={user.user_metadata.avatar_url} 
                  alt={user.user_metadata?.full_name || user.email || 'User'} 
                  className="w-full h-full rounded-lg object-cover"
                />
              ) : (
                <span>{(user.user_metadata?.full_name || user.email || 'U').charAt(0).toUpperCase()}</span>
              )}
              
              {/* Tooltip */}
              <div className="absolute left-16 ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                {user.user_metadata?.full_name || user.email}
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
      </div>
    </aside>
  );
}


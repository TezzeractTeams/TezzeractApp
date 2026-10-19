import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import VerticalSidebar from './VerticalSidebar';

export default function PlatformLayout() {
  const mainRef = useRef<HTMLElement>(null);
  const location = useLocation();

  useEffect(() => {
    if (!mainRef.current || !location.pathname.startsWith('/social')) return;
    const el = mainRef.current;
    let lastLog = 0;
    const onScroll = () => {
      if (Date.now() - lastLog < 800) return;
      lastLog = Date.now();
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/0b0f08c3-d177-414e-9c2d-ee1698ed7d28',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'PlatformLayout.tsx:scroll',message:'Main area scrolled',data:{scrollTop:el.scrollTop,scrollHeight:el.scrollHeight,clientHeight:el.clientHeight},hypothesisId:'H4',timestamp:Date.now()})}).catch(()=>{});
      // #endregion
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [location.pathname]);

  useEffect(() => {
    if (!location.pathname.startsWith('/social')) return;
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      const tag = t?.tagName || '';
      const dataDebug = t?.getAttribute?.('data-debug') || t?.closest?.('[data-debug]')?.getAttribute?.('data-debug') || '';
      const isSidebarBlur = dataDebug === 'sidebar-blur';
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/0b0f08c3-d177-414e-9c2d-ee1698ed7d28',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'PlatformLayout.tsx:docClick',message:'Document click (capture)',data:{tag,dataDebug,isSidebarBlur},hypothesisId:'H5',timestamp:Date.now()})}).catch(()=>{});
      // #endregion
    };
    document.addEventListener('click', onDocClick, true);
    return () => document.removeEventListener('click', onDocClick, true);
  }, [location.pathname]);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Vertical Sidebar - VS Code style */}
      <VerticalSidebar />
      
      {/* Main Content Area */}
      <main ref={mainRef} className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}


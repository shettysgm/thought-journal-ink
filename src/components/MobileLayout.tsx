import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import BottomNav from './BottomNav';

interface MobileLayoutProps {
  children: ReactNode;
}

export default function MobileLayout({ children }: MobileLayoutProps) {
  const location = useLocation();
  
  // Pages that should show the bottom nav
  const showBottomNav = ['/', '/text', '/voice', '/unified', '/journal', '/quiz'].includes(location.pathname);
  
  return (
    <div className="min-h-[100svh] flex flex-col">
      {/* Main content area */}
      <main className={`flex-1 ${showBottomNav ? 'pb-20' : ''}`}>
        {children}
      </main>
      
      {/* Bottom navigation */}
      {showBottomNav && <BottomNav />}
    </div>
  );
}

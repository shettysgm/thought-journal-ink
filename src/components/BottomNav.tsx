import { Link, useLocation } from 'react-router-dom';
import { PenLine, BookOpen, LayoutGrid, HelpCircle } from 'lucide-react';

const navItems = [
  { path: '/', icon: LayoutGrid, label: 'Home' },
  { path: '/text', icon: PenLine, label: 'Write' },
  { path: '/journal', icon: BookOpen, label: 'Journal' },
  { path: '/quiz', icon: HelpCircle, label: 'Quiz' },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-card/90 backdrop-blur-xl border-t border-border/60"
      style={{
        paddingBottom: 'max(env(safe-area-inset-bottom), 0.25rem)'
      }}
    >
      <div className="flex items-center justify-around max-w-lg mx-auto px-2 pt-2 pb-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex flex-col items-center justify-center gap-1 px-4 py-1 min-w-[3.5rem]
                transition-colors duration-150
                ${isActive ? 'text-primary' : 'text-muted-foreground'}
              `}
            >
              <Icon
                className="w-5 h-5"
                strokeWidth={isActive ? 2 : 1.5}
              />
              <span className={`text-[10px] ${isActive ? 'font-semibold' : 'font-medium'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

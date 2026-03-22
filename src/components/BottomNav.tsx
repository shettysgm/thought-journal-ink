import { Link, useLocation } from 'react-router-dom';
import { Type, BookOpen, Heart, HelpCircle } from 'lucide-react';

const navItems = [
  { path: '/', icon: Heart, label: 'Home' },
  { path: '/text', icon: Type, label: 'Write' },
  { path: '/journal', icon: BookOpen, label: 'Journal' },
  { path: '/quiz', icon: HelpCircle, label: 'Quiz' },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-lg border-t border-border"
      style={{
        paddingBottom: 'max(env(safe-area-inset-bottom), 0.25rem)'
      }}
    >
      <div className="flex items-center justify-around max-w-lg mx-auto px-2 pt-1.5 pb-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex flex-col items-center justify-center gap-0.5 px-4 py-1.5 rounded-lg
                transition-all duration-150 min-w-[3.5rem]
                ${isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
                }
              `}
            >
              <div className={`relative ${isActive ? '' : ''}`}>
                <Icon
                  className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
                {isActive && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                )}
              </div>
              <span className={`text-[10px] font-medium ${isActive ? 'font-semibold' : ''}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

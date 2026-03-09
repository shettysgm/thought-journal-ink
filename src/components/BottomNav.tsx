import { Link, useLocation } from 'react-router-dom';
import { Type, Mic, BookOpen, Brain, Heart } from 'lucide-react';

const navItems = [
  { 
    path: '/', 
    icon: Heart, 
    label: 'Home' 
  },
  { 
    path: '/text', 
    icon: Type, 
    label: 'Text' 
  },
  { 
    path: '/journal', 
    icon: BookOpen, 
    label: 'Journal' 
  },
  { 
    path: '/quiz', 
    icon: Brain, 
    label: 'Quiz' 
  },
];

export default function BottomNav() {
  const location = useLocation();
  
  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-lg border-t border-border shadow-strong"
      style={{ 
        paddingBottom: 'max(env(safe-area-inset-bottom), 0.5rem)'
      }}
    >
      <div className="flex items-center justify-around max-w-4xl mx-auto px-2 pt-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg
                transition-all duration-200 min-w-[4rem]
                ${isActive 
                  ? 'text-primary bg-primary/10' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }
              `}
            >
              <Icon 
                className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} 
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className={`text-xs font-medium ${isActive ? 'font-semibold' : ''}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

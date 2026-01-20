import { useState } from 'react';
import { Phone, X, Heart, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

const BANNER_DISMISSED_KEY = 'crisis-banner-dismissed';

export default function CrisisResourcesBanner() {
  const [isDismissed, setIsDismissed] = useState(() => {
    return sessionStorage.getItem(BANNER_DISMISSED_KEY) === 'true';
  });

  const handleDismiss = () => {
    sessionStorage.setItem(BANNER_DISMISSED_KEY, 'true');
    setIsDismissed(true);
  };

  if (isDismissed) return null;

  return (
    <div className="bg-rose-50 border-b border-rose-200 px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <Heart className="w-5 h-5 text-rose-500 flex-shrink-0" />
          <p className="text-sm text-rose-800">
            <strong>Need support?</strong>{' '}
            <span className="hidden sm:inline">
              If you're in crisis, please reach out.{' '}
            </span>
            <a 
              href="tel:988" 
              className="font-semibold underline hover:text-rose-900 inline-flex items-center gap-1"
            >
              <Phone className="w-3 h-3" />
              Call/Text 988
            </a>
            <span className="mx-2 text-rose-400">|</span>
            <a 
              href="https://988lifeline.org/chat/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline hover:text-rose-900 inline-flex items-center gap-1"
            >
              Chat Online
              <ExternalLink className="w-3 h-3" />
            </a>
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="text-rose-500 hover:text-rose-700 hover:bg-rose-100 p-1 h-auto"
          aria-label="Dismiss crisis resources banner"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

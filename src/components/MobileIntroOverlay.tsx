import { useState, useEffect } from 'react';
import { X, Heart, Brain, Shield, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const INTRO_SEEN_KEY = 'cbt-journal-intro-seen';

interface MobileIntroOverlayProps {
  alwaysShow?: boolean;
  openSignal?: number;
}

export default function MobileIntroOverlay({ alwaysShow = false, openSignal }: MobileIntroOverlayProps) {
  const [isVisible, setIsVisible] = useState(alwaysShow);

  useEffect(() => {
    if (alwaysShow) {
      setIsVisible(true);
    } else {
      const hasSeenIntro = localStorage.getItem(INTRO_SEEN_KEY);
      if (!hasSeenIntro) {
        setTimeout(() => setIsVisible(true), 500);
      }
    }
  }, [alwaysShow]);

  // Re-open overlay when signal changes
  useEffect(() => {
    if (openSignal !== undefined) {
      setIsVisible(true);
    }
  }, [openSignal]);

  const handleDismiss = () => {
    if (!alwaysShow) {
      localStorage.setItem(INTRO_SEEN_KEY, 'true');
    }
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md animate-fade-in"
      style={{ 
        touchAction: 'none',
        overscrollBehavior: 'contain'
      }}
    >
      <div className="h-full w-full flex flex-col items-center justify-center p-6 overflow-y-auto">
        
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors"
          aria-label="Close intro"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>

        <div className="max-w-md w-full space-y-6 animate-scale-in">
          
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Heart className="w-10 h-10 text-primary animate-pulse" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Welcome to CBT Journal</h1>
            <p className="text-lg text-muted-foreground">
              Your private companion for mental wellness
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <Card className="p-4 bg-card/50 backdrop-blur-sm border-primary/20 shadow-soft animate-fade-in" style={{ animationDelay: '0.2s', opacity: 0, animationFillMode: 'forwards' }}>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">100% Private</h3>
                  <p className="text-sm text-muted-foreground">
                    All your entries stay on your device. No accounts, no cloud storage.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-card/50 backdrop-blur-sm border-primary/20 shadow-soft animate-fade-in" style={{ animationDelay: '0.4s', opacity: 0, animationFillMode: 'forwards' }}>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-accent-strong/10 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-accent-strong" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">AI-Powered Insights</h3>
                  <p className="text-sm text-muted-foreground">
                    Get gentle guidance to reframe negative thoughts using CBT techniques.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-card/50 backdrop-blur-sm border-primary/20 shadow-soft animate-fade-in" style={{ animationDelay: '0.6s', opacity: 0, animationFillMode: 'forwards' }}>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-therapeutic-warmth/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-therapeutic-warmth" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Multiple Ways to Express</h3>
                  <p className="text-sm text-muted-foreground">
                    Type, speak, or handwrite your thoughts - whatever feels natural.
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* CTA */}
          <div className="space-y-3 pt-4 animate-fade-in" style={{ animationDelay: '0.8s', opacity: 0, animationFillMode: 'forwards' }}>
            <Button 
              onClick={handleDismiss}
              className="w-full h-12 text-lg bg-primary hover:bg-primary/90 shadow-medium"
            >
              Get Started
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Tap anywhere to continue
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

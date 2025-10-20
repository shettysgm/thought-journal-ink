import { useState, useEffect, useRef, TouchEvent } from 'react';
import { X, Feather, Brain, Shield, Sparkles, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import quillIcon from '@/assets/quill-ink-icon.png';

const INTRO_SEEN_KEY = 'cbt-journal-intro-seen';

interface MobileIntroOverlayProps {
  alwaysShow?: boolean;
  openSignal?: number;
}

const slides = [
  {
    icon: Feather,
    title: "Welcome to Journal IQ",
    description: "Your private companion for mental wellness",
    color: "text-primary",
    bgColor: "bg-primary/10"
  },
  {
    icon: Shield,
    title: "100% Private",
    description: "All your entries stay on your device. No accounts, no cloud storage, no tracking.",
    color: "text-primary",
    bgColor: "bg-primary/10"
  },
  {
    icon: Brain,
    title: "AI-Powered Insights",
    description: "Get gentle guidance to reframe negative thoughts using CBT techniques.",
    color: "text-accent-strong",
    bgColor: "bg-accent-strong/10"
  },
  {
    icon: Sparkles,
    title: "Multiple Ways to Express",
    description: "Type, speak, or handwrite your thoughts - whatever feels natural to you.",
    color: "text-therapeutic-warmth",
    bgColor: "bg-therapeutic-warmth/20"
  }
];

export default function MobileIntroOverlay({ alwaysShow = false, openSignal }: MobileIntroOverlayProps) {
  const [isVisible, setIsVisible] = useState(alwaysShow);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const slideRef = useRef<HTMLDivElement>(null);

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
      setCurrentSlide(0); // Reset to first slide
    }
  }, [openSignal]);

  const handleDismiss = () => {
    if (!alwaysShow) {
      localStorage.setItem(INTRO_SEEN_KEY, 'true');
    }
    setIsVisible(false);
    setCurrentSlide(0);
  };

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      handleDismiss();
    }
  };

  const handleSkip = () => {
    handleDismiss();
  };

  const handleTouchStart = (e: TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
    if (isRightSwipe && currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }

    setTouchStart(0);
    setTouchEnd(0);
  };

  if (!isVisible) return null;

  const slide = slides[currentSlide];

  return (
      <div 
        className="fixed inset-0 z-50 bg-white backdrop-blur-md animate-fade-in"
        style={{ 
          touchAction: 'pan-y',
          overscrollBehavior: 'contain'
        }}
        role="dialog"
        aria-modal="true"
      >
        <div className="h-full w-full flex flex-col items-center justify-between p-6">
          
          {/* Close/Skip button */}
          <div className="w-full max-w-md flex justify-between items-center">
            <button
              onClick={handleSkip}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
              aria-label="Skip intro"
            >
              Skip
            </button>
            <button
              onClick={handleDismiss}
              className="p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors"
              aria-label="Close intro"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Slide Content */}
          <div 
            ref={slideRef}
            className="max-w-md w-full flex-1 flex flex-col items-center justify-center"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="text-center space-y-6 animate-fade-in" key={currentSlide}>
              {/* Icon or Logo */}
              <div className="flex items-center justify-center mb-4">
                {currentSlide === 0 ? (
                  <div className="w-24 h-24 md:w-28 md:h-28 flex items-center justify-center">
                    <img 
                      src={quillIcon} 
                      alt="Journal IQ Logo" 
                      className="w-full h-full animate-fade-in-scale" 
                    />
                  </div>
                ) : (
                  <div className={`w-20 h-20 rounded-2xl ${slide.bgColor} flex items-center justify-center`}>
                    <slide.icon className={`w-10 h-10 ${slide.color}`} />
                  </div>
                )}
              </div>

              {/* Title and Description */}
              <div className="space-y-3">
                <h2 className="text-3xl font-bold text-foreground">
                  {slide.title}
                </h2>
                <p className="text-lg text-muted-foreground max-w-sm mx-auto">
                  {slide.description}
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Navigation */}
          <div className="w-full max-w-md space-y-6">
            {/* Dots Indicator */}
            <div className="flex items-center justify-center gap-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentSlide 
                      ? 'w-8 bg-primary' 
                      : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>

            {/* Next/Get Started Button */}
            <Button 
              onClick={handleNext}
              className="w-full h-12 text-lg bg-primary hover:bg-primary/90 shadow-medium gap-2"
            >
              {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}
              {currentSlide < slides.length - 1 && <ChevronRight className="w-5 h-5" />}
            </Button>

            {/* Swipe hint */}
            {currentSlide === 0 && (
              <p className="text-xs text-center text-muted-foreground animate-fade-in">
                Swipe left or tap Next to continue
              </p>
            )}
          </div>
        </div>
      </div>
  );
}

import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, Brain, Settings, Heart, BookOpen, Type } from "lucide-react";
import MobileIntroOverlay from "@/components/MobileIntroOverlay";
import { useState } from "react";
import quillIcon from "@/assets/quill-icon.svg";
import cbtJournalTextLogo from "@/assets/cbt-journal-text-logo.png";
import quillSolidIcon from "@/assets/quill-solid-icon.png";
import cbtJournalLogo from "@/assets/cbt-journal-logo.png";

const navigationCards = [
  {
    title: "Text Journal",
    description: "Type your thoughts and feelings",
    icon: Type,
    href: "/text",
    gradient: "bg-gradient-primary",
    color: "primary"
  },
  {
    title: "Voice Journal", 
    description: "Speak your thoughts aloud",
    icon: Mic,
    href: "/voice",
    gradient: "bg-therapeutic-focus",
    color: "therapeutic-focus"
  },
  {
    title: "My Journal",
    description: "View all your saved entries",
    icon: BookOpen,
    href: "/journal",
    gradient: "bg-therapeutic-energy",
    color: "therapeutic-energy"
  },
  {
    title: "CBT Quiz",
    description: "Practice identifying distortions",
    icon: Brain,
    href: "/quiz",
    gradient: "bg-gradient-secondary", 
    color: "secondary"
  }
];

export default function Home() {
  console.log('Home component rendering');
  const [introSignal, setIntroSignal] = useState(0);
  return (
    <>
      <MobileIntroOverlay openSignal={introSignal} />
      <div className="min-h-[100svh] bg-gradient-therapeutic p-4 md:p-6" style={{ backgroundColor: '#f8fafc' }}>
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setIntroSignal((s) => s + 1)}>
              Show Intro
            </Button>
          </div>
          
          {/* Logo Options Preview */}
          <div className="bg-card rounded-xl p-6 shadow-md border border-border">
            <h2 className="text-xl font-semibold text-center mb-6">Logo Options</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col items-center gap-3 p-4 bg-background rounded-lg">
                <img src={quillIcon} alt="Quill Icon" className="w-20 h-20" />
                <p className="text-sm text-muted-foreground">Simple Quill</p>
              </div>
              <div className="flex flex-col items-center gap-3 p-4 bg-background rounded-lg">
                <img src={quillSolidIcon} alt="Quill with Ink" className="w-20 h-20" />
                <p className="text-sm text-muted-foreground">Quill & Ink</p>
              </div>
              <div className="flex flex-col items-center gap-3 p-4 bg-background rounded-lg md:col-span-2">
                <img src={cbtJournalTextLogo} alt="CBT Journal Text Logo" className="w-64 h-auto" />
                <p className="text-sm text-muted-foreground">Full Text Logo</p>
              </div>
              <div className="flex flex-col items-center gap-3 p-4 bg-background rounded-lg md:col-span-2">
                <img src={cbtJournalLogo} alt="Journal with Leaves" className="w-32 h-32" />
                <p className="text-sm text-muted-foreground">Journal with Leaves (Previous)</p>
              </div>
            </div>
          </div>

          {/* Header */}
        <header className="text-center space-y-4 pt-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img src={quillIcon} alt="CBT Journal Logo" className="w-10 h-10 md:w-12 md:h-12 animate-float hover:animate-gentle-bounce transition-all duration-300" />
            <h1 className="text-2xl md:text-4xl font-bold text-foreground">CBT Journal</h1>
          </div>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            A private, secure space to explore your thoughts, identify patterns, and practice healthier thinking habits.
          </p>
        </header>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {navigationCards.map((card) => {
            const IconComponent = card.icon;
            return (
              <Link key={card.href} to={card.href} className="group">
                <Card className="h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border border-border bg-card shadow-md">
                  <CardContent className="p-4 md:p-8 text-center space-y-3 md:space-y-4">
                    <div className={`w-12 h-12 md:w-16 md:h-16 rounded-xl ${card.gradient} flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                      <IconComponent className="w-6 h-6 md:w-8 md:h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg md:text-xl font-semibold text-card-foreground mb-2">
                        {card.title}
                      </h3>
                      <p className="text-sm md:text-base text-muted-foreground">
                        {card.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="flex justify-center gap-4 pt-4">
          <Link to="/settings">
            <Button variant="outline" size="sm" className="gap-2 md:text-base">
              <Settings className="w-4 h-4" />
              Settings
            </Button>
          </Link>
        </div>

        {/* AI Usage Notice */}
        <div className="text-center text-sm text-muted-foreground bg-card/50 rounded-lg p-4 backdrop-blur-sm space-y-2">
          <p>
            🔒 Your journal entries stay private and secure on this device.
          </p>
          <p>
            🤖 <strong>This app uses AI</strong> to analyze your entries and detect cognitive distortions to help you develop healthier thinking patterns.
          </p>
        </div>

        {/* Footer Links */}
        <footer className="text-center text-sm text-muted-foreground pb-8 space-y-2">
          <div className="flex items-center justify-center gap-4">
            <a 
              href="/privacy" 
              className="hover:text-foreground transition-colors underline"
            >
              Privacy Policy
            </a>
            <span>•</span>
            <a 
              href="/terms" 
              className="hover:text-foreground transition-colors underline"
            >
              Terms of Service
            </a>
          </div>
        </footer>

        </div>
      </div>
    </>
  );
}
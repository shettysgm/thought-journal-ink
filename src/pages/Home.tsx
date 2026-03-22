import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HelpCircle, Settings, BookOpen, Type, Lightbulb } from "lucide-react";
import MobileIntroOverlay from "@/components/MobileIntroOverlay";
import DailyPrompt from "@/components/DailyPrompt";
import StreakReminder from "@/components/StreakReminder";
import StreakTracker from "@/components/StreakTracker";
import { useState } from "react";
import quillIcon from "@/assets/quill-icon-new.png";



export default function Home() {
  console.log('Home component rendering');
  const [introSignal, setIntroSignal] = useState<number | undefined>(undefined);
  return (
    <>
      <MobileIntroOverlay openSignal={introSignal} />
      <div 
        className="min-h-[100svh] bg-white px-4 md:px-6 pt-14 pb-6"
        style={{ 
          paddingTop: 'max(3.5rem, calc(env(safe-area-inset-top, 20px) + 1rem))',
          paddingBottom: 'max(1.5rem, calc(env(safe-area-inset-bottom, 0px) + 1rem))'
        }}
      >
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setIntroSignal((s) => (s ?? 0) + 1)}>
              Show Intro
            </Button>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground text-center">Journal Inc</h1>

          {/* Hero: Streak Tracker - prominent */}
          <StreakTracker />
          <StreakReminder />

          {/* Hero: Daily Prompt - prominent */}
          <DailyPrompt />

          {/* Quick start CTA */}
          <Link to="/unified" className="block">
            <Button className="w-full gap-2 h-12 text-base font-semibold shadow-md">
              <Type className="w-5 h-5" />
              Start Today's Entry
            </Button>
          </Link>

          {/* Secondary Navigation */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { title: "Journal", icon: BookOpen, href: "/journal", gradient: "from-teal-50 to-teal-100", iconColor: "text-teal-400" },
              { title: "CBT Quiz", icon: HelpCircle, href: "/quiz", gradient: "from-teal-50 to-teal-100", iconColor: "text-teal-400" },
              { title: "Why CBT", icon: Lightbulb, href: "/why-cbt", gradient: "from-teal-50 to-teal-100", iconColor: "text-teal-400" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} to={item.href}>
                  <Card className="rounded-2xl border border-border/50 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
                    <CardContent className="p-4 text-center space-y-2 flex flex-col items-center">
                      <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-sm`}>
                        <Icon className={`w-5 h-5 ${item.iconColor}`} />
                      </div>
                      <p className="text-sm font-medium text-card-foreground">{item.title}</p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          {/* Settings */}
          <div className="flex justify-center pt-2">
            <Link to="/settings">
              <Button variant="outline" size="sm" className="gap-2">
                <Settings className="w-4 h-4" />
                Settings
              </Button>
            </Link>
          </div>

          {/* Footer */}
          <footer className="text-center text-sm text-muted-foreground pb-8 space-y-2">
            <p>🔒 Private & secure on this device. 🤖 AI-powered distortion detection.</p>
            <div className="flex items-center justify-center gap-4">
              <a href="/privacy" className="hover:text-foreground transition-colors underline">Privacy</a>
              <span>•</span>
              <a href="/terms" className="hover:text-foreground transition-colors underline">Terms</a>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
}
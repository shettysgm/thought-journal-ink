import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookOpen, HelpCircle, Lightbulb, Settings, Pen } from "lucide-react";
import MobileIntroOverlay from "@/components/MobileIntroOverlay";
import DailyPrompt from "@/components/DailyPrompt";
import StreakReminder from "@/components/StreakReminder";
import StreakTracker from "@/components/StreakTracker";
import XPBar from "@/components/XPBar";
import AchievementBadges from "@/components/AchievementBadges";
import DailyChallenges from "@/components/DailyChallenge";
import { useState } from "react";

export default function Home() {
  const [introSignal, setIntroSignal] = useState<number | undefined>(undefined);

  return (
    <>
      <MobileIntroOverlay openSignal={introSignal} />
      <div
        className="min-h-[100svh] bg-background px-5 pb-24"
        style={{
          paddingTop: 'max(3rem, calc(env(safe-area-inset-top, 20px) + 0.75rem))',
          paddingBottom: 'max(6rem, calc(env(safe-area-inset-bottom, 0px) + 6rem))'
        }}
      >
        <div className="max-w-lg mx-auto space-y-5">
          {/* Header — minimal */}
          <div className="flex items-center justify-between pt-2">
            <h1 className="text-lg font-semibold text-foreground tracking-tight">Journal Inc</h1>
            <Link to="/settings">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                <Settings className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {/* Level + XP — compact */}
          <XPBar />

          {/* Stats strip */}
          <StreakTracker />

          {/* Streak nudge */}
          <StreakReminder />

          {/* Primary CTA */}
          <Link to="/unified" className="block">
            <button className="w-full flex items-center justify-center gap-2.5 h-[52px] rounded-2xl bg-primary text-primary-foreground text-[15px] font-semibold shadow-medium hover:opacity-90 transition-opacity">
              <Pen className="w-[18px] h-[18px]" />
              Write today's entry
            </button>
          </Link>

          {/* Challenges */}
          <DailyChallenges />

          {/* Prompt */}
          <DailyPrompt />

          {/* Achievements */}
          <AchievementBadges />

          {/* Quick links — borderless, inline */}
          <div className="flex items-center justify-center gap-6 pt-1">
            {[
              { label: "Journal", icon: BookOpen, href: "/journal" },
              { label: "Quiz", icon: HelpCircle, href: "/quiz" },
              { label: "Why CBT", icon: Lightbulb, href: "/why-cbt" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className="flex flex-col items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-muted/60 flex items-center justify-center">
                    <Icon className="w-[18px] h-[18px]" />
                  </div>
                  <span className="text-[11px] font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Footer — minimal */}
          <footer className="text-center text-[11px] text-muted-foreground pt-2 pb-2 space-y-1">
            <p>Private & secure · AI-powered</p>
            <div className="flex items-center justify-center gap-3">
              <a href="/privacy" className="hover:text-foreground transition-colors">Privacy</a>
              <span>·</span>
              <a href="/terms" className="hover:text-foreground transition-colors">Terms</a>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
}

import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookOpen, Type, HelpCircle, Lightbulb, Settings, ChevronRight } from "lucide-react";
import MobileIntroOverlay from "@/components/MobileIntroOverlay";
import DailyPrompt from "@/components/DailyPrompt";
import StreakReminder from "@/components/StreakReminder";
import StreakTracker from "@/components/StreakTracker";
import XPBar from "@/components/XPBar";
import AchievementBadges from "@/components/AchievementBadges";
import DailyChallenges from "@/components/DailyChallenge";
import { useState } from "react";
import { useGameStore } from "@/store/useGameStore";

export default function Home() {
  const [introSignal, setIntroSignal] = useState<number | undefined>(undefined);
  const { totalEntries, totalWords } = useGameStore();

  return (
    <>
      <MobileIntroOverlay openSignal={introSignal} />
      <div
        className="min-h-[100svh] bg-background px-4 md:px-6 pt-14 pb-24"
        style={{
          paddingTop: 'max(3.5rem, calc(env(safe-area-inset-top, 20px) + 1rem))',
          paddingBottom: 'max(6rem, calc(env(safe-area-inset-bottom, 0px) + 6rem))'
        }}
      >
        <div className="max-w-lg mx-auto space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">Journal Inc</h1>
              <p className="text-xs text-muted-foreground">Your mental fitness dashboard</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIntroSignal((s) => (s ?? 0) + 1)}
              >
                <HelpCircle className="w-4 h-4" />
              </Button>
              <Link to="/settings">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Settings className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* XP / Level Bar */}
          <XPBar />

          {/* Stats row */}
          <StreakTracker />

          {/* Streak warning */}
          <StreakReminder />

          {/* CTA */}
          <Link to="/unified" className="block">
            <Button className="w-full gap-2 h-12 text-base font-semibold shadow-medium rounded-xl">
              <Type className="w-5 h-5" />
              Start Today's Entry
              <ChevronRight className="w-4 h-4 ml-auto" />
            </Button>
          </Link>

          {/* Daily Challenges */}
          <DailyChallenges />

          {/* Daily Prompt */}
          <DailyPrompt />

          {/* Achievements */}
          <AchievementBadges />

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border bg-card p-4 shadow-soft">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Total Entries</p>
              <p className="stat-number text-2xl text-card-foreground mt-1">{totalEntries}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 shadow-soft">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Words Written</p>
              <p className="stat-number text-2xl text-card-foreground mt-1">{totalWords.toLocaleString()}</p>
            </div>
          </div>

          {/* Navigation */}
          <div className="space-y-2">
            {[
              { title: "Past Entries", desc: "Review your journal", icon: BookOpen, href: "/journal" },
              { title: "CBT Quiz", desc: "Test your knowledge", icon: HelpCircle, href: "/quiz" },
              { title: "Why CBT?", desc: "Learn the science", icon: Lightbulb, href: "/why-cbt" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} to={item.href}>
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card shadow-soft hover:shadow-medium hover:border-primary/20 transition-all duration-200">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-card-foreground">{item.title}</p>
                      <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Footer */}
          <footer className="text-center text-xs text-muted-foreground pb-4 space-y-1.5 pt-2">
            <p>🔒 Private & secure · 🤖 AI-powered insights</p>
            <div className="flex items-center justify-center gap-3">
              <a href="/privacy" className="hover:text-foreground transition-colors underline">Privacy</a>
              <span>·</span>
              <a href="/terms" className="hover:text-foreground transition-colors underline">Terms</a>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
}

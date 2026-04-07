import { Link } from "react-router-dom";
import { Settings, Pen, Info, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import MobileIntroOverlay from "@/components/MobileIntroOverlay";
import StreakReminder from "@/components/StreakReminder";
import DailyPrompt from "@/components/DailyPrompt";
import HeroStats from "@/components/HeroStats";
import DailyChallenges from "@/components/DailyChallenge";
import NotificationBanner from "@/components/NotificationBanner";
import { useState } from "react";

export default function Home() {
  const [introSignal, setIntroSignal] = useState<number | undefined>(undefined);

  return (
    <>
      <MobileIntroOverlay openSignal={introSignal} />
      <div
        className="min-h-[100svh] bg-white dark:bg-background px-5 pb-24"
        style={{
          paddingTop: 'max(3.5rem, calc(env(safe-area-inset-top, 20px) + 1.5rem))',
          paddingBottom: 'max(6rem, calc(env(safe-area-inset-bottom, 0px) + 6rem))',
        }}
      >
        <div className="max-w-lg mx-auto space-y-6">
          {/* Header */}
          <header className="flex items-center justify-between mt-1">
            <div>
              <h1 className="text-lg font-semibold text-foreground">Journal Inc</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Your daily companion</p>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => setIntroSignal((s) => (s ?? 0) + 1)}>
                <Info className="w-4 h-4" />
              </Button>
              <Link to="/settings">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                  <Settings className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Prompt */}
          <DailyPrompt />

          {/* Single hero card: level + streak + goal */}
          <HeroStats />

          {/* Notification opt-in */}
          <NotificationBanner />

          {/* Streak warning (conditional) */}
          <StreakReminder />

          {/* CTA */}
          <Link to="/unified" className="block">
            <button className="w-full flex items-center justify-center gap-2 h-[50px] rounded-2xl bg-primary text-primary-foreground text-[15px] font-semibold shadow-medium hover:opacity-90 transition-opacity">
              <Pen className="w-4 h-4" />
              <span>Write or record</span>
              <Mic className="w-4 h-4 opacity-70" />
            </button>
          </Link>

          {/* Challenges — compact */}
          <DailyChallenges />
        </div>
      </div>
    </>
  );
}

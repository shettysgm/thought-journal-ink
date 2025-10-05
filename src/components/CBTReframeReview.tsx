import * as React from "react";
import { Check, Pencil, X, Brain, Sprout, Wand2, Info, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

/**
 * CBT Reframe Review
 * - Shows a modal (desktop) or drawer (mobile) with detected thought patterns.
 * - Each item displays {type, reframe} and allows ✅ Accept or ✏️ Edit.
 * - Provides callbacks so your app can persist choices.
 *
 * Usage:
 * <CBTReframeReview
 *   open={open}
 *   onOpenChange={setOpen}
 *   detections={detections}
 *   onAccept={(idx, text) => saveOne(idx, text)}
 *   onAcceptAll={(items) => saveMany(items)}
 * />
 */

export type DistortionType =
  | "All-or-Nothing"
  | "Catastrophizing"
  | "Mind Reading"
  | "Fortune Telling"
  | "Should Statements"
  | "Labeling"
  | "Emotional Reasoning"
  | "Overgeneralization"
  | "Personalization"
  | "Mental Filter";

export type Detection = {
  span: string; // short excerpt (≤ 12 words)
  type: DistortionType;
  reframe: string; // model suggestion (≤ 15 words)
};

export type CBTReframeReviewProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  detections: Detection[];
  onAccept?: (index: number, acceptedText: string) => Promise<void> | void;
  onAcceptAll?: (acceptedItems: { index: number; text: string }[]) => Promise<void> | void;
  busy?: boolean; // show spinner while persisting
};

const TypeIcon: Record<DistortionType, React.ReactNode> = {
  "All-or-Nothing": <Wand2 className="h-4 w-4" aria-hidden />,
  Catastrophizing: <Info className="h-4 w-4" aria-hidden />,
  "Mind Reading": <Brain className="h-4 w-4" aria-hidden />,
  "Fortune Telling": <Wand2 className="h-4 w-4" aria-hidden />,
  "Should Statements": <Info className="h-4 w-4" aria-hidden />,
  Labeling: <Info className="h-4 w-4" aria-hidden />,
  "Emotional Reasoning": <Info className="h-4 w-4" aria-hidden />,
  Overgeneralization: <Sprout className="h-4 w-4" aria-hidden />,
  Personalization: <Info className="h-4 w-4" aria-hidden />,
  "Mental Filter": <Info className="h-4 w-4" aria-hidden />,
};

function wordCount(s: string) {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

function clampReframe(text: string): string {
  // Enforce ≤ 15 words without being harsh; trims extra words softly.
  const words = text.trim().split(/\s+/);
  return words.slice(0, 15).join(" ");
}

export default function CBTReframeReview(props: CBTReframeReviewProps) {
  const { open, onOpenChange, detections, onAccept, onAcceptAll, busy } = props;
  const isMobile = useIsMobile();
  const [items, setItems] = React.useState(
    detections.map((d) => ({ reframe: d.reframe, editing: false, accepted: false }))
  );

  React.useEffect(() => {
    // Reset local state whenever detections change
    setItems(detections.map((d) => ({ reframe: d.reframe, editing: false, accepted: false })));
  }, [detections]);

  const allAccepted = items.every((i) => i.accepted);

  const handleAccept = async (i: number) => {
    const text = clampReframe(items[i].reframe);
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, accepted: true, editing: false, reframe: text } : it)));
    await onAccept?.(i, text);
  };

  const handleAcceptAll = async () => {
    const payload = items.map((it, idx) => ({ index: idx, text: clampReframe(it.reframe) }));
    setItems((prev) => prev.map((it) => ({ ...it, accepted: true, editing: false, reframe: clampReframe(it.reframe) })));
    await onAcceptAll?.(payload);
  };

  const Body = (
    <div className="flex flex-col gap-4">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">Here are some thought patterns I noticed today:</h3>
        <p className="text-sm text-muted-foreground">Tap to accept or edit a balanced reframe. You're in control.</p>
      </div>

      <ul className="flex flex-col gap-3">
        {detections.map((d, i) => {
          const state = items[i] || { reframe: d.reframe, editing: false, accepted: false };
          const icon = TypeIcon[d.type];
          const wc = wordCount(state.reframe);
          const overLimit = wc > 15;

          return (
            <li key={i} className={cn(
              "rounded-2xl border p-4 shadow-sm",
              state.accepted ? "border-green-400" : "border-border"
            )}>
              <div className="flex items-start gap-3">
                <div className="mt-1">{icon}</div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm rounded-full bg-muted px-2 py-0.5">{d.type}</span>
                    <span className="text-xs text-muted-foreground">From: "{d.span}"</span>
                  </div>

                  {!state.editing ? (
                    <p className="mt-2 text-base">{state.reframe}</p>
                  ) : (
                    <div className="mt-2 flex items-center gap-2">
                      <Input
                        value={state.reframe}
                        onChange={(e) =>
                          setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, reframe: e.target.value } : it)))
                        }
                        aria-label="Edit reframe"
                      />
                      <Button
                        variant="secondary"
                        onClick={() =>
                          setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, editing: false } : it)))
                        }
                        className="shrink-0"
                      >
                        Done
                      </Button>
                    </div>
                  )}

                  <div className="mt-3 flex items-center gap-2">
                    <Button size="sm" onClick={() => handleAccept(i)} disabled={busy || state.accepted}>
                      {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />} Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, editing: !it.editing } : it)))
                      }
                      disabled={busy}
                    >
                      <Pencil className="mr-2 h-4 w-4" /> {items[i].editing ? "Cancel" : "Edit"}
                    </Button>
                    {state.accepted && (
                      <span className="text-xs text-green-700">Saved</span>
                    )}
                  </div>

                  {overLimit && (
                    <p className="mt-2 text-xs text-amber-700">
                      Tip: Keep reframes short (≤ 15 words). Currently {wc} words.
                    </p>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="-mr-2"
                  onClick={() => setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, accepted: false } : it)))}
                  aria-label="Clear acceptance"
                  disabled={busy}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm text-muted-foreground">
          {allAccepted ? "All reframes accepted." : "Review and accept the reframes you want to keep."}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Close
          </Button>
          <Button onClick={handleAcceptAll} disabled={busy || allAccepted}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />} Accept All
          </Button>
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Thought Coach</SheetTitle>
            <SheetDescription>🌱 Overgeneralization • 🧠 Mind Reading • and more</SheetDescription>
          </SheetHeader>
          <div className="mt-4">{Body}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Thought Coach</DialogTitle>
          <DialogDescription>
            Here are some thought patterns I noticed today. Accept or edit the reframes.
          </DialogDescription>
        </DialogHeader>
        {Body}
      </DialogContent>
    </Dialog>
  );
}

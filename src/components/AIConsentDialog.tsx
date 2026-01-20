import { useState, useEffect } from 'react';
import { Brain, Shield, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const AI_CONSENT_KEY = 'ai-analysis-consent';

interface AIConsentDialogProps {
  onConsentGiven: () => void;
  onConsentDeclined: () => void;
}

export default function AIConsentDialog({ onConsentGiven, onConsentDeclined }: AIConsentDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [understood, setUnderstood] = useState(false);

  useEffect(() => {
    const hasConsented = localStorage.getItem(AI_CONSENT_KEY);
    if (!hasConsented) {
      // Small delay to avoid immediate popup on first load
      const timer = setTimeout(() => setIsOpen(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(AI_CONSENT_KEY, 'accepted');
    setIsOpen(false);
    onConsentGiven();
  };

  const handleDecline = () => {
    localStorage.setItem(AI_CONSENT_KEY, 'declined');
    setIsOpen(false);
    onConsentDeclined();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <DialogTitle className="text-xl">AI Analysis</DialogTitle>
          </div>
          <DialogDescription className="text-left space-y-3 pt-2">
            <p>
              Journal Ink uses AI to help identify cognitive distortions in your writing 
              and suggest healthier thinking patterns.
            </p>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              How your data is handled:
            </h4>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                Your text is sent to <strong>Google Gemini AI</strong> for analysis
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                Personal info (emails, phones, etc.) is redacted before sending
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                Google does not store your data after processing
              </li>
              <li className="flex gap-2">
                <span className="text-primary">•</span>
                You can disable AI analysis anytime in Settings
              </li>
            </ul>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox 
              id="understood" 
              checked={understood} 
              onCheckedChange={(checked) => setUnderstood(checked === true)} 
            />
            <Label htmlFor="understood" className="text-sm leading-relaxed cursor-pointer">
              I understand that my journal entries will be processed by AI to provide insights, 
              and I can disable this feature at any time.
            </Label>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleDecline} className="w-full sm:w-auto">
            No thanks, disable AI
          </Button>
          <Button onClick={handleAccept} disabled={!understood} className="w-full sm:w-auto">
            Enable AI Analysis
          </Button>
        </DialogFooter>

        <p className="text-xs text-center text-muted-foreground">
          <a href="/privacy" className="underline hover:text-foreground inline-flex items-center gap-1">
            Read our Privacy Policy
            <ExternalLink className="w-3 h-3" />
          </a>
        </p>
      </DialogContent>
    </Dialog>
  );
}

// Helper to check if user has consented
export function hasAIConsent(): boolean {
  return localStorage.getItem(AI_CONSENT_KEY) === 'accepted';
}

// Helper to check if user explicitly declined
export function hasDeclinedAI(): boolean {
  return localStorage.getItem(AI_CONSENT_KEY) === 'declined';
}

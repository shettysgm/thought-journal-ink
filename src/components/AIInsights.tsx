import React, { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, Brain, Target, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useSettings } from '@/store/useSettings';
import { toast } from 'sonner';

interface AIInsightsProps {
  reframes?: Array<{
    span: string;
    suggestion: string;
    socratic: string;
  }>;
  contextInfo?: {
    topics: string[];
    commonTypes: string[];
    matchesGoals?: boolean;
  };
}

const FIRST_N = 5;
const WEEKLY_MS = 7 * 24 * 60 * 60 * 1000;

function shouldShowFeedback(feedbackCount?: number, lastFeedbackAt?: string): boolean {
  const count = feedbackCount || 0;
  // Always show for the first 5 feedback-eligible entries
  if (count < FIRST_N) return true;
  // After that, show once a week
  if (!lastFeedbackAt) return true;
  const elapsed = Date.now() - new Date(lastFeedbackAt).getTime();
  return elapsed >= WEEKLY_MS;
}

export function AIInsights({ reframes = [], contextInfo }: AIInsightsProps) {
  const { feedbackCount, lastFeedbackAt, updateSettings } = useSettings();
  const [feedbackGiven, setFeedbackGiven] = useState<'up' | 'down' | null>(null);

  const showFeedback = useMemo(
    () => reframes.length > 0 && shouldShowFeedback(feedbackCount, lastFeedbackAt),
    [feedbackCount, lastFeedbackAt, reframes.length]
  );

  const handleFeedback = async (type: 'up' | 'down') => {
    setFeedbackGiven(type);
    await updateSettings({
      feedbackCount: (feedbackCount || 0) + 1,
      lastFeedbackAt: new Date().toISOString(),
    });
    toast.success(type === 'up' ? 'Glad it helped!' : 'Thanks, we will improve.');
  };

  if (reframes.length === 0 && !contextInfo) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Context-aware insights */}
      {contextInfo && (
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Brain className="w-4 h-4 text-primary" />
              Personalized Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {contextInfo.commonTypes.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Your common patterns:
                </p>
                <div className="flex flex-wrap gap-1">
                  {contextInfo.commonTypes.map((type) => (
                    <Badge key={type} variant="secondary" className="text-xs">
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {contextInfo.topics.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Recent topics:
                </p>
                <div className="flex flex-wrap gap-1">
                  {contextInfo.topics.map((topic) => (
                    <Badge key={topic} variant="outline" className="text-xs">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {contextInfo.matchesGoals && (
              <div className="flex items-center gap-2 text-xs text-primary">
                <Target className="w-3 h-3" />
                This aligns with your goals
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* AI-powered reframes */}
      {reframes.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Lightbulb className="w-4 h-4 text-primary" />
              CBT Reframes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {reframes.map((reframe, index) => (
              <div key={index} className="space-y-2">
                {reframe.suggestion.split('\n').map((line, lineIndex) => {
                  const trimmedLine = line.trim();
                  if (!trimmedLine) return null;
                  
                  return (
                    <div key={lineIndex} className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm leading-relaxed">
                        {trimmedLine}
                      </p>
                    </div>
                  );
                }).filter(Boolean)}
              </div>
            ))}

            {/* Thumbs up / down feedback */}
            {showFeedback && !feedbackGiven && (
              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <p className="text-xs text-muted-foreground">Was this helpful?</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleFeedback('up')}
                    className="p-2 rounded-full hover:bg-primary/10 transition-colors"
                    aria-label="Helpful"
                  >
                    <ThumbsUp className="w-4 h-4 text-muted-foreground hover:text-primary" />
                  </button>
                  <button
                    onClick={() => handleFeedback('down')}
                    className="p-2 rounded-full hover:bg-destructive/10 transition-colors"
                    aria-label="Not helpful"
                  >
                    <ThumbsDown className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              </div>
            )}

            {feedbackGiven && (
              <p className="text-xs text-muted-foreground text-center pt-2 border-t border-border/50">
                {feedbackGiven === 'up' ? '👍' : '👎'} Thanks for your feedback
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

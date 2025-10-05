import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, Brain, Target } from 'lucide-react';

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

export function AIInsights({ reframes = [], contextInfo }: AIInsightsProps) {
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
              <div key={index} className="p-3 bg-muted/50 rounded-lg space-y-2">
                {reframe.socratic && (
                  <Badge variant="secondary" className="text-xs">
                    {reframe.socratic}
                  </Badge>
                )}
                <p className="text-sm italic text-muted-foreground">
                  "{reframe.span}"
                </p>
                <p className="text-sm font-medium leading-relaxed">
                  {reframe.suggestion}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
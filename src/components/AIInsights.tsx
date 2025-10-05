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
              <div key={index} className="space-y-2">
                {reframe.suggestion.split('\n').map((line, lineIndex) => {
                  const trimmedLine = line.trim();
                  if (!trimmedLine) return null;
                  
                  // Check if line contains a distortion pattern
                  const isDistortionLine = trimmedLine.match(/shows|demonstrates|reflects/i);
                  
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}
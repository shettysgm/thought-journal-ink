import { Link } from 'react-router-dom';
import { ArrowLeft, Brain, Target, TrendingUp, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function WhyCBTPage() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex items-center gap-4">
          <Link to="/">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
        </header>

        {/* Video Section */}
        <div className="w-full max-w-3xl mx-auto pt-8">
          <video 
            controls 
            autoPlay
            muted
            className="w-full rounded-lg shadow-medium"
            poster=""
          >
            <source src="/cbt-explainer.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>

        {/* Hero Section */}
        <div className="text-center space-y-4 pt-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Brain className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-foreground">
            Why CBT Journaling Works
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Transform your thinking patterns and unlock your full potential through proven cognitive behavioral techniques
          </p>
        </div>

        {/* Benefits Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8">
          <Card className="shadow-soft">
            <CardContent className="p-6 space-y-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-card-foreground">
                Identify Distorted Thinking
              </h3>
              <p className="text-muted-foreground">
                Learn to recognize cognitive distortions like catastrophizing, black-and-white thinking, and mind reading that hold you back from achieving your goals.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardContent className="p-6 space-y-3">
              <div className="w-12 h-12 rounded-lg bg-therapeutic-energy flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-card-foreground">
                Rewire Your Brain
              </h3>
              <p className="text-muted-foreground">
                Through consistent practice, you create new neural pathways. Your brain literally changes its structure, making positive thinking more automatic over time.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardContent className="p-6 space-y-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-secondary flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-card-foreground">
                Build Better Habits
              </h3>
              <p className="text-muted-foreground">
                Replace negative thought loops with constructive alternatives. Each reframe strengthens your ability to respond to challenges with clarity and confidence.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardContent className="p-6 space-y-3">
              <div className="w-12 h-12 rounded-lg bg-therapeutic-focus flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-card-foreground">
                Evidence-Based Results
              </h3>
              <p className="text-muted-foreground">
                CBT is one of the most researched therapeutic approaches, proven effective for anxiety, depression, and stress management across thousands of studies.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* How It Works Section */}
        <Card className="shadow-medium bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-8 space-y-6">
            <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground">
              The Science Behind It
            </h2>
            
            <div className="space-y-4 text-muted-foreground">
              <p className="text-base md:text-lg">
                <strong className="text-foreground">1. Awareness:</strong> First, you become conscious of automatic negative thoughts that usually go unnoticed.
              </p>
              
              <p className="text-base md:text-lg">
                <strong className="text-foreground">2. Recognition:</strong> You identify the specific type of cognitive distortion (e.g., "all-or-nothing thinking").
              </p>
              
              <p className="text-base md:text-lg">
                <strong className="text-foreground">3. Reframing:</strong> You challenge and replace the distorted thought with a balanced, realistic alternative.
              </p>
              
              <p className="text-base md:text-lg">
                <strong className="text-foreground">4. Repetition:</strong> Through consistent practice, your brain forms new neural pathways, making positive thinking more natural.
              </p>
            </div>

            <div className="bg-card/50 rounded-lg p-6 border border-border">
              <p className="text-sm md:text-base text-muted-foreground italic">
                "The greatest discovery of my generation is that human beings can alter their lives by altering their attitudes." 
                <span className="block mt-2 not-italic font-semibold text-foreground">— William James</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <div className="text-center space-y-4 pb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Ready to Start Your Journey?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Begin transforming your thought patterns today with Journal IQ's AI-powered insights and real-time cognitive distortion detection.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Link to="/unified">
              <Button size="lg" className="gap-2">
                Start Journaling
              </Button>
            </Link>
            <Link to="/quiz">
              <Button size="lg" variant="outline" className="gap-2">
                Take the Quiz
              </Button>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
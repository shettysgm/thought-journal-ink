import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PenTool, Mic, BarChart3, Brain, Settings, Heart, BookOpen, Type } from "lucide-react";

const navigationCards = [
  {
    title: "Text Journal",
    description: "Type your thoughts and feelings",
    icon: Type,
    href: "/text",
    gradient: "bg-gradient-primary",
    color: "primary"
  },
  {
    title: "Handwriting Journal",
    description: "Write with your finger or Apple Pencil",
    icon: PenTool,
    href: "/handwriting",
    gradient: "bg-gradient-therapeutic",
    color: "therapeutic-warmth"
  },
  {
    title: "Voice Journal", 
    description: "Speak your thoughts aloud",
    icon: Mic,
    href: "/voice",
    gradient: "bg-gradient-secondary",
    color: "therapeutic-growth"
  },
  {
    title: "My Journal",
    description: "View all your saved entries",
    icon: BookOpen,
    href: "/journal",
    gradient: "bg-gradient-secondary",
    color: "secondary"
  },
  {
    title: "Insights",
    description: "Track your thought patterns",
    icon: BarChart3,
    href: "/insights", 
    gradient: "bg-therapeutic-focus",
    color: "therapeutic-focus"
  },
  {
    title: "CBT Quiz",
    description: "Practice identifying distortions",
    icon: Brain,
    href: "/quiz",
    gradient: "bg-therapeutic-energy", 
    color: "therapeutic-energy"
  }
];

export default function Home() {
  console.log('Home component rendering');
  
  return (
    <div className="min-h-screen bg-gradient-therapeutic p-4 md:p-6" style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div className="max-w-4xl mx-auto space-y-8" style={{ backgroundColor: 'transparent', padding: '20px', borderRadius: '8px' }}>
        
        {/* Header */}
        <header className="text-center space-y-4 pt-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Heart className="w-6 h-6 md:w-8 md:h-8 text-primary" />
            <h1 className="text-2xl md:text-4xl font-bold text-foreground">CBT Journal</h1>
          </div>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            A private, secure space to explore your thoughts, identify patterns, and practice healthier thinking habits.
          </p>
        </header>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {navigationCards.map((card) => {
            const IconComponent = card.icon;
            return (
              <Link key={card.href} to={card.href} className="group">
                <Card className="h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border border-border bg-card shadow-md">
                  <CardContent className="p-4 md:p-8 text-center space-y-3 md:space-y-4">
                    <div className={`w-12 h-12 md:w-16 md:h-16 rounded-xl ${card.gradient} flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                      <IconComponent className="w-6 h-6 md:w-8 md:h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg md:text-xl font-semibold text-card-foreground mb-2">
                        {card.title}
                      </h3>
                      <p className="text-sm md:text-base text-muted-foreground">
                        {card.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="flex justify-center gap-4 pt-4">
          <Link to="/settings">
            <Button variant="outline" size="sm" className="gap-2 md:text-base">
              <Settings className="w-4 h-4" />
              Settings
            </Button>
          </Link>
        </div>

        {/* Privacy Notice */}
        <div className="text-center text-sm text-muted-foreground bg-card/50 rounded-lg p-4 backdrop-blur-sm">
          <p>
            🔒 Your journal entries stay private and secure on this device. 
            Only anonymous usage patterns are analyzed to help you grow.
          </p>
        </div>

      </div>
    </div>
  );
}
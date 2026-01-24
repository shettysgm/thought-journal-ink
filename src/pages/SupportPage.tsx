import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, MessageCircle, Shield, BookOpen, HelpCircle } from "lucide-react";

const SupportPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link to="/">
          <Button variant="ghost" size="sm" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Support</h1>
            <p className="text-muted-foreground">
              Get help with Journal Ink — your private CBT journaling companion.
            </p>
          </div>

          {/* Contact Section */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Mail className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Contact Us</h2>
            </div>
            <p className="text-muted-foreground mb-4">
              Have a question or need assistance? We're here to help.
            </p>
            <a 
              href="mailto:support@journalink.app"
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              support@journalink.app
            </a>
          </div>

          {/* FAQ Section */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <HelpCircle className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Frequently Asked Questions</h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-foreground mb-2">Is my data private?</h3>
                <p className="text-muted-foreground text-sm">
                  Yes, 100%. All your journal entries are stored locally on your device. We don't have access to your data, and nothing is uploaded to any cloud server.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-foreground mb-2">How does the AI analysis work?</h3>
                <p className="text-muted-foreground text-sm">
                  When you choose to analyze your entry, your text is sent to Google's Gemini AI for cognitive distortion detection. Google does not retain this data after processing. You can disable AI features in Settings.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-foreground mb-2">Can I export my journal entries?</h3>
                <p className="text-muted-foreground text-sm">
                  Currently, entries are stored locally in your browser or app. We're working on export functionality for a future update.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-foreground mb-2">What are cognitive distortions?</h3>
                <p className="text-muted-foreground text-sm">
                  Cognitive distortions are patterns of negative thinking that can affect your mood and behavior. Common examples include catastrophizing, black-and-white thinking, and mind reading. CBT helps you identify and reframe these patterns.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-foreground mb-2">Is Journal Ink a replacement for therapy?</h3>
                <p className="text-muted-foreground text-sm">
                  No. Journal Ink is a self-help tool based on CBT principles. It's not a substitute for professional mental health care. If you're experiencing a mental health crisis, please contact a healthcare provider or crisis line.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-foreground mb-2">How do I delete my data?</h3>
                <p className="text-muted-foreground text-sm">
                  Since all data is stored locally, you can clear your data by going to Settings and selecting "Clear All Data," or by uninstalling the app.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Link to="/privacy" className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="w-5 h-5 text-primary" />
                <h3 className="font-medium">Privacy Policy</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Learn how we protect your data.
              </p>
            </Link>

            <Link to="/why-cbt" className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <h3 className="font-medium">Why CBT?</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Understand the science behind CBT journaling.
              </p>
            </Link>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground pt-4 border-t border-border">
            <p>© {new Date().getFullYear()} Journal Ink. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportPage;

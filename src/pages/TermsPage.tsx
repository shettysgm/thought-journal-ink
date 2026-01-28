import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <div 
      className="min-h-screen bg-gradient-therapeutic px-4 md:px-8 pt-14 pb-6"
      style={{ 
        paddingTop: 'max(3.5rem, calc(env(safe-area-inset-top, 20px) + 1rem))',
        paddingBottom: 'max(1.5rem, calc(env(safe-area-inset-bottom, 0px) + 1rem))'
      }}
    >
      <div className="max-w-4xl mx-auto">
        <Link to="/">
          <Button variant="ghost" size="sm" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        <div className="bg-card rounded-lg shadow-lg p-6 md:p-8 space-y-6">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">Terms of Service</h1>
          
          <div className="space-y-6 text-muted-foreground">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">1. Acceptance of Terms</h2>
              <p>
                By accessing and using Journal Inc, you accept and agree to be bound by the terms and provisions of this agreement.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">2. Use of Service</h2>
              <p>
                Journal Inc is a personal journaling application designed to help you track thoughts and identify cognitive distortions. 
                The app uses AI technology to analyze your journal entries and provide insights.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">3. AI Usage</h2>
              <p>
                This application uses <strong>Google Gemini AI</strong> to:
              </p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>Analyze your journal entries for cognitive distortions</li>
                <li>Provide reframing suggestions based on CBT principles</li>
                <li>Generate insights about your thinking patterns</li>
              </ul>
              <p className="mt-3 font-medium">AI Limitations:</p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>AI analysis may be inaccurate or miss context</li>
                <li>Suggestions are general guidance, not personalized therapy</li>
                <li>The AI cannot understand your full situation or history</li>
                <li>You should use your own judgment when considering suggestions</li>
              </ul>
              <p className="mt-2">
                You can disable AI analysis at any time in Settings.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">4. Privacy and Data Storage</h2>
              <p>
                Your journal entries are stored locally on your device. We do not have access to your personal journal content. 
                Please refer to our Privacy Policy for more detailed information.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">5. Mental Health Disclaimer</h2>
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-4">
                <p className="font-medium text-amber-800 mb-2">⚠️ Important Notice</p>
                <p className="text-amber-700 text-sm">
                  Journal Inc is a self-help tool and is <strong>not a substitute for professional mental health care</strong>. 
                  If you are experiencing a mental health crisis, please contact a qualified healthcare provider or crisis service immediately.
                </p>
              </div>
              <p>
                The cognitive distortion detection and reframing suggestions provided by this app are educational tools based on 
                Cognitive Behavioral Therapy (CBT) principles. They are not:
              </p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>A diagnosis of any mental health condition</li>
                <li>A replacement for therapy or counseling</li>
                <li>Medical advice or treatment</li>
                <li>Appropriate for crisis intervention</li>
              </ul>
              <p className="mt-3">
                <strong>If you need immediate help:</strong>
              </p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>🇺🇸 USA: Call or text <strong>988</strong> (Suicide & Crisis Lifeline)</li>
                <li>🇬🇧 UK: Call <strong>116 123</strong> (Samaritans)</li>
                <li>🌍 International: Visit <a href="https://findahelpline.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">findahelpline.com</a></li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">6. Limitation of Liability</h2>
              <p>
                Journal Inc is provided "as is" without any warranties. We are not liable for any damages arising from your use of the application.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">7. Changes to Terms</h2>
              <p>
                We reserve the right to modify these terms at any time. Continued use of the application constitutes acceptance of any changes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">8. Contact</h2>
              <p>
                If you have any questions about these Terms of Service, please contact us through the app settings.
              </p>
            </section>
          </div>

          <div className="pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

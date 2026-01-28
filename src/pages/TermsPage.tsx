import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-therapeutic p-4 md:p-8">
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
                By accessing and using Journal IQ, you accept and agree to be bound by the terms and provisions of this agreement.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">2. Use of Service</h2>
              <p>
                Journal IQ is a personal journaling application designed to help you track thoughts and identify cognitive distortions. 
                The app uses AI technology to analyze your journal entries and provide insights.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">3. AI Usage</h2>
              <p>
                This application uses artificial intelligence to:
              </p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>Analyze your journal entries for cognitive distortions</li>
                <li>Provide reframing suggestions</li>
                <li>Generate insights about your thinking patterns</li>
              </ul>
              <p className="mt-2">
                All AI analysis is performed to help you develop healthier thinking patterns and is not shared with third parties.
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
              <h2 className="text-xl font-semibold text-foreground mb-3">5. Medical Disclaimer</h2>
              <p>
                Journal IQ is not a substitute for professional medical advice, diagnosis, or treatment. 
                Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">6. Limitation of Liability</h2>
              <p>
                Journal IQ is provided "as is" without any warranties. We are not liable for any damages arising from your use of the application.
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

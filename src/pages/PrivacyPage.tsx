import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
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
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">Privacy Policy</h1>
          
          <div className="space-y-6 text-muted-foreground">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">1. Information We Collect</h2>
              <p>
                Journal IQ is designed with privacy as a core principle. Your journal entries, voice recordings, and personal notes 
                are stored locally on your device using your browser's secure storage.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">2. How We Use Your Information</h2>
              <p>
                Your journal entries are processed using AI technology to:
              </p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>Identify cognitive distortions in your thinking patterns</li>
                <li>Provide personalized reframing suggestions</li>
                <li>Generate insights about your mental health journey</li>
              </ul>
              <p className="mt-2">
                All AI processing happens with privacy safeguards in place. Your raw journal content is not stored on external servers.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">3. Data Storage</h2>
              <p>
                All your personal data including:
              </p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>Journal entries (text and voice)</li>
                <li>Mood tracking data</li>
                <li>Analysis results</li>
                <li>App settings and preferences</li>
              </ul>
              <p className="mt-2">
                is stored locally on your device using IndexedDB. This means your data never leaves your device unless you explicitly choose to export it.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">4. AI Processing</h2>
              <p>
                When analyzing your entries, we use AI services that may process your content. However:
              </p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>Text is redacted to remove personally identifiable information before AI analysis</li>
                <li>AI providers do not retain your data after processing</li>
                <li>No identifiable personal information is shared with AI services</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">5. Third-Party Services</h2>
              <p>
                We may use third-party AI services for cognitive distortion detection. These services are bound by strict privacy agreements 
                and do not have access to your personal information or identity.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">6. Data Security</h2>
              <p>
                We implement industry-standard security measures to protect your data. However, no method of electronic storage is 100% secure, 
                and we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">7. Your Rights</h2>
              <p>
                You have the right to:
              </p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>Access all your stored data</li>
                <li>Delete your data at any time through the app settings</li>
                <li>Export your data for personal use</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">8. Children's Privacy</h2>
              <p>
                Journal IQ is not intended for children under 13 years of age. We do not knowingly collect personal information from children.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">9. Changes to Privacy Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">10. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us through the app settings.
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

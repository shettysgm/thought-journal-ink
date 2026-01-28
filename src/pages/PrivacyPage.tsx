import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
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
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">Privacy Policy</h1>
          
          <div className="space-y-6 text-muted-foreground">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">1. Information We Collect</h2>
              <p>
                Journal Inc is designed with privacy as a core principle. Your journal entries, voice recordings, and personal notes 
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
                When analyzing your entries, we use <strong>Google Gemini AI</strong> to detect cognitive distortions. Here's how it works:
              </p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>Your text is processed by Google's Gemini 2.0 Flash model</li>
                <li>Personal information (names, emails, phones, addresses, medical terms) is automatically redacted before sending</li>
                <li>Google processes your text in real-time and does not retain it after analysis</li>
                <li>You can disable AI analysis completely in Settings</li>
              </ul>
              <p className="mt-2 text-sm">
                For more information about Google's data practices, see{' '}
                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                  Google's Privacy Policy
                </a>.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">5. Third-Party Services</h2>
              <p>
                We use Google Cloud's Gemini AI service for cognitive distortion analysis. This service:
              </p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>Processes data in Google's secure cloud infrastructure</li>
                <li>Does not use your data to train AI models</li>
                <li>Is bound by Google's enterprise privacy agreements</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">6. Your Rights (GDPR/CCPA)</h2>
              <p>
                Depending on your location, you may have the following rights:
              </p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li><strong>Access:</strong> Request a copy of your data (available via export in Settings)</li>
                <li><strong>Deletion:</strong> Delete all your data at any time (stored locally on your device)</li>
                <li><strong>Opt-out:</strong> Disable AI processing entirely in Settings</li>
                <li><strong>Portability:</strong> Export your data in JSON format</li>
                <li><strong>Correction:</strong> Edit your entries at any time</li>
              </ul>
              <p className="mt-2">
                Since your data is stored locally on your device, you have full control over it at all times.
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
                Journal Inc is not intended for children under 13 years of age. We do not knowingly collect personal information from children.
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

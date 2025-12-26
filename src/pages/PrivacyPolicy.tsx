import { ArrowLeft, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b">
        <button onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold">Privacy Policy</h1>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        <Card className="p-5 space-y-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-foreground">
              Your Privacy Matters
            </h2>
          </div>

          <p>
            This app respects your privacy and is committed to protecting your
            personal data.
          </p>

          <p>
            <strong>Information We Collect</strong><br />
            We collect basic account information and food-related data you
            voluntarily provide.
          </p>

          <p>
            <strong>How We Use Data</strong><br />
            Data is used to improve calorie tracking, personalize insights, and
            enhance user experience.
          </p>

          <p>
            <strong>Data Sharing</strong><br />
            We do not sell or share your data with third parties.
          </p>

          <p>
            <strong>Security</strong><br />
            Industry-standard security measures are used to protect your data.
          </p>

          <p>
            <strong>Your Rights</strong><br />
            You can request data deletion or account removal at any time.
          </p>

          <p className="text-xs text-center pt-2">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </Card>
      </div>
    </div>
  );
}

import { ArrowLeft, Mail, MessageCircle, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function Help() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b">
        <button onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold">Help & Support</h1>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-4">
        {/* FAQ */}
        <Card className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Frequently Asked Questions</h2>
          </div>

          <Separator />

          <div className="space-y-3 text-sm text-muted-foreground">
            <p><strong>How does food scanning work?</strong><br />
              We use AI to analyze food images and estimate calories and macros.
            </p>

            <p><strong>Is my data secure?</strong><br />
              Yes. Your data is encrypted and never shared without consent.
            </p>

            <p><strong>Why are results sometimes inaccurate?</strong><br />
              AI estimates may vary based on image quality and portion size.
            </p>
          </div>
        </Card>

        {/* Contact */}
        <Card className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Contact Us</h2>
          </div>

          <Separator />

          <div className="flex items-center gap-3 text-sm">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <span>support@yourapp.com</span>
          </div>
        </Card>

        <p className="text-xs text-center text-muted-foreground">
          We usually respond within 24–48 hours.
        </p>
      </div>
    </div>
  );
}

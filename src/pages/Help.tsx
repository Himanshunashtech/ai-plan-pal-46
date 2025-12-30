import { ArrowLeft, Mail, MessageCircle, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import { Separator } from '@/components/ui/separator';

export default function Help() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b">
        <button onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold">{t('help_support')}</h1>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-4">
        {/* FAQ */}
        <Card className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">{t('faq')}</h2>
          </div>

          <Separator />

          <div className="space-y-3 text-sm text-muted-foreground">
            <p><strong>{t('faq_scanning_q')}</strong><br />
              {t('faq_scanning_a')}
            </p>

            <p><strong>{t('faq_secure_q')}</strong><br />
              {t('faq_secure_a')}
            </p>

            <p><strong>{t('faq_accuracy_q')}</strong><br />
              {t('faq_accuracy_a')}
            </p>
          </div>
        </Card>

        {/* Contact */}
        <Card className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">{t('contact_us')}</h2>
          </div>

          <Separator />

          <div className="flex items-center gap-3 text-sm">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <span>support@yourapp.com</span>
          </div>
        </Card>

        <p className="text-xs text-center text-muted-foreground">
          {t('respond_time')}
        </p>
      </div>
    </div>
  );
}

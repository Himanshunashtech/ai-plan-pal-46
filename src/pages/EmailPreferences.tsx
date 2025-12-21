import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmailPreferences as EmailPreferencesComponent } from '@/components/settings/EmailPreferences';

const EmailPreferences = () => {
  return (
    <div className="min-h-screen bg-background safe-area-top safe-area-bottom">
      <div className="px-6 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Link 
            to="/profile" 
            className="p-2 rounded-full hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold">Email Preferences</h1>
        </div>

        <EmailPreferencesComponent />
      </div>
    </div>
  );
};

export default EmailPreferences;

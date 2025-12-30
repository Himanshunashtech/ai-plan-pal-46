import {
  User,
  ChevronRight,
  LogOut,
  Target,
  Mail,
  HelpCircle,
  ShieldCheck,
  Moon,
  Globe,
  Wallet,
  Scale,
  History,
  Info,
  Smartphone,
  Plus
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProfileSkeleton } from "@/components/skeletons";
import { Switch } from "@/components/ui/switch";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import { setTheme } from "@/store/slices/uiSlice";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import clsx from "clsx";
import { useTranslation } from "react-i18next";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

interface ProfileInfo {
  full_name: string | null;
  avatar_url: string | null;
  age: number | null;
  burned_calories_enabled: boolean;
  rollover_calories_enabled: boolean;
}

// import i18nInstance from "@/i18n"; // Removed direct import

// Helper Components

const Profile = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const dispatch = useDispatch();
  const theme = useSelector((state: RootState) => state.ui.theme);
  const { t, i18n } = useTranslation();

  const [profileInfo, setProfileInfo] = useState<ProfileInfo>({
    full_name: null,
    avatar_url: null,
    age: null,
    burned_calories_enabled: true,
    rollover_calories_enabled: true,
  });
  const [loading, setLoading] = useState(() => {
    // Initialize from cache if available
    const cached = localStorage.getItem(`profile_cache_${user?.id}`);
    if (cached) {
      return false;
    }
    return true;
  });

  const [logoutOpen, setLogoutOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);

  const languages = [
    { code: 'en', name: 'USA', flag: '🇺🇸', label: 'English (US)' },
    { code: 'en-GB', name: 'UK', flag: '🇬🇧', label: 'English (UK)' },
    { code: 'hi', name: 'India', flag: '🇮🇳', label: 'Hindi' },
    { code: 'de', name: 'Germany', flag: '🇩🇪', label: 'German' },
    { code: 'fr', name: 'France', flag: '🇫🇷', label: 'French' },
  ];

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code === 'en-GB' ? 'en' : code);
    setLanguageOpen(false);
  };



  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;

      // Load from cache first to ensure state is populated even if we init with false
      const cached = localStorage.getItem(`profile_cache_${user.id}`);
      if (cached) {
        setProfileInfo(JSON.parse(cached));
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("full_name, avatar_url, age, burned_calories_enabled, rollover_calories_enabled")
          .eq("user_id", user.id)
          .maybeSingle();

        if (data) {
          const profileData = {
            ...data,
            burned_calories_enabled: data.burned_calories_enabled ?? true,
            rollover_calories_enabled: data.rollover_calories_enabled ?? true,
          };
          setProfileInfo(profileData);
          localStorage.setItem(`profile_cache_${user.id}`, JSON.stringify(profileData));
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user?.id]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  const handleToggleChange = async (field: 'burned_calories_enabled' | 'rollover_calories_enabled', value: boolean) => {
    if (!user) return;
    
    // Optimistically update UI
    setProfileInfo(prev => ({ ...prev, [field]: value }));
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      // Update cache
      const updated = { ...profileInfo, [field]: value };
      localStorage.setItem(`profile_cache_${user.id}`, JSON.stringify(updated));
    } catch (error) {
      console.error('Error updating toggle:', error);
      // Rollback on error
      setProfileInfo(prev => ({ ...prev, [field]: !value }));
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      // Mark as deleted by setting scheduled_deletion_at to now
      const { error } = await supabase
        .from('profiles')
        .update({ scheduled_deletion_at: new Date().toISOString() })
        .eq('user_id', user.id);

      if (error) throw error;

      await signOut();
      navigate('/auth', { replace: true });
    } catch (error) {
      console.error('Error deleting account:', error);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <ProfileSkeleton />;

  return (
    <div className="min-h-screen bg-background flex flex-col safe-area-top safe-area-bottom">
      <div className="flex-1 px-5 py-6 pb-24 overflow-auto">
        <h1 className="text-2xl font-bold mb-6 px-1">{t('settings')}</h1>

        {/* User Card */}
        <div className="bg-card rounded-[20px] p-4 shadow-sm mb-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center overflow-hidden shrink-0">
            {profileInfo.avatar_url ? (
              <img src={profileInfo.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="w-7 h-7 text-muted-foreground" />
            )}
          </div>
          <div>
            <p className="font-semibold text-lg leading-tight">
              {profileInfo.full_name || "User"}
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {profileInfo.age ? `${profileInfo.age} ${t('years_old')}` : t('no_age_set')}
            </p>
          </div>
        </div>

        {/* Invite Friends Banner */}

        {/* Menu List Groups */}
        <div className="space-y-8">

          {/* General Settings */}
          <div className="bg-card rounded-[24px] overflow-hidden shadow-sm">
            <MenuItem icon={Wallet} label={t('personal_details')} onClick={() => navigate('/edit-profile')} />
            <MenuItem icon={Target} label={t('adjust_macros')} onClick={() => navigate('/nutrition-goals')} />
            <MenuItem icon={Target} label={t('milestones')} onClick={() => navigate('/milestones')} />
            <MenuItem icon={Wallet} label={t('subscription')} onClick={() => navigate('/subscription')} />
            <MenuItem icon={Scale} label={t('goal_weight')} onClick={() => navigate('/edit-profile')} />
            <MenuItem icon={History} label={t('weight_history')} border={false} onClick={() => navigate('/progress')} />
          </div>

          <div className="bg-card rounded-[24px] overflow-hidden shadow-sm">
            <MenuItem
              icon={Globe}
              label={t('language')}
              border={false}
              onClick={() => {
                console.log("Opening language dialog");
                setLanguageOpen(true);
              }}
              rightElement={<span className="text-xl">{languages.find(l => l.code === i18n.language || (i18n.language === 'en' && l.code === 'en'))?.flag || '🇺🇸'}</span>}
            />
          </div>

          {/* Preferences */}
          <div>
            <h2 className="text-base font-bold text-foreground mb-4 px-1 flex items-center gap-2">
              <SettingsIcon /> {t('preferences')}
            </h2>
            <div className="bg-card rounded-[24px] overflow-hidden shadow-sm p-2">
              {/* Appearance */}
              <div className="flex items-center justify-between p-4 border-b border-border/40">
                <div>
                  <p className="font-medium">{t('appearance')}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{t('theme_desc')}</p>
                </div>
                <Select value={theme} onValueChange={(v: any) => dispatch(setTheme(v))}>
                  <SelectTrigger className="w-24 h-8 text-xs rounded-full border-border/50 bg-secondary/50">
                    <SelectValue placeholder="Theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">{t('light')}</SelectItem>
                    <SelectItem value="dark">{t('dark')}</SelectItem>
                    <SelectItem value="system">{t('system')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Toggles */}
              <ToggleItem 
                label={t('add_burned')} 
                subLabel={t('add_burned_desc')} 
                checked={profileInfo.burned_calories_enabled}
                onChange={(checked) => handleToggleChange('burned_calories_enabled', checked)}
              />
              <ToggleItem 
                label={t('rollover')} 
                subLabel={t('rollover_desc')} 
                checked={profileInfo.rollover_calories_enabled}
                onChange={(checked) => handleToggleChange('rollover_calories_enabled', checked)}
              />
              <ToggleItem 
                label={t('badge_cel')} 
                subLabel={t('badge_cel_desc')} 
                checked={true} 
                onChange={() => {}}
                border={false} 
              />
            </div>
          </div>

          {/* Widgets Section */}


          {/* Support & Legal */}
          <div className="bg-card rounded-[24px] overflow-hidden shadow-sm">
            <MenuItem icon={Info} label={t('terms')} />
            <MenuItem icon={ShieldCheck} label={t('privacy')} onClick={() => navigate('/privacy-policy')} />
            <MenuItem icon={Mail} label={t('support')} />
            <MenuItem icon={HelpCircle} label={t('feature_req')} onClick={() => navigate('/help')} />
            <MenuItem icon={User} label={t('delete_account')} border={false} danger onClick={() => setDeleteOpen(true)} />
          </div>

          {/* Footer Actions */}
          <div className="px-2 pb-6">
            <button
              onClick={() => setLogoutOpen(true)}
              className="flex items-center gap-2 text-sm font-medium hover:opacity-80 transition-opacity"
            >
              <LogOut className="w-4 h-4" />
              {t('logout')}
            </button>
            <p className="text-[10px] text-muted-foreground mt-6 text-center tracking-widest uppercase">
              {t('version')} 1.0.184
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}


      {/* Logout Dialog */}
      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogContent className="max-w-[300px] rounded-3xl p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center text-xl">{t('logout_confirm')}</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              {t('logout_desc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-3 space-x-0 mt-4">
            <AlertDialogAction onClick={handleSignOut} className="w-full h-12 rounded-full bg-red-500 hover:bg-red-600">
              {t('logout')}
            </AlertDialogAction>
            <AlertDialogCancel className="w-full h-12 rounded-full border-0 bg-secondary hover:bg-secondary/80 mt-0">
              {t('cancel')}
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Account Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="max-w-[300px] rounded-3xl p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center text-xl text-red-500">{t('delete_account')}</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              {t('delete_account_desc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-3 space-x-0 mt-4">
            <AlertDialogAction
              onClick={handleDeleteAccount}
              className="w-full h-12 rounded-full bg-red-500 hover:bg-red-600"
              disabled={deleting}
            >
              {deleting ? t('deleting') : t('delete_forever')}
            </AlertDialogAction>
            <AlertDialogCancel className="w-full h-12 rounded-full border-0 bg-secondary hover:bg-secondary/80 mt-0">
              {t('cancel')}
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={languageOpen} onOpenChange={setLanguageOpen}>
        <AlertDialogContent className="max-w-[300px] rounded-3xl p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center text-xl mb-2">{t('language')}</AlertDialogTitle>
            <AlertDialogDescription className="sr-only">Select your preferred language.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={clsx(
                  "w-full flex items-center gap-4 p-4 rounded-xl transition-colors",
                  i18n.language === lang.code ? "bg-primary/10 border border-primary/20" : "bg-card hover:bg-secondary"
                )}
              >
                <span className="text-2xl">{lang.flag}</span>
                <span className="font-medium">{lang.label}</span>
                {i18n.language === lang.code && <div className="ml-auto w-2 h-2 rounded-full bg-primary" />}
              </button>
            ))}
          </div>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="w-full h-12 rounded-full border-0 bg-secondary hover:bg-secondary/80 mt-0">
              {t('cancel')}
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const MenuItem = ({ icon: Icon, label, onClick, border = true, danger = false, rightElement }: any) => (
  <button
    type="button"
    onClick={(e) => {
      console.log('MenuItem clicked:', label);
      if (onClick) onClick(e);
    }}
    className={clsx(
      "w-full flex items-center gap-4 p-4 hover:bg-secondary/50 transition-colors text-left",
      border && "border-b border-border/40"
    )}
  >
    <Icon className={clsx("w-5 h-5", danger ? "text-foreground" : "text-foreground")} strokeWidth={2} />
    <span className={clsx("flex-1 text-sm font-medium", danger && "text-foreground")}>{label}</span>
    {rightElement ? rightElement : !danger && <ChevronRight className="w-4 h-4 text-muted-foreground/50" />}
  </button>
);

const ToggleItem = ({ label, subLabel, checked, onChange, border = true }: {
  label: string;
  subLabel?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  border?: boolean;
}) => (
  <div className={clsx("flex items-center justify-between p-4", border && "border-b border-border/40")}>
    <div className="pr-4">
      <p className="font-medium text-sm">{label}</p>
      {subLabel && <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{subLabel}</p>}
    </div>
    <Switch checked={checked} onCheckedChange={onChange} />
  </div>
);

const SettingsIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l.43.25a2 2 0 0 1-1-1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
)

export default Profile;

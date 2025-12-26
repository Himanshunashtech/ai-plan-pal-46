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
import { useHideOnScroll } from "@/hooks/useHideOnScroll";
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
}

import i18nInstance from "@/i18n";

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
    i18nInstance.changeLanguage(code === 'en-GB' ? 'en' : code);
    setLanguageOpen(false);
  };

  const isNavHidden = useHideOnScroll();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      // Load from cache first to ensure state is populated even if we init with false
      const cached = localStorage.getItem(`profile_cache_${user.id}`);
      if (cached) {
        setProfileInfo(JSON.parse(cached));
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("full_name, avatar_url, age")
          .eq("user_id", user.id)
          .maybeSingle();

        if (data) {
          setProfileInfo(data);
          // Update cache
          localStorage.setItem(`profile_cache_${user.id}`, JSON.stringify(data));
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth", { replace: true });
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
        <h1 className="text-2xl font-bold mb-6 px-1">Settings</h1>

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
              {profileInfo.age ? `${profileInfo.age} years old` : "No age set"}
            </p>
          </div>
        </div>

        {/* Invite Friends Banner */}

        {/* Menu List Groups */}
        <div className="space-y-8">

          {/* General Settings */}
          <div className="bg-card rounded-[24px] overflow-hidden shadow-sm">
            <MenuItem icon={Wallet} label="Personal details" onClick={() => navigate('/edit-profile')} />
            <MenuItem icon={Target} label="Adjust macronutrients" onClick={() => navigate('/nutrition-goals')} />
            <MenuItem icon={Scale} label="Goal & current weight" onClick={() => navigate('/edit-profile')} />
            <MenuItem icon={History} label="Weight history" border={false} onClick={() => navigate('/progress')} />
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
              <SettingsIcon /> Preferences
            </h2>
            <div className="bg-card rounded-[24px] overflow-hidden shadow-sm p-2">
              {/* Appearance */}
              <div className="flex items-center justify-between p-4 border-b border-border/40">
                <div>
                  <p className="font-medium">Appearance</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Choose light, dark, or system</p>
                </div>
                <Select value={theme} onValueChange={(v: any) => dispatch(setTheme(v))}>
                  <SelectTrigger className="w-24 h-8 text-xs rounded-full border-border/50 bg-secondary/50">
                    <SelectValue placeholder="Theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Toggles */}
              <ToggleItem label="Add Burned Calories" subLabel="Add burned calories to daily goal" />
              <ToggleItem label="Rollover calories" subLabel="Add up to 200 left over calories from yesterday" />
              <ToggleItem label="Badge Celebrations" subLabel="Show celebrations when you unlock new badges" defaultChecked={true} border={false} />
            </div>
          </div>

          {/* Widgets Section */}
          <div>
            <div className="flex items-center justify-between mb-4 px-1">
              <h2 className="text-base font-bold text-foreground">Widgets</h2>
              <Link to="#" className="text-xs text-muted-foreground hover:text-primary">How to add?</Link>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 snap-x hide-scrollbar">
              {/* Widget Preview 1: Calories */}
              <div className="snap-center shrink-0 w-36 h-36 bg-card rounded-[24px] shadow-sm p-4 flex flex-col items-center justify-center border-2 border-transparent hover:border-primary/20 transition-all cursor-pointer">
                <div className="relative w-20 h-20 mb-2">
                  <div className="absolute inset-0 border-4 border-muted rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent border-l-transparent -rotate-45"></div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-bold">709</span>
                    <span className="text-[9px] text-muted-foreground">Calories left</span>
                  </div>
                </div>
                <div className="absolute top-2 right-2">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                </div>
              </div>

              {/* Widget Preview 2: Log Food Shortcut */}
              <div className="snap-center shrink-0 w-36 h-36 bg-card rounded-[24px] shadow-sm p-4 flex flex-col items-center justify-center border-2 border-transparent hover:border-primary/20 transition-all cursor-pointer">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mb-3 shadow-lg shadow-primary/30">
                  <Plus className="w-6 h-6 text-primary-foreground" />
                </div>
                <div className="bg-foreground text-background text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
                  <Smartphone className="w-3 h-3" />
                  Log your food
                </div>
              </div>
            </div>
          </div>

          {/* Support & Legal */}
          <div className="bg-card rounded-[24px] overflow-hidden shadow-sm">
            <MenuItem icon={Info} label="Terms and Conditions" />
            <MenuItem icon={ShieldCheck} label="Privacy Policy" onClick={() => navigate('/privacy-policy')} />
            <MenuItem icon={Mail} label="Support Email" />
            <MenuItem icon={HelpCircle} label="Feature Request" onClick={() => navigate('/help')} />
            <MenuItem icon={User} label="Delete Account?" border={false} danger onClick={() => setDeleteOpen(true)} />
          </div>

          {/* Footer Actions */}
          <div className="px-2 pb-6">
            <button
              onClick={() => setLogoutOpen(true)}
              className="flex items-center gap-2 text-sm font-medium hover:opacity-80 transition-opacity"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
            <p className="text-[10px] text-muted-foreground mt-6 text-center tracking-widest uppercase">
              Version 1.0.184
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav
        className={`fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-area-bottom
        transition-transform duration-300 ease-out z-50
        ${isNavHidden ? "translate-y-full" : "translate-y-0"}`}
      >
        {/* Same Nav as before */}
        <div className="grid grid-cols-3 items-center py-2">
          {/* ... Nav Items ... Use existing component or recreate */}
          {/* Recreating for layout consistency in this rewrite */}
          <div className="flex flex-col items-center text-muted-foreground cursor-pointer" onClick={() => navigate('/dashboard')}>
            <svg className="w-6 h-6 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>
            <span className="text-[10px]">Home</span>
          </div>
          <div className="flex flex-col items-center text-muted-foreground cursor-pointer" onClick={() => navigate('/progress')}>
            <svg className="w-6 h-6 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
            <span className="text-[10px]">Analytics</span>
          </div>
          <div className="flex flex-col items-center text-primary cursor-pointer">
            <svg className="w-6 h-6 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            <span className="text-[10px]">Settings</span>
          </div>
        </div>
      </nav>

      {/* Logout Dialog */}
      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogContent className="max-w-[300px] rounded-3xl p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center text-xl">Log out?</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              You'll need to sign in again to access your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-3 space-x-0 mt-4">
            <AlertDialogAction onClick={handleSignOut} className="w-full h-12 rounded-full bg-red-500 hover:bg-red-600">
              Log Out
            </AlertDialogAction>
            <AlertDialogCancel className="w-full h-12 rounded-full border-0 bg-secondary hover:bg-secondary/80 mt-0">
              Cancel
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Account Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="max-w-[300px] rounded-3xl p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center text-xl text-red-500">Delete Account?</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              This will permanently delete your account and data. You won't be able to log in again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-3 space-x-0 mt-4">
            <AlertDialogAction
              onClick={handleDeleteAccount}
              className="w-full h-12 rounded-full bg-red-500 hover:bg-red-600"
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete Forever"}
            </AlertDialogAction>
            <AlertDialogCancel className="w-full h-12 rounded-full border-0 bg-secondary hover:bg-secondary/80 mt-0">
              Cancel
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={languageOpen} onOpenChange={setLanguageOpen}>
        <AlertDialogContent className="max-w-[300px] rounded-3xl p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center text-xl mb-2">{t('language')}</AlertDialogTitle>
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
              Close
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

const ToggleItem = ({ label, subLabel, defaultChecked = false, border = true }: any) => (
  <div className={clsx("flex items-center justify-between p-4", border && "border-b border-border/40")}>
    <div className="pr-4">
      <p className="font-medium text-sm">{label}</p>
      {subLabel && <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{subLabel}</p>}
    </div>
    <Switch defaultChecked={defaultChecked} />
  </div>
);

const SettingsIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l.43.25a2 2 0 0 1-1-1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
)

export default Profile;

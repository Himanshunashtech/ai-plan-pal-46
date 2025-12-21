import { Home, BarChart3, Scan, User, ChevronRight, LogOut } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ProfileInfo {
  full_name: string | null;
  avatar_url: string | null;
}

const Profile = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [profileInfo, setProfileInfo] = useState<ProfileInfo>({ full_name: null, avatar_url: null });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('user_id', user.id)
        .single();
      if (data) {
        setProfileInfo(data);
      }
    };
    fetchProfile();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const menuItems = [
    { label: 'Edit Profile', path: '/edit-profile' },
    { label: 'Nutrition Goals', path: '/nutrition-goals' },
    { label: 'Notifications', path: '/notifications' },
    { label: 'Subscription', path: '#' },
    { label: 'Help & Support', path: '#' },
    { label: 'Privacy Policy', path: '#' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col safe-area-top safe-area-bottom">
      <div className="flex-1 px-6 py-6 pb-24 overflow-auto">
        <h1 className="text-xl font-bold mb-6">Settings</h1>

        <div className="bg-card rounded-2xl p-4 shadow-soft mb-6 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
            {profileInfo.avatar_url ? (
              <img src={profileInfo.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="w-8 h-8 text-muted-foreground" />
            )}
          </div>
          <div>
            <p className="font-semibold">{profileInfo.full_name || 'User'}</p>
            <p className="text-sm text-muted-foreground">{user?.email || 'Guest'}</p>
          </div>
        </div>

        <div className="bg-card rounded-2xl shadow-soft overflow-hidden">
          {menuItems.map((item, i) => (
            <Link
              key={item.label}
              to={item.path}
              className={`flex items-center justify-between p-4 hover:bg-secondary transition-colors ${
                i !== menuItems.length - 1 ? 'border-b border-border' : ''
              }`}
            >
              <span>{item.label}</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </Link>
          ))}
        </div>

        <Button
          variant="outline"
          size="lg"
          className="w-full mt-6 text-destructive border-destructive/20"
          onClick={handleSignOut}
        >
          <LogOut className="w-5 h-5 mr-2" />
          Sign Out
        </Button>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-area-bottom">
        <div className="flex justify-around py-3">
          {[
            { icon: Home, path: '/dashboard', label: 'Home' },
            { icon: BarChart3, path: '/progress', label: 'Analytics' },
            { icon: Scan, path: '/scanner', label: 'Scan' },
            { icon: User, path: '/profile', label: 'Settings' },
          ].map(({ icon: Icon, path, label }) => (
            <Link key={path} to={path} className={`flex flex-col items-center gap-1 px-4 ${
              location.pathname === path ? 'text-primary' : 'text-muted-foreground'
            }`}>
              <Icon className="w-6 h-6" />
              <span className="text-xs">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default Profile;

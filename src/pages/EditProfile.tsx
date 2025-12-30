import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, User, Lock, Eye, EyeOff, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ImageCropper from '@/components/profile/ImageCropper';
import { FormPageSkeleton } from '@/components/skeletons';
import { useTranslation } from 'react-i18next';

interface ProfileData {
  full_name: string | null;
  avatar_url: string | null;
  gender: string | null;
  age: number | null;
  height: number | null;
  height_unit: string | null;
  current_weight: number | null;
  weight_unit: string | null;
  activity_level: string | null;
}

const CACHE: Record<string, { data: ProfileData, timestamp: number }> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const EditProfile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cache logic
  const cacheKey = user?.id || 'anon';
  const cached = CACHE[cacheKey];
  const isCacheValid = cached && (Date.now() - cached.timestamp < CACHE_TTL);

  const [loading, setLoading] = useState(!isCacheValid);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData>(isCacheValid ? cached.data : {
    full_name: '',
    avatar_url: null,
    gender: null,
    age: null,
    height: null,
    height_unit: 'cm',
    current_weight: null,
    weight_unit: 'kg',
    activity_level: null,
  });

  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(isCacheValid && cached.data.avatar_url ? cached.data.avatar_url : null);
  const [newAvatarBlob, setNewAvatarBlob] = useState<Blob | null>(null);

  // Password change state
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, gender, age, height, height_unit, current_weight, weight_unit, activity_level')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setProfile(data);
        if (data.avatar_url) {
          setPreviewUrl(data.avatar_url);
        }

        // Update Cache
        if (user?.id) {
          CACHE[user.id] = {
            data: data,
            timestamp: Date.now()
          };
        }
      }
      setLoading(false);
    };

    fetchProfile();
  }, [user]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageToCrop(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedBlob: Blob) => {
    setNewAvatarBlob(croppedBlob);
    setPreviewUrl(URL.createObjectURL(croppedBlob));
    setImageToCrop(null);
  };

  const handlePasswordChange = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error(t('fill_all_fields'));
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(t('passwords_not_match'));
      return;
    }

    if (newPassword.length < 6) {
      toast.error(t('password_min_length'));
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast.success(t('password_updated'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordSection(false);

      // Send notification email about password change
      try {
        await supabase.functions.invoke('send-notification-email', {
          body: {
            type: 'password_changed',
            userId: user?.id
          }
        });
      } catch (emailError) {
        console.log('Email notification not sent (API key may not be configured)');
      }
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast.error(error.message || t('failed_to_change_password'));
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      let avatarUrl = profile.avatar_url;

      // Upload new avatar if changed
      if (newAvatarBlob) {
        const fileName = `${user.id}/${Date.now()}.jpg`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, newAvatarBlob, {
            contentType: 'image/jpeg',
            upsert: true
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

        avatarUrl = publicUrl;
      }

      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          avatar_url: avatarUrl,
          gender: profile.gender,
          age: profile.age,
          height: profile.height,
          height_unit: profile.height_unit,
          current_weight: profile.current_weight,
          weight_unit: profile.weight_unit,
          activity_level: profile.activity_level,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      // Send notification email about profile update
      try {
        await supabase.functions.invoke('send-notification-email', {
          body: {
            type: 'profile_updated',
            userId: user.id
          }
        });
      } catch (emailError) {
        console.log('Email notification not sent (API key may not be configured)');
      }

      toast.success(t('profile_updated'));
      navigate('/profile');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error(t('failed_to_update_profile'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <FormPageSkeleton fieldCount={7} showAvatar={true} />;
  }

  if (imageToCrop) {
    return (
      <ImageCropper
        imageSrc={imageToCrop}
        onCropComplete={handleCropComplete}
        onCancel={() => setImageToCrop(null)}
      />
    );
  }

  return (
    <div className="min-h-screen  dark:bg-background safe-area-top safe-area-bottom pb-10">
      {/* Header */}
      <div className="bg-background/80 backdrop-blur-md sticky top-0 z-50 border-b border-border/50">
        <div className="px-5 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate('/profile')}
            className="text-primary text-lg font-medium active:opacity-50 transition-opacity"
          >
            {t('cancel')}
          </button>
          <h1 className="text-lg font-semibold text-foreground">{t('edit_profile')}</h1>
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-primary text-lg font-bold active:opacity-50 transition-opacity disabled:opacity-30"
          >
            {saving ? t('done_dot') : t('done')}
          </button>
        </div>
      </div>

      <div className="flex flex-col">
        {/* Avatar Section */}
        <div className="flex flex-col items-center py-8">
          <div
            className="relative w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden cursor-pointer active:scale-95 transition-transform shadow-sm"
            onClick={() => fileInputRef.current?.click()}
          >
            {previewUrl ? (
              <img src={previewUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="w-12 h-12 text-muted-foreground" />
            )}
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <Camera className="w-8 h-8 text-white" />
            </div>
          </div>
          <button
            className="text-primary text-sm font-medium mt-4 bg-background px-4 py-1.5 rounded-full border border-border/50 shadow-sm active:opacity-70 transition-opacity"
            onClick={() => fileInputRef.current?.click()}
          >
            {t('edit_photo')}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        {/* Form Groups */}
        <div className="space-y-6 px-4">
          {/* Main Info Section */}
          <div className="bg-card rounded-xl overflow-hidden shadow-sm border border-border/50">
            <div className="flex flex-col">
              {/* Name */}
              <div className="px-4 py-3 bg-card flex items-center">
                <label htmlFor="fullName" className="text-[17px] font-medium w-28 shrink-0">{t('name')}</label>
                <input
                  id="fullName"
                  value={profile.full_name || ''}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  placeholder={t('your_name')}
                  className="flex-1 bg-transparent border-none focus:ring-0 focus-visible:outline-none text-[17px] p-0 text-muted-foreground"
                />
              </div>
              <div className="mx-4 h-[0.5px] bg-border/50" />

              {/* Gender */}
              <div className="px-4 py-3 bg-card flex items-center">
                <label className="text-[17px] font-medium w-28 shrink-0">{t('gender')}</label>
                <div className="flex-1">
                  <Select
                    value={profile.gender || ''}
                    onValueChange={(value) => setProfile({ ...profile, gender: value })}
                  >
                    <SelectTrigger className="border-none bg-transparent p-0 h-auto focus:ring-0 focus-visible:outline-none shadow-none text-[17px] text-muted-foreground justify-between">
                      <SelectValue placeholder={t('select')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">{t('male')}</SelectItem>
                      <SelectItem value="female">{t('female')}</SelectItem>
                      <SelectItem value="other">{t('other')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mx-4 h-[0.5px] bg-border/50" />

              {/* Age */}
              <div className="px-4 py-3 bg-card flex items-center">
                <label htmlFor="age" className="text-[17px] font-medium w-28 shrink-0">{t('age')}</label>
                <input
                  id="age"
                  type="number"
                  value={profile.age || ''}
                  onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value) || null })}
                  placeholder={t('enter_age')}
                  className="flex-1 bg-transparent border-none focus:ring-0 focus-visible:outline-none text-[17px] p-0 text-muted-foreground"
                />
              </div>
            </div>
          </div>

          <p className="px-4 text-[13px] text-muted-foreground uppercase tracking-tight -mb-4">{t('physical_stats')}</p>
          <div className="bg-card rounded-xl overflow-hidden shadow-sm border border-border/50">
            <div className="flex flex-col">
              {/* Height */}
              <div className="px-4 py-3 bg-card flex items-center">
                <label htmlFor="height" className="text-[17px] font-medium w-28 shrink-0">{t('height')}</label>
                <input
                  id="height"
                  type="number"
                  value={profile.height || ''}
                  onChange={(e) => setProfile({ ...profile, height: parseFloat(e.target.value) || null })}
                  className="flex-1 bg-transparent border-none focus:ring-0 focus-visible:outline-none text-[17px] p-0 text-muted-foreground"
                />
                <Select
                  value={profile.height_unit || 'cm'}
                  onValueChange={(value) => setProfile({ ...profile, height_unit: value })}
                >
                  <SelectTrigger className="border-none bg-transparent p-0 h-auto w-auto focus:ring-0 shadow-none text-[15px] font-semibold text-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cm">cm</SelectItem>
                    <SelectItem value="ft">ft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="mx-4 h-[0.5px] bg-border/50" />

              {/* Weight */}
              <div className="px-4 py-3 bg-card flex items-center">
                <label htmlFor="weight" className="text-[17px] font-medium w-28 shrink-0">{t('weight')}</label>
                <input
                  id="weight"
                  type="number"
                  value={profile.current_weight || ''}
                  onChange={(e) => setProfile({ ...profile, current_weight: parseFloat(e.target.value) || null })}
                  className="flex-1 bg-transparent border-none focus:ring-0 focus-visible:outline-none text-[17px] p-0 text-muted-foreground"
                />
                <Select
                  value={profile.weight_unit || 'kg'}
                  onValueChange={(value) => setProfile({ ...profile, weight_unit: value })}
                >
                  <SelectTrigger className="border-none bg-transparent p-0 h-auto w-auto focus:ring-0 shadow-none text-[15px] font-semibold text-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="lbs">lbs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <p className="px-4 text-[13px] text-muted-foreground uppercase tracking-tight -mb-4">{t('lifestyle')}</p>
          <div className="bg-card rounded-xl overflow-hidden shadow-sm border border-border/50">
            <div className="px-4 py-3 bg-card flex items-center">
              <label className="text-[17px] font-medium w-28 shrink-0">{t('activity')}</label>
              <div className="flex-1">
                <Select
                  value={profile.activity_level || ''}
                  onValueChange={(value) => setProfile({ ...profile, activity_level: value })}
                >
                  <SelectTrigger className="border-none bg-transparent p-0 h-auto focus:ring-0 focus-visible:outline-none shadow-none text-[17px] text-muted-foreground justify-between">
                    <SelectValue placeholder={t('select')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sedentary">{t('sedentary')}</SelectItem>
                    <SelectItem value="lightly_active">{t('lightly_active')}</SelectItem>
                    <SelectItem value="moderately_active">{t('moderately_active')}</SelectItem>
                    <SelectItem value="very_active">{t('very_active')}</SelectItem>
                    <SelectItem value="extremely_active">{t('extremely_active')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Password Group */}
          <p className="px-4 text-[13px] text-muted-foreground uppercase tracking-tight -mb-4">{t('account')}</p>
          <div className="bg-card rounded-xl overflow-hidden shadow-sm border border-border/50 mb-10">
            <button
              type="button"
              className="w-full px-4 py-4 flex items-center justify-between active:bg-muted/50 transition-colors"
              onClick={() => setShowPasswordSection(!showPasswordSection)}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center text-white">
                  <Lock className="w-4 h-4" />
                </div>
                <span className="text-[17px] font-medium">{t('change_password')}</span>
              </div>
              <ChevronRight className={`w-5 h-5 text-muted-foreground/30 transition-transform ${showPasswordSection ? 'rotate-90' : ''}`} />
            </button>

            {showPasswordSection && (
              <div className="px-4 pb-4 animate-in slide-in-from-top duration-300">
                <div className="space-y-3 bg-secondary/30 p-4 rounded-xl">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[13px] font-semibold opacity-60">{t('new_password')}</Label>
                    <div className="relative">
                      <Input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="bg-background/50 border-none h-11"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[13px] font-semibold opacity-60">{t('confirm_password')}</Label>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="bg-background/50 border-none h-11"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                      </button>
                    </div>
                  </div>
                  <Button
                    type="button"
                    className="w-full h-11 rounded-lg bg-primary font-bold mt-2"
                    onClick={handlePasswordChange}
                    disabled={changingPassword}
                  >
                    {changingPassword ? t('updating') : t('update_password')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;

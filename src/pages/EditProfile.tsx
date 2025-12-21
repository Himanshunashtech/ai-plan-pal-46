import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ImageCropper from '@/components/profile/ImageCropper';

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

const EditProfile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [newAvatarBlob, setNewAvatarBlob] = useState<Blob | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, gender, age, height, height_unit, current_weight, weight_unit, activity_level')
        .eq('user_id', user.id)
        .single();
      
      if (data) {
        setProfile(data);
        if (data.avatar_url) {
          setPreviewUrl(data.avatar_url);
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
      
      toast.success('Profile updated successfully');
      navigate('/profile');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
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
    <div className="min-h-screen bg-background safe-area-top safe-area-bottom">
      <div className="px-6 py-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/profile')}>
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-xl font-bold">Edit Profile</h1>
        </div>

        {/* Avatar Section */}
        <div className="flex flex-col items-center mb-8">
          <div 
            className="relative w-28 h-28 rounded-full bg-secondary flex items-center justify-center overflow-hidden cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            {previewUrl ? (
              <img src={previewUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="w-12 h-12 text-muted-foreground" />
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <Camera className="w-8 h-8 text-white" />
            </div>
          </div>
          <button 
            className="text-primary text-sm font-medium mt-3"
            onClick={() => fileInputRef.current?.click()}
          >
            Change Photo
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        {/* Form Fields */}
        <div className="space-y-5">
          <div>
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={profile.full_name || ''}
              onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              placeholder="Enter your name"
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="gender">Gender</Label>
            <Select
              value={profile.gender || ''}
              onValueChange={(value) => setProfile({ ...profile, gender: value })}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="age">Age</Label>
            <Input
              id="age"
              type="number"
              value={profile.age || ''}
              onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value) || null })}
              placeholder="Enter your age"
              className="mt-1.5"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <Label htmlFor="height">Height</Label>
              <Input
                id="height"
                type="number"
                value={profile.height || ''}
                onChange={(e) => setProfile({ ...profile, height: parseFloat(e.target.value) || null })}
                placeholder="Height"
                className="mt-1.5"
              />
            </div>
            <div className="w-24">
              <Label htmlFor="heightUnit">Unit</Label>
              <Select
                value={profile.height_unit || 'cm'}
                onValueChange={(value) => setProfile({ ...profile, height_unit: value })}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cm">cm</SelectItem>
                  <SelectItem value="ft">ft</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <Label htmlFor="weight">Weight</Label>
              <Input
                id="weight"
                type="number"
                value={profile.current_weight || ''}
                onChange={(e) => setProfile({ ...profile, current_weight: parseFloat(e.target.value) || null })}
                placeholder="Weight"
                className="mt-1.5"
              />
            </div>
            <div className="w-24">
              <Label htmlFor="weightUnit">Unit</Label>
              <Select
                value={profile.weight_unit || 'kg'}
                onValueChange={(value) => setProfile({ ...profile, weight_unit: value })}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="lbs">lbs</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="activity">Activity Level</Label>
            <Select
              value={profile.activity_level || ''}
              onValueChange={(value) => setProfile({ ...profile, activity_level: value })}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Select activity level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sedentary">Sedentary</SelectItem>
                <SelectItem value="lightly_active">Lightly Active</SelectItem>
                <SelectItem value="moderately_active">Moderately Active</SelectItem>
                <SelectItem value="very_active">Very Active</SelectItem>
                <SelectItem value="extremely_active">Extremely Active</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Save Button */}
        <Button
          className="w-full mt-8"
          size="lg"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
};

export default EditProfile;

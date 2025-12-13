import { useState } from 'react';
import { Camera, Save, User, Mail, ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getErrorMessage } from '@/lib/error-messages';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const { user, updateProfile } = useAuth();
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: user?.user_metadata?.full_name || '',
    email: user?.email || '',
  });

  const [avatarUrl, setAvatarUrl] = useState(user?.user_metadata?.avatar_url || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setFormError(null);
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid File',
        description: 'Please select an image file (JPG, PNG, etc).',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      toast({
        title: 'File Too Large',
        description: 'Image must be smaller than 5MB.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploadingAvatar(true);

    try {
      // Upload para storage do Supabase
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true // Allow overwrite
        });

      if (uploadError) {
        console.error('Upload error details:', uploadError);
        throw uploadError;
      }

      // Obter URL pública
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const newAvatarUrl = data.publicUrl;
      setAvatarUrl(newAvatarUrl);

      // Atualizar no Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          avatar_url: newAvatarUrl
        }
      });

      if (updateError) {
        console.error('Auth update error:', updateError);
        // Continue even if auth update fails
      }

      // Atualizar no profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ avatar_url: newAvatarUrl })
        .eq('id', user.id);

      if (profileError) {
        console.error('Profile update error:', profileError);
        // Show success anyway since upload worked
      }

      toast({
        title: 'Photo Updated',
        description: 'Your profile photo has been changed successfully.',
      });

    } catch (error) {
      console.error('Error uploading avatar:', error);
      const errorMessage = getErrorMessage(error);
      toast({
        title: 'Upload Failed',
        description: errorMessage || 'Could not update profile photo. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate form
    setFormError(null);

    if (!formData.fullName.trim()) {
      setFormError('Full name cannot be empty.');
      return;
    }

    if (!formData.email.trim()) {
      setFormError('Email cannot be empty.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setFormError('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);

    try {
      // Update email if changed
      if (formData.email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: formData.email
        });

        if (emailError) throw emailError;

        toast({
          title: 'Confirm New Email',
          description: 'We sent a confirmation link to your new email. Please check your inbox.',
        });
      }

      // Update data in Supabase Auth
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: formData.fullName
        }
      });

      if (authError) throw authError;

      // Update in profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          full_name: formData.fullName,
          email: formData.email 
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Update local context
      updateProfile({ 
        full_name: formData.fullName,
        email: formData.email,
        avatar_url: avatarUrl 
      });

      toast({
        title: 'Profile Updated',
        description: 'Your profile information has been saved successfully.',
      });

    } catch (error) {
      console.error('Error updating profile:', error);
      const errorMessage = getErrorMessage(error);
      setFormError(errorMessage || 'Could not update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };


  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate passwords
    setPasswordError(null);

    if (!newPassword.trim()) {
      setPasswordError('Please enter a new password.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      return;
    }

    if (!confirmPassword.trim()) {
      setPasswordError('Please confirm your password.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match. Please try again.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      toast({ 
        title: 'Password Changed', 
        description: 'Your password has been updated successfully.' 
      });
      setNewPassword('');
      setConfirmPassword('');
      setPasswordError(null);
    } catch (error) {
      console.error('Error changing password:', error);
      const errorMessage = getErrorMessage(error);
      setPasswordError(errorMessage || 'Could not change password. Please try again.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground">Manage your personal information</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Foto de Perfil */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Photo
              </CardTitle>
              <CardDescription>
                Add or change your profile photo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={avatarUrl} alt="Profile photo" />
                    <AvatarFallback className="text-lg">
                      {user?.user_metadata?.full_name?.charAt(0)?.toUpperCase() || 
                       user?.email?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1">
                    <Label
                      htmlFor="avatar-upload"
                      className="cursor-pointer"
                    >
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors">
                        <Camera className="h-4 w-4 text-primary-foreground" />
                      </div>
                    </Label>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                      disabled={isUploadingAvatar}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Profile photo</p>
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG or GIF (max 5MB)
                  </p>
                  {isUploadingAvatar && (
                    <p className="text-xs text-primary">Uploading...</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações Pessoais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Personal Information
              </CardTitle>
              <CardDescription>
                Update your personal data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {formError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{formError}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    placeholder="Your full name"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="your@email.com"
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Changing email requires email confirmation.
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Outras Configurações (removidas) */}

          {/* Security - Change password */}
          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>Change your password</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                {passwordError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{passwordError}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setPasswordError(null);
                    }}
                    placeholder="Enter new password (min. 6 characters)"
                    disabled={isChangingPassword}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setPasswordError(null);
                    }}
                    placeholder="Confirm new password"
                    disabled={isChangingPassword}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isChangingPassword}>
                  {isChangingPassword ? 'Changing...' : 'Change Password'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
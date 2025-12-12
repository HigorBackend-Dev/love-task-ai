import { useState } from 'react';
import { Camera, Save, User, Mail, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/hooks/useOnboarding';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const { user, updateProfile } = useAuth();
  const { restartOnboarding } = useOnboarding();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const [formData, setFormData] = useState({
    fullName: user?.user_metadata?.full_name || '',
    email: user?.email || '',
  });

  const [avatarUrl, setAvatarUrl] = useState(user?.user_metadata?.avatar_url || '');

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setIsUploadingAvatar(true);

    try {
      // Upload para storage do Supabase
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar_${user.id}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

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

      if (updateError) throw updateError;

      // Atualizar no profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ avatar_url: newAvatarUrl })
        .eq('id', user.id);

      if (profileError) throw profileError;

      toast({
        title: '✅ Foto atualizada!',
        description: 'Sua foto de perfil foi alterada com sucesso.',
      });

    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: 'Erro no upload',
        description: 'Não foi possível atualizar a foto de perfil.',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);

    try {
      // Atualizar email se mudou
      if (formData.email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: formData.email
        });

        if (emailError) throw emailError;

        toast({
          title: '📧 Confirme o novo email',
          description: 'Enviamos um link de confirmação para seu novo email.',
        });
      }

      // Atualizar dados no Supabase Auth
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: formData.fullName
        }
      });

      if (authError) throw authError;

      // Atualizar no profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          full_name: formData.fullName,
          email: formData.email 
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Atualizar contexto local
      updateProfile({ 
        full_name: formData.fullName,
        email: formData.email,
        avatar_url: avatarUrl 
      });

      toast({
        title: '✅ Perfil atualizado!',
        description: 'Suas informações foram salvas com sucesso.',
      });

    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível atualizar o perfil. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestartOnboarding = async () => {
    try {
      await restartOnboarding();
      navigate('/dashboard');
    } catch (error) {
      console.error('Error restarting onboarding:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível reiniciar o tour.',
        variant: 'destructive',
      });
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
            <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
            <p className="text-muted-foreground">Gerencie suas informações pessoais</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Foto de Perfil */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Foto de Perfil
              </CardTitle>
              <CardDescription>
                Adicione ou altere sua foto de perfil
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={avatarUrl} alt="Foto de perfil" />
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
                  <p className="text-sm font-medium">Foto de perfil</p>
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG ou GIF (máx. 5MB)
                  </p>
                  {isUploadingAvatar && (
                    <p className="text-xs text-primary">Fazendo upload...</p>
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
                Informações Pessoais
              </CardTitle>
              <CardDescription>
                Atualize seus dados pessoais
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome Completo</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    placeholder="Seu nome completo"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="seu@email.com"
                  />
                  <p className="text-xs text-muted-foreground">
                    Alterar o email requer confirmação por email.
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
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Alterações
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Outras Configurações */}
          <Card>
            <CardHeader>
              <CardTitle>Outras Opções</CardTitle>
              <CardDescription>
                Configurações adicionais e ajuda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                onClick={handleRestartOnboarding}
                className="w-full justify-start"
              >
                🎯 Refazer Tour de Boas-vindas
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
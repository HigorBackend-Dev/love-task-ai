import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types/task';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchProfile = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        // @ts-expect-error - profiles table not in generated types yet
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        // Se profile não existe, será criado automaticamente pelo trigger
        if (error.code === 'PGRST116') {
          console.log('Profile will be created automatically');
          return;
        }
        throw error;
      }

      setProfile(data as unknown as Profile);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: 'Erro ao carregar perfil',
        description: 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    fetchProfile();

    // Subscribe to profile changes
    const channel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          setProfile(payload.new as Profile);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchProfile]);

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) {
      toast({
        title: 'Erro',
        description: 'Você precisa estar autenticado.',
        variant: 'destructive',
      });
      return false;
    }

    try {
      const { error } = await supabase
        // @ts-expect-error - profiles table not in generated types yet
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      setProfile((prev) => (prev ? { ...prev, ...updates } : null));

      toast({
        title: 'Perfil atualizado!',
        description: 'Suas alterações foram salvas.',
      });

      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Erro ao atualizar',
        description: 'Tente novamente.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const updatePreferences = async (preferences: Record<string, unknown>) => {
    return updateProfile({ preferences });
  };

  return {
    profile,
    isLoading,
    updateProfile,
    updatePreferences,
    refetch: fetchProfile,
  };
}

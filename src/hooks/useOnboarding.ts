import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { OnboardingState } from '@/types/onboarding';
import type { Database } from '@/integrations/supabase/types';

export function useOnboarding() {
  const [state, setState] = useState<OnboardingState>({
    completed: false,
    currentStep: 0,
    skipped: false,
    checklist: {
      created_task: false,
      completed_task: false,
      started_chat: false,
      viewed_dashboard: false,
    },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch onboarding state
  const fetchOnboardingState = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('onboarding_completed, onboarding_step, onboarding_skipped, onboarding_checklist')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setState({
          // @ts-expect-error - onboarding fields not in generated types yet
          completed: data.onboarding_completed || false,
          // @ts-expect-error - onboarding fields not in generated types yet
          currentStep: data.onboarding_step || 0,
          // @ts-expect-error - onboarding fields not in generated types yet
          skipped: data.onboarding_skipped || false,
          // @ts-expect-error - onboarding fields not in generated types yet
          checklist: data.onboarding_checklist || {
            created_task: false,
            completed_task: false,
            started_chat: false,
            viewed_dashboard: false,
          },
        });

        // Ativar onboarding automaticamente se não foi completado nem pulado
        // @ts-expect-error - onboarding fields not in generated types yet
        if (!data.onboarding_completed && !data.onboarding_skipped) {
          setIsActive(true);
        }
      }
    } catch (error) {
      console.error('Error fetching onboarding state:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchOnboardingState();
  }, [fetchOnboardingState]);

  // Avançar para próximo passo
  const nextStep = useCallback(async () => {
    if (!user) return;

    const newStep = state.currentStep + 1;
    setState((prev) => ({ ...prev, currentStep: newStep }));

    try {
      await supabase
        .from('profiles')
        // @ts-expect-error - onboarding_step not in update type yet
        .update({ onboarding_step: newStep })
        .eq('id', user.id);
    } catch (error) {
      console.error('Error updating onboarding step:', error);
    }
  }, [user, state.currentStep]);

  // Voltar para passo anterior
  const previousStep = useCallback(async () => {
    if (!user || state.currentStep === 0) return;

    const newStep = state.currentStep - 1;
    setState((prev) => ({ ...prev, currentStep: newStep }));

    try {
      await supabase
        .from('profiles')
        // @ts-expect-error - onboarding_step not in update type yet
        .update({ onboarding_step: newStep })
        .eq('id', user.id);
    } catch (error) {
      console.error('Error updating onboarding step:', error);
    }
  }, [user, state.currentStep]);

  // Completar onboarding
  const completeOnboarding = useCallback(async () => {
    if (!user) return;

    setState((prev) => ({ ...prev, completed: true }));
    setIsActive(false);

    try {
      // @ts-expect-error - RPC function not in generated types yet
      await supabase.rpc('complete_onboarding', { user_id: user.id });

      toast({
        title: '🎉 Onboarding concluído!',
        description: 'Você está pronto para usar o sistema.',
      });
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast({
        title: 'Erro ao completar onboarding',
        variant: 'destructive',
      });
    }
  }, [user, toast]);

  // Pular onboarding
  const skipOnboarding = useCallback(async () => {
    if (!user) return;

    setState((prev) => ({ ...prev, skipped: true }));
    setIsActive(false);

    try {
      await supabase
        .from('profiles')
        .update({
          // @ts-expect-error - onboarding fields not in update type yet
          onboarding_skipped: true,
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      toast({
        title: 'Tour pulado',
        description: 'Você pode retomá-lo nas configurações.',
      });
    } catch (error) {
      console.error('Error skipping onboarding:', error);
    }
  }, [user, toast]);

  // Reiniciar onboarding
  const restartOnboarding = useCallback(async () => {
    if (!user) return;

    setState({
      completed: false,
      currentStep: 0,
      skipped: false,
      checklist: {
        created_task: false,
        completed_task: false,
        started_chat: false,
        viewed_dashboard: false,
      },
    });
    setIsActive(true);

    try {
      await supabase
        .from('profiles')
        .update({
          // @ts-expect-error - onboarding fields not in update type yet
          onboarding_completed: false,
          onboarding_step: 0,
          onboarding_skipped: false,
          onboarding_completed_at: null,
        })
        .eq('id', user.id);
    } catch (error) {
      console.error('Error restarting onboarding:', error);
    }
  }, [user]);

  // Atualizar item do checklist
  const updateChecklistItem = useCallback(
    async (item: keyof OnboardingState['checklist'], completed: boolean = true) => {
      if (!user) return;

      setState((prev) => ({
        ...prev,
        checklist: {
          ...prev.checklist,
          [item]: completed,
        },
      }));

      try {
        // @ts-expect-error - RPC function not in generated types yet
        await supabase.rpc('update_onboarding_checklist', {
          user_id: user.id,
          checklist_item: item,
          completed,
        });
      } catch (error) {
        console.error('Error updating checklist:', error);
      }
    },
    [user]
  );

  // Ativar/desativar manualmente
  const setActive = useCallback((active: boolean) => {
    setIsActive(active);
  }, []);

  return {
    state,
    isLoading,
    isActive,
    nextStep,
    previousStep,
    completeOnboarding,
    skipOnboarding,
    restartOnboarding,
    updateChecklistItem,
    setActive,
  };
}

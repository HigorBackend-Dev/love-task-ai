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
      setIsLoading(true);
      
      // Try to fetch existing profile with onboarding data
      const { data, error } = await supabase
        .from('profiles')
        .select('onboarding_completed, onboarding_step, onboarding_skipped, onboarding_checklist')
        .eq('id', user.id)
        .maybeSingle(); // Use maybeSingle to avoid error if doesn't exist

      if (error) {
        console.warn('Error fetching onboarding state (possibly columns don\'t exist):', error);
        // Fallback: assume new user needs onboarding but don't auto-activate
        setState({
          completed: false,
          currentStep: 0,
          skipped: false,
          checklist: {
            created_task: false,
            completed_task: false,
            started_chat: false,
            viewed_dashboard: false, // Changed to false as default
          },
        });
        setIsActive(false); // Don't auto-activate on error
        return;
      }

      if (data) {
        // Data found, user has onboarding info
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
        
        // Only auto-activate if not completed and not skipped
        // @ts-expect-error - onboarding fields not in generated types yet
        setIsActive(!(data.onboarding_completed || data.onboarding_skipped));
      } else {
        // No onboarding data found - treat as new user
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
        // For brand new users, don't auto-activate immediately
        setIsActive(false);
      }
    } catch (error) {
      console.error('Error fetching onboarding state:', error);
      // Set default state on error - but don't auto-activate for existing users
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
      setIsActive(false);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchOnboardingState();
  }, [fetchOnboardingState]);

  // Advance to next step
  const nextStep = useCallback(async () => {
    if (!user) return;

    const newStep = Math.min(state.currentStep + 1, 3);
    setState(prev => ({ ...prev, currentStep: newStep }));

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

  // Go back to previous step
  const previousStep = useCallback(async () => {
    if (!user) return;
    
    const newStep = Math.max(state.currentStep - 1, 0);
    setState(prev => ({ ...prev, currentStep: newStep }));

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

  // Complete onboarding
  const completeOnboarding = useCallback(async () => {
    if (!user) return;

    setState(prev => ({ ...prev, completed: true }));
    setIsActive(false);
    
    try {
      await supabase
        .from('profiles')
        .update({ 
          // @ts-expect-error - onboarding fields not in update type yet
          onboarding_completed: true,
          onboarding_step: 3 
        })
        .eq('id', user.id);

      toast({
        title: '🎉 Parabéns!',
        description: 'Você concluiu o tour de integração!',
      });
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o progresso.',
        variant: 'destructive',
      });
    }
  }, [user, toast]);

  // Skip onboarding
  const skipOnboarding = useCallback(async () => {
    if (!user) return;

    setState(prev => ({ ...prev, skipped: true, completed: true }));
    setIsActive(false);
    
    try {
      await supabase
        .from('profiles')
        .update({ 
          // @ts-expect-error - onboarding fields not in update type yet
          onboarding_skipped: true,
          onboarding_completed: true,
          onboarding_step: 3 
        })
        .eq('id', user.id);

      toast({
        title: '👍 Tour ignorado',
        description: 'Você pode reativar o tour nas configurações.',
      });
    } catch (error) {
      console.error('Error skipping onboarding:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar a preferência.',
        variant: 'destructive',
      });
    }
  }, [user, toast]);

  // Restart onboarding
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
          onboarding_skipped: false,
          onboarding_step: 0,
          onboarding_checklist: {
            created_task: false,
            completed_task: false,
            started_chat: false,
            viewed_dashboard: false,
          }
        })
        .eq('id', user.id);
    } catch (error) {
      console.error('Error restarting onboarding:', error);
    }
  }, [user]);

  // Update checklist item
  const updateChecklistItem = useCallback(
    async (item: keyof OnboardingState['checklist'], completed: boolean = true) => {
      if (!user) return;

      setState(prev => ({
        ...prev,
        checklist: {
          ...prev.checklist,
          [item]: completed,
        },
      }));

      try {
        // Get current checklist from state
        const newChecklist = {
          ...state.checklist,
          [item]: completed,
        };

        await supabase
          .from('profiles')
          // @ts-expect-error - onboarding_checklist not in update type yet
          .update({ onboarding_checklist: newChecklist })
          .eq('id', user.id);
      } catch (error) {
        console.error('Error updating checklist:', error);
      }
    },
    [user, state.checklist]
  );

  // Set onboarding active/inactive manually
  const setActive = useCallback((active: boolean) => {
    setIsActive(active);
  }, []);

  return {
    ...state,
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

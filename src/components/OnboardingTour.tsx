import { useEffect, useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useOnboarding } from '@/hooks/useOnboarding';
import { ONBOARDING_STEPS, type OnboardingStep } from '@/types/onboarding';
import { cn } from '@/lib/utils';

interface TooltipPosition {
  top: number;
  left: number;
  arrow: 'top' | 'bottom' | 'left' | 'right';
}

export function OnboardingTour() {
  const {
    state,
    isActive,
    nextStep,
    previousStep,
    completeOnboarding,
    skipOnboarding,
  } = useOnboarding();

  const [position, setPosition] = useState<TooltipPosition>({ top: 0, left: 0, arrow: 'bottom' });
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const currentStepData = ONBOARDING_STEPS[state.currentStep];
  const isLastStep = state.currentStep === ONBOARDING_STEPS.length - 1;
  const progress = ((state.currentStep + 1) / ONBOARDING_STEPS.length) * 100;
  const isCenterModal = !currentStepData?.target || currentStepData?.placement === 'center';

  // Calcular posição ideal do tooltip
  const calculatePosition = useCallback(() => {
    if (!currentStepData || isCenterModal) {
      setPosition({ top: 0, left: 0, arrow: 'bottom' });
      setHighlightRect(null);
      setIsVisible(true);
      return;
    }

    const targetElement = document.querySelector(currentStepData.target!);
    if (!targetElement) {
      console.warn(`Target not found: ${currentStepData.target}`);
      setIsVisible(true);
      return;
    }

    const targetRect = targetElement.getBoundingClientRect();
    const tooltipElement = tooltipRef.current;
    if (!tooltipElement) {
      setIsVisible(true);
      return;
    }

    // Forçar renderização do tooltip para obter dimensões
    tooltipElement.style.visibility = 'hidden';
    tooltipElement.style.position = 'fixed';
    tooltipElement.style.top = '0px';
    tooltipElement.style.left = '0px';

    const tooltipRect = tooltipElement.getBoundingClientRect();
    const margin = 20;

    let newPosition: TooltipPosition;

    switch (currentStepData.placement) {
      case 'top':
        newPosition = {
          top: targetRect.top - tooltipRect.height - margin,
          left: Math.max(margin, Math.min(
            window.innerWidth - tooltipRect.width - margin,
            targetRect.left + targetRect.width / 2 - tooltipRect.width / 2
          )),
          arrow: 'bottom'
        };
        break;
      
      case 'bottom':
        newPosition = {
          top: targetRect.bottom + margin,
          left: Math.max(margin, Math.min(
            window.innerWidth - tooltipRect.width - margin,
            targetRect.left + targetRect.width / 2 - tooltipRect.width / 2
          )),
          arrow: 'top'
        };
        break;
      
      case 'left':
        newPosition = {
          top: Math.max(margin, Math.min(
            window.innerHeight - tooltipRect.height - margin,
            targetRect.top + targetRect.height / 2 - tooltipRect.height / 2
          )),
          left: targetRect.left - tooltipRect.width - margin,
          arrow: 'right'
        };
        break;
      
      case 'right':
        newPosition = {
          top: Math.max(margin, Math.min(
            window.innerHeight - tooltipRect.height - margin,
            targetRect.top + targetRect.height / 2 - tooltipRect.height / 2
          )),
          left: targetRect.right + margin,
          arrow: 'left'
        };
        break;
      
      default:
        newPosition = {
          top: targetRect.bottom + margin,
          left: Math.max(margin, Math.min(
            window.innerWidth - tooltipRect.width - margin,
            targetRect.left + targetRect.width / 2 - tooltipRect.width / 2
          )),
          arrow: 'top'
        };
    }

    // Verificar se a posição está fora da tela e ajustar
    if (newPosition.top < margin) {
      newPosition.top = targetRect.bottom + margin;
      newPosition.arrow = 'top';
    }
    if (newPosition.top + tooltipRect.height > window.innerHeight - margin) {
      newPosition.top = targetRect.top - tooltipRect.height - margin;
      newPosition.arrow = 'bottom';
    }
    if (newPosition.left < margin) {
      newPosition.left = targetRect.right + margin;
      newPosition.arrow = 'left';
    }
    if (newPosition.left + tooltipRect.width > window.innerWidth - margin) {
      newPosition.left = targetRect.left - tooltipRect.width - margin;
      newPosition.arrow = 'right';
    }

    setPosition(newPosition);
    setHighlightRect(targetRect);
    
    // Restaurar visibilidade
    tooltipElement.style.visibility = 'visible';
    setIsVisible(true);
  }, [currentStepData, isCenterModal]);

  // Scroll suave para elemento
  const scrollToTarget = useCallback(() => {
    if (!currentStepData?.target) return;

    const targetElement = document.querySelector(currentStepData.target);
    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      });
    }
  }, [currentStepData]);

  // Executar cálculos quando o passo mudar
  useEffect(() => {
    if (!isActive) return;

    setIsVisible(false);
    
    // Aguardar um tick para DOM updates
    const timer = setTimeout(() => {
      scrollToTarget();
      
      // Aguardar scroll completar
      setTimeout(() => {
        calculatePosition();
      }, 300);
    }, 50);

    return () => clearTimeout(timer);
  }, [isActive, state.currentStep, calculatePosition, scrollToTarget]);

  // Recalcular posição em resize/scroll
  useEffect(() => {
    if (!isActive || isCenterModal) return;

    const handleResize = () => {
      setTimeout(calculatePosition, 100);
    };

    const handleScroll = () => {
      setTimeout(calculatePosition, 10);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isActive, isCenterModal, calculatePosition]);

  if (!isActive || !currentStepData) return null;

  const handleNext = () => {
    if (isLastStep) {
      completeOnboarding();
    } else {
      nextStep();
    }
  };

  return (
    <>
      {/* Overlay com recorte para o elemento destacado */}
      <div className="fixed inset-0 z-[9998] pointer-events-none">
        {/* Overlay escuro com recorte */}
        <div
          className="absolute inset-0 bg-black/60 transition-all duration-300"
          style={{
            clipPath: highlightRect
              ? `polygon(0% 0%, 0% 100%, ${highlightRect.left - 4}px 100%, ${highlightRect.left - 4}px ${highlightRect.top - 4}px, ${highlightRect.right + 4}px ${highlightRect.top - 4}px, ${highlightRect.right + 4}px ${highlightRect.bottom + 4}px, ${highlightRect.left - 4}px ${highlightRect.bottom + 4}px, ${highlightRect.left - 4}px 100%, 100% 100%, 100% 0%)`
              : 'none',
          }}
        />
        
        {/* Highlight brilhante */}
        {highlightRect && (
          <div
            className="absolute border-2 border-primary bg-primary/10 rounded-lg shadow-2xl animate-onboarding-pulse transition-all duration-300"
            style={{
              top: highlightRect.top - 4,
              left: highlightRect.left - 4,
              width: highlightRect.width + 8,
              height: highlightRect.height + 8,
            }}
          />
        )}
        
        {/* Overlay clicável para fechar */}
        <div
          className="absolute inset-0 pointer-events-auto"
          onClick={() => {
            if (currentStepData.skippable !== false) {
              skipOnboarding();
            }
          }}
        />
      </div>

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className={cn(
          'fixed z-[9999] pointer-events-auto transition-all duration-300',
          isCenterModal && 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
          !isVisible && 'opacity-0'
        )}
        style={
          !isCenterModal && isVisible
            ? {
                top: `${position.top}px`,
                left: `${position.left}px`,
              }
            : undefined
        }
      >
        <Card className="w-80 shadow-2xl border-2 border-primary/20 bg-background/95 backdrop-blur-sm animate-onboarding-fade-in">
          {/* Arrow */}
          {!isCenterModal && (
            <div
              className={cn(
                'absolute w-0 h-0 border-8',
                position.arrow === 'top' && '-top-4 left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-border border-t-transparent',
                position.arrow === 'bottom' && '-bottom-4 left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-border border-b-transparent',
                position.arrow === 'left' && '-left-4 top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-border border-l-transparent',
                position.arrow === 'right' && '-right-4 top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-border border-r-transparent'
              )}
            />
          )}

          <div className="p-6 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2 flex-1">
                <h3 className="text-lg font-semibold leading-tight text-foreground">
                  {currentStepData.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {currentStepData.description}
                </p>
              </div>
              {currentStepData.skippable !== false && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={skipOnboarding}
                  className="h-8 w-8 -mr-2 -mt-2 hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Progress */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Passo {state.currentStep + 1} de {ONBOARDING_STEPS.length}
                </span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={previousStep}
                disabled={state.currentStep === 0}
                className="flex-1"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Voltar
              </Button>
              
              <Button
                onClick={handleNext}
                size="sm"
                className="flex-1"
              >
                {isLastStep ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Finalizar
                  </>
                ) : (
                  <>
                    Próximo
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
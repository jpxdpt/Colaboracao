import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { useAuthStore } from '../../stores/authStore';
import OnboardingModal from './OnboardingModal';

export default function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { completed, currentStep, missions, startOnboarding, completeMission } = useOnboardingStore();
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);

  useEffect(() => {
    // Aguardar hidratação e verificar se é um novo utilizador
    if (!hasHydrated || !user) return;

    // Verificar se o utilizador acabou de se registar (primeira vez)
    const onboardingData = localStorage.getItem('onboarding-storage');
    const isNewUser = !onboardingData || JSON.parse(onboardingData).state?.completed === false;

    if (isNewUser && !completed) {
      startOnboarding();
    }
  }, [hasHydrated, user, completed, startOnboarding]);

  // Verificar se a missão atual foi completada
  useEffect(() => {
    if (completed || !hasHydrated || !user) return;

    const currentMission = missions[currentStep];
    if (!currentMission) return;

    // Verificar se está na rota correta
    if (location.pathname === currentMission.target) {
      // Marcar como completada após um pequeno delay (para dar tempo ao utilizador ver a página)
      const timer = setTimeout(() => {
        if (!currentMission.completed) {
          completeMission(currentMission.id);
        }
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [location.pathname, currentStep, missions, completed, hasHydrated, user, completeMission]);

  return (
    <>
      {children}
      {!completed && hasHydrated && user && <OnboardingModal />}
    </>
  );
}


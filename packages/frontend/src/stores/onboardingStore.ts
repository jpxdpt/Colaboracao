import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface OnboardingMission {
  id: string;
  title: string;
  description: string;
  target: string; // route or element selector
  completed: boolean;
  points?: number;
}

export interface OnboardingState {
  completed: boolean;
  currentStep: number;
  missions: OnboardingMission[];
  tooltipsShown: Set<string>;
  startOnboarding: () => void;
  completeMission: (missionId: string) => void;
  completeOnboarding: () => void;
  nextStep: () => void;
  previousStep: () => void;
  markTooltipShown: (tooltipId: string) => void;
  resetOnboarding: () => void;
}

const initialMissions: OnboardingMission[] = [
  {
    id: 'explore-dashboard',
    title: 'Explorar o Dashboard',
    description: 'Conheça o seu painel principal com todas as suas estatísticas!',
    target: '/dashboard',
    completed: false,
    points: 10,
  },
  {
    id: 'create-first-task',
    title: 'Criar Primeira Tarefa',
    description: 'Crie a sua primeira tarefa para começar a ganhar pontos!',
    target: '/tasks',
    completed: false,
    points: 25,
  },
  {
    id: 'complete-task',
    title: 'Completar uma Tarefa',
    description: 'Complete uma tarefa para ganhar pontos e aumentar o seu nível!',
    target: '/tasks',
    completed: false,
    points: 50,
  },
  {
    id: 'create-goal',
    title: 'Criar uma Meta',
    description: 'Defina uma meta pessoal e acompanhe o seu progresso!',
    target: '/goals',
    completed: false,
    points: 20,
  },
  {
    id: 'join-team',
    title: 'Juntar-se a uma Equipa',
    description: 'Colabore com colegas e participe em desafios de equipa!',
    target: '/teams',
    completed: false,
    points: 30,
  },
  {
    id: 'view-rankings',
    title: 'Ver Rankings',
    description: 'Veja como está a sua posição nos rankings semanais e mensais!',
    target: '/rankings',
    completed: false,
    points: 15,
  },
];

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      completed: false,
      currentStep: 0,
      missions: initialMissions,
      tooltipsShown: new Set<string>(),
      startOnboarding: () => {
        const user = localStorage.getItem('auth-storage');
        if (user) {
          try {
            const parsed = JSON.parse(user);
            // Se o utilizador já completou onboarding antes, não reiniciar
            const stored = localStorage.getItem('onboarding-storage');
            if (stored) {
              const onboardingData = JSON.parse(stored);
              if (onboardingData.state?.completed) {
                return;
              }
            }
          } catch (e) {
            // Ignorar erro
          }
        }
        set({ completed: false, currentStep: 0 });
      },
      completeMission: (missionId: string) => {
        set((state) => ({
          missions: state.missions.map((mission) =>
            mission.id === missionId
              ? { ...mission, completed: true }
              : mission
          ),
        }));
      },
      completeOnboarding: () => {
        set({ completed: true, currentStep: 0 });
      },
      nextStep: () => {
        set((state) => ({
          currentStep: Math.min(state.currentStep + 1, state.missions.length - 1),
        }));
      },
      previousStep: () => {
        set((state) => ({
          currentStep: Math.max(state.currentStep - 1, 0),
        }));
      },
      markTooltipShown: (tooltipId: string) => {
        set((state) => {
          const newSet = new Set(state.tooltipsShown);
          newSet.add(tooltipId);
          return { tooltipsShown: newSet };
        });
      },
      resetOnboarding: () => {
        set({
          completed: false,
          currentStep: 0,
          missions: initialMissions.map((m) => ({ ...m, completed: false })),
          tooltipsShown: new Set(),
        });
      },
    }),
    {
      name: 'onboarding-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        completed: state.completed,
        missions: state.missions,
        tooltipsShown: Array.from(state.tooltipsShown),
      }),
    }
  )
);


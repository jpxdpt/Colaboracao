import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, Circle, Trophy, ArrowRight, ArrowLeft } from 'lucide-react';
import { useOnboardingStore } from '../../stores/onboardingStore';
import { useThemeStore } from '../../stores/themeStore';
import Button from '../ui/Button';
import Card from '../ui/Card';

export default function OnboardingModal() {
  const {
    completed,
    currentStep,
    missions,
    completeOnboarding,
    nextStep,
    previousStep,
    completeMission,
  } = useOnboardingStore();
  const theme = useThemeStore((state) => state.theme);

  if (completed) return null;

  const currentMission = missions[currentStep];
  const completedMissions = missions.filter((m) => m.completed).length;
  const progress = (completedMissions / missions.length) * 100;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        style={{
          background: theme === 'dark' ? 'rgba(0, 0, 0, 0.75)' : 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
        }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-2xl"
        >
          <Card variant="default" className="p-6 relative" style={{ background: 'var(--surface-card)' }}>
            {/* Close Button */}
            <button
              onClick={completeOnboarding}
              className="absolute top-4 right-4 p-2 rounded-lg transition-colors"
              style={{
                background: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = theme === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
              }}
              aria-label="Fechar onboarding"
            >
              <X className="w-5 h-5" style={{ color: 'var(--color-text-primary)' }} />
            </button>

            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-purple rounded-xl flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                    Bem-vindo ao Gamify! 🎮
                  </h2>
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    Complete as missões para ganhar pontos extras!
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-2">
                <div className="flex justify-between text-sm mb-1">
                  <span style={{ color: 'var(--color-text-secondary)' }}>
                    Missão {currentStep + 1} de {missions.length}
                  </span>
                  <span style={{ color: 'var(--color-text-secondary)' }}>
                    {completedMissions}/{missions.length} completas
                  </span>
                </div>
                <div
                  className="h-2 rounded-full overflow-hidden"
                  style={{ background: 'var(--surface-muted)' }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                    className="h-full bg-gradient-purple"
                  />
                </div>
              </div>
            </div>

            {/* Current Mission */}
            <div className="mb-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0 mt-1">
                  {currentMission.completed ? (
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                  ) : (
                    <Circle className="w-6 h-6" style={{ color: 'var(--color-text-muted)' }} />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                    {currentMission.title}
                  </h3>
                  <p className="mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                    {currentMission.description}
                  </p>
                  {currentMission.points && (
                    <div className="flex items-center gap-2 text-sm">
                      <span
                        className="font-semibold"
                        style={{
                          color: theme === 'dark' ? '#a78bfa' : '#7c3aed',
                        }}
                      >
                        +{currentMission.points} pontos
                      </span>
                      <span style={{ color: 'var(--color-text-muted)' }}>ao completar</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Mission List */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                Todas as Missões:
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {missions.map((mission, index) => {
                  const isCurrent = index === currentStep;
                  const isCompleted = mission.completed;
                  
                  return (
                    <div
                      key={mission.id}
                      className="flex items-center gap-3 p-3 rounded-lg transition-colors border-2"
                      style={{
                        background: isCurrent
                          ? theme === 'dark'
                            ? 'rgba(139, 92, 246, 0.2)'
                            : 'rgba(139, 92, 246, 0.1)'
                          : isCompleted
                          ? theme === 'dark'
                            ? 'rgba(34, 197, 94, 0.15)'
                            : 'rgba(34, 197, 94, 0.08)'
                          : 'transparent',
                        borderColor: isCurrent
                          ? '#8b5cf6'
                          : isCompleted
                          ? theme === 'dark'
                            ? 'rgba(34, 197, 94, 0.3)'
                            : 'rgba(34, 197, 94, 0.2)'
                          : 'transparent',
                      }}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--color-text-muted)' }} />
                      )}
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-medium"
                          style={{
                            color: isCurrent
                              ? theme === 'dark'
                                ? '#a78bfa'
                                : '#7c3aed'
                              : isCompleted
                              ? 'var(--color-text-primary)'
                              : 'var(--color-text-secondary)',
                          }}
                        >
                          {mission.title}
                        </p>
                      </div>
                      {mission.points && (
                        <span
                          className="text-xs font-semibold flex-shrink-0"
                          style={{
                            color: theme === 'dark' ? '#a78bfa' : '#7c3aed',
                          }}
                        >
                          +{mission.points}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between gap-4">
              <Button
                variant="secondary"
                onClick={previousStep}
                disabled={currentStep === 0}
                icon={<ArrowLeft className="w-4 h-4" />}
              >
                Anterior
              </Button>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={completeOnboarding}>
                  Pular
                </Button>
                {currentStep < missions.length - 1 ? (
                  <Button variant="gamified" onClick={nextStep} icon={<ArrowRight className="w-4 h-4" />}>
                    Próxima
                  </Button>
                ) : (
                  <Button variant="gamified" onClick={completeOnboarding}>
                    Finalizar
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}


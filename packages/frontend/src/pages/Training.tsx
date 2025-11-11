import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  GraduationCap,
  Play,
  CheckCircle2,
  BookOpen,
  Video,
  FileText,
  Award,
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import Container from '../components/layout/Container';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import ProgressBar from '../components/gamification/ProgressBar';
import EmptyState from '../components/ui/EmptyState';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Modal from '../components/ui/Modal';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

interface Training {
  _id: string;
  title: string;
  description?: string;
  category: string;
  duration: number; // minutos
  type: 'text' | 'video' | 'quiz' | 'interactive';
  points: number;
  progress?: number;
  completed?: boolean;
  completedAt?: string;
}

export default function Training() {
  const [selectedTraining, setSelectedTraining] = useState<Training | null>(null);
  const [showModal, setShowModal] = useState(false);

  const { data: trainings, isLoading } = useQuery({
    queryKey: ['training'],
    queryFn: () => api.get<{ trainings: Training[] }>('/api/training'),
  });

  const { data: progressData } = useQuery({
    queryKey: ['training', 'progress'],
    queryFn: () => api.get<{ progress: Array<{ trainingId: string; progress: number }> }>('/api/training/progress'),
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="w-5 h-5" />;
      case 'quiz':
        return <FileText className="w-5 h-5" />;
      default:
        return <BookOpen className="w-5 h-5" />;
    }
  };

  const getTrainingProgress = (trainingId: string) => {
    return progressData?.progress?.find((p) => p.trainingId === trainingId)?.progress || 0;
  };

  const handleStartTraining = (training: Training) => {
    setSelectedTraining(training);
    setShowModal(true);
  };

  return (
    <Layout>
      <Container>
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Formação</h1>
            <p className="text-gray-600">Aprenda e desenvolva suas habilidades!</p>
          </motion.div>
        </div>

        {isLoading ? (
          <LoadingSpinner fullScreen text="Carregando formações..." />
        ) : !trainings?.trainings || trainings.trainings.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="Nenhuma formação disponível"
            description="As formações serão adicionadas em breve!"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trainings.trainings.map((training, index) => {
              const progress = getTrainingProgress(training._id);
              const isCompleted = progress >= 100;

              return (
                <motion.div
                  key={training._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card variant="interactive" glow="purple">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-purple rounded-xl flex items-center justify-center">
                          {getTypeIcon(training.type)}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{training.title}</h3>
                          <span className="text-xs text-gray-500">{training.category}</span>
                        </div>
                      </div>
                      {isCompleted && (
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                      )}
                    </div>

                    {training.description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {training.description}
                      </p>
                    )}

                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Progresso</span>
                        <span className="text-sm font-semibold text-purple-600">
                          {progress.toFixed(0)}%
                        </span>
                      </div>
                      <ProgressBar progress={progress} color="purple" />
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Play className="w-4 h-4" />
                        <span>{training.duration} min</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm font-semibold text-purple-600">
                        <Award className="w-4 h-4" />
                        <span>+{training.points} pts</span>
                      </div>
                    </div>

                    <div className="mt-4">
                      <Button
                        variant={isCompleted ? 'secondary' : 'gamified'}
                        className="w-full"
                        onClick={() => handleStartTraining(training)}
                        icon={isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                      >
                        {isCompleted ? 'Revisar' : 'Iniciar'}
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Training Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedTraining(null);
          }}
          title={selectedTraining?.title || 'Formação'}
          size="lg"
        >
          {selectedTraining && (
            <div className="space-y-4">
              <p className="text-gray-600">{selectedTraining.description}</p>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>Duração: {selectedTraining.duration} minutos</span>
                <span>Pontos: +{selectedTraining.points}</span>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <p className="text-gray-500 text-sm">
                  O conteúdo da formação será exibido aqui
                </p>
              </div>
            </div>
          )}
        </Modal>
      </Container>
    </Layout>
  );
}


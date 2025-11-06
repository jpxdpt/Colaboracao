import { useState, useEffect } from 'react';
import { Play, Square, Clock, Pause } from 'lucide-react';
import { timeEntryService } from '../services/timeEntryService';
import { TimeEntry } from '../types';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale/pt';

interface TimeTrackerProps {
  taskId: string;
  onUpdate?: () => void;
}

const TimeTracker = ({ taskId, onUpdate }: TimeTrackerProps) => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<TimeEntry | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [summary, setSummary] = useState<{
    total_entries: number;
    total_minutes: number;
    formatted_time: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTimeEntries();
    loadSummary();
  }, [taskId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && currentEntry) {
      interval = setInterval(() => {
        const start = new Date(currentEntry.start_time).getTime();
        const now = Date.now();
        setElapsedTime(Math.floor((now - start) / 1000 / 60)); // minutos
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, currentEntry]);

  const loadTimeEntries = async () => {
    try {
      const entries = await timeEntryService.getTimeEntries({ task_id: taskId });
      setTimeEntries(entries);
      // Verificar se há entrada ativa
      const activeEntry = entries.find((e) => !e.end_time);
      if (activeEntry) {
        setCurrentEntry(activeEntry);
        setIsRunning(true);
      }
    } catch (error) {
      console.error('Error loading time entries:', error);
    }
  };

  const loadSummary = async () => {
    try {
      const summaryData = await timeEntryService.getTaskTimeSummary(taskId);
      setSummary(summaryData);
    } catch (error) {
      console.error('Error loading summary:', error);
    }
  };

  const handleStart = async () => {
    try {
      setLoading(true);
      const entry = await timeEntryService.createTimeEntry({
        task_id: taskId,
        start_time: new Date().toISOString(),
      });
      setCurrentEntry(entry);
      setIsRunning(true);
      setElapsedTime(0);
      await loadTimeEntries();
      await loadSummary();
      onUpdate?.();
    } catch (error) {
      console.error('Error starting timer:', error);
      alert('Erro ao iniciar timer');
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    if (!currentEntry) return;

    try {
      setLoading(true);
      await timeEntryService.updateTimeEntry(currentEntry.id, {
        end_time: new Date().toISOString(),
      });
      setCurrentEntry(null);
      setIsRunning(false);
      setElapsedTime(0);
      await loadTimeEntries();
      await loadSummary();
      onUpdate?.();
    } catch (error) {
      console.error('Error stopping timer:', error);
      alert('Erro ao parar timer');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins.toString().padStart(2, '0')}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="space-y-4">
      {/* Timer */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Registo de Tempo</h3>
          </div>
          {summary && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total: <span className="font-medium">{summary.formatted_time}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {!isRunning ? (
            <button
              onClick={handleStart}
              disabled={loading}
              className="btn btn-primary flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              Iniciar
            </button>
          ) : (
            <>
              <div className="flex-1">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatTime(elapsedTime)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  A decorrer desde{' '}
                  {currentEntry &&
                    format(new Date(currentEntry.start_time), "HH:mm", { locale: pt })}
                </div>
              </div>
              <button
                onClick={handleStop}
                disabled={loading}
                className="btn btn-secondary flex items-center gap-2"
              >
                <Square className="w-4 h-4" />
                Parar
              </button>
            </>
          )}
        </div>
      </div>

      {/* Histórico */}
      {timeEntries.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Histórico</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {timeEntries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm"
              >
                <div>
                  <div className="text-gray-900 dark:text-white">
                    {format(new Date(entry.start_time), "d 'de' MMM 'às' HH:mm", { locale: pt })}
                    {entry.end_time &&
                      ` - ${format(new Date(entry.end_time), 'HH:mm', { locale: pt })}`}
                  </div>
                  {entry.description && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">{entry.description}</div>
                  )}
                </div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {timeEntryService.formatTime(entry.duration)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeTracker;


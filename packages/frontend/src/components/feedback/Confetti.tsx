import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

interface ConfettiProps {
  trigger: boolean;
  type?: 'default' | 'celebration' | 'success' | 'fireworks';
  duration?: number;
}

export default function Confetti({
  trigger,
  type = 'default',
  duration = 3000,
}: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!trigger || !canvasRef.current) return;

    const myConfetti = confetti.create(canvasRef.current, {
      resize: true,
      useWorker: true,
    });

    const end = Date.now() + duration;

    const configs: Record<string, () => void> = {
      default: () => {
        const interval = setInterval(() => {
          if (Date.now() > end) {
            clearInterval(interval);
            return;
          }

          myConfetti({
            particleCount: 2,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#8b5cf6', '#ec4899', '#f59e0b'],
          });
          myConfetti({
            particleCount: 2,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#8b5cf6', '#ec4899', '#f59e0b'],
          });
        }, 250);
      },
      celebration: () => {
        const interval = setInterval(() => {
          if (Date.now() > end) {
            clearInterval(interval);
            return;
          }

          myConfetti({
            particleCount: 50,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981'],
          });
        }, 200);
      },
      success: () => {
        myConfetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#34d399'],
        });
      },
      fireworks: () => {
        const duration = 5000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        function randomInRange(min: number, max: number) {
          return Math.random() * (max - min) + min;
        }

        const interval = setInterval(() => {
          const timeLeft = animationEnd - Date.now();

          if (timeLeft <= 0) {
            clearInterval(interval);
            return;
          }

          const particleCount = 50 * (timeLeft / duration);
          myConfetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
            colors: ['#8b5cf6', '#ec4899', '#f59e0b'],
          });
          myConfetti({
            ...defaults,
            particleCount,
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
            colors: ['#10b981', '#3b82f6', '#f59e0b'],
          });
        }, 250);
      },
    };

    configs[type]();

    return () => {
      myConfetti.reset();
    };
  }, [trigger, type, duration]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9999]"
      style={{ width: '100%', height: '100%' }}
    />
  );
}


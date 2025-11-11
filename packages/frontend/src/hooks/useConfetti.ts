import { useState, useCallback } from 'react';

export function useConfetti() {
  const [trigger, setTrigger] = useState(false);

  const fire = useCallback(() => {
    setTrigger(true);
    setTimeout(() => setTrigger(false), 100);
  }, []);

  return { trigger, fire };
}


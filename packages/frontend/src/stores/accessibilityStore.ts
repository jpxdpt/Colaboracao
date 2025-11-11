import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface AccessibilityState {
  highContrast: boolean;
  reducedMotion: boolean;
  fontSize: 'normal' | 'large' | 'extra-large';
  toggleHighContrast: () => void;
  toggleReducedMotion: () => void;
  setFontSize: (size: 'normal' | 'large' | 'extra-large') => void;
}

export const useAccessibilityStore = create<AccessibilityState>()(
  persist(
    (set) => ({
      highContrast: false,
      reducedMotion: false,
      fontSize: 'normal',
      toggleHighContrast: () => {
        set((state) => {
          const newValue = !state.highContrast;
          // Aplicar classe ao body
          if (typeof document !== 'undefined') {
            if (newValue) {
              document.documentElement.classList.add('high-contrast');
            } else {
              document.documentElement.classList.remove('high-contrast');
            }
          }
          return { highContrast: newValue };
        });
      },
      toggleReducedMotion: () => {
        set((state) => {
          const newValue = !state.reducedMotion;
          // Aplicar classe ao body
          if (typeof document !== 'undefined') {
            if (newValue) {
              document.documentElement.classList.add('reduce-motion');
            } else {
              document.documentElement.classList.remove('reduce-motion');
            }
          }
          return { reducedMotion: newValue };
        });
      },
      setFontSize: (size) => {
        set({ fontSize: size });
        if (typeof document !== 'undefined') {
          document.documentElement.classList.remove('font-normal', 'font-large', 'font-extra-large');
          document.documentElement.classList.add(`font-${size}`);
        }
      },
    }),
    {
      name: 'accessibility-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => {
        return (state) => {
          if (state && typeof document !== 'undefined') {
            // Aplicar preferências ao carregar
            if (state.highContrast) {
              document.documentElement.classList.add('high-contrast');
            }
            if (state.reducedMotion) {
              document.documentElement.classList.add('reduce-motion');
            }
            document.documentElement.classList.add(`font-${state.fontSize}`);
          }
        };
      },
    }
  )
);


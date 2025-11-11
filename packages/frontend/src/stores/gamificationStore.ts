import { create } from 'zustand';

interface Badge {
  _id: string;
  name: string;
  description: string;
  icon: string;
  rarity: string;
  earnedAt?: Date;
}

interface LevelProgress {
  currentLevel: number;
  nextLevel: number | null;
  pointsCurrent: number;
  pointsNext: number | null;
  progress: number;
}

interface GamificationState {
  totalPoints: number;
  badges: Badge[];
  levelProgress: LevelProgress | null;
  setTotalPoints: (points: number) => void;
  setBadges: (badges: Badge[]) => void;
  setLevelProgress: (progress: LevelProgress) => void;
}

export const useGamificationStore = create<GamificationState>((set) => ({
  totalPoints: 0,
  badges: [],
  levelProgress: null,
  setTotalPoints: (points) => set({ totalPoints: points }),
  setBadges: (badges) => set({ badges }),
  setLevelProgress: (progress) => set({ levelProgress: progress }),
}));


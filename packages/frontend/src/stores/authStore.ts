import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  setAuth: (user: User, token: string, refreshToken: string) => void;
  setToken: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      _hasHydrated: false,
      setHasHydrated: (state) => {
        set({
          _hasHydrated: state,
        });
      },
      setAuth: (user, token, refreshToken) => {
        set({
          user,
          token,
          refreshToken,
          _hasHydrated: true,
        });
      },
      setToken: (token) =>
        set({
          token,
        }),
      logout: () => {
        // Limpar cache do React Query ao fazer logout
        if (typeof window !== 'undefined') {
          // Importar dinamicamente para evitar dependência circular
          import('../main').then(({ queryClient }) => {
            queryClient.clear();
          }).catch(() => {
            // Se falhar, tentar limpar localStorage manualmente
            console.warn('Não foi possível limpar cache do React Query');
          });
        }
        set({
          user: null,
          token: null,
          refreshToken: null,
        });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      // Callback após rehidratação - apenas para logging
      onRehydrateStorage: () => {
        // Log do localStorage antes da restauração
        const stored = localStorage.getItem('auth-storage');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            console.log('📦 Dados no localStorage antes da restauração:', {
              hasState: !!parsed.state,
              hasUser: !!parsed.state?.user,
              hasToken: !!parsed.state?.token,
              structure: Object.keys(parsed)
            });
          } catch (e) {
            console.error('Erro ao parsear localStorage:', e);
          }
        }
        
        return (state, error) => {
          if (error) {
            console.error('Erro ao rehidratar auth store:', error);
            return;
          }
          
          if (state) {
            console.log('✅ Auth Store rehidratado:', {
              hasUser: !!state.user,
              hasToken: !!state.token,
              user: state.user?.email,
              tokenLength: state.token?.length,
              stateKeys: Object.keys(state)
            });
          } else {
            console.warn('⚠️ Estado vazio após rehidratação');
          }
        };
      },
      // Não usar partialize - deixar o Zustand persistir tudo exceto _hasHydrated
      // O _hasHydrated será sempre false no início e marcado como true após rehidratação
      partialize: (state) => {
        // Persistir apenas os dados de autenticação, não o flag de hidratação
        const { _hasHydrated, ...persistedState } = state;
        return persistedState;
      },
    }
  )
);


// Selector helper para isAuthenticated
export const useIsAuthenticated = () => {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  return !!(user && token);
};


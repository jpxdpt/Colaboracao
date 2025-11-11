import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';
import { useThemeStore } from './stores/themeStore';

// Initialize theme on app start
useThemeStore.getState().setTheme(
  localStorage.getItem('theme-storage') 
    ? JSON.parse(localStorage.getItem('theme-storage') || '{}').state?.theme || 'light'
    : 'light'
);

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);


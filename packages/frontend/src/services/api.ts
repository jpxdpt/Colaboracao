import { useAuthStore } from '../stores/authStore';

const getDefaultApiUrl = () => {
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    const devTunnelMatch = origin.match(/https:\/\/([a-z0-9-]+)-(\d+)\.[^/]+/);
    if (devTunnelMatch) {
      const subdomain = devTunnelMatch[1];
      return `https://${subdomain}-3000.uks1.devtunnels.ms`;
    }
  }
  return 'http://localhost:3000';
};

const API_URL = import.meta.env.VITE_API_URL || getDefaultApiUrl();

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

class ApiClient {
  private isRefreshing = false;
  private refreshPromise: Promise<string> | null = null;

  private isTokenExpired(token: string): boolean {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`)
          .join('')
      );
      const decoded = JSON.parse(jsonPayload);
      if (decoded.exp) {
        return Date.now() >= decoded.exp * 1000;
      }
      return false;
    } catch (error) {
      console.error('Erro ao verificar expiração do token:', error);
      return false;
    }
  }

  private getHeaders(): HeadersInit {
    const state = useAuthStore.getState();
    const { token } = state;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token && !this.isTokenExpired(token)) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  private async refreshAccessToken(): Promise<string> {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      const { refreshToken } = useAuthStore.getState();

      if (!refreshToken) {
        this.isRefreshing = false;
        this.refreshPromise = null;
        throw new Error('No refresh token available');
      }

      try {
        const response = await fetch(`${API_URL}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
          credentials: 'include',
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to refresh token');
        }

        const data = await response.json();
        const payload = data.data ?? data;
        const tokens = payload.tokens ?? payload;

        const newAccessToken = tokens.accessToken;
        const newRefreshToken = tokens.refreshToken;

        if (!newAccessToken) {
          throw new Error('No access token in refresh response');
        }

        const authStore = useAuthStore.getState();
        authStore.setToken(newAccessToken);
        if (newRefreshToken) {
          authStore.setAuth(authStore.user!, newAccessToken, newRefreshToken);
        }

        this.isRefreshing = false;
        this.refreshPromise = null;
        return newAccessToken;
      } catch (error) {
        this.isRefreshing = false;
        this.refreshPromise = null;
        useAuthStore.getState().logout();
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        throw error;
      }
    })();

    return this.refreshPromise;
  }

  private async request<T>(
    method: HttpMethod,
    endpoint: string,
    body?: unknown,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_URL}${endpoint}`;
    const isAuthRoute =
      endpoint.includes('/auth/login') ||
      endpoint.includes('/auth/register') ||
      endpoint.includes('/auth/refresh');

    if (!isAuthRoute && !endpoint.includes('/auth/users/export')) {
      const { token } = useAuthStore.getState();
      if (!token) {
        throw new Error('Não autenticado. Por favor, faça login.');
      }
    }

    try {
      const response = await fetch(url, {
        method,
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (response.status === 401 && !isAuthRoute) {
        try {
          await this.refreshAccessToken();
          return this.request<T>(method, endpoint, body, options);
        } catch (error) {
          throw new Error('Sessão expirada. Por favor, faça login novamente.');
        }
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          error: `Erro HTTP ${response.status}`,
        }));
        throw new Error(error.error || error.message || `HTTP ${response.status}`);
      }

      if (response.status === 204) {
        return {} as T;
      }

      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new Error('Não foi possível conectar ao servidor. Verifique se o backend está rodando.');
      }
      throw error;
    }
  }

  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>('GET', endpoint, undefined, options);
  }

  async post<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>('POST', endpoint, body, options);
  }

  async put<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>('PUT', endpoint, body, options);
  }

  async patch<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>('PATCH', endpoint, body, options);
  }

  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>('DELETE', endpoint, undefined, options);
  }

  async download(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = `${API_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || `HTTP ${response.status}`);
    }
    return response;
  }
}

export const api = new ApiClient();



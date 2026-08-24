import axios from 'axios';
import { useAuthStore } from '../store/authStore';

export const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.params && typeof config.params === 'object') {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(config.params)) {
      if (value !== '' && value !== null && value !== undefined) {
        cleaned[key] = value;
      }
    }
    config.params = cleaned;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().clearSession();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message ?? error.message ?? 'Ocurrio un error inesperado';
  }
  if (error instanceof Error) return error.message;
  return 'Ocurrio un error inesperado';
}

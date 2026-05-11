import axios from 'axios';
import { useAuthStore } from '@/store/useAuthStore';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Network error occurred';
    
    if (typeof window !== 'undefined') {
      // Dynamic import to avoid SSR issues
      import('sonner').then(({ toast }) => {
        toast.error(`System Protocol Error: ${message}`, {
          description: `Endpoint: ${error.config?.url}`,
          duration: 10000,
        });
      });
    }

    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
        // Return a pending promise to stop the error from bubbling up while redirecting
        return new Promise(() => {}); 
      }
    }
    return Promise.reject(error);
  }
);

export default api;

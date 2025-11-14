import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || '30000', 10);

export const api = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT,
  withCredentials: true, // Importante para CSRF cookies e sessão
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar CSRF token em todas as requisições
api.interceptors.request.use(
  (config) => {
    const csrfToken = sessionStorage.getItem('csrf_token');
    if (csrfToken && config.method !== 'get') {
      config.headers['X-CSRF-Token'] = csrfToken;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para tratamento de erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403 && error.response?.data?.error === 'Token CSRF inválido') {
      // CSRF token expirado - recarregar página
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

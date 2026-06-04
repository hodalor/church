import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const normalizeApiBaseUrl = (value) => {
  const raw = String(value || '').trim();
  if (!raw) {
    return 'http://localhost:5000/api/v1';
  }

  try {
    const url = new URL(raw);
    const pathname = url.pathname.replace(/\/+$/, '');

    if (!pathname || pathname === '') {
      url.pathname = '/api/v1';
      return url.toString().replace(/\/$/, '');
    }

    if (pathname === '/api/v1' || pathname.endsWith('/api/v1')) {
      return url.toString().replace(/\/$/, '');
    }

    url.pathname = `${pathname}/api/v1`;
    return url.toString().replace(/\/$/, '');
  } catch {
    const normalized = raw.replace(/\/+$/, '');
    if (normalized === '/api/v1' || normalized.endsWith('/api/v1')) {
      return normalized;
    }

    return `${normalized}/api/v1`;
  }
};

const API_BASE_URL = normalizeApiBaseUrl(
  process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL,
);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
      return;
    }

    resolve(token);
  });

  failedQueue = [];
};

api.interceptors.request.use(
  (config) => {
    const { accessToken, tenantId } = useAuthStore.getState();

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    if (tenantId) {
      config.headers['X-Tenant-ID'] = tenantId;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isUnauthorized = error.response?.status === 401;
    const isRefreshRequest = originalRequest?.url?.includes('/auth/refresh');

    if (!isUnauthorized || !originalRequest || isRefreshRequest) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      await useAuthStore.getState().logout();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch((refreshError) => Promise.reject(refreshError));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const nextAccessToken = await useAuthStore.getState().refreshAccessToken();
      processQueue(null, nextAccessToken);
      originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      await useAuthStore.getState().logout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;

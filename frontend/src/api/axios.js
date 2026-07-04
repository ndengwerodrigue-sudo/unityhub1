import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 120000,
  maxContentLength: 50 * 1024 * 1024,
  maxBodyLength: 50 * 1024 * 1024,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

let isRefreshing = false;
let refreshQueue = [];

const getStoredToken = () => {
  const raw = localStorage.getItem('token');
  if (!raw) return null;
  const token = raw.trim().replace(/^["']|["']$/g, '');
  if (!token || token === 'null' || token === 'undefined') return null;
  return token;
};

export const clearAuthStorage = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

const processQueue = (error, token = null) => {
  refreshQueue.forEach((cb) => cb(error, token));
  refreshQueue = [];
};

api.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    if (status === 429) {
      return Promise.reject(error);
    }

    if (status === 401 && original && !original._retry && !original.url?.includes('/auth/refresh')) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push((err, token) => {
            if (err) reject(err);
            else {
              original.headers.Authorization = `Bearer ${token}`;
              resolve(api(original));
            }
          });
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const { data } = await api.post('/auth/refresh');
        const newToken = data.accessToken || data.token;
        localStorage.setItem('token', newToken);
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        processQueue(null, newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAuthStorage();
        if (!window.location.pathname.includes('/login')) {
          sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
          window.location.href = '/login?session=expired';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export const getApiBaseUrl = () => API_BASE.replace(/\/api\/?$/, '');

export function getApiErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (!error?.response) {
    return 'Network error. Please check your connection and try again.';
  }
  if (error.response.status === 429) {
    return error.response.data?.message || 'Too many requests. Please wait a minute and try again.';
  }
  const validation = error.response.data?.errors?.[0]?.msg;
  if (validation) return validation;
  return error.response.data?.message || fallback;
}

export default api;

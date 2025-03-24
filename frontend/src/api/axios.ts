import axios from 'axios';
import { logout } from '../store/slices/authSlice';
import { store } from '../store/store';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

const refreshToken = async () => {
  try {
    const refresh = localStorage.getItem('refreshToken');
    if (!refresh) {
      store.dispatch(logout());
      return null;
    }

    const response = await axios.post('http://localhost:8000/api/token/refresh/', {
      refresh: refresh
    });

    const { access } = response.data;
    localStorage.setItem('token', access);
    return access;
  } catch (error) {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    store.dispatch(logout());
    return null;
  }
};

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Error en interceptor de request:', error);
    return Promise.reject(error);
  }
);

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si no hay respuesta del servidor, rechazar inmediatamente
    if (!error.response) {
      return Promise.reject(error);
    }

    // Si el error no es 401 o ya intentamos refresh, rechazar
    if (error.response.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Si ya estamos refrescando, agregar a la cola
    if (isRefreshing) {
      try {
        const token = await new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        });
        if (token) {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axiosInstance(originalRequest);
        }
        return Promise.reject(error);
      } catch (err) {
        return Promise.reject(err);
      }
    }

    // Intentar refresh token
    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const newToken = await refreshToken();
      if (newToken) {
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axiosInstance(originalRequest);
      } else {
        processQueue(new Error('No se pudo refrescar el token'), null);
        return Promise.reject(error);
      }
    } catch (refreshError) {
      processQueue(refreshError, null);
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default axiosInstance; 
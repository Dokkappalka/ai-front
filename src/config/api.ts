import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useMainStore } from '../store/mainStore';
import { refreshToken } from '../api/fetchRefresh';
import config from '../config.ts'

// Конфигурация API
export const API_CONFIG = {
  baseURL: config.API_URL,
  timeout: 10000,
} as const;

// Создаем единый экземпляр axios
export const apiClient = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  withCredentials: true,
});

// Механизм очереди для множественных запросов
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Request interceptor для добавления токена
apiClient.interceptors.request.use(
  (config) => {
    const accessToken = useMainStore.getState().accessToken;
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor для обработки 401
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Если это не 401 или запрос уже был повторен, возвращаем ошибку
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Исключаем refresh endpoint из автоматической обработки
    if (originalRequest.url?.includes('/auth/refresh/')) {
      return Promise.reject(error);
    }

    // Если refresh уже выполняется, добавляем запрос в очередь
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return apiClient(originalRequest);
        })
        .catch((err) => {
          return Promise.reject(err);
        });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Выполняем refresh токена
      const refreshData = await refreshToken();
      const newAccessToken = refreshData.access;
      useMainStore.getState().setAccessToken(newAccessToken);

      // Обновляем заголовок оригинального запроса
      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      }

      // Обрабатываем очередь успешно
      processQueue(null, newAccessToken);

      // Повторяем оригинальный запрос
      return apiClient(originalRequest);
    } catch (refreshError) {
      // Если refresh вернул 401, разлогиниваем пользователя
      if ((refreshError as AxiosError).response?.status === 401) {
        useMainStore.getState().logout();
        // ProtectedRoute автоматически перенаправит на /login
      }

      // Обрабатываем очередь с ошибкой
      processQueue(refreshError as AxiosError);

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);


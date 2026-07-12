import axios, {
  AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios';
import { env } from '@/config/env';

interface RetryableRequestConfig
  extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

export const apiClient = axios.create({
  baseURL: env.API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15_000,
});

let refreshRequest: Promise<void> | null = null;

const refreshSession = async (): Promise<void> => {
  await axios.post(
    `${env.API_URL}/auth/refresh`,
    {},
    {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const request = error.config as
      | RetryableRequestConfig
      | undefined;

    if (!request || error.response?.status !== 401) {
      return Promise.reject(error);
    }

    const requestUrl = request.url ?? '';

    const isPublicAuthRequest = [
      '/auth/login',
      '/auth/register',
      '/auth/refresh',
    ].some((path) => requestUrl.includes(path));

    if (request._retry || isPublicAuthRequest) {
      return Promise.reject(error);
    }

    request._retry = true;

    try {
      if (!refreshRequest) {
        refreshRequest = refreshSession().finally(() => {
          refreshRequest = null;
        });
      }

      await refreshRequest;

      return apiClient(request);
    } catch {
      return Promise.reject(error);
    }
  }
);
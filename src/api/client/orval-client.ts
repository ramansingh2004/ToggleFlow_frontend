import type {
  AxiosError,
  AxiosRequestConfig,
} from 'axios';
import { apiClient } from './api-client';

export const customInstance = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig
): Promise<T> => {
  return apiClient({
    ...config,
    ...options,
    headers: {
      ...config.headers,
      ...options?.headers,
    },
  }).then(({ data }) => data);
};

export type ErrorType<T> = AxiosError<T>;
export type BodyType<T> = T;
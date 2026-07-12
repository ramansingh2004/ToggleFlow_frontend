import axios from 'axios';
import type { ApiError } from '@/api/generated/models';

export function getApiErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.'
): string {
  if (axios.isAxiosError<ApiError>(error)) {
    return (
      error.response?.data?.error?.message ??
      error.message ??
      fallback
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}
const apiUrl =
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:5000/api/v1';

const appUrl =
  process.env.NEXT_PUBLIC_APP_URL ??
  'http://localhost:3000';

export const env = {
  API_URL: apiUrl.replace(/\/$/, ''),
  APP_URL: appUrl.replace(/\/$/, ''),
} as const;
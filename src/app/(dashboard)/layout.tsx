import type { ReactNode } from 'react';
import { AuthGuard } from '@/components/auth/auth-guard';

export default function DashboardLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return <AuthGuard>{children}</AuthGuard>;
}
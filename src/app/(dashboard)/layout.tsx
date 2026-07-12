import type { ReactNode } from 'react';
import { AuthGuard } from '@/components/auth/auth-guard';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export default function DashboardLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <AuthGuard>
      <DashboardShell>{children}</DashboardShell>
    </AuthGuard>
  );
}
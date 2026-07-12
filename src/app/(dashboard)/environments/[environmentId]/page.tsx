import { EnvironmentDetailPage } from '@/components/environments/environment-detail-page';

interface EnvironmentPageProps {
  params: Promise<{
    environmentId: string;
  }>;
}

export default async function EnvironmentPage({
  params,
}: EnvironmentPageProps) {
  const { environmentId } = await params;

  return (
    <EnvironmentDetailPage
      environmentId={environmentId}
    />
  );
}
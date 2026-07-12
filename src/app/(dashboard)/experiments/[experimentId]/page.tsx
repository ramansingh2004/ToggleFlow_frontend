import { ExperimentDetailPage } from '@/components/experiments/experiment-detail-page';

interface ExperimentRouteProps {
  params: Promise<{
    experimentId: string;
  }>;
}

export default async function ExperimentRoute({
  params,
}: ExperimentRouteProps) {
  const { experimentId } = await params;

  return (
    <ExperimentDetailPage
      experimentId={experimentId}
    />
  );
}
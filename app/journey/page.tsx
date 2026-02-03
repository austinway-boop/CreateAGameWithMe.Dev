'use client';

import { JourneyView } from '@/components/JourneyView';
import { useProject } from '@/hooks/useProject';
import { JourneySkeleton } from '@/components/LoadingScreen';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function JourneyContent() {
  const { project, loading, isInitialLoad } = useProject();
  const searchParams = useSearchParams();
  const completedStep = searchParams.get('completed');

  if (isInitialLoad && loading) {
    return <JourneySkeleton />;
  }

  return <JourneyView currentStep={project?.currentPage} completedStep={completedStep} />;
}

export default function JourneyPage() {
  return (
    <Suspense fallback={<JourneySkeleton />}>
      <JourneyContent />
    </Suspense>
  );
}

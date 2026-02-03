'use client';

import { JourneyView } from '@/components/JourneyView';
import { useProject } from '@/hooks/useProject';
import { JourneySkeleton } from '@/components/LoadingScreen';

export default function JourneyPage() {
  const { project, loading, isInitialLoad } = useProject();

  if (isInitialLoad && loading) {
    return <JourneySkeleton />;
  }

  return <JourneyView currentStep={project?.currentPage} />;
}

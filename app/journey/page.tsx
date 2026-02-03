'use client';

import { JourneyView } from '@/components/JourneyView';
import { useProject } from '@/hooks/useProject';
import { LoadingScreen } from '@/components/LoadingScreen';
import { useEffect, useState } from 'react';

export default function JourneyPage() {
  const { project, loading, isInitialLoad, retryLoad } = useProject();
  const [forceShow, setForceShow] = useState(false);

  // Show the journey view after a short delay even if still loading
  // This prevents long loading screens on slow database connections
  useEffect(() => {
    const timer = setTimeout(() => {
      setForceShow(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Show loading only on initial load and before timeout
  if (isInitialLoad && loading && !forceShow) {
    return <LoadingScreen message="Loading your journey" onRetry={retryLoad} />;
  }

  return <JourneyView currentStep={project?.currentPage} />;
}

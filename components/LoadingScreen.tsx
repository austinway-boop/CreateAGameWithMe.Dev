'use client';

import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LoadingScreenProps {
  onRetry?: () => void;
  retryDelayMs?: number;
}

export function LoadingScreen({ onRetry, retryDelayMs = 5000 }: LoadingScreenProps) {
  const [showRetry, setShowRetry] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowRetry(true);
    }, retryDelayMs);

    return () => clearTimeout(timer);
  }, [retryDelayMs]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4">
      <div className="text-muted-foreground">Loading...</div>
      {showRetry && onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Taking too long? Retry
        </Button>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LoadingScreenProps {
  onRetry?: () => void;
  retryDelayMs?: number;
  message?: string;
  submessage?: string;
}

export function LoadingScreen({ 
  onRetry, 
  retryDelayMs = 5000,
  message = 'Loading...',
  submessage
}: LoadingScreenProps) {
  const [showRetry, setShowRetry] = useState(false);

  useEffect(() => {
    setShowRetry(false);
    const timer = setTimeout(() => {
      setShowRetry(true);
    }, retryDelayMs);

    return () => clearTimeout(timer);
  }, [retryDelayMs]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <div className="text-center">
        <p className="text-muted-foreground">{message}</p>
        {submessage && (
          <p className="text-sm text-muted-foreground/70 mt-1">{submessage}</p>
        )}
      </div>
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

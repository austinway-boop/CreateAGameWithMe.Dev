'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LoadingScreenProps {
  onRetry?: () => void;
  retryDelayMs?: number;
  message?: string;
  submessage?: string;
  /** If true, shows a minimal inline loader instead of full screen */
  inline?: boolean;
}

export function LoadingScreen({ 
  onRetry, 
  retryDelayMs = 8000,
  message = 'Loading...',
  submessage,
  inline = false
}: LoadingScreenProps) {
  const [showRetry, setShowRetry] = useState(false);
  const [dots, setDots] = useState('');

  // Animated dots for visual feedback
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(d => d.length >= 3 ? '' : d + '.');
    }, 400);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setShowRetry(false);
    const timer = setTimeout(() => {
      setShowRetry(true);
    }, retryDelayMs);

    return () => clearTimeout(timer);
  }, [retryDelayMs]);

  if (inline) {
    return (
      <div className="flex items-center justify-center gap-2 py-8">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">{message}{dots}</span>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 min-h-[300px]">
      <div className="relative">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
      <div className="text-center">
        <p className="text-muted-foreground">{message}{dots}</p>
        {submessage && (
          <p className="text-sm text-muted-foreground/70 mt-1">{submessage}</p>
        )}
      </div>
      {showRetry && onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="gap-2 animate-in fade-in slide-in-from-bottom-2"
        >
          <RefreshCw className="h-4 w-4" />
          Taking too long? Retry
        </Button>
      )}
    </div>
  );
}

/** Skeleton placeholder for content that's loading */
export function LoadingSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-muted rounded ${className}`} />
  );
}

/** Card skeleton for pages that show cards */
export function CardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-6 space-y-4 animate-pulse">
      <div className="h-6 bg-muted rounded w-3/4" />
      <div className="space-y-2">
        <div className="h-4 bg-muted rounded w-full" />
        <div className="h-4 bg-muted rounded w-5/6" />
        <div className="h-4 bg-muted rounded w-4/6" />
      </div>
    </div>
  );
}

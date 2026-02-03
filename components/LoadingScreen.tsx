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

/** Journey page skeleton */
export function JourneySkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="px-6 py-3 flex justify-end">
        <div className="h-5 w-20 bg-gray-200 rounded animate-pulse" />
      </header>
      
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="h-5 w-72 bg-gray-200 rounded animate-pulse mb-8" />
        
        <div className="flex items-center gap-4 py-8">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
            <div key={i} className="flex flex-col items-center" style={{ marginTop: i % 2 === 0 ? 0 : 40 }}>
              <div className="w-16 h-16 rounded-full bg-gray-200 animate-pulse" />
              <div className="mt-2 h-3 w-12 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 rounded-2xl bg-white border border-gray-200 max-w-md w-full">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gray-200 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="w-11 h-11 rounded-xl bg-gray-200 animate-pulse" />
          </div>
        </div>
      </main>
    </div>
  );
}

/** Generic page skeleton */
export function PageSkeleton() {
  return (
    <div className="flex-1 flex flex-col p-6 max-w-4xl mx-auto w-full">
      <div className="h-8 w-64 bg-muted rounded animate-pulse mb-2" />
      <div className="h-5 w-96 bg-muted rounded animate-pulse mb-8" />
      <div className="space-y-4">
        <div className="h-32 bg-muted rounded-lg animate-pulse" />
        <div className="h-32 bg-muted rounded-lg animate-pulse" />
      </div>
    </div>
  );
}

/** Create page skeleton */
export function CreateSkeleton() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <div className="h-8 w-64 bg-muted rounded animate-pulse mx-auto" />
          <div className="h-5 w-48 bg-muted rounded animate-pulse mx-auto" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-32 bg-muted rounded-xl animate-pulse" />
          <div className="h-32 bg-muted rounded-xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}

/** Form page skeleton (ikigai, questions, etc) */
export function FormSkeleton() {
  return (
    <div className="flex-1 flex flex-col p-6 max-w-4xl mx-auto w-full">
      <div className="h-8 w-48 bg-muted rounded animate-pulse mb-2" />
      <div className="h-5 w-72 bg-muted rounded animate-pulse mb-6" />
      <div className="space-y-4">
        <div className="h-24 bg-muted rounded-lg animate-pulse" />
        <div className="h-24 bg-muted rounded-lg animate-pulse" />
        <div className="h-24 bg-muted rounded-lg animate-pulse" />
      </div>
      <div className="mt-6 flex justify-end">
        <div className="h-10 w-32 bg-muted rounded-lg animate-pulse" />
      </div>
    </div>
  );
}

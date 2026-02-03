'use client';

import { usePathname } from 'next/navigation';
import { AppHeader } from './AppHeader';
import { ProgressPath } from './ProgressPath';

// Routes that should show the app header and progress
const PROTECTED_ROUTES = [
  '/create',
  '/idea',
  '/ikigai',
  '/sparks',
  '/remix',
  '/finalize',
  '/gameloop',
  '/card',
  '/questions',
  '/skilltree',
  '/validation',
];

// Routes that show progress but might have different header behavior
const PROGRESS_ROUTES = [
  '/create',
  '/idea',
  '/ikigai',
  '/sparks',
  '/card',
  '/finalize',
  '/gameloop',
  '/questions',
  '/skilltree',
  '/validation',
];

export function PageWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  const showHeader = PROTECTED_ROUTES.some(route => pathname?.startsWith(route));
  const showProgress = PROGRESS_ROUTES.some(route => pathname?.startsWith(route));

  return (
    <>
      {showHeader && <AppHeader />}
      {showProgress && <ProgressPath />}
      <div className="flex-1 flex flex-col">
        {children}
      </div>
    </>
  );
}

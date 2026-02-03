'use client';

import { usePathname } from 'next/navigation';
import { AppHeader } from './AppHeader';

// Routes that should show the app header (activity pages)
const ACTIVITY_ROUTES = [
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

// Routes that handle their own layout (no wrapper)
const SELF_CONTAINED_ROUTES = [
  '/journey',
  '/onboarding',
  '/gameloop',
];

export function PageWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Check if this is a self-contained route (handles its own layout)
  const isSelfContained = SELF_CONTAINED_ROUTES.some(route => pathname?.startsWith(route));
  if (isSelfContained) {
    return <>{children}</>;
  }

  // Check if this is an activity route (show header, no progress path)
  const isActivity = ACTIVITY_ROUTES.some(route => pathname?.startsWith(route));

  return (
    <>
      {isActivity && <AppHeader />}
      <div className="flex-1 flex flex-col">
        {children}
      </div>
    </>
  );
}

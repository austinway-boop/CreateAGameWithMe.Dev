'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';
import { ProjectProvider } from '@/hooks/useProject';

interface ProvidersProps {
  children: ReactNode;
}

// Check if we should use mock auth
const USE_MOCK_AUTH = process.env.NEXT_PUBLIC_MOCK_AUTH === 'true';

export function Providers({ children }: ProvidersProps) {
  if (USE_MOCK_AUTH) {
    // In mock mode, don't use SessionProvider at all
    // The useAuth hook will return mock data
    return (
      <ProjectProvider>
        {children}
      </ProjectProvider>
    );
  }

  // Use real auth
  return (
    <SessionProvider>
      <ProjectProvider>
        {children}
      </ProjectProvider>
    </SessionProvider>
  );
}

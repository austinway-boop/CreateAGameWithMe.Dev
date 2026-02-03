'use client';

import { useSession } from 'next-auth/react';

// Check if mock auth is enabled - this is a build-time constant
const USE_MOCK_AUTH = process.env.NEXT_PUBLIC_MOCK_AUTH === 'true';
const MOCK_USER_ID = 'dev-user-123';

// Mock session data
const MOCK_SESSION_DATA = {
  user: {
    id: MOCK_USER_ID,
    name: 'Dev User',
    email: 'dev@example.com',
    image: null as string | null,
    username: 'devuser',
    onboardingComplete: true,
  },
  expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
};

// Hook for mock mode - always returns mock session
function useMockAuth() {
  return {
    data: MOCK_SESSION_DATA,
    status: 'authenticated' as const,
    update: async () => null,
  };
}

// Hook for real mode - wraps next-auth's useSession
function useRealAuth() {
  return useSession();
}

// Export the appropriate hook based on mock mode
// This is determined at build time, so only one version is used
export const useAuth = USE_MOCK_AUTH ? useMockAuth : useRealAuth;

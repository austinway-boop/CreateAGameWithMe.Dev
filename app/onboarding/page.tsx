'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { User, Users, ArrowRight, Loader2 } from 'lucide-react';
import { LoadingScreen } from '@/components/LoadingScreen';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type Step = 'username' | 'organization';

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, status, update: updateSession } = useAuth();
  const [step, setStep] = useState<Step>('username');
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOrgMessage, setShowOrgMessage] = useState(false);

  // Redirect if already onboarded
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.onboardingComplete) {
      router.push('/journey');
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return <LoadingScreen message="Loading your profile..." />;
  }

  if (!session?.user) {
    router.push('/');
    return null;
  }

  const validateUsername = (value: string): string | null => {
    const trimmed = value.trim();
    if (trimmed.length < 3) {
      return 'Username must be at least 3 characters';
    }
    if (trimmed.length > 20) {
      return 'Username must be 20 characters or less';
    }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      return 'Only letters, numbers, and underscores allowed';
    }
    return null;
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsername(value);
    
    // Clear error while typing
    if (usernameError) {
      setUsernameError(null);
    }
  };

  const checkUsernameAvailability = async (username: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/user?checkUsername=${encodeURIComponent(username)}`);
      const data = await response.json();
      return data.available;
    } catch {
      return false;
    }
  };

  const handleUsernameSubmit = async () => {
    const validationError = validateUsername(username);
    if (validationError) {
      setUsernameError(validationError);
      return;
    }

    setIsCheckingUsername(true);
    setUsernameError(null);

    const isAvailable = await checkUsernameAvailability(username.trim());
    
    if (!isAvailable) {
      setUsernameError('Username is already taken');
      setIsCheckingUsername(false);
      return;
    }

    setIsCheckingUsername(false);
    setStep('organization');
  };

  const handleOrganizationSelect = async (isOrg: boolean) => {
    if (isOrg) {
      setShowOrgMessage(true);
      return;
    }

    // Solo user - complete onboarding
    await completeOnboarding();
  };

  const handleOrgMessageContinue = async () => {
    await completeOnboarding();
  };

  const completeOnboarding = async () => {
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          onboardingComplete: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        setUsernameError(error.message || 'Failed to save');
        setIsSubmitting(false);
        setStep('username');
        return;
      }

      // Update the session to reflect new data
      await updateSession();

      // Navigate to journey page
      router.push('/journey');
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      setUsernameError('Something went wrong. Please try again.');
      setIsSubmitting(false);
      setStep('username');
    }
  };

  const renderStep = () => {
    if (showOrgMessage) {
      return (
        <>
          <div className="text-center space-y-2">
            <Users className="h-12 w-12 mx-auto text-muted-foreground" />
            <h2 className="text-xl font-medium">Coming Soon</h2>
            <p className="text-muted-foreground">
              Organizations are not supported yet.
            </p>
          </div>
          <Button
            onClick={handleOrgMessageContinue}
            disabled={isSubmitting}
            className="w-full gap-2"
            size="lg"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Continue
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </>
      );
    }

    switch (step) {
      case 'username':
        return (
          <>
            <h2 className="text-xl font-medium text-center">Choose a username</h2>
            <div className="space-y-3">
              <Input
                placeholder="Username"
                value={username}
                onChange={handleUsernameChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && username.trim()) {
                    handleUsernameSubmit();
                  }
                }}
                disabled={isCheckingUsername}
                className={usernameError ? 'border-destructive' : ''}
              />
              {usernameError && (
                <p className="text-sm text-destructive">{usernameError}</p>
              )}
            </div>
            <Button
              onClick={handleUsernameSubmit}
              disabled={!username.trim() || isCheckingUsername}
              className="w-full gap-2"
              size="lg"
            >
              {isCheckingUsername ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </>
        );

      case 'organization':
        return (
          <>
            <h2 className="text-xl font-medium text-center">Part of an organization?</h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleOrganizationSelect(true)}
                disabled={isSubmitting}
                className="p-6 rounded-lg border-2 border-border hover:border-primary transition-all flex flex-col items-center gap-3 disabled:opacity-50"
              >
                <Users className="h-8 w-8 text-muted-foreground" />
                <span className="font-medium">Yes</span>
              </button>
              <button
                onClick={() => handleOrganizationSelect(false)}
                disabled={isSubmitting}
                className="p-6 rounded-lg border-2 border-border hover:border-primary transition-all flex flex-col items-center gap-3 disabled:opacity-50"
              >
                <User className="h-8 w-8 text-muted-foreground" />
                <span className="font-medium">Solo</span>
              </button>
            </div>
            {isSubmitting && (
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}
          </>
        );
    }
  };

  const stepIndex = showOrgMessage ? 2 : ['username', 'organization'].indexOf(step);

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-[400px] space-y-8">
        {/* Header - No branding */}
        <div className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight">Welcome</h1>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2">
          {[0, 1].map((i) => (
            <div
              key={i}
              className={`h-2 w-2 rounded-full transition-colors ${
                i <= stepIndex ? 'bg-primary' : 'bg-border'
              }`}
            />
          ))}
        </div>

        {/* Step Card */}
        <Card className="border-2">
          <CardContent className="pt-6 space-y-6">
            {renderStep()}
          </CardContent>
        </Card>

        {/* Back button */}
        {step !== 'username' && !showOrgMessage && (
          <button
            onClick={() => setStep('username')}
            disabled={isSubmitting}
            className="block w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            ← Back
          </button>
        )}
        {showOrgMessage && (
          <button
            onClick={() => setShowOrgMessage(false)}
            disabled={isSubmitting}
            className="block w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            ← Back
          </button>
        )}
      </div>
    </div>
  );
}

import { auth, signIn } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Sparkles, Lightbulb, Gamepad2, Zap } from 'lucide-react';

export default async function LandingPage() {
  const session = await auth();

  // If user is already logged in, redirect to create
  if (session?.user) {
    redirect('/create');
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[600px] space-y-12 text-center">
          {/* Logo/Title */}
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="p-4 rounded-2xl bg-primary/10">
                <Gamepad2 className="h-12 w-12 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Create A Game With Me
            </h1>
            <p className="text-xl text-muted-foreground max-w-md mx-auto">
              Turn your ideas into game concepts with AI-powered ideation tools
            </p>
          </div>

          {/* Sign In Button */}
          <form
            action={async () => {
              'use server';
              await signIn('google', { redirectTo: '/create' });
            }}
          >
            <button
              type="submit"
              className="inline-flex items-center gap-3 px-8 py-4 text-lg font-medium rounded-xl bg-white text-black border-2 border-border hover:bg-gray-50 transition-all shadow-sm hover:shadow-md"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in with Google
            </button>
          </form>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
            <div className="p-6 rounded-xl border border-border bg-card">
              <div className="flex justify-center mb-4">
                <Lightbulb className="h-8 w-8 text-amber-500" />
              </div>
              <h3 className="font-semibold mb-2">Ideation Tools</h3>
              <p className="text-sm text-muted-foreground">
                Ikigai-based brainstorming to find your perfect game idea
              </p>
            </div>
            <div className="p-6 rounded-xl border border-border bg-card">
              <div className="flex justify-center mb-4">
                <Sparkles className="h-8 w-8 text-purple-500" />
              </div>
              <h3 className="font-semibold mb-2">AI Sparks</h3>
              <p className="text-sm text-muted-foreground">
                Generate unique game concepts tailored to your preferences
              </p>
            </div>
            <div className="p-6 rounded-xl border border-border bg-card">
              <div className="flex justify-center mb-4">
                <Zap className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="font-semibold mb-2">Concept Cards</h3>
              <p className="text-sm text-muted-foreground">
                Export beautiful concept cards with AI-generated art
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="p-6 text-center text-sm text-muted-foreground border-t">
        <p>Built for game developers, by game developers</p>
      </footer>
    </div>
  );
}

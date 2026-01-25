'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ComingSoonPage() {
  const router = useRouter();

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-[500px] space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-primary/10">
              <Rocket className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Coming Soon</h1>
        </div>

        {/* Back Button */}
        <Button
          variant="outline"
          onClick={() => router.push('/finalize')}
          className="w-full gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Your Concept
        </Button>

      </div>
    </div>
  );
}

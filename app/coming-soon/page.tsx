'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Rocket, Palette, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function ComingSoonPage() {
  const router = useRouter();

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-[500px] space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-primary/10">
              <Rocket className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Great Progress!</h1>
          <p className="text-muted-foreground">
            You&apos;ve mapped out your game loop. Next up: defining your game&apos;s tone and style.
          </p>
        </div>

        {/* What's Coming */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h2 className="font-medium text-center">Coming Soon: Tone &amp; Style Validation</h2>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <Palette className="h-5 w-5 text-purple-500 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Visual Style</p>
                  <p className="text-xs text-muted-foreground">Define your art direction, color palette, and visual identity</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <Sparkles className="h-5 w-5 text-amber-500 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Emotional Tone</p>
                  <p className="text-xs text-muted-foreground">Capture the feeling you want players to experience</p>
                </div>
              </div>
            </div>

            <p className="text-xs text-center text-muted-foreground pt-2">
              This feature is under development. Check back soon!
            </p>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="space-y-3">
          <Button
            variant="outline"
            onClick={() => router.push('/gameloop')}
            className="w-full gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Game Loop
          </Button>
          
          <Button
            variant="ghost"
            onClick={() => router.push('/card')}
            className="w-full"
          >
            View Concept Card
          </Button>
        </div>
      </div>
    </div>
  );
}

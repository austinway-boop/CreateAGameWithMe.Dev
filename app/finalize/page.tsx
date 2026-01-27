'use client';

import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { useProject } from '@/hooks/useProject';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function FinalizePage() {
  const router = useRouter();
  const { project, loading, updateProject } = useProject();

  if (loading || !project) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const canContinue = project.finalTitle.trim().length > 0 && project.finalConcept.trim().length > 10;

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-[600px] space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Your Concept</h1>
          <p className="text-muted-foreground mt-1">Put it in your own words</p>
        </div>

        {/* Main Card */}
        <Card>
          <CardContent className="pt-6 space-y-6">
            {/* Editable Title */}
            <div className="space-y-2">
              <Label>Game Title</Label>
              <Input
                placeholder="My Awesome Game"
                value={project.finalTitle}
                onChange={(e) => updateProject({ finalTitle: e.target.value })}
                className="text-lg font-semibold h-12"
              />
            </div>

            {/* Editable Concept */}
            <div className="space-y-2">
              <Label>Describe your game</Label>
              <Textarea
                placeholder="Write out your game concept in your own words. What is it about? What makes it unique? What does the player do?"
                value={project.finalConcept}
                onChange={(e) => updateProject({ finalConcept: e.target.value })}
                className="min-h-[200px]"
              />
              <p className="text-xs text-muted-foreground">
                Even if AI helped generate this, rewrite it in your own words to truly own it.
              </p>
            </div>

            {/* Continue Button */}
            <Button
              onClick={() => {
                updateProject({ currentPage: 'gameloop' });
                router.push('/gameloop');
              }}
              disabled={!canContinue}
              className="w-full gap-2"
              size="lg"
            >
              Continue to Game Loop
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Back Links */}
        <div className="flex justify-center gap-4 text-sm">
          {project.hasIdea ? (
            <button
              onClick={() => router.push('/idea')}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Edit idea
            </button>
          ) : (
            <button
              onClick={() => router.push('/sparks')}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back to sparks
            </button>
          )}
          <button
            onClick={() => router.push('/')}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Start over
          </button>
        </div>
      </div>
    </div>
  );
}

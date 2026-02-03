'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowRight, Sparkles, Loader2, Palette } from 'lucide-react';
import { useProject } from '@/hooks/useProject';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { FormSkeleton } from '@/components/LoadingScreen';
import { VIBE_OPTIONS } from '@/lib/types';

type LoadingStage = 'idle' | 'structuring' | 'creating-card';

export default function IdeaPage() {
  const router = useRouter();
  const { project, loading, updateProject, updateProjectAndSave, retryLoad } = useProject();
  const [loadingStage, setLoadingStage] = useState<LoadingStage>('idle');
  const [error, setError] = useState<string | null>(null);

  if (loading || !project) {
    return <FormSkeleton />;
  }

  const toggleVibe = (vibe: string) => {
    const current = project.vibeChips;
    const updated = current.includes(vibe)
      ? current.filter((v) => v !== vibe)
      : [...current, vibe];
    updateProject({ vibeChips: updated });
  };

  const handleStructure = async () => {
    if (!project.ideaDescription.trim()) return;

    setLoadingStage('structuring');
    setError(null);

    try {
      // Step 1: Structure the idea
      const structureResponse = await fetch('/api/structureIdea', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ideaDescription: project.ideaDescription,
          vibes: project.vibeChips,
          platform: project.platform,
          teamSize: project.teamSize,
          timeHorizon: project.timeHorizon,
        }),
      });

      if (!structureResponse.ok) {
        const err = await structureResponse.json();
        throw new Error(err.message || 'Failed to structure idea');
      }

      const structured = await structureResponse.json();
      await updateProjectAndSave({
        structuredIdea: structured,
        finalTitle: structured.title,
        finalConcept: structured.conceptParagraph,
      });

      // Step 2: Generate the concept card image
      setLoadingStage('creating-card');

      const imageResponse = await fetch('/api/generateImage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: structured.title,
          concept: structured.conceptParagraph,
          vibes: project.vibeChips,
        }),
      });

      if (!imageResponse.ok) {
        const err = await imageResponse.json();
        throw new Error(err.message || 'Failed to generate image');
      }

      const imageData = await imageResponse.json();
      
      // Use immediate save before navigation to avoid race condition
      await updateProjectAndSave({ conceptImage: imageData.imageUrl, currentPage: 'card' });

      // Redirect to journey with completion animation
      router.push('/journey?completed=idea');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoadingStage('idle');
    }
  };

  const canStructure = project.ideaDescription.trim().length > 10;
  const isLoading = loadingStage !== 'idle';

  const getButtonContent = () => {
    switch (loadingStage) {
      case 'structuring':
        return (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Structuring your idea...
          </>
        );
      case 'creating-card':
        return (
          <>
            <Palette className="h-4 w-4 animate-pulse" />
            Creating your concept card...
          </>
        );
      default:
        return (
          <>
            <Sparkles className="h-4 w-4" />
            Structure with AI
            <ArrowRight className="h-4 w-4" />
          </>
        );
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-[600px] space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Describe Your Idea</h1>
        </div>

        {/* Main Card */}
        <Card>
          <CardContent className="pt-6 space-y-6">
            {/* Idea Textarea */}
            <Textarea
              placeholder="A cozy game where you run a magical bookshop, recommending books to fantastical creatures based on their problems..."
              value={project.ideaDescription}
              onChange={(e) => updateProject({ ideaDescription: e.target.value })}
              className="min-h-[150px] text-base"
              disabled={isLoading}
            />

            {/* Vibe Chips */}
            <div className="space-y-3">
              <span className="text-sm font-medium">Vibe (optional)</span>
              <div className="flex flex-wrap gap-2">
                {VIBE_OPTIONS.map((vibe) => (
                  <Badge
                    key={vibe}
                    variant={project.vibeChips.includes(vibe) ? 'default' : 'outline'}
                    className={`cursor-pointer transition-colors ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
                    onClick={() => !isLoading && toggleVibe(vibe)}
                  >
                    {vibe}
                  </Badge>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            {/* Actions */}
            <div className="pt-2">
              <Button
                onClick={handleStructure}
                disabled={!canStructure || isLoading}
                className="w-full gap-2"
                size="lg"
              >
                {getButtonContent()}
              </Button>
            </div>

          </CardContent>
        </Card>

        {/* Back Link */}
        <button
          onClick={() => router.push('/create')}
          className={`block w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors ${isLoading ? 'pointer-events-none opacity-50' : ''}`}
        >
          ← Back to Setup
        </button>
      </div>
    </div>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowRight, Loader2, Shuffle } from 'lucide-react';
import { useProject } from '@/hooks/useProject';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  SCAMPER_PROMPTS,
  MATRIX_OPTIONS,
  ScamperMode,
  SparkRound,
  RemixConstraints,
} from '@/lib/types';

export default function RemixPage() {
  const router = useRouter();
  const { project, loading, updateProject } = useProject();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Remix state
  const [selectedScamper, setSelectedScamper] = useState<ScamperMode | null>(null);
  const [dislikeReason, setDislikeReason] = useState('');
  const [matrixSelections, setMatrixSelections] = useState({
    coreVerb: '',
    setting: '',
    progression: '',
    playerMotivation: '',
    sessionLength: '',
    twist: '',
  });
  
  // Manual ideas (when AI disabled)
  const [manualIdeas, setManualIdeas] = useState(['', '', '']);

  const aiEnabled = process.env.NEXT_PUBLIC_ENABLE_AI === 'true';

  if (loading || !project) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const previousSparks = project.sparkRounds.flatMap(r => r.sparks);
  const likedSparks = previousSparks.filter(s => s.likedParts.length > 0);

  const generateRemixedSparks = async () => {
    setIsGenerating(true);
    setError(null);

    const constraints: RemixConstraints = {
      likedSparkIds: likedSparks.map(s => s.id),
      dislikeReason,
      scamperMode: selectedScamper,
      matrixSelections: Object.values(matrixSelections).some(v => v) ? matrixSelections : null,
    };

    try {
      const response = await fetch('/api/generateSparks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ikigaiChips: project.ikigai.chips,
          platform: project.platform,
          teamSize: project.teamSize,
          timeHorizon: project.timeHorizon,
          previousRounds: previousSparks,
          constraints,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to generate sparks');
      }

      const data = await response.json();
      
      const newRound: SparkRound = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        sparks: data.sparks,
        constraints,
      };

      updateProject({
        sparkRounds: [...project.sparkRounds, newRound],
      });

      router.push('/sparks');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleManualContinue = () => {
    const validIdeas = manualIdeas.filter(idea => idea.trim());
    if (validIdeas.length === 0) return;

    // Create manual sparks with the new structure
    const manualSparks = validIdeas.map((idea, i) => ({
      id: crypto.randomUUID(),
      title: `Idea ${i + 1}`,
      hook: idea,
      coreLoop: 'To be defined',
      uniqueMechanic: 'To be defined',
      winLoseCondition: 'To be defined',
      targetPlatform: project.platform || 'Any',
      scopeLevel: 'small indie',
      whyFun: ['To be explored'],
      prototypePlan: 'To be planned',
      likedParts: [],
      isSelected: false,
    }));

    const newRound: SparkRound = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      sparks: manualSparks,
      constraints: null,
    };

    updateProject({
      sparkRounds: [...project.sparkRounds, newRound],
    });

    router.push('/sparks');
  };

  return (
    <div className="flex-1 flex flex-col items-center p-6">
      <div className="w-full max-w-[800px] space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Remix</h1>
        </div>

        {/* Liked Sparks */}
        {likedSparks.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Parts You Liked</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {likedSparks.map((spark) => (
                  <Badge key={spark.id} variant="secondary">
                    {spark.title}: {spark.likedParts.join(', ')}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dislike Input */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">What didn&apos;t work?</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="e.g., Scope too big, wrong vibe, boring hook..."
              value={dislikeReason}
              onChange={(e) => setDislikeReason(e.target.value)}
            />
          </CardContent>
        </Card>

        {/* Remix Modes */}
        <Tabs defaultValue="scamper">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="scamper">SCAMPER</TabsTrigger>
            <TabsTrigger value="matrix">Matrix Mix</TabsTrigger>
          </TabsList>

          <TabsContent value="scamper" className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(SCAMPER_PROMPTS) as ScamperMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setSelectedScamper(selectedScamper === mode ? null : mode)}
                  className={`p-3 text-left rounded-lg border transition-all ${
                    selectedScamper === mode
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="font-medium text-sm">{SCAMPER_PROMPTS[mode].label}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {SCAMPER_PROMPTS[mode].prompt}
                  </div>
                </button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="matrix" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(MATRIX_OPTIONS).map(([key, options]) => (
                <div key={key} className="space-y-1.5">
                  <Label className="text-xs capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
                  <Select
                    value={matrixSelections[key as keyof typeof matrixSelections]}
                    onValueChange={(value) => 
                      setMatrixSelections(prev => ({ ...prev, [key]: value }))
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      {options.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Manual Ideas (when AI disabled) */}
        {!aiEnabled && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Write Your Ideas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {manualIdeas.map((idea, i) => (
                <Textarea
                  key={i}
                  placeholder={`Idea ${i + 1}...`}
                  value={idea}
                  onChange={(e) => {
                    const updated = [...manualIdeas];
                    updated[i] = e.target.value;
                    setManualIdeas(updated);
                  }}
                  className="min-h-[80px]"
                />
              ))}
            </CardContent>
          </Card>
        )}

        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/sparks')}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to Sparks
          </button>
          
          {aiEnabled ? (
            <Button
              onClick={generateRemixedSparks}
              disabled={isGenerating}
              className="flex-1 gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Shuffle className="h-4 w-4" />
                  Generate 10 Remixed Sparks
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleManualContinue}
              disabled={!manualIdeas.some(i => i.trim())}
              className="flex-1 gap-2"
            >
              Continue with My Ideas
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

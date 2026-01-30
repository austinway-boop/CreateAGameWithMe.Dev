'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowRight, ArrowLeft, Plus, X } from 'lucide-react';
import { useProject } from '@/hooks/useProject';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { GameQuestions } from '@/lib/types';

const EMOTION_SUGGESTIONS = [
  'Excitement', 'Tension', 'Joy', 'Fear', 'Curiosity', 
  'Satisfaction', 'Pride', 'Relaxation', 'Surprise', 'Nostalgia'
];

export default function QuestionsPage() {
  const router = useRouter();
  const { project, loading, updateProject } = useProject();
  
  const [questions, setQuestions] = useState<GameQuestions>({
    oneSentence: project?.gameQuestions?.oneSentence || '',
    genre: project?.gameQuestions?.genre || '',
    genreSuccessRate: project?.gameQuestions?.genreSuccessRate || '',
    emotions: project?.gameQuestions?.emotions || [],
    targetPlayer: project?.gameQuestions?.targetPlayer || '',
    playerGames: project?.gameQuestions?.playerGames || ['', '', '', '', ''],
    pricePoint: project?.gameQuestions?.pricePoint || '',
    priceReason: project?.gameQuestions?.priceReason || '',
    biggestRisk: project?.gameQuestions?.biggestRisk || '',
    notFor: project?.gameQuestions?.notFor || '',
    memorableThing: project?.gameQuestions?.memorableThing || '',
  });

  const [newEmotion, setNewEmotion] = useState('');

  if (loading || !project) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const updateField = (field: keyof GameQuestions, value: string | string[]) => {
    const updated = { ...questions, [field]: value };
    setQuestions(updated);
    updateProject({ gameQuestions: updated });
  };

  const addEmotion = (emotion: string) => {
    if (emotion && questions.emotions.length < 3 && !questions.emotions.includes(emotion)) {
      updateField('emotions', [...questions.emotions, emotion]);
    }
    setNewEmotion('');
  };

  const removeEmotion = (emotion: string) => {
    updateField('emotions', questions.emotions.filter(e => e !== emotion));
  };

  const updatePlayerGame = (index: number, value: string) => {
    const updated = [...questions.playerGames];
    updated[index] = value;
    updateField('playerGames', updated);
  };

  const canContinue = questions.oneSentence && questions.genre && questions.emotions.length > 0;

  return (
    <div className="flex-1 flex flex-col p-6 max-w-4xl mx-auto w-full overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.push('/gameloop')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Game Loop
          </Button>
          <h1 className="text-xl font-semibold tracking-tight">Tell Us About Your Game</h1>
        </div>
        <Button
          onClick={() => {
            updateProject({ currentPage: 'skilltree', gameQuestions: questions });
            router.push('/skilltree');
          }}
          disabled={!canContinue}
          className="gap-2"
        >
          Continue to Skill Tree
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-6">
        {/* One Sentence Pitch */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">The One-Sentence Pitch</CardTitle>
            <CardDescription>Describe your game in one sentence. No jargon, no "it's like X meets Y." Just what it IS.</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Players [verb] to [goal] by [core mechanic]..."
              value={questions.oneSentence}
              onChange={(e) => updateField('oneSentence', e.target.value)}
              className="min-h-[80px]"
            />
          </CardContent>
        </Card>

        {/* Genre & Success Rate */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Genre Reality Check</CardTitle>
            <CardDescription>What genre is your game, and what's that genre's success rate? Be specific — not just "action" but "roguelike deckbuilder" or "horror simulation."</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Genre</Label>
              <Input
                placeholder="e.g., Roguelike Deckbuilder, Horror Simulation, Cozy Farming Sim"
                value={questions.genre}
                onChange={(e) => updateField('genre', e.target.value)}
              />
            </div>
            <div>
              <Label>Genre Success Rate (look it up!)</Label>
              <Input
                placeholder="e.g., 3.2%, 0.34%, 5.1%"
                value={questions.genreSuccessRate}
                onChange={(e) => updateField('genreSuccessRate', e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Hint: Horror ~3.2%, Puzzle ~0.34%, Roguelike Deckbuilder ~5.1%
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Emotions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Target Emotions</CardTitle>
            <CardDescription>What 3 emotions do you want players to feel? Pick carefully — you can't make players feel everything.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {questions.emotions.map((emotion) => (
                <div
                  key={emotion}
                  className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-full text-sm"
                >
                  {emotion}
                  <button onClick={() => removeEmotion(emotion)} className="hover:text-primary-foreground/80">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {questions.emotions.length < 3 && (
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Add emotion..."
                    value={newEmotion}
                    onChange={(e) => setNewEmotion(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addEmotion(newEmotion)}
                    className="w-32 h-8"
                  />
                  <Button size="sm" variant="outline" onClick={() => addEmotion(newEmotion)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-muted-foreground">Suggestions:</span>
              {EMOTION_SUGGESTIONS.filter(e => !questions.emotions.includes(e)).slice(0, 6).map((emotion) => (
                <button
                  key={emotion}
                  onClick={() => addEmotion(emotion)}
                  disabled={questions.emotions.length >= 3}
                  className="text-xs px-2 py-1 rounded bg-muted hover:bg-muted/80 disabled:opacity-50"
                >
                  {emotion}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Target Player */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Specific Player</CardTitle>
            <CardDescription>Describe your target player. Not "gamers" — YOUR specific player. What 5 games did they play this month?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Who is your player?</Label>
              <Textarea
                placeholder="A 25-year-old who works from home, plays games during lunch breaks, prefers games they can pause instantly..."
                value={questions.targetPlayer}
                onChange={(e) => updateField('targetPlayer', e.target.value)}
                className="min-h-[80px]"
              />
            </div>
            <div>
              <Label>5 Games they played this month:</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                {questions.playerGames.map((game, i) => (
                  <Input
                    key={i}
                    placeholder={`Game ${i + 1}`}
                    value={game}
                    onChange={(e) => updatePlayerGame(i, e.target.value)}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Price Point */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Price Point</CardTitle>
            <CardDescription>What's your price, and why? Remember: $3 games can earn MORE than $15 games through viral impulse buying.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Price</Label>
              <Input
                placeholder="e.g., $3, $10, $15, $20, Free with IAP"
                value={questions.pricePoint}
                onChange={(e) => updateField('pricePoint', e.target.value)}
              />
            </div>
            <div>
              <Label>Why this price?</Label>
              <Textarea
                placeholder="At $3, streamers will say 'JUST BUY IT' instead of 'maybe wishlist'..."
                value={questions.priceReason}
                onChange={(e) => updateField('priceReason', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Risks and Anti-audience */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">The Hard Questions</CardTitle>
            <CardDescription>Be honest with yourself. What could kill this project?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Biggest risk that could kill this project:</Label>
              <Textarea
                placeholder="The biggest risk is..."
                value={questions.biggestRisk}
                onChange={(e) => updateField('biggestRisk', e.target.value)}
              />
            </div>
            <div>
              <Label>Who WON'T like your game?</Label>
              <Textarea
                placeholder="This game is NOT for people who..."
                value={questions.notFor}
                onChange={(e) => updateField('notFor', e.target.value)}
              />
            </div>
            <div>
              <Label>What will players remember a week after playing?</Label>
              <Textarea
                placeholder="The one thing that will stick with them is..."
                value={questions.memorableThing}
                onChange={(e) => updateField('memorableThing', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center mt-6 pt-4 border-t">
        <span className="text-sm text-muted-foreground">
          {canContinue ? '✓ Ready to continue' : 'Fill in the required fields to continue'}
        </span>
        <Button
          onClick={() => {
            updateProject({ currentPage: 'skilltree', gameQuestions: questions });
            router.push('/skilltree');
          }}
          disabled={!canContinue}
          className="gap-2"
        >
          Continue to Skill Tree
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

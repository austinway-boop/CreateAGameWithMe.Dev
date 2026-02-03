'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, Plus, X, Check } from 'lucide-react';
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

type Tab = 'essential' | 'market' | 'details';

export default function QuestionsPage() {
  const router = useRouter();
  const { project, loading, updateProject } = useProject();
  const [activeTab, setActiveTab] = useState<Tab>('essential');
  
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

  // Sync questions with project when it loads
  useEffect(() => {
    if (project?.gameQuestions) {
      setQuestions({
        oneSentence: project.gameQuestions.oneSentence || '',
        genre: project.gameQuestions.genre || '',
        genreSuccessRate: project.gameQuestions.genreSuccessRate || '',
        emotions: project.gameQuestions.emotions || [],
        targetPlayer: project.gameQuestions.targetPlayer || '',
        playerGames: project.gameQuestions.playerGames || ['', '', '', '', ''],
        pricePoint: project.gameQuestions.pricePoint || '',
        priceReason: project.gameQuestions.priceReason || '',
        biggestRisk: project.gameQuestions.biggestRisk || '',
        notFor: project.gameQuestions.notFor || '',
        memorableThing: project.gameQuestions.memorableThing || '',
      });
    }
  }, [project?.gameQuestions]);

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

  // Only require the pitch and genre to continue (simplified)
  const canContinue = questions.oneSentence.trim().length > 0 && questions.genre.trim().length > 0;

  // Check tab completion
  const isEssentialComplete = questions.oneSentence && questions.genre && questions.emotions.length > 0;
  const isMarketComplete = questions.targetPlayer || questions.pricePoint;
  const isDetailsComplete = questions.biggestRisk || questions.memorableThing;

  const tabs: { id: Tab; label: string; isComplete: boolean }[] = [
    { id: 'essential', label: 'Essential', isComplete: !!isEssentialComplete },
    { id: 'market', label: 'Market', isComplete: !!isMarketComplete },
    { id: 'details', label: 'Details', isComplete: !!isDetailsComplete },
  ];

  const handleContinue = () => {
    updateProject({ currentPage: 'skilltree', gameQuestions: questions });
    router.push('/journey?completed=questions');
  };

  return (
    <div className="flex-1 flex flex-col p-6 max-w-3xl mx-auto w-full overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.push('/gameloop')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-xl font-semibold tracking-tight">About Your Game</h1>
        </div>
        <Button
          onClick={handleContinue}
          disabled={!canContinue}
          className="gap-2"
        >
          Continue
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-muted/50 rounded-lg p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.isComplete && <Check className="h-3 w-3 text-green-500" />}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'essential' && (
          <>
            {/* One Sentence Pitch */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  The One-Sentence Pitch
                  <span className="text-xs text-red-500 font-normal">*required</span>
                </CardTitle>
                <CardDescription className="text-sm">What is your game in one sentence?</CardDescription>
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

            {/* Genre */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  Genre
                  <span className="text-xs text-red-500 font-normal">*required</span>
                </CardTitle>
                <CardDescription className="text-sm">Be specific — not just "action" but "roguelike deckbuilder"</CardDescription>
              </CardHeader>
              <CardContent>
                <Input
                  placeholder="e.g., Roguelike Deckbuilder, Horror Simulation, Cozy Farming Sim"
                  value={questions.genre}
                  onChange={(e) => updateField('genre', e.target.value)}
                />
              </CardContent>
            </Card>

            {/* Emotions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Target Emotions (pick up to 3)</CardTitle>
                <CardDescription className="text-sm">What feelings should players experience?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
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
                  {EMOTION_SUGGESTIONS.filter(e => !questions.emotions.includes(e)).slice(0, 6).map((emotion) => (
                    <button
                      key={emotion}
                      onClick={() => addEmotion(emotion)}
                      disabled={questions.emotions.length >= 3}
                      className="text-xs px-2 py-1 rounded bg-muted hover:bg-muted/80 disabled:opacity-50"
                    >
                      + {emotion}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Navigation */}
            <div className="flex justify-end">
              <Button variant="ghost" onClick={() => setActiveTab('market')} className="gap-2">
                Next: Market
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}

        {activeTab === 'market' && (
          <>
            {/* Target Player */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Target Player</CardTitle>
                <CardDescription className="text-sm">Who is your specific player? What games do they play?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="A 25-year-old who works from home, plays games during lunch breaks, prefers games they can pause instantly..."
                  value={questions.targetPlayer}
                  onChange={(e) => updateField('targetPlayer', e.target.value)}
                  className="min-h-[80px]"
                />
                <div>
                  <Label className="text-xs text-muted-foreground">Games they might play (optional)</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                    {questions.playerGames.slice(0, 3).map((game, i) => (
                      <Input
                        key={i}
                        placeholder={`Game ${i + 1}`}
                        value={game}
                        onChange={(e) => updatePlayerGame(i, e.target.value)}
                        className="text-sm"
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Price Point */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Price Point</CardTitle>
                <CardDescription className="text-sm">$3 games can earn MORE than $15 games through viral impulse buying</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2 flex-wrap">
                  {['Free', '$3', '$5', '$10', '$15', '$20+'].map((price) => (
                    <button
                      key={price}
                      onClick={() => updateField('pricePoint', price)}
                      className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                        questions.pricePoint === price
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      {price}
                    </button>
                  ))}
                </div>
                <Input
                  placeholder="Or enter custom price..."
                  value={['Free', '$3', '$5', '$10', '$15', '$20+'].includes(questions.pricePoint) ? '' : questions.pricePoint}
                  onChange={(e) => updateField('pricePoint', e.target.value)}
                  className="text-sm"
                />
              </CardContent>
            </Card>

            {/* Genre Success Rate */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Genre Success Rate</CardTitle>
                <CardDescription className="text-sm">What's your genre's success rate on Steam? (Look it up!)</CardDescription>
              </CardHeader>
              <CardContent>
                <Input
                  placeholder="e.g., 3.2%, 0.34%, 5.1%"
                  value={questions.genreSuccessRate}
                  onChange={(e) => updateField('genreSuccessRate', e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Hint: Horror ~3.2%, Puzzle ~0.34%, Roguelike Deckbuilder ~5.1%
                </p>
              </CardContent>
            </Card>

            {/* Quick Navigation */}
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setActiveTab('essential')} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back: Essential
              </Button>
              <Button variant="ghost" onClick={() => setActiveTab('details')} className="gap-2">
                Next: Details
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}

        {activeTab === 'details' && (
          <>
            {/* Biggest Risk */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Biggest Risk</CardTitle>
                <CardDescription className="text-sm">What could kill this project? Be honest.</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="The biggest risk is..."
                  value={questions.biggestRisk}
                  onChange={(e) => updateField('biggestRisk', e.target.value)}
                />
              </CardContent>
            </Card>

            {/* Memorable Thing */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">The Memorable Moment</CardTitle>
                <CardDescription className="text-sm">What will players remember a week after playing?</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="The one thing that will stick with them is..."
                  value={questions.memorableThing}
                  onChange={(e) => updateField('memorableThing', e.target.value)}
                />
              </CardContent>
            </Card>

            {/* Not For */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Who It's NOT For</CardTitle>
                <CardDescription className="text-sm">Knowing your anti-audience is powerful</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="This game is NOT for people who..."
                  value={questions.notFor}
                  onChange={(e) => updateField('notFor', e.target.value)}
                />
              </CardContent>
            </Card>

            {/* Quick Navigation */}
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setActiveTab('market')} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back: Market
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center mt-6 pt-4 border-t">
        <span className="text-sm text-muted-foreground">
          {canContinue ? '✓ Ready to continue' : 'Fill in pitch and genre to continue'}
        </span>
        <Button
          onClick={handleContinue}
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

'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, Plus, X } from 'lucide-react';
import { useProject } from '@/hooks/useProject';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { GameQuestions } from '@/lib/types';

const EMOTION_SUGGESTIONS = [
  'Excitement', 'Tension', 'Joy', 'Fear', 'Curiosity', 
  'Satisfaction', 'Pride', 'Relaxation', 'Surprise', 'Nostalgia'
];

interface Question {
  id: keyof GameQuestions | 'playerGames';
  title: string;
  subtitle: string;
  placeholder: string;
  type: 'textarea' | 'input' | 'emotions' | 'price' | 'games';
  required?: boolean;
  hint?: string;
}

const QUESTIONS: Question[] = [
  {
    id: 'oneSentence',
    title: 'What is your game in one sentence?',
    subtitle: 'The elevator pitch that hooks people instantly',
    placeholder: 'Players [verb] to [goal] by [core mechanic]...',
    type: 'textarea',
    required: true,
  },
  {
    id: 'genre',
    title: 'What genre is your game?',
    subtitle: 'Be specific — not just "action" but "roguelike deckbuilder"',
    placeholder: 'e.g., Roguelike Deckbuilder, Horror Simulation, Cozy Farming Sim',
    type: 'input',
    required: true,
  },
  {
    id: 'emotions',
    title: 'What emotions should players feel?',
    subtitle: 'Pick up to 3 feelings you want to evoke',
    placeholder: 'Add emotion...',
    type: 'emotions',
  },
  {
    id: 'targetPlayer',
    title: 'Who is your ideal player?',
    subtitle: 'Describe them specifically — age, lifestyle, gaming habits',
    placeholder: 'A 25-year-old who works from home, plays games during lunch breaks, prefers games they can pause instantly...',
    type: 'textarea',
  },
  {
    id: 'playerGames',
    title: 'What games does your player enjoy?',
    subtitle: 'List 3 games your target player probably plays',
    placeholder: 'Game name',
    type: 'games',
  },
  {
    id: 'pricePoint',
    title: 'What\'s your price point?',
    subtitle: '$3 games can earn MORE than $15 games through viral impulse buying',
    placeholder: 'Or enter custom price...',
    type: 'price',
  },
  {
    id: 'genreSuccessRate',
    title: 'What\'s your genre\'s success rate?',
    subtitle: 'What percentage of games in this genre "succeed" on Steam?',
    placeholder: 'e.g., 3.2%, 0.34%, 5.1%',
    type: 'input',
    hint: 'Hint: Horror ~3.2%, Puzzle ~0.34%, Roguelike Deckbuilder ~5.1%',
  },
  {
    id: 'biggestRisk',
    title: 'What could kill this project?',
    subtitle: 'Be honest about the biggest risk',
    placeholder: 'The biggest risk is...',
    type: 'textarea',
  },
  {
    id: 'memorableThing',
    title: 'What will players remember?',
    subtitle: 'A week after playing, what moment will stick with them?',
    placeholder: 'The one thing that will stick with them is...',
    type: 'textarea',
  },
  {
    id: 'notFor',
    title: 'Who is this game NOT for?',
    subtitle: 'Knowing your anti-audience is powerful',
    placeholder: 'This game is NOT for people who...',
    type: 'textarea',
  },
];

export default function QuestionsPage() {
  const router = useRouter();
  const { project, loading, updateProject } = useProject();
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const [questions, setQuestions] = useState<GameQuestions>({
    oneSentence: '',
    genre: '',
    genreSuccessRate: '',
    emotions: [],
    targetPlayer: '',
    playerGames: ['', '', ''],
    pricePoint: '',
    priceReason: '',
    biggestRisk: '',
    notFor: '',
    memorableThing: '',
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
        playerGames: project.gameQuestions.playerGames?.slice(0, 3) || ['', '', ''],
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

  const currentQuestion = QUESTIONS[currentIndex];
  const progress = ((currentIndex + 1) / QUESTIONS.length) * 100;
  const isLastQuestion = currentIndex === QUESTIONS.length - 1;

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

  // Check if current question has a valid answer
  const isCurrentAnswered = () => {
    const q = currentQuestion;
    if (q.type === 'emotions') {
      return questions.emotions.length > 0;
    }
    if (q.type === 'games') {
      return questions.playerGames.some(g => g.trim().length > 0);
    }
    if (q.type === 'price') {
      return questions.pricePoint.trim().length > 0;
    }
    const value = questions[q.id as keyof GameQuestions];
    return typeof value === 'string' && value.trim().length > 0;
  };

  // Required questions must be answered, optional can be skipped
  const canProceed = !currentQuestion.required || isCurrentAnswered();

  const handleNext = () => {
    if (isLastQuestion) {
      updateProject({ currentPage: 'skilltree', gameQuestions: questions });
      router.push('/journey?completed=questions');
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const renderQuestionInput = () => {
    const q = currentQuestion;

    switch (q.type) {
      case 'textarea':
        return (
          <Textarea
            placeholder={q.placeholder}
            value={questions[q.id as keyof GameQuestions] as string}
            onChange={(e) => updateField(q.id as keyof GameQuestions, e.target.value)}
            className="min-h-[120px] text-base"
            autoFocus
          />
        );

      case 'input':
        return (
          <div className="space-y-2">
            <Input
              placeholder={q.placeholder}
              value={questions[q.id as keyof GameQuestions] as string}
              onChange={(e) => updateField(q.id as keyof GameQuestions, e.target.value)}
              className="text-base h-12"
              autoFocus
            />
            {q.hint && (
              <p className="text-sm text-muted-foreground">{q.hint}</p>
            )}
          </div>
        );

      case 'emotions':
        return (
          <div className="space-y-4">
            {/* Selected emotions - fixed height */}
            <div className="flex flex-wrap gap-2 h-[44px] items-start">
              {questions.emotions.map((emotion) => (
                <div
                  key={emotion}
                  className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-xl text-sm font-medium shadow-[0_3px_0_#be185d]"
                >
                  {emotion}
                  <button onClick={() => removeEmotion(emotion)} className="hover:opacity-70">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add custom emotion - fixed height container */}
            <div className="h-[44px]">
              {questions.emotions.length < 3 && (
                <div className="flex items-center gap-2">
                  <Input
                    placeholder={q.placeholder}
                    value={newEmotion}
                    onChange={(e) => setNewEmotion(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addEmotion(newEmotion)}
                    className="flex-1 h-11"
                    autoFocus
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => addEmotion(newEmotion)}
                    disabled={!newEmotion.trim()}
                    className="h-11"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Suggestions */}
            <div className="flex flex-wrap gap-2">
              {EMOTION_SUGGESTIONS.filter(e => !questions.emotions.includes(e)).map((emotion) => (
                <button
                  key={emotion}
                  onClick={() => addEmotion(emotion)}
                  disabled={questions.emotions.length >= 3}
                  className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium text-gray-700 disabled:opacity-50 transition-colors"
                >
                  + {emotion}
                </button>
              ))}
            </div>
          </div>
        );

      case 'price':
        return (
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              {['Free', '$3', '$5', '$10', '$15', '$20+'].map((price) => (
                <button
                  key={price}
                  onClick={() => updateField('pricePoint', price)}
                  className={`px-5 py-3 rounded-xl text-sm font-bold transition-all ${
                    questions.pricePoint === price
                      ? 'bg-pink-500 text-white shadow-[0_3px_0_#be185d]'
                      : 'bg-gray-100 text-gray-700 shadow-[0_3px_0_#d1d5db] hover:bg-gray-200'
                  }`}
                >
                  {price}
                </button>
              ))}
            </div>
            <Input
              placeholder={q.placeholder}
              value={['Free', '$3', '$5', '$10', '$15', '$20+'].includes(questions.pricePoint) ? '' : questions.pricePoint}
              onChange={(e) => updateField('pricePoint', e.target.value)}
              className="h-11"
            />
          </div>
        );

      case 'games':
        return (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <Input
                key={i}
                placeholder={`Game ${i + 1}`}
                value={questions.playerGames[i] || ''}
                onChange={(e) => updatePlayerGame(i, e.target.value)}
                className="h-12 text-base"
                autoFocus={i === 0}
              />
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Progress bar */}
      <div className="px-6 pt-4">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-pink-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-sm font-medium text-gray-500">
              {currentIndex + 1}/{QUESTIONS.length}
            </span>
          </div>
        </div>
      </div>

      {/* Question content */}
      <div className="flex-1 flex flex-col px-6 pt-8 pb-6 overflow-auto">
        <div className="w-full max-w-xl mx-auto space-y-6">
          {/* Question header - fixed height area */}
          <div className="text-center space-y-2 min-h-[80px]">
            <h1 className="text-2xl font-bold text-gray-900">
              {currentQuestion.title}
              {currentQuestion.required && <span className="text-pink-500 ml-1">*</span>}
            </h1>
            <p className="text-gray-500">{currentQuestion.subtitle}</p>
          </div>

          {/* Question input - fixed minimum height to prevent jumping */}
          <div className="bg-white rounded-2xl p-6 shadow-[0_3px_0_#e5e7eb] min-h-[200px]">
            {renderQuestionInput()}
          </div>

          {/* Navigation - fixed at bottom of content area */}
          <div className="flex items-center justify-between pt-4">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentIndex === 0}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>

            <Button
              onClick={handleNext}
              disabled={!canProceed}
              className="gap-2 px-6"
            >
              {isLastQuestion ? 'Finish' : 'Continue'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Skip hint for optional questions - fixed height */}
          <div className="h-6 text-center">
            {!currentQuestion.required && !isCurrentAnswered() && (
              <p className="text-sm text-gray-400">
                This question is optional — you can skip it
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

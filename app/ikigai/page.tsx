'use client';

import { useRouter } from 'next/navigation';
import { useState, useRef, DragEvent } from 'react';
import { ArrowRight, ArrowLeft, Plus, X, Sparkles, GripVertical, Download } from 'lucide-react';
import { useProject } from '@/hooks/useProject';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FormSkeleton } from '@/components/LoadingScreen';
import { IkigaiCategory, IkigaiChip, getOverlapChips, isIkigaiComplete } from '@/lib/types';

// Example items users can drag
const EXAMPLE_ITEMS = [
  // === I LOVE (feelings, experiences, vibes) ===
  { text: 'Playing with friends', suggested: ['love'] },
  { text: 'Party games', suggested: ['love'] },
  { text: 'Getting scared', suggested: ['love'] },
  { text: 'Solving puzzles', suggested: ['love'] },
  { text: 'Exploring worlds', suggested: ['love'] },
  { text: 'Collecting things', suggested: ['love'] },
  { text: 'Building stuff', suggested: ['love'] },
  { text: 'Competition', suggested: ['love'] },
  { text: 'Chill vibes', suggested: ['love'] },
  { text: 'Dark stories', suggested: ['love'] },
  { text: 'Cute aesthetics', suggested: ['love'] },
  { text: 'Retro feel', suggested: ['love'] },
  { text: 'Sci-fi worlds', suggested: ['love'] },
  { text: 'Fantasy settings', suggested: ['love'] },
  { text: 'Making people laugh', suggested: ['love'] },
  { text: 'Pixel art', suggested: ['love'] },
  { text: 'Music/rhythm', suggested: ['love'] },
  { text: 'Strategy', suggested: ['love'] },
  { text: 'Speed/action', suggested: ['love'] },
  { text: 'Weird/surreal', suggested: ['love'] },
  
  // === GOOD AT (skills, tools, languages) ===
  { text: 'Unity', suggested: ['good'] },
  { text: 'Godot', suggested: ['good'] },
  { text: 'Unreal', suggested: ['good'] },
  { text: 'GameMaker', suggested: ['good'] },
  { text: '2D art', suggested: ['good'] },
  { text: '3D modeling', suggested: ['good'] },
  { text: 'Animation', suggested: ['good'] },
  { text: 'VFX', suggested: ['good'] },
  { text: 'Procedural gen', suggested: ['good'] },
  { text: 'Sound design', suggested: ['good'] },
  { text: 'Music', suggested: ['good'] },
  { text: 'Writing', suggested: ['good'] },
  { text: 'Level design', suggested: ['good'] },
  { text: 'UI design', suggested: ['good'] },
  { text: 'Game balance', suggested: ['good'] },
  { text: 'Shaders', suggested: ['good'] },
  { text: 'Networking', suggested: ['good'] },
  // Programming languages
  { text: 'C#', suggested: ['good'] },
  { text: 'JavaScript', suggested: ['good'] },
  { text: 'TypeScript', suggested: ['good'] },
  { text: 'Python', suggested: ['good'] },
  { text: 'Lua', suggested: ['good'] },
  { text: 'GDScript', suggested: ['good'] },
  { text: 'Rust', suggested: ['good'] },
  { text: 'C++', suggested: ['good'] },
  
  // === CAN SHIP (constraints) ===
  { text: 'Small scope', suggested: ['ship'] },
  { text: 'One mechanic', suggested: ['ship'] },
  { text: 'Web games', suggested: ['ship'] },
  { text: 'Mobile', suggested: ['ship'] },
  { text: 'Jam-sized', suggested: ['ship'] },
  { text: '2D only', suggested: ['ship'] },
  { text: 'Solo dev', suggested: ['ship'] },
  { text: 'No online', suggested: ['ship'] },
  { text: 'Simple art', suggested: ['ship'] },
  { text: 'Asset packs', suggested: ['ship'] },
  { text: 'Short game', suggested: ['ship'] },
  { text: 'Turn-based', suggested: ['ship'] },
  
  // === PLAYERS WANT (market) ===
  { text: 'Roguelikes', suggested: ['want'] },
  { text: 'Deck builders', suggested: ['want'] },
  { text: 'Cozy games', suggested: ['want'] },
  { text: 'Idle games', suggested: ['want'] },
  { text: 'Survival', suggested: ['want'] },
  { text: 'Metroidvania', suggested: ['want'] },
  { text: 'Souls-like', suggested: ['want'] },
  { text: 'City builder', suggested: ['want'] },
  { text: 'Tower defense', suggested: ['want'] },
  { text: 'Local co-op', suggested: ['want'] },
  { text: 'Online MP', suggested: ['want'] },
  { text: 'Short sessions', suggested: ['want'] },
  { text: 'Replayability', suggested: ['want'] },
  { text: 'Story-driven', suggested: ['want'] },
  { text: 'Sandbox', suggested: ['want'] },
  { text: 'Relaxing', suggested: ['want'] },
];

// Circle definitions for hit detection (in viewBox coordinates 0-100)
const CIRCLES: { category: IkigaiCategory; cx: number; cy: number; r: number }[] = [
  { category: 'love', cx: 35, cy: 35, r: 30 },
  { category: 'good', cx: 65, cy: 35, r: 30 },
  { category: 'ship', cx: 65, cy: 65, r: 30 },
  { category: 'want', cx: 35, cy: 65, r: 30 },
];

// Check which circles contain a point (as percentage 0-100)
const getCategoriesAtPoint = (x: number, y: number): IkigaiCategory[] => {
  return CIRCLES
    .filter(c => {
      const dx = x - c.cx;
      const dy = y - c.cy;
      return Math.sqrt(dx * dx + dy * dy) <= c.r;
    })
    .map(c => c.category);
};

export default function IkigaiPage() {
  const router = useRouter();
  const { project, loading, updateProject, retryLoad } = useProject();
  const [showIntro, setShowIntro] = useState(true);
  const [customText, setCustomText] = useState('');
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [draggedChipId, setDraggedChipId] = useState<string | null>(null); // For repositioning existing chips
  const [dropPreview, setDropPreview] = useState<{ x: number; y: number; categories: IkigaiCategory[] } | null>(null);
  const diagramRef = useRef<HTMLDivElement>(null);

  if (loading || !project) {
    return <FormSkeleton />;
  }

  const chips = project.ikigai.chips;
  const overlapChips = getOverlapChips(chips);
  const isComplete = isIkigaiComplete(project.ikigai);

  // Check if an example item is already used
  const isItemUsed = (text: string) => chips.some((c) => c.text === text);

  const handleDragStart = (e: DragEvent, text: string) => {
    setDraggedItem(text);
    setDraggedChipId(null);
    e.dataTransfer.setData('text/plain', text);
    e.dataTransfer.effectAllowed = 'copy';
  };

  // For repositioning existing chips
  const handleChipDragStart = (e: DragEvent, chip: IkigaiChip) => {
    setDraggedChipId(chip.id);
    setDraggedItem(chip.text);
    e.dataTransfer.setData('text/plain', chip.text);
    e.dataTransfer.setData('chip-id', chip.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDraggedChipId(null);
    setDropPreview(null);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    
    // Calculate position as percentage
    const rect = diagramRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const categories = getCategoriesAtPoint(x, y);
    
    setDropPreview(categories.length > 0 ? { x, y, categories } : null);
  };

  const handleDragLeave = () => {
    setDropPreview(null);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    const text = e.dataTransfer.getData('text/plain');
    const chipId = e.dataTransfer.getData('chip-id');
    if (!text.trim()) return;

    // Calculate position
    const rect = diagramRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const categories = getCategoriesAtPoint(x, y);
    
    // Must be inside at least one circle
    if (categories.length === 0) {
      setDraggedItem(null);
      setDraggedChipId(null);
      setDropPreview(null);
      return;
    }

    // If repositioning an existing chip
    if (chipId) {
      const updatedChips = chips.map((c) =>
        c.id === chipId ? { ...c, x, y, categories } : c
      );
      updateProject({
        ikigai: { chips: updatedChips },
      });
      setDraggedItem(null);
      setDraggedChipId(null);
      setDropPreview(null);
      return;
    }

    // Check if already exists (for new items)
    if (chips.some((c) => c.text === text)) {
      setDraggedItem(null);
      setDraggedChipId(null);
      setDropPreview(null);
      return;
    }
    
    const newChip: IkigaiChip = {
      id: crypto.randomUUID(),
      text: text.trim(),
      categories,
      x,
      y,
    };

    updateProject({
      ikigai: { chips: [...chips, newChip] },
    });

    setDraggedItem(null);
    setDraggedChipId(null);
    setDropPreview(null);
  };

  const removeChip = (id: string) => {
    updateProject({
      ikigai: { chips: chips.filter((c) => c.id !== id) },
    });
  };

  const addCustomItem = () => {
    if (!customText.trim()) return;
    // Add to a default position, user can drag to place
    const newChip: IkigaiChip = {
      id: crypto.randomUUID(),
      text: customText.trim(),
      categories: ['love'], // Default, they'll drag to correct zone
      x: 35,
      y: 25,
    };
    updateProject({
      ikigai: { chips: [...chips, newChip] },
    });
    setCustomText('');
  };

  const getChipStyle = (categories: IkigaiCategory[]) => {
    // 4 categories = center/ikigai
    if (categories.length === 4) return 'bg-violet-200 border-violet-500 text-violet-900';
    // 3 categories
    if (categories.length === 3) return 'bg-purple-150 border-purple-400 text-purple-800';
    // 2 categories - blend colors
    if (categories.length === 2) {
      const has = (c: IkigaiCategory) => categories.includes(c);
      if (has('love') && has('good')) return 'bg-gradient-to-r from-rose-100 to-blue-100 border-purple-300 text-purple-700';
      if (has('good') && has('ship')) return 'bg-gradient-to-r from-blue-100 to-green-100 border-teal-300 text-teal-700';
      if (has('ship') && has('want')) return 'bg-gradient-to-r from-green-100 to-amber-100 border-lime-300 text-lime-700';
      if (has('want') && has('love')) return 'bg-gradient-to-r from-amber-100 to-rose-100 border-orange-300 text-orange-700';
      return 'bg-purple-100 border-purple-300 text-purple-700';
    }
    // Single category
    const cat = categories[0];
    const styles: Record<IkigaiCategory, string> = {
      love: 'bg-rose-100 border-rose-400 text-rose-800',
      good: 'bg-blue-100 border-blue-400 text-blue-800',
      ship: 'bg-green-100 border-green-400 text-green-800',
      want: 'bg-amber-100 border-amber-400 text-amber-800',
    };
    return styles[cat] || 'bg-gray-100 border-gray-300 text-gray-700';
  };

  const handleContinue = () => {
    updateProject({ currentPage: 'sparks' });
    router.push('/journey?completed=ikigai');
  };

  const exportIkigai = () => {
    // Group chips by their category combinations
    const loveOnly = chips.filter(c => c.categories.length === 1 && c.categories[0] === 'love');
    const goodOnly = chips.filter(c => c.categories.length === 1 && c.categories[0] === 'good');
    const shipOnly = chips.filter(c => c.categories.length === 1 && c.categories[0] === 'ship');
    const wantOnly = chips.filter(c => c.categories.length === 1 && c.categories[0] === 'want');
    
    const loveGood = chips.filter(c => c.categories.length === 2 && c.categories.includes('love') && c.categories.includes('good'));
    const goodShip = chips.filter(c => c.categories.length === 2 && c.categories.includes('good') && c.categories.includes('ship'));
    const shipWant = chips.filter(c => c.categories.length === 2 && c.categories.includes('ship') && c.categories.includes('want'));
    const wantLove = chips.filter(c => c.categories.length === 2 && c.categories.includes('want') && c.categories.includes('love'));
    
    const threeWay = chips.filter(c => c.categories.length === 3);
    const center = chips.filter(c => c.categories.length === 4);

    const formatList = (items: IkigaiChip[]) => items.map(c => `  - ${c.text}`).join('\n') || '  (none)';

    const md = `# My Ikigai

## Single Categories

### ❤️ Love (what excites me)
${formatList(loveOnly)}

### 💪 Good At (my skills)
${formatList(goodOnly)}

### 🚀 Can Ship (realistic scope)
${formatList(shipOnly)}

### 🎯 Players Want (market demand)
${formatList(wantOnly)}

## Overlaps (2 categories)

### ❤️💪 Passion (Love + Good At)
${formatList(loveGood)}

### 💪🚀 Profession (Good At + Can Ship)
${formatList(goodShip)}

### 🚀🎯 Vocation (Can Ship + Players Want)
${formatList(shipWant)}

### 🎯❤️ Mission (Players Want + Love)
${formatList(wantLove)}

## Sweet Spots

### 3-way overlaps
${formatList(threeWay)}

### ✨ IKIGAI (all 4)
${formatList(center)}

---
Total items: ${chips.length}
Overlaps: ${overlapChips.length}
`;

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ikigai.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Intro Screen
  if (showIntro) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[480px] space-y-6">
          {/* Header with skip option */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold tracking-tight">Build Your Ikigai</h1>
            <button
              onClick={() => setShowIntro(false)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Skip intro →
            </button>
          </div>

          {/* Diagram preview - centered */}
          <div className="flex justify-center">
            <svg viewBox="0 0 200 200" className="w-44 h-44">
              <defs>
                <path id="introLovePath" d="M 30,75 A 40,40 0 0,1 75,30" fill="none" />
                <path id="introGoodPath" d="M 125,30 A 40,40 0 0,1 170,75" fill="none" />
                <path id="introShipPath" d="M 170,125 A 40,40 0 0,1 125,170" fill="none" />
                <path id="introWantPath" d="M 75,170 A 40,40 0 0,1 30,125" fill="none" />
              </defs>
              <circle cx="70" cy="70" r="55" fill="rgba(244, 63, 94, 0.15)" stroke="#f43f5e" strokeWidth="1.5" />
              <circle cx="130" cy="70" r="55" fill="rgba(59, 130, 246, 0.15)" stroke="#3b82f6" strokeWidth="1.5" />
              <circle cx="130" cy="130" r="55" fill="rgba(34, 197, 94, 0.15)" stroke="#22c55e" strokeWidth="1.5" />
              <circle cx="70" cy="130" r="55" fill="rgba(245, 158, 11, 0.15)" stroke="#f59e0b" strokeWidth="1.5" />
              <text fontSize="11" fill="#be123c" fontWeight="600">
                <textPath href="#introLovePath" startOffset="50%" textAnchor="middle">LOVE</textPath>
              </text>
              <text fontSize="11" fill="#1d4ed8" fontWeight="600">
                <textPath href="#introGoodPath" startOffset="50%" textAnchor="middle">GOOD AT</textPath>
              </text>
              <text fontSize="11" fill="#15803d" fontWeight="600">
                <textPath href="#introShipPath" startOffset="50%" textAnchor="middle">CAN SHIP</textPath>
              </text>
              <text fontSize="10" fill="#b45309" fontWeight="600">
                <textPath href="#introWantPath" startOffset="50%" textAnchor="middle">WANT</textPath>
              </text>
              <text x="100" y="102" fontSize="9" fill="#6d28d9" fontWeight="600" textAnchor="middle">✨</text>
            </svg>
          </div>

          {/* Brief explanation */}
          <p className="text-sm text-muted-foreground text-center">
            Drag items into circles. Items that fit <strong className="text-foreground">multiple circles</strong> = stronger ideas.
          </p>

          {/* Legend - compact row */}
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span className="text-rose-700 font-medium">Love</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              <span className="text-blue-700 font-medium">Good At</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
              <span className="text-green-700 font-medium">Can Ship</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span className="text-amber-700 font-medium">Players Want</span>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button onClick={() => setShowIntro(false)} className="w-full gap-2" size="lg">
              Start Building
              <ArrowRight className="h-4 w-4" />
            </Button>
            
            <Button variant="ghost" onClick={() => router.push('/create')} className="w-full gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Setup
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[750px] flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight">Build Your Ikigai</h1>
          <div className="flex items-center gap-4 text-sm">
            <span className={chips.length >= 8 ? 'text-green-600' : 'text-muted-foreground'}>
              {chips.length}/8 items
            </span>
            <span className={overlapChips.length >= 3 ? 'text-green-600' : 'text-muted-foreground'}>
              {overlapChips.length}/3 overlaps
            </span>
            {chips.length > 0 && (
              <button
                onClick={exportIkigai}
                className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
            )}
          </div>
        </div>

        {/* Main content */}
        <div className="flex gap-4 items-start">
          {/* Item Pool - fixed height, scrollable */}
          <div className="w-[200px] flex-shrink-0">
            <div className="text-xs font-medium text-muted-foreground mb-2">Drag items →</div>
            
            {/* Custom input */}
            <div className="flex gap-1 mb-2">
              <Input
                placeholder="Add your own..."
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomItem();
                  }
                }}
                className="h-7 text-xs"
              />
              <Button size="sm" className="h-7 px-2" onClick={addCustomItem} disabled={!customText.trim()}>
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            {/* Example items - scrollable list with fixed height */}
            <div className="overflow-y-auto space-y-0.5 pr-1" style={{ maxHeight: '400px' }}>
              {EXAMPLE_ITEMS.map((item) => {
                const used = isItemUsed(item.text);
                return (
                  <div
                    key={item.text}
                    draggable={!used}
                    onDragStart={(e) => handleDragStart(e, item.text)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center gap-1.5 px-1.5 py-1 rounded border text-xs transition-all ${
                      used
                        ? 'bg-muted/50 border-transparent text-muted-foreground cursor-not-allowed opacity-40'
                        : 'bg-white border-border cursor-grab hover:border-primary/50 active:cursor-grabbing'
                    }`}
                  >
                    {!used && <GripVertical className="h-2.5 w-2.5 text-muted-foreground flex-shrink-0" />}
                    <span className="truncate">{item.text}</span>
                    {used && <span className="text-[10px] ml-auto">✓</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Diagram - square, fixed size */}
          <div
            ref={diagramRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className="relative bg-muted/20 rounded-xl border-2 w-[450px] h-[450px] flex-shrink-0"
          >
            <svg viewBox="0 0 100 100" className="w-full h-full pointer-events-none" preserveAspectRatio="xMidYMid meet">
              <defs>
                <path id="lovePath" d="M 15,38 A 20,20 0 0,1 38,15" fill="none" />
                <path id="goodPath" d="M 62,15 A 20,20 0 0,1 85,38" fill="none" />
                <path id="shipPath" d="M 85,62 A 20,20 0 0,1 62,85" fill="none" />
                <path id="wantPath" d="M 38,85 A 20,20 0 0,1 15,62" fill="none" />
              </defs>

              {/* Four circles */}
              <circle cx="35" cy="35" r="30" fill="rgba(244, 63, 94, 0.12)" stroke="#f43f5e" strokeWidth="0.5" />
              <circle cx="65" cy="35" r="30" fill="rgba(59, 130, 246, 0.12)" stroke="#3b82f6" strokeWidth="0.5" />
              <circle cx="65" cy="65" r="30" fill="rgba(34, 197, 94, 0.12)" stroke="#22c55e" strokeWidth="0.5" />
              <circle cx="35" cy="65" r="30" fill="rgba(245, 158, 11, 0.12)" stroke="#f59e0b" strokeWidth="0.5" />

              {/* Curved text labels */}
              <text fontSize="4" fill="#be123c" fontWeight="600">
                <textPath href="#lovePath" startOffset="50%" textAnchor="middle">LOVE</textPath>
              </text>
              <text fontSize="4" fill="#1d4ed8" fontWeight="600">
                <textPath href="#goodPath" startOffset="50%" textAnchor="middle">GOOD AT</textPath>
              </text>
              <text fontSize="4" fill="#15803d" fontWeight="600">
                <textPath href="#shipPath" startOffset="50%" textAnchor="middle">SHIP</textPath>
              </text>
              <text fontSize="4" fill="#b45309" fontWeight="600">
                <textPath href="#wantPath" startOffset="50%" textAnchor="middle">WANT</textPath>
              </text>

              {/* Center label */}
              <text x="50" y="51" fontSize="2" fill="#7c3aed" textAnchor="middle" fontWeight="500" opacity="0.5">ikigai</text>
            </svg>

            {/* Drop preview indicator */}
            {dropPreview && (
              <div
                className="absolute w-3 h-3 rounded-full bg-violet-500 border-2 border-white shadow-lg pointer-events-none"
                style={{
                  left: `${dropPreview.x}%`,
                  top: `${dropPreview.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              />
            )}

            {/* Placed chips */}
            {chips.map((chip) => (
              <div
                key={chip.id}
                draggable
                onDragStart={(e) => handleChipDragStart(e, chip)}
                onDragEnd={handleDragEnd}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 group z-10 cursor-grab active:cursor-grabbing ${
                  draggedChipId === chip.id ? 'opacity-50' : ''
                }`}
                style={{
                  left: `${chip.x ?? 50}%`,
                  top: `${chip.y ?? 50}%`,
                }}
              >
                <div
                  className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full border text-[10px] font-medium shadow-sm whitespace-nowrap ${getChipStyle(chip.categories)}`}
                >
                  <span>{chip.text}</span>
                  <button
                    onClick={() => removeChip(chip.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-600"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              </div>
            ))}

            {/* Drag hint */}
            {draggedItem && !dropPreview && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-black/70 text-white px-3 py-1.5 rounded-lg text-xs">
                  Drop inside a circle
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 pt-2">
          <button
            onClick={() => router.push('/create')}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to Setup
          </button>
          <Button
            onClick={handleContinue}
            disabled={!isComplete}
            className="flex-1 gap-2"
            size="lg"
          >
            {isComplete ? (
              <>
                <Sparkles className="h-4 w-4" />
                Generate Sparks
              </>
            ) : (
              <>Need {Math.max(0, 8 - chips.length)} more items, {Math.max(0, 3 - overlapChips.length)} overlaps</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

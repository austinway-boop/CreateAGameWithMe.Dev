'use client';

import { useRouter } from 'next/navigation';
import { useState, useRef, useCallback, useEffect } from 'react';
import { ArrowRight, ArrowLeft, Trash2, HelpCircle, GripVertical, X, Plus } from 'lucide-react';
import { useProject } from '@/hooks/useProject';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { GameLoopNode, GameLoopNodeType, LoopType } from '@/lib/types';

const NODE_TYPES: { type: GameLoopNodeType; label: string; color: string; borderColor: string; description: string }[] = [
  { type: 'action', label: 'Action', color: 'bg-blue-500', borderColor: 'border-blue-500', description: 'What the player DOES' },
  { type: 'challenge', label: 'Challenge', color: 'bg-orange-500', borderColor: 'border-orange-500', description: 'What they must OVERCOME' },
  { type: 'reward', label: 'Reward', color: 'bg-green-500', borderColor: 'border-green-500', description: 'What they GAIN' },
  { type: 'decision', label: 'Decision', color: 'bg-purple-500', borderColor: 'border-purple-500', description: 'A choice point' },
  { type: 'repeat', label: 'Repeat', color: 'bg-pink-500', borderColor: 'border-pink-500', description: 'Loop back' },
];

const DEFAULT_LABELS: Record<GameLoopNodeType, string> = {
  action: 'Player does...',
  challenge: 'Must overcome...',
  reward: 'Gains...',
  decision: 'Chooses...',
  repeat: 'Loop',
};

const SUB_LOOP_COLORS = [
  { bg: 'bg-cyan-500/20', border: 'border-cyan-500', text: 'text-cyan-700' },
  { bg: 'bg-amber-500/20', border: 'border-amber-500', text: 'text-amber-700' },
  { bg: 'bg-rose-500/20', border: 'border-rose-500', text: 'text-rose-700' },
  { bg: 'bg-emerald-500/20', border: 'border-emerald-500', text: 'text-emerald-700' },
  { bg: 'bg-violet-500/20', border: 'border-violet-500', text: 'text-violet-700' },
];

interface DragState {
  nodeId: string;
  startX: number;
  startY: number;
  nodeStartX: number;
  nodeStartY: number;
}

interface ConnectionDragState {
  fromNodeId: string;
  fromX: number;
  fromY: number;
  currentX: number;
  currentY: number;
}

export default function GameLoopPage() {
  const router = useRouter();
  const { project, loading, updateProject } = useProject();
  const [showIntro, setShowIntro] = useState(true);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [connectionDrag, setConnectionDrag] = useState<ConnectionDragState | null>(null);
  const [hoveredInputHandle, setHoveredInputHandle] = useState<string | null>(null);
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedLoopType, setSelectedLoopType] = useState<LoopType>('main');
  const [subLoopName, setSubLoopName] = useState('');
  const canvasRef = useRef<HTMLDivElement>(null);

  // Get unique sub-loop names for color assignment
  const getSubLoopColor = useCallback((loopName?: string) => {
    if (!project || !loopName) return SUB_LOOP_COLORS[0];
    const uniqueNames = [...new Set(project.gameLoop.filter(n => n.loopName).map(n => n.loopName))];
    const index = uniqueNames.indexOf(loopName);
    return SUB_LOOP_COLORS[index % SUB_LOOP_COLORS.length];
  }, [project]);

  // Handle mouse move for node dragging
  useEffect(() => {
    if (!dragState) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const deltaX = e.clientX - dragState.startX;
      const deltaY = e.clientY - dragState.startY;
      const newX = Math.max(0, Math.min(rect.width - 150, dragState.nodeStartX + deltaX));
      const newY = Math.max(0, Math.min(rect.height - 60, dragState.nodeStartY + deltaY));
      
      const nodes = project?.gameLoop || [];
      const updated = nodes.map(n => n.id === dragState.nodeId ? { ...n, x: newX, y: newY } : n);
      updateProject({ gameLoop: updated });
    };

    const handleMouseUp = () => {
      setDragState(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, project, updateProject]);

  // Handle mouse move for connection dragging
  useEffect(() => {
    if (!connectionDrag) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      setConnectionDrag(prev => prev ? {
        ...prev,
        currentX: e.clientX - rect.left,
        currentY: e.clientY - rect.top,
      } : null);
    };

    const handleMouseUp = () => {
      // Check if we're over an input handle
      if (hoveredInputHandle && connectionDrag) {
        const nodes = project?.gameLoop || [];
        const fromNode = nodes.find(n => n.id === connectionDrag.fromNodeId);
        if (fromNode && !fromNode.connections.includes(hoveredInputHandle) && connectionDrag.fromNodeId !== hoveredInputHandle) {
          const updated = nodes.map(n => n.id === connectionDrag.fromNodeId 
            ? { ...n, connections: [...n.connections, hoveredInputHandle] } 
            : n
          );
          updateProject({ gameLoop: updated });
        }
      }
      setConnectionDrag(null);
      setHoveredInputHandle(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [connectionDrag, hoveredInputHandle, project, updateProject]);

  if (loading || !project) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const nodes = project.gameLoop || [];

  const addNode = (type: GameLoopNodeType, x: number, y: number, loopType: LoopType = 'main', loopName?: string) => {
    const newNode: GameLoopNode = {
      id: crypto.randomUUID(),
      type,
      label: DEFAULT_LABELS[type],
      x,
      y,
      connections: [],
      loopType,
      loopName: loopType === 'sub' ? loopName : undefined,
    };
    updateProject({ gameLoop: [...nodes, newNode] });
    setContextMenuPos(null);
  };

  const updateNode = (id: string, updates: Partial<GameLoopNode>) => {
    const updated = nodes.map(n => n.id === id ? { ...n, ...updates } : n);
    updateProject({ gameLoop: updated });
  };

  const deleteNode = (id: string) => {
    const updated = nodes
      .filter(n => n.id !== id)
      .map(n => ({
        ...n,
        connections: n.connections.filter(c => c !== id),
      }));
    updateProject({ gameLoop: updated });
    setSelectedNode(null);
  };

  const removeConnection = (fromId: string, toId: string) => {
    const fromNode = nodes.find(n => n.id === fromId);
    if (fromNode) {
      updateNode(fromId, {
        connections: fromNode.connections.filter(c => c !== toId),
      });
    }
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('node-type') as GameLoopNodeType;
    const loopType = e.dataTransfer.getData('loop-type') as LoopType || 'main';
    const loopName = e.dataTransfer.getData('loop-name') || undefined;
    if (!type || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - 75;
    const y = e.clientY - rect.top - 25;
    addNode(type, Math.max(0, x), Math.max(0, y), loopType, loopName);
  };

  const handleCanvasDoubleClick = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setContextMenuPos({ x, y });
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    // Only deselect if clicking on canvas background
    if (e.target === canvasRef.current) {
      setSelectedNode(null);
      setContextMenuPos(null);
    }
  };

  const startNodeDrag = (e: React.MouseEvent, nodeId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    setDragState({
      nodeId,
      startX: e.clientX,
      startY: e.clientY,
      nodeStartX: node.x,
      nodeStartY: node.y,
    });
  };

  const startConnectionDrag = (e: React.MouseEvent, nodeId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canvasRef.current) return;
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const fromX = node.x + 150; // Right side of node
    const fromY = node.y + 25;  // Center height
    
    setConnectionDrag({
      fromNodeId: nodeId,
      fromX,
      fromY,
      currentX: e.clientX - rect.left,
      currentY: e.clientY - rect.top,
    });
  };

  const getNodeColor = (type: GameLoopNodeType) => {
    return NODE_TYPES.find(t => t.type === type)?.color || 'bg-gray-500';
  };

  const getNodeBorderColor = (type: GameLoopNodeType) => {
    return NODE_TYPES.find(t => t.type === type)?.borderColor || 'border-gray-500';
  };

  const canContinue = nodes.length >= 3;
  const totalConnections = nodes.reduce((sum, node) => sum + node.connections.length, 0);
  const hasNoConnections = nodes.length > 0 && totalConnections === 0;

  const getProgressHint = () => {
    if (nodes.length === 0) return null;
    if (nodes.length === 1) {
      return "Great start! Add more blocks to build your loop.";
    }
    if (hasNoConnections) {
      return "Now connect your blocks! Drag from the right dot (o) to another block's left dot.";
    }
    if (nodes.length < 3) {
      return `Add ${3 - nodes.length} more block${3 - nodes.length > 1 ? 's' : ''} to complete your loop.`;
    }
    if (canContinue) {
      return "Looking good! Continue when ready, or keep building.";
    }
    return null;
  };

  // Intro Screen with Minecraft Example
  if (showIntro) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
        <div className="w-full max-w-[700px] space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Understanding Game Loops</h1>
            <p className="text-muted-foreground mt-1">The core cycles that make games engaging</p>
          </div>

          <Card>
            <CardContent className="pt-6 space-y-6">
              <p className="text-muted-foreground">
                Every great game has loops — repeating cycles that keep players engaged. There&apos;s usually a <strong>main loop</strong> (the core experience) and <strong>sub-loops</strong> (supporting activities).
              </p>

              {/* Minecraft Example */}
              <div className="space-y-4">
                <p className="text-sm font-medium">Example: Minecraft</p>
                
                {/* Main Loop Visualization */}
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-xs font-medium uppercase tracking-wide">Main Loop</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs flex-wrap justify-center">
                    <div className="px-2 py-1.5 rounded bg-blue-500 text-white font-medium">Explore</div>
                    <span className="text-muted-foreground">→</span>
                    <div className="px-2 py-1.5 rounded bg-orange-500 text-white font-medium">Survive Night</div>
                    <span className="text-muted-foreground">→</span>
                    <div className="px-2 py-1.5 rounded bg-green-500 text-white font-medium">Get Stronger</div>
                    <span className="text-muted-foreground">→</span>
                    <div className="px-2 py-1.5 rounded bg-purple-500 text-white font-medium">Progress</div>
                    <span className="text-muted-foreground">→</span>
                    <div className="px-2 py-1.5 rounded bg-pink-500 text-white font-medium">Repeat</div>
                  </div>
                </div>

                {/* Sub-Loops */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                      <span className="text-xs font-medium text-cyan-700">Mining Sub-Loop</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] flex-wrap">
                      <span className="px-1.5 py-0.5 rounded bg-blue-500/80 text-white">Dig</span>
                      <span>→</span>
                      <span className="px-1.5 py-0.5 rounded bg-orange-500/80 text-white">Find Ores</span>
                      <span>→</span>
                      <span className="px-1.5 py-0.5 rounded bg-green-500/80 text-white">Better Tools</span>
                    </div>
                  </div>
                  
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                      <span className="text-xs font-medium text-amber-700">Combat Sub-Loop</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] flex-wrap">
                      <span className="px-1.5 py-0.5 rounded bg-blue-500/80 text-white">Hunt</span>
                      <span>→</span>
                      <span className="px-1.5 py-0.5 rounded bg-orange-500/80 text-white">Fight</span>
                      <span>→</span>
                      <span className="px-1.5 py-0.5 rounded bg-green-500/80 text-white">Loot</span>
                    </div>
                  </div>
                  
                  <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                      <span className="text-xs font-medium text-rose-700">Building Sub-Loop</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] flex-wrap">
                      <span className="px-1.5 py-0.5 rounded bg-blue-500/80 text-white">Gather</span>
                      <span>→</span>
                      <span className="px-1.5 py-0.5 rounded bg-orange-500/80 text-white">Plan</span>
                      <span>→</span>
                      <span className="px-1.5 py-0.5 rounded bg-green-500/80 text-white">Create</span>
                    </div>
                  </div>
                  
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      <span className="text-xs font-medium text-emerald-700">Farming Sub-Loop</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] flex-wrap">
                      <span className="px-1.5 py-0.5 rounded bg-blue-500/80 text-white">Plant</span>
                      <span>→</span>
                      <span className="px-1.5 py-0.5 rounded bg-orange-500/80 text-white">Wait</span>
                      <span>→</span>
                      <span className="px-1.5 py-0.5 rounded bg-green-500/80 text-white">Harvest</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  Sub-loops feed into and support the main loop, creating depth
                </p>
              </div>

              <div className="space-y-3 border-t pt-4">
                <p className="text-sm font-medium">Your task:</p>
                <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                  <li>Start with your <strong>Main Loop</strong> — the core cycle players repeat</li>
                  <li>Add <strong>Sub-Loops</strong> for supporting activities (optional but adds depth)</li>
                  <li><strong>Connect</strong> blocks by dragging from the right dot to another block</li>
                </ol>
              </div>

              <div className="space-y-2 border-t pt-4">
                <p className="text-sm font-medium">Building blocks:</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-blue-500"></div>
                    <span><strong>Action</strong> — What players DO</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-orange-500"></div>
                    <span><strong>Challenge</strong> — What they OVERCOME</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-green-500"></div>
                    <span><strong>Reward</strong> — What they GAIN</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-purple-500"></div>
                    <span><strong>Decision</strong> — Choice points</span>
                  </div>
                </div>
              </div>

              <Button onClick={() => setShowIntro(false)} className="w-full gap-2" size="lg">
                Build My Game Loops
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <Button variant="ghost" onClick={() => router.push('/finalize')} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Concept
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-4 h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.push('/finalize')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Concept
          </Button>
          <h1 className="text-xl font-semibold tracking-tight">Game Loop Builder</h1>
          <Popover>
            <PopoverTrigger asChild>
              <button className="text-muted-foreground hover:text-foreground">
                <HelpCircle className="h-4 w-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 text-sm">
              <p className="font-medium mb-2">How to use:</p>
              <ol className="space-y-2 text-muted-foreground list-decimal list-inside">
                <li><strong>Drag</strong> blocks from the palette onto the canvas</li>
                <li><strong>Connect</strong> by dragging from the right dot (o) to another block&apos;s left dot</li>
                <li><strong>Move</strong> blocks using the grip handle (⋮⋮)</li>
                <li><strong>Edit</strong> text by clicking on it</li>
                <li><strong>Double-click</strong> canvas to add nodes quickly</li>
              </ol>
              <p className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                Tip: Create a main loop first, then add sub-loops for supporting activities!
              </p>
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {nodes.length} block{nodes.length !== 1 ? 's' : ''}
          </span>
          <Button
            onClick={() => router.push('/coming-soon')}
            disabled={!canContinue}
            className="gap-2"
          >
            Continue to Validation
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Progress Hint Banner */}
      {getProgressHint() && (
        <div className="mb-3 px-4 py-2 bg-muted/50 rounded-lg border border-muted text-sm text-muted-foreground">
          {getProgressHint()}
        </div>
      )}

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Node Palette */}
        <div className="w-52 flex-shrink-0 space-y-4 overflow-y-auto">
          {/* Loop Type Selector */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">Loop Type</Label>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedLoopType('main')}
                className={`flex-1 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  selectedLoopType === 'main' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                Main Loop
              </button>
              <button
                onClick={() => setSelectedLoopType('sub')}
                className={`flex-1 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  selectedLoopType === 'sub' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                Sub-Loop
              </button>
            </div>
            {selectedLoopType === 'sub' && (
              <Input
                placeholder="Loop name (e.g., Mining)"
                value={subLoopName}
                onChange={(e) => setSubLoopName(e.target.value)}
                className="text-xs h-8"
              />
            )}
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Drag to canvas →</p>
            {NODE_TYPES.map((nodeType) => (
              <div
                key={nodeType.type}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('node-type', nodeType.type);
                  e.dataTransfer.setData('loop-type', selectedLoopType);
                  if (selectedLoopType === 'sub' && subLoopName) {
                    e.dataTransfer.setData('loop-name', subLoopName);
                  }
                }}
                className={`${nodeType.color} text-white px-3 py-2 rounded-lg cursor-grab active:cursor-grabbing text-sm font-medium shadow-sm hover:shadow-md transition-shadow`}
              >
                <div>{nodeType.label}</div>
                <div className="text-xs opacity-80">{nodeType.description}</div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setShowIntro(true)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors w-full text-left"
          >
            What&apos;s a game loop?
          </button>
        </div>

        {/* Canvas */}
        <div
          ref={canvasRef}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleCanvasDrop}
          onDoubleClick={handleCanvasDoubleClick}
          onClick={handleCanvasClick}
          className="flex-1 bg-muted/30 rounded-xl border-2 border-dashed relative overflow-hidden"
          style={{ minHeight: '400px', cursor: connectionDrag ? 'crosshair' : 'default' }}
        >
          {/* Connection Lines (Bezier Curves) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="#666" />
              </marker>
            </defs>
            
            {/* Existing connections */}
            {nodes.map((node) =>
              node.connections.map((targetId) => {
                const target = nodes.find(n => n.id === targetId);
                if (!target) return null;
                
                // From right side of source to left side of target
                const x1 = node.x + 150;
                const y1 = node.y + 25;
                const x2 = target.x;
                const y2 = target.y + 25;
                
                // Calculate bezier control points
                const midX = (x1 + x2) / 2;
                const path = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
                
                return (
                  <g key={`${node.id}-${targetId}`} className="group" style={{ pointerEvents: 'auto' }}>
                    {/* Invisible wider path for easier interaction */}
                    <path
                      d={path}
                      fill="none"
                      stroke="transparent"
                      strokeWidth="20"
                      className="cursor-pointer"
                      onClick={() => removeConnection(node.id, targetId)}
                    />
                    <path
                      d={path}
                      fill="none"
                      stroke="#666"
                      strokeWidth="2"
                      markerEnd="url(#arrowhead)"
                      className="pointer-events-none"
                    />
                    {/* Delete button on hover - positioned at midpoint */}
                    <g 
                      className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      onClick={() => removeConnection(node.id, targetId)}
                      style={{ pointerEvents: 'auto' }}
                    >
                      <circle cx={midX} cy={(y1 + y2) / 2} r="10" fill="white" stroke="#ef4444" strokeWidth="2" />
                      <text x={midX} y={(y1 + y2) / 2 + 4} textAnchor="middle" fontSize="12" fill="#ef4444">×</text>
                    </g>
                  </g>
                );
              })
            )}
            
            {/* Dragging connection line */}
            {connectionDrag && (
              <path
                d={`M ${connectionDrag.fromX} ${connectionDrag.fromY} C ${(connectionDrag.fromX + connectionDrag.currentX) / 2} ${connectionDrag.fromY}, ${(connectionDrag.fromX + connectionDrag.currentX) / 2} ${connectionDrag.currentY}, ${connectionDrag.currentX} ${connectionDrag.currentY}`}
                fill="none"
                stroke="#666"
                strokeWidth="2"
                strokeDasharray="5,5"
                markerEnd="url(#arrowhead)"
              />
            )}
          </svg>

          {/* Nodes */}
          {nodes.map((node) => {
            const isSubLoop = node.loopType === 'sub';
            const subLoopColor = isSubLoop ? getSubLoopColor(node.loopName) : null;
            
            return (
              <div
                key={node.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedNode(selectedNode === node.id ? null : node.id);
                }}
                className={`absolute group ${
                  selectedNode === node.id ? 'ring-2 ring-primary ring-offset-2' : ''
                } ${isSubLoop ? 'border-2 border-dashed ' + subLoopColor?.border : ''}`}
                style={{
                  left: node.x,
                  top: node.y,
                  zIndex: selectedNode === node.id ? 20 : 10,
                }}
              >
                {/* Sub-loop label */}
                {isSubLoop && node.loopName && (
                  <div className={`absolute -top-5 left-0 text-[10px] font-medium ${subLoopColor?.text}`}>
                    {node.loopName}
                  </div>
                )}
                
                {/* Input Handle (Left) */}
                <div
                  className={`absolute -left-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 bg-white transition-all cursor-pointer z-20 ${
                    hoveredInputHandle === node.id 
                      ? 'border-green-500 scale-125 bg-green-100' 
                      : 'border-gray-400 hover:border-gray-600 hover:scale-110'
                  }`}
                  onMouseEnter={() => connectionDrag && setHoveredInputHandle(node.id)}
                  onMouseLeave={() => setHoveredInputHandle(null)}
                />
                
                {/* Node Content */}
                <div className={`${getNodeColor(node.type)} text-white rounded-lg shadow-md min-w-[150px] flex items-center ${isSubLoop ? 'opacity-90' : ''}`}>
                  {/* Drag Handle */}
                  <div
                    className="px-2 py-3 cursor-grab active:cursor-grabbing hover:bg-white/10 rounded-l-lg flex items-center"
                    onMouseDown={(e) => startNodeDrag(e, node.id)}
                  >
                    <GripVertical className="h-4 w-4 opacity-60" />
                  </div>
                  
                  {/* Label Input */}
                  <div className="flex-1 pr-2 py-1">
                    <Input
                      value={node.label}
                      onChange={(e) => updateNode(node.id, { label: e.target.value })}
                      className="bg-transparent border-none text-white placeholder:text-white/60 h-auto p-1 text-sm font-medium focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  </div>
                </div>
                
                {/* Output Handle (Right) */}
                <div
                  className="absolute -right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-gray-400 bg-white hover:border-blue-500 hover:scale-125 hover:bg-blue-100 transition-all cursor-crosshair z-20"
                  onMouseDown={(e) => startConnectionDrag(e, node.id)}
                />
                
                {/* Delete Button (shown when selected) */}
                {selectedNode === node.id && (
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteNode(node.id); }}
                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors z-30"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            );
          })}

          {/* Context Menu for adding nodes */}
          {contextMenuPos && (
            <div
              className="absolute bg-white rounded-lg shadow-xl border p-2 z-50"
              style={{ left: contextMenuPos.x, top: contextMenuPos.y }}
            >
              <div className="text-xs font-medium text-muted-foreground mb-2 px-2">Add Block</div>
              <div className="space-y-1">
                {NODE_TYPES.map((nodeType) => (
                  <button
                    key={nodeType.type}
                    onClick={() => addNode(nodeType.type, contextMenuPos.x - 75, contextMenuPos.y - 25, selectedLoopType, selectedLoopType === 'sub' ? subLoopName : undefined)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-muted transition-colors`}
                  >
                    <div className={`w-3 h-3 rounded ${nodeType.color}`}></div>
                    <span>{nodeType.label}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setContextMenuPos(null)}
                className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* Empty State */}
          {nodes.length === 0 && !contextMenuPos && (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground pointer-events-none">
              <div className="text-center space-y-2">
                <p className="text-lg font-medium">Start building your game loop!</p>
                <p className="text-sm">
                  Drag blocks from the left, or <strong>double-click</strong> here to add
                </p>
                <p className="text-xs">Begin with an Action — what does the player DO?</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center mt-4">
        <button
          onClick={() => router.push('/idea')}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Edit Original Idea
        </button>
        {!canContinue && (
          <p className="text-sm text-muted-foreground">
            Add at least 3 blocks to continue
          </p>
        )}
      </div>
    </div>
  );
}

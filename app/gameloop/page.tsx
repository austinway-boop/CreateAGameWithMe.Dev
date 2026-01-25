'use client';

import { useRouter } from 'next/navigation';
import { useState, useRef, DragEvent, MouseEvent } from 'react';
import { ArrowRight, Plus, Trash2, HelpCircle } from 'lucide-react';
import { useProject } from '@/hooks/useProject';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { GameLoopNode, GameLoopNodeType } from '@/lib/types';

const NODE_TYPES: { type: GameLoopNodeType; label: string; color: string; description: string }[] = [
  { type: 'action', label: 'Action', color: 'bg-blue-500', description: 'What the player DOES' },
  { type: 'challenge', label: 'Challenge', color: 'bg-orange-500', description: 'What they must OVERCOME' },
  { type: 'reward', label: 'Reward', color: 'bg-green-500', description: 'What they GAIN' },
  { type: 'decision', label: 'Decision', color: 'bg-purple-500', description: 'A choice point' },
  { type: 'repeat', label: 'Repeat', color: 'bg-pink-500', description: 'Loop back' },
];

const DEFAULT_LABELS: Record<GameLoopNodeType, string> = {
  action: 'Player does...',
  challenge: 'Must overcome...',
  reward: 'Gains...',
  decision: 'Chooses...',
  repeat: 'Loop',
};

export default function GameLoopPage() {
  const router = useRouter();
  const { project, loading, updateProject } = useProject();
  const [showIntro, setShowIntro] = useState(true);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  if (loading || !project) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const nodes = project.gameLoop || [];

  const addNode = (type: GameLoopNodeType, x: number, y: number) => {
    const newNode: GameLoopNode = {
      id: crypto.randomUUID(),
      type,
      label: DEFAULT_LABELS[type],
      x,
      y,
      connections: [],
    };
    updateProject({ gameLoop: [...nodes, newNode] });
  };

  const updateNode = (id: string, updates: Partial<GameLoopNode>) => {
    const updated = nodes.map(n => n.id === id ? { ...n, ...updates } : n);
    updateProject({ gameLoop: updated });
  };

  const deleteNode = (id: string) => {
    // Remove node and any connections to it
    const updated = nodes
      .filter(n => n.id !== id)
      .map(n => ({
        ...n,
        connections: n.connections.filter(c => c !== id),
      }));
    updateProject({ gameLoop: updated });
    setSelectedNode(null);
  };

  const handleCanvasDrop = (e: DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('node-type') as GameLoopNodeType;
    if (!type || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - 60; // Center the node
    const y = e.clientY - rect.top - 20;
    addNode(type, Math.max(0, x), Math.max(0, y));
  };

  const handleNodeDrag = (e: DragEvent, nodeId: string) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - 60;
    const y = e.clientY - rect.top - 20;
    updateNode(nodeId, { x: Math.max(0, x), y: Math.max(0, y) });
  };

  const startConnection = (nodeId: string) => {
    if (connectingFrom === nodeId) {
      setConnectingFrom(null);
    } else if (connectingFrom) {
      // Complete connection
      const fromNode = nodes.find(n => n.id === connectingFrom);
      if (fromNode && !fromNode.connections.includes(nodeId) && connectingFrom !== nodeId) {
        updateNode(connectingFrom, {
          connections: [...fromNode.connections, nodeId],
        });
      }
      setConnectingFrom(null);
    } else {
      setConnectingFrom(nodeId);
    }
  };

  const removeConnection = (fromId: string, toId: string) => {
    const fromNode = nodes.find(n => n.id === fromId);
    if (fromNode) {
      updateNode(fromId, {
        connections: fromNode.connections.filter(c => c !== toId),
      });
    }
  };

  const getNodeColor = (type: GameLoopNodeType) => {
    return NODE_TYPES.find(t => t.type === type)?.color || 'bg-gray-500';
  };

  const canContinue = nodes.length >= 3;

  // Intro Screen
  if (showIntro) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[600px] space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-semibold tracking-tight">What&apos;s a Game Loop?</h1>
          </div>

          <Card>
            <CardContent className="pt-6 space-y-6">
              <p className="text-muted-foreground">
                A game loop is the core cycle players repeat throughout your game. Every great game has one.
              </p>

              {/* Example */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <p className="text-sm font-medium">Example: Tetris</p>
                <div className="flex items-center gap-2 text-sm flex-wrap">
                  <span className="px-2 py-1 rounded bg-blue-500 text-white">Rotate/Move</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="px-2 py-1 rounded bg-orange-500 text-white">Clear Lines</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="px-2 py-1 rounded bg-green-500 text-white">Score Points</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="px-2 py-1 rounded bg-pink-500 text-white">Repeat</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Every loop needs:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <span className="text-blue-500 font-medium">Action</span> — Something to DO</li>
                  <li>• <span className="text-orange-500 font-medium">Challenge</span> — Something to OVERCOME</li>
                  <li>• <span className="text-green-500 font-medium">Reward</span> — Something to GAIN</li>
                </ul>
              </div>

              <Button onClick={() => setShowIntro(false)} className="w-full gap-2" size="lg">
                Build My Loop
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <button
            onClick={() => router.push('/finalize')}
            className="block w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to Concept
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-4 h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold tracking-tight">Game Loop Builder</h1>
          <Popover>
            <PopoverTrigger asChild>
              <button className="text-muted-foreground hover:text-foreground">
                <HelpCircle className="h-4 w-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-64 text-sm">
              <p className="font-medium mb-2">How to use:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Drag nodes from the palette</li>
                <li>• Click a node to select it</li>
                <li>• Click &quot;Connect&quot; then another node to link them</li>
                <li>• Double-click to edit labels</li>
              </ul>
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {nodes.length} node{nodes.length !== 1 ? 's' : ''}
          </span>
          <Button
            onClick={() => router.push('/card')}
            disabled={!canContinue}
            className="gap-2"
          >
            Generate Concept Card
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Node Palette */}
        <div className="w-48 flex-shrink-0 space-y-2">
          <p className="text-xs font-medium text-muted-foreground mb-3">Drag to canvas →</p>
          {NODE_TYPES.map((nodeType) => (
            <div
              key={nodeType.type}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('node-type', nodeType.type);
              }}
              className={`${nodeType.color} text-white px-3 py-2 rounded-lg cursor-grab active:cursor-grabbing text-sm font-medium shadow-sm hover:shadow-md transition-shadow`}
            >
              <div>{nodeType.label}</div>
              <div className="text-xs opacity-80">{nodeType.description}</div>
            </div>
          ))}
        </div>

        {/* Canvas */}
        <div
          ref={canvasRef}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleCanvasDrop}
          className="flex-1 bg-muted/30 rounded-xl border-2 border-dashed relative overflow-hidden"
          style={{ minHeight: '400px' }}
        >
          {/* Connection Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {nodes.map((node) =>
              node.connections.map((targetId) => {
                const target = nodes.find(n => n.id === targetId);
                if (!target) return null;
                const x1 = node.x + 60;
                const y1 = node.y + 20;
                const x2 = target.x + 60;
                const y2 = target.y + 20;
                return (
                  <g key={`${node.id}-${targetId}`}>
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="#888"
                      strokeWidth="2"
                      markerEnd="url(#arrowhead)"
                    />
                  </g>
                );
              })
            )}
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="#888" />
              </marker>
            </defs>
          </svg>

          {/* Nodes */}
          {nodes.map((node) => (
            <div
              key={node.id}
              draggable
              onDragEnd={(e) => handleNodeDrag(e, node.id)}
              onClick={() => setSelectedNode(selectedNode === node.id ? null : node.id)}
              className={`absolute cursor-move group ${
                selectedNode === node.id ? 'ring-2 ring-primary ring-offset-2' : ''
              } ${connectingFrom === node.id ? 'ring-2 ring-yellow-400' : ''}`}
              style={{
                left: node.x,
                top: node.y,
              }}
            >
              <div className={`${getNodeColor(node.type)} text-white px-3 py-2 rounded-lg shadow-md min-w-[120px]`}>
                <Input
                  value={node.label}
                  onChange={(e) => updateNode(node.id, { label: e.target.value })}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-transparent border-none text-white placeholder:text-white/60 h-auto p-0 text-sm font-medium focus-visible:ring-0"
                />
              </div>

              {/* Node Actions */}
              {selectedNode === node.id && (
                <div className="absolute -bottom-10 left-0 flex gap-1 bg-white rounded-lg shadow-lg p-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); startConnection(node.id); }}
                    className={`px-2 py-1 text-xs rounded ${
                      connectingFrom === node.id ? 'bg-yellow-100 text-yellow-700' : 'hover:bg-muted'
                    }`}
                  >
                    {connectingFrom === node.id ? 'Click target...' : 'Connect'}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteNode(node.id); }}
                    className="px-2 py-1 text-xs rounded hover:bg-red-100 text-red-600"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* Empty State */}
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              <p className="text-center">
                Drag nodes here to build your game loop<br />
                <span className="text-sm">Start with an Action!</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center mt-4">
        <button
          onClick={() => setShowIntro(true)}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← What&apos;s a game loop?
        </button>
        {!canContinue && (
          <p className="text-sm text-muted-foreground">
            Add at least 3 nodes to continue
          </p>
        )}
      </div>
    </div>
  );
}

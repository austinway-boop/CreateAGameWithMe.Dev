'use client';

import { useRouter } from 'next/navigation';
import { useState, useRef, useCallback, useEffect } from 'react';
import { ArrowRight, ArrowLeft, HelpCircle, X, Plus } from 'lucide-react';
import { useProject } from '@/hooks/useProject';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SkillTreeNode, SkillLevel } from '@/lib/types';

const SKILL_LEVELS: { level: SkillLevel; label: string; color: string; borderColor: string; description: string }[] = [
  { level: 'core', label: 'Core', color: 'bg-green-500', borderColor: 'border-green-500', description: 'Foundation skills everyone needs' },
  { level: 'advanced', label: 'Advanced', color: 'bg-blue-500', borderColor: 'border-blue-500', description: 'Skills that build on the basics' },
  { level: 'expert', label: 'Expert', color: 'bg-purple-500', borderColor: 'border-purple-500', description: 'Mastery-level techniques' },
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

export default function SkillTreePage() {
  const router = useRouter();
  const { project, loading, updateProject } = useProject();
  const [showIntro, setShowIntro] = useState(true);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [connectionDrag, setConnectionDrag] = useState<ConnectionDragState | null>(null);
  const [hoveredInputHandle, setHoveredInputHandle] = useState<string | null>(null);
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<SkillLevel>('core');
  const canvasRef = useRef<HTMLDivElement>(null);

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
      
      const nodes = project?.skillTree || [];
      const updated = nodes.map(n => n.id === dragState.nodeId ? { ...n, x: newX, y: newY } : n);
      updateProject({ skillTree: updated });
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
        const nodes = project?.skillTree || [];
        const toNode = nodes.find(n => n.id === hoveredInputHandle);
        if (toNode && !toNode.dependencies.includes(connectionDrag.fromNodeId) && connectionDrag.fromNodeId !== hoveredInputHandle) {
          // Add dependency: the target node depends on the source node
          const updated = nodes.map(n => n.id === hoveredInputHandle 
            ? { ...n, dependencies: [...n.dependencies, connectionDrag.fromNodeId] } 
            : n
          );
          updateProject({ skillTree: updated });
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

  const nodes = project.skillTree || [];

  const addNode = (level: SkillLevel, x: number, y: number) => {
    const newNode: SkillTreeNode = {
      id: crypto.randomUUID(),
      label: level === 'core' ? 'Basic skill...' : level === 'advanced' ? 'Advanced skill...' : 'Expert technique...',
      level,
      x,
      y,
      dependencies: [],
    };
    updateProject({ skillTree: [...nodes, newNode] });
    setContextMenuPos(null);
  };

  const updateNode = (id: string, updates: Partial<SkillTreeNode>) => {
    const updated = nodes.map(n => n.id === id ? { ...n, ...updates } : n);
    updateProject({ skillTree: updated });
  };

  const deleteNode = (id: string) => {
    const updated = nodes
      .filter(n => n.id !== id)
      .map(n => ({
        ...n,
        dependencies: n.dependencies.filter(d => d !== id),
      }));
    updateProject({ skillTree: updated });
    setSelectedNode(null);
  };

  const removeDependency = (nodeId: string, depId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      updateNode(nodeId, {
        dependencies: node.dependencies.filter(d => d !== depId),
      });
    }
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const level = e.dataTransfer.getData('skill-level') as SkillLevel;
    if (!level || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - 75;
    const y = e.clientY - rect.top - 25;
    addNode(level, Math.max(0, x), Math.max(0, y));
  };

  const handleCanvasDoubleClick = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setContextMenuPos({ x, y });
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
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
    const fromX = node.x + 75;  // Center of node
    const fromY = node.y - 5;   // Top of node
    
    setConnectionDrag({
      fromNodeId: nodeId,
      fromX,
      fromY,
      currentX: e.clientX - rect.left,
      currentY: e.clientY - rect.top,
    });
  };

  const getLevelColor = (level: SkillLevel) => {
    return SKILL_LEVELS.find(l => l.level === level)?.color || 'bg-gray-500';
  };

  const canContinue = nodes.length >= 3;

  // Intro Screen
  if (showIntro) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
        <div className="w-full max-w-[600px] space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Skill Dependency Tree</h1>
            <p className="text-muted-foreground mt-2">Map out every skill players need to master in your game</p>
          </div>

          <Card>
            <CardContent className="pt-6 space-y-5">
              <div className="space-y-3">
                <p className="font-medium">What is a Skill Tree?</p>
                <p className="text-muted-foreground text-sm">
                  Every game teaches players skills. A skill tree maps out what players learn and in what order — 
                  showing which foundational skills must be mastered before advanced techniques become possible.
                </p>
              </div>

              {/* Example */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <p className="text-sm font-medium">Example: A Shooter Game</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-green-500"></div>
                    <strong>Core:</strong> Move, Aim, Shoot
                  </div>
                  <div className="flex items-center gap-2 pl-4">
                    <span className="text-muted-foreground">↓ builds to</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-blue-500"></div>
                    <strong>Advanced:</strong> Track moving targets, Use cover, Reload timing
                  </div>
                  <div className="flex items-center gap-2 pl-4">
                    <span className="text-muted-foreground">↓ builds to</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-purple-500"></div>
                    <strong>Expert:</strong> Predict enemy movement, Combo abilities, Map control
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-2">
                <p className="text-sm font-medium">How to build your tree:</p>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Start with <strong className="text-green-600">Core skills</strong> — what does everyone need to learn first?</li>
                  <li>Add <strong className="text-blue-600">Advanced skills</strong> that build on the basics</li>
                  <li>Add <strong className="text-purple-600">Expert skills</strong> that separate good players from great</li>
                  <li>Connect them: drag from a skill's top handle to show "this requires that"</li>
                </ol>
              </div>

              {/* Skill Levels */}
              <div className="flex flex-wrap gap-4 text-sm border-t pt-4">
                {SKILL_LEVELS.map((level) => (
                  <div key={level.level} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded ${level.color}`}></div>
                    <span><strong>{level.label}:</strong> {level.description}</span>
                  </div>
                ))}
              </div>

              <Button onClick={() => setShowIntro(false)} className="w-full gap-2" size="lg">
                Start Building
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <Button variant="ghost" onClick={() => router.push('/questions')} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Questions
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
          <Button variant="outline" size="sm" onClick={() => router.push('/questions')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Questions
          </Button>
          <h1 className="text-xl font-semibold tracking-tight">Skill Dependency Tree</h1>
          <Button variant="outline" size="sm" onClick={() => setShowIntro(true)} className="gap-2">
            <HelpCircle className="h-4 w-4" />
            How it works
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {nodes.length} skill{nodes.length !== 1 ? 's' : ''}
          </span>
          <Button
            onClick={() => {
              updateProject({ currentPage: 'coming-soon' });
              router.push('/coming-soon');
            }}
            disabled={!canContinue}
            className="gap-2"
          >
            Continue
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Progress Hint */}
      {nodes.length < 3 && (
        <div className="mb-3 px-4 py-2 bg-muted/50 rounded-lg border border-muted text-sm text-muted-foreground">
          {nodes.length === 0 && "Start by adding Core skills — what must every player learn first?"}
          {nodes.length === 1 && "Great! Add more skills to build your tree."}
          {nodes.length === 2 && "One more skill to continue. Try connecting them to show dependencies!"}
        </div>
      )}

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Skill Palette */}
        <div className="w-52 flex-shrink-0 space-y-4 overflow-y-auto">
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">Skill Level</Label>
            <div className="flex flex-col gap-2">
              {SKILL_LEVELS.map((level) => (
                <button
                  key={level.level}
                  onClick={() => setSelectedLevel(level.level)}
                  className={`px-3 py-1.5 rounded text-xs font-medium text-left transition-colors ${
                    selectedLevel === level.level 
                      ? level.color + ' text-white' 
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  {level.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Drag to canvas →</p>
            {SKILL_LEVELS.map((level) => (
              <div
                key={level.level}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('skill-level', level.level);
                }}
                className={`${level.color} text-white px-3 py-2 rounded-lg cursor-grab active:cursor-grabbing text-sm font-medium shadow-sm hover:shadow-md transition-shadow`}
              >
                <div>{level.label} Skill</div>
                <div className="text-xs opacity-80">{level.description}</div>
              </div>
            ))}
          </div>

          {/* Tips */}
          <div className="space-y-2 pt-4 border-t">
            <p className="text-xs font-medium text-muted-foreground">Tips:</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Drag from top handle to connect skills</li>
              <li>• Click text to edit skill names</li>
              <li>• Arrow shows "requires this first"</li>
            </ul>
          </div>
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
          {/* Connection Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
            <defs>
              <marker
                id="arrow-up"
                markerWidth="10"
                markerHeight="7"
                refX="5"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 7, 5 0, 10 7" fill="#666" />
              </marker>
            </defs>
            
            {/* Existing connections - arrows point UP to show dependency */}
            {nodes.map((node) =>
              node.dependencies.map((depId) => {
                const dep = nodes.find(n => n.id === depId);
                if (!dep) return null;
                
                // From dependency (bottom) to node (top)
                const x1 = dep.x + 75;   // Center of dependency
                const y1 = dep.y + 50;   // Bottom of dependency
                const x2 = node.x + 75;  // Center of node
                const y2 = node.y;       // Top of node
                
                // Bezier curve going upward
                const midY = (y1 + y2) / 2;
                const path = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
                
                return (
                  <g key={`${node.id}-${depId}`} className="group" style={{ pointerEvents: 'auto' }}>
                    <path
                      d={path}
                      fill="none"
                      stroke="transparent"
                      strokeWidth="20"
                      className="cursor-pointer"
                      onClick={() => removeDependency(node.id, depId)}
                    />
                    <path
                      d={path}
                      fill="none"
                      stroke="#666"
                      strokeWidth="2"
                      markerEnd="url(#arrow-up)"
                      className="pointer-events-none"
                    />
                    <g 
                      className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      onClick={() => removeDependency(node.id, depId)}
                      style={{ pointerEvents: 'auto' }}
                    >
                      <circle cx={(x1 + x2) / 2} cy={midY} r="10" fill="white" stroke="#ef4444" strokeWidth="2" />
                      <text x={(x1 + x2) / 2} y={midY + 4} textAnchor="middle" fontSize="12" fill="#ef4444">×</text>
                    </g>
                  </g>
                );
              })
            )}
            
            {/* Dragging connection */}
            {connectionDrag && (
              <path
                d={`M ${connectionDrag.fromX} ${connectionDrag.fromY} C ${connectionDrag.fromX} ${(connectionDrag.fromY + connectionDrag.currentY) / 2}, ${connectionDrag.currentX} ${(connectionDrag.fromY + connectionDrag.currentY) / 2}, ${connectionDrag.currentX} ${connectionDrag.currentY}`}
                fill="none"
                stroke="#666"
                strokeWidth="2"
                strokeDasharray="5,5"
              />
            )}
          </svg>

          {/* Nodes */}
          {nodes.map((node) => (
            <div
              key={node.id}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedNode(selectedNode === node.id ? null : node.id);
              }}
              onMouseDown={(e) => {
                const target = e.target as HTMLElement;
                if (target.tagName === 'INPUT' || target.closest('[data-handle]')) return;
                startNodeDrag(e, node.id);
              }}
              className={`absolute group cursor-grab active:cursor-grabbing ${
                selectedNode === node.id ? 'ring-2 ring-primary ring-offset-2' : ''
              }`}
              style={{
                left: node.x,
                top: node.y,
                zIndex: selectedNode === node.id || dragState?.nodeId === node.id ? 20 : 10,
              }}
            >
              {/* Top Handle - for incoming connections (this skill requires...) */}
              <div
                data-handle="input"
                className={`absolute left-1/2 -translate-x-1/2 -top-3 w-4 h-4 rounded-full border-2 bg-white transition-all cursor-pointer z-20 ${
                  hoveredInputHandle === node.id 
                    ? 'border-green-500 scale-125 bg-green-100' 
                    : 'border-gray-400 hover:border-gray-600 hover:scale-110'
                }`}
                onMouseEnter={() => connectionDrag && setHoveredInputHandle(node.id)}
                onMouseLeave={() => setHoveredInputHandle(null)}
              />
              
              {/* Node Content */}
              <div className={`${getLevelColor(node.level)} text-white rounded-lg shadow-md min-w-[150px]`}>
                <div className="px-3 py-2">
                  <div className="text-[10px] uppercase tracking-wide opacity-70 mb-1">{node.level}</div>
                  <Input
                    value={node.label}
                    onChange={(e) => updateNode(node.id, { label: e.target.value })}
                    className="bg-transparent border-none text-white placeholder:text-white/60 h-auto p-0 text-sm font-medium focus-visible:ring-0 focus-visible:ring-offset-0 cursor-text"
                  />
                </div>
              </div>
              
              {/* Bottom Handle - for outgoing connections (required by...) */}
              <div
                data-handle="output"
                className="absolute left-1/2 -translate-x-1/2 -bottom-3 w-4 h-4 rounded-full border-2 border-gray-400 bg-white hover:border-blue-500 hover:scale-125 hover:bg-blue-100 transition-all cursor-crosshair z-20"
                onMouseDown={(e) => startConnectionDrag(e, node.id)}
              />
              
              {/* Delete Button */}
              {selectedNode === node.id && (
                <button
                  onClick={(e) => { e.stopPropagation(); deleteNode(node.id); }}
                  className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors z-30"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}

          {/* Context Menu */}
          {contextMenuPos && (
            <div
              className="absolute bg-white rounded-lg shadow-xl border p-2 z-50"
              style={{ left: contextMenuPos.x, top: contextMenuPos.y }}
            >
              <div className="text-xs font-medium text-muted-foreground mb-2 px-2">Add Skill</div>
              <div className="space-y-1">
                {SKILL_LEVELS.map((level) => (
                  <button
                    key={level.level}
                    onClick={() => addNode(level.level, contextMenuPos.x - 75, contextMenuPos.y - 25)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-muted transition-colors"
                  >
                    <div className={`w-3 h-3 rounded ${level.color}`}></div>
                    <span>{level.label}</span>
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
                <p className="text-lg font-medium">Build your skill tree!</p>
                <p className="text-sm">
                  Drag skills from the left, or <strong>double-click</strong> here to add
                </p>
                <p className="text-xs">Start with Core skills — what must every player learn first?</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center mt-4">
        <button
          onClick={() => router.push('/questions')}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to Questions
        </button>
        {!canContinue && (
          <p className="text-sm text-muted-foreground">
            Add at least 3 skills to continue
          </p>
        )}
      </div>
    </div>
  );
}

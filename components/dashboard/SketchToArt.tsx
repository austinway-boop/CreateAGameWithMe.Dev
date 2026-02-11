'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Pencil, Eraser, Undo2, Redo2, Trash2, Download, Upload,
  Loader2, Sparkles, PaintBucket, Minus, Square, Circle,
} from 'lucide-react';
import { useProject } from '@/hooks/useProject';
import { CreditInfo } from '@/lib/credits';

type BrushType = 'pencil' | 'eraser' | 'fill' | 'line' | 'rectangle' | 'circle';
type SketchFidelity = 'loose' | 'balanced' | 'close';
type GenerationMode = 'scene' | 'item';

interface GeneratedResult {
  id: string;
  imageUrl: string;
  description: string;
  mode: GenerationMode;
  fidelity: SketchFidelity;
}

const BRUSH_SIZES = [2, 5, 10, 20, 40];
const PRESET_COLORS = [
  '#000000', '#ffffff', '#52525b', '#a1a1aa',
  '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899',
  '#ef4444', '#f59e0b', '#22c55e', '#06b6d4',
];

interface Props {
  credits: CreditInfo | null;
  onCreditsUpdate: () => void;
}

export function SketchToArt({ credits, onCreditsUpdate }: Props) {
  const { project } = useProject();

  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const colorPickerRef = useRef<HTMLInputElement>(null);

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState<BrushType>('pencil');
  const [brushSize, setBrushSize] = useState(5);
  const [brushColor, setBrushColor] = useState('#000000');
  const [shapeStart, setShapeStart] = useState<{ x: number; y: number } | null>(null);

  // History
  const [canvasHistory, setCanvasHistory] = useState<string[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);

  // Generation
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState<GenerationMode>('scene');
  const [fidelity, setFidelity] = useState<SketchFidelity>('balanced');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<GeneratedResult[]>([]);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const overlay = overlayRef.current;
    if (!canvas || !overlay) return;

    canvas.width = 512;
    canvas.height = 512;
    overlay.width = 512;
    overlay.height = 512;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    contextRef.current = ctx;

    saveToHistory();
    setCanvasReady(true);
  }, []);

  const saveToHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL();
    setCanvasHistory((prev) => {
      const newH = prev.slice(0, historyStep + 1);
      newH.push(dataUrl);
      return newH;
    });
    setHistoryStep((prev) => prev + 1);
  };

  const loadFromHistory = (step: number) => {
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (!canvas || !ctx) return;
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      setHistoryStep(step);
    };
    img.src = canvasHistory[step];
  };

  const undo = () => { if (historyStep > 0) loadFromHistory(historyStep - 1); };
  const redo = () => { if (historyStep < canvasHistory.length - 1) loadFromHistory(historyStep + 1); };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (!canvas || !ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveToHistory();
    setHasDrawn(false);
  };

  // Flood fill
  const floodFill = (startX: number, startY: number, fillColor: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const x = Math.floor(startX);
    const y = Math.floor(startY);

    const getPixel = (px: number, py: number) => {
      const idx = (py * canvas.width + px) * 4;
      return { r: data[idx], g: data[idx + 1], b: data[idx + 2] };
    };
    const setPixel = (px: number, py: number, r: number, g: number, b: number) => {
      const idx = (py * canvas.width + px) * 4;
      data[idx] = r; data[idx + 1] = g; data[idx + 2] = b; data[idx + 3] = 255;
    };
    const colorsMatch = (c1: any, c2: any, tol = 48) =>
      Math.abs(c1.r - c2.r) <= tol && Math.abs(c1.g - c2.g) <= tol && Math.abs(c1.b - c2.b) <= tol;

    const target = getPixel(x, y);
    const hex = fillColor.replace('#', '');
    const fR = parseInt(hex.substring(0, 2), 16);
    const fG = parseInt(hex.substring(2, 4), 16);
    const fB = parseInt(hex.substring(4, 6), 16);
    if (colorsMatch(target, { r: fR, g: fG, b: fB }, 5)) return;

    const stack: [number, number][] = [[x, y]];
    const visited = new Set<string>();
    while (stack.length > 0) {
      const [cx, cy] = stack.pop()!;
      const key = `${cx},${cy}`;
      if (visited.has(key)) continue;
      if (cx < 0 || cx >= canvas.width || cy < 0 || cy >= canvas.height) continue;
      if (!colorsMatch(getPixel(cx, cy), target)) continue;
      visited.add(key);
      setPixel(cx, cy, fR, fG, fB);
      stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
    }
    ctx.putImageData(imageData, 0, 0);
    saveToHistory();
  };

  // Canvas coordinate helper
  const getCoords = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;
    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX; clientY = e.touches[0].clientY;
    } else if ('changedTouches' in e && (e as React.TouchEvent).changedTouches.length > 0) {
      clientX = (e as React.TouchEvent).changedTouches[0].clientX;
      clientY = (e as React.TouchEvent).changedTouches[0].clientY;
    } else if ('clientX' in e) {
      clientX = (e as React.MouseEvent).clientX; clientY = (e as React.MouseEvent).clientY;
    } else return null;
    const rx = (clientX - rect.left) / rect.width;
    const ry = (clientY - rect.top) / rect.height;
    return { x: Math.max(0, Math.min(canvas.width, rx * canvas.width)), y: Math.max(0, Math.min(canvas.height, ry * canvas.height)) };
  }, []);

  // Shape preview on overlay
  const drawShapePreview = useCallback((endX: number, endY: number) => {
    const overlay = overlayRef.current;
    if (!overlay || !shapeStart) return;
    const ctx = overlay.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, overlay.width, overlay.height);
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const { x: sx, y: sy } = shapeStart;
    ctx.beginPath();
    if (currentTool === 'line') { ctx.moveTo(sx, sy); ctx.lineTo(endX, endY); }
    else if (currentTool === 'rectangle') { ctx.rect(sx, sy, endX - sx, endY - sy); }
    else if (currentTool === 'circle') {
      const rx = Math.abs(endX - sx) / 2, ry = Math.abs(endY - sy) / 2;
      ctx.ellipse(sx + (endX - sx) / 2, sy + (endY - sy) / 2, rx, ry, 0, 0, Math.PI * 2);
    }
    ctx.stroke();
  }, [shapeStart, currentTool, brushColor, brushSize]);

  const commitShape = useCallback((endX: number, endY: number) => {
    const canvas = canvasRef.current;
    const overlay = overlayRef.current;
    if (!canvas || !overlay || !shapeStart) return;
    const ctx = canvas.getContext('2d');
    const oCtx = overlay.getContext('2d');
    if (!ctx || !oCtx) return;
    oCtx.clearRect(0, 0, overlay.width, overlay.height);
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const { x: sx, y: sy } = shapeStart;
    ctx.beginPath();
    if (currentTool === 'line') { ctx.moveTo(sx, sy); ctx.lineTo(endX, endY); }
    else if (currentTool === 'rectangle') { ctx.rect(sx, sy, endX - sx, endY - sy); }
    else if (currentTool === 'circle') {
      const rx = Math.abs(endX - sx) / 2, ry = Math.abs(endY - sy) / 2;
      ctx.ellipse(sx + (endX - sx) / 2, sy + (endY - sy) / 2, rx, ry, 0, 0, Math.PI * 2);
    }
    ctx.stroke();
    setShapeStart(null);
    saveToHistory();
  }, [shapeStart, currentTool, brushColor, brushSize]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const ctx = contextRef.current;
    if (!ctx) return;
    const coords = getCoords(e);
    if (!coords) return;
    setHasDrawn(true);
    if (currentTool === 'fill') { floodFill(coords.x, coords.y, brushColor); return; }
    if (['line', 'rectangle', 'circle'].includes(currentTool)) { setShapeStart({ x: coords.x, y: coords.y }); return; }
    ctx.lineWidth = brushSize;
    ctx.strokeStyle = currentTool === 'eraser' ? '#ffffff' : brushColor;
    ctx.globalCompositeOperation = currentTool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    ctx.lineTo(coords.x + 0.1, coords.y + 0.1);
    ctx.stroke();
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) e.preventDefault();
    const coords = getCoords(e);
    if (!coords) return;
    if (shapeStart && ['line', 'rectangle', 'circle'].includes(currentTool)) { drawShapePreview(coords.x, coords.y); return; }
    if (!isDrawing || (currentTool !== 'pencil' && currentTool !== 'eraser')) return;
    const ctx = contextRef.current;
    if (!ctx) return;
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  };

  const stopDrawing = (e?: React.MouseEvent | React.TouchEvent) => {
    if (shapeStart && ['line', 'rectangle', 'circle'].includes(currentTool)) {
      if (e) { const c = getCoords(e); if (c) commitShape(c.x, c.y); }
      const overlay = overlayRef.current;
      if (overlay) overlay.getContext('2d')?.clearRect(0, 0, overlay.width, overlay.height);
      setShapeStart(null);
      return;
    }
    contextRef.current?.closePath();
    if (isDrawing) saveToHistory();
    setIsDrawing(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        const ctx = contextRef.current;
        if (!canvas || !ctx) return;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
        const x = (canvas.width - img.width * scale) / 2;
        const y = (canvas.height - img.height * scale) / 2;
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        saveToHistory();
        setHasDrawn(true);
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const generateArt = async () => {
    if (!hasDrawn || !description.trim()) {
      setError('Draw something and describe it first.');
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;

    const sketchBase64 = canvas.toDataURL('image/png').split(',')[1];
    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/sketch-to-art', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sketchBase64,
          description,
          fidelity,
          mode,
          projectId: project?.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Generation failed'); return; }
      if (data.image) {
        const imageUrl = `data:${data.image.mimeType};base64,${data.image.base64}`;
        setResults((prev) => [{ id: data.image.id, imageUrl, description, mode, fidelity }, ...prev]);
        onCreditsUpdate();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate.');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = (url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `game-art-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [historyStep, canvasHistory.length]);

  const hasContent = hasDrawn || canvasHistory.length > 1;

  const tools: { id: BrushType; icon: typeof Pencil; label: string }[] = [
    { id: 'pencil', icon: Pencil, label: 'Pencil' },
    { id: 'eraser', icon: Eraser, label: 'Eraser' },
    { id: 'fill', icon: PaintBucket, label: 'Fill' },
    { id: 'line', icon: Minus, label: 'Line' },
    { id: 'rectangle', icon: Square, label: 'Rectangle' },
    { id: 'circle', icon: Circle, label: 'Circle' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Toolbar */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-[0_4px_0_#e5e7eb] p-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Tools */}
          <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
            {tools.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setCurrentTool(id)}
                className={`p-1.5 rounded-md transition-all ${
                  currentTool === id ? 'bg-[#58cc02] text-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'
                }`}
                title={label}
              >
                <Icon size={16} />
              </button>
            ))}
          </div>

          {/* Brush Sizes */}
          <div className="flex items-center gap-0.5">
            {BRUSH_SIZES.map((size) => (
              <button
                key={size}
                onClick={() => setBrushSize(size)}
                className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                  brushSize === size ? 'bg-[#58cc02]' : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                <div
                  className={`rounded-full ${brushSize === size ? 'bg-white' : 'bg-gray-600'}`}
                  style={{ width: Math.min(size / 3 + 2, 10), height: Math.min(size / 3 + 2, 10) }}
                />
              </button>
            ))}
          </div>

          {/* Colors */}
          {currentTool !== 'eraser' && (
            <div className="flex items-center gap-1">
              {PRESET_COLORS.slice(0, 8).map((color) => (
                <button
                  key={color}
                  onClick={() => setBrushColor(color)}
                  className={`w-5 h-5 rounded border transition-all ${
                    brushColor === color ? 'border-[#58cc02] scale-110 ring-1 ring-green-200' : 'border-gray-300 hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
              <div className="relative">
                <button
                  onClick={() => colorPickerRef.current?.click()}
                  className="w-5 h-5 rounded border-2 border-dashed border-gray-400 hover:border-[#58cc02] transition-all"
                  style={{ backgroundColor: brushColor }}
                />
                <input
                  ref={colorPickerRef}
                  type="color"
                  value={brushColor}
                  onChange={(e) => setBrushColor(e.target.value)}
                  className="absolute opacity-0 w-0 h-0"
                />
              </div>
            </div>
          )}

          <div className="flex-1" />

          {/* Actions */}
          <div className="flex items-center gap-1">
            <button onClick={undo} disabled={historyStep <= 0}
              className={`p-1.5 rounded-md transition-all ${historyStep > 0 ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-gray-50 text-gray-300'}`}>
              <Undo2 size={16} />
            </button>
            <button onClick={redo} disabled={historyStep >= canvasHistory.length - 1}
              className={`p-1.5 rounded-md transition-all ${historyStep < canvasHistory.length - 1 ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-gray-50 text-gray-300'}`}>
              <Redo2 size={16} />
            </button>
            <button onClick={clearCanvas} className="p-1.5 rounded-md bg-red-50 text-red-600 hover:bg-red-100">
              <Trash2 size={16} />
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="p-1.5 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100">
              <Upload size={16} />
            </button>
            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleImageUpload} className="hidden" />
          </div>
        </div>
      </div>

      {/* Canvas + Settings */}
      <div className="flex gap-4 items-start">
        {/* Canvas */}
        <div className="flex-shrink-0">
          <div className="relative overflow-hidden rounded-2xl border-2 border-gray-200 shadow-[0_4px_0_#e5e7eb] bg-white"
            style={{ width: '380px', height: '380px' }}>
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={() => stopDrawing()}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="touch-none relative z-10 cursor-crosshair"
              style={{ width: '100%', height: '100%' }}
            />
            <canvas ref={overlayRef} className="absolute inset-0 pointer-events-none z-20" style={{ width: '100%', height: '100%' }} />
            {canvasReady && !hasContent && !isDrawing && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                <div className="text-center bg-white/90 rounded-xl px-4 py-3 shadow-lg border border-gray-200">
                  <Pencil size={28} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-500 text-xs font-medium">Draw your game art here</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Settings Panel */}
        <div className="flex-1 bg-white rounded-2xl border-2 border-gray-200 shadow-[0_4px_0_#e5e7eb] p-4">
          <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide">Generate Art</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">What did you draw?</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., A mushroom house in a forest..."
                className="w-full h-16 px-3 py-2 rounded-xl bg-gray-50 border-2 border-gray-200 text-gray-900 text-sm placeholder:text-gray-400 resize-none focus:outline-none focus:border-[#58cc02]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                <div className="grid grid-cols-2 gap-1">
                  {(['scene', 'item'] as const).map((m) => (
                    <button key={m} onClick={() => setMode(m)}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                        mode === m ? 'bg-[#58cc02] text-white shadow-[0_2px_0_#58a700]' : 'bg-gray-100 text-gray-600'
                      }`}>{m === 'scene' ? 'Scene' : 'Item'}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">AI Freedom</label>
                <div className="grid grid-cols-3 gap-1">
                  {([['close', 'Precise'], ['balanced', 'Balanced'], ['loose', 'Creative']] as const).map(([f, label]) => (
                    <button key={f} onClick={() => setFidelity(f as SketchFidelity)}
                      className={`py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                        fidelity === f ? 'bg-[#1cb0f6] text-white shadow-[0_2px_0_#1899d6]' : 'bg-gray-100 text-gray-600'
                      }`}>{label}</button>
                  ))}
                </div>
              </div>
            </div>

            {error && (
              <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs">{error}</div>
            )}

            <button
              onClick={generateArt}
              disabled={!hasContent || !description.trim() || isGenerating}
              className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                hasContent && description.trim() && !isGenerating
                  ? 'bg-[#58cc02] text-white shadow-[0_4px_0_#58a700] hover:shadow-[0_2px_0_#58a700] hover:translate-y-[2px]'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isGenerating ? (
                <><Loader2 size={16} className="animate-spin" /> Generating...</>
              ) : (
                <><Sparkles size={16} /> Generate (1 credit)</>
              )}
            </button>

            {credits && (
              <p className="text-center text-[11px] text-gray-400">{credits.remaining} credits remaining</p>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-[0_4px_0_#e5e7eb] p-4">
          <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide">
            Your Generations ({results.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {results.map((result) => (
              <div key={result.id} className="group relative">
                <div className="aspect-square rounded-xl overflow-hidden border-2 border-gray-200 hover:border-[#58cc02] transition-all shadow-sm">
                  <img src={result.imageUrl} alt={result.description} className="w-full h-full object-cover" />
                </div>
                <p className="text-xs text-gray-600 mt-1.5 line-clamp-1">{result.description}</p>
                <div className="flex gap-1 mt-1">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-medium">{result.mode}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-medium">{result.fidelity}</span>
                </div>
                <button onClick={() => downloadImage(result.imageUrl)}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/90 text-gray-600 hover:bg-white shadow opacity-0 group-hover:opacity-100 transition-all">
                  <Download size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

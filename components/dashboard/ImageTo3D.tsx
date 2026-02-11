'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, Loader2, Box, Download, AlertTriangle, Sparkles } from 'lucide-react';
import { useProject } from '@/hooks/useProject';
import { CreditInfo } from '@/lib/credits';

interface Model3DResult {
  id: string;
  meshyTaskId: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'SUCCEEDED' | 'FAILED';
  progress: number;
  glbUrl?: string | null;
  fbxUrl?: string | null;
  objUrl?: string | null;
  usdzUrl?: string | null;
  thumbnailUrl?: string | null;
  errorMessage?: string | null;
}

interface Props {
  credits: CreditInfo | null;
  onCreditsUpdate: () => void;
}

export function ImageTo3D({ credits, onCreditsUpdate }: Props) {
  const { project } = useProject();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeModel, setActiveModel] = useState<Model3DResult | null>(null);
  const [models, setModels] = useState<Model3DResult[]>([]);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // Load existing models
  useEffect(() => {
    loadModels();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const loadModels = async () => {
    try {
      const res = await fetch('/api/ai/image-to-3d');
      if (res.ok) {
        const data = await res.json();
        setModels(data);
        // If there's a pending model, start polling
        const pending = data.find((m: any) => m.status === 'PENDING' || m.status === 'IN_PROGRESS');
        if (pending) {
          setActiveModel(pending);
          startPolling(pending.meshyTaskId);
        }
      }
    } catch { /* ignore */ }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setPreviewUrl(dataUrl);
      setImageBase64(dataUrl.split(',')[1]);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const startGeneration = async () => {
    if (!imageBase64) return;
    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/image-to-3d', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, projectId: project?.id }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }

      const model: Model3DResult = {
        id: data.id,
        meshyTaskId: data.meshyTaskId,
        status: 'PENDING',
        progress: 0,
      };
      setActiveModel(model);
      setModels((prev) => [model, ...prev]);
      startPolling(data.meshyTaskId);
      onCreditsUpdate();
    } catch (err: any) {
      setError(err.message || 'Failed to start generation');
    } finally {
      setIsGenerating(false);
    }
  };

  const startPolling = (taskId: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/ai/image-to-3d/status?taskId=${taskId}`);
        if (!res.ok) return;
        const data = await res.json();

        setActiveModel(data);
        setModels((prev) =>
          prev.map((m) => (m.meshyTaskId === taskId ? { ...m, ...data } : m))
        );

        if (data.status === 'SUCCEEDED' || data.status === 'FAILED') {
          if (pollRef.current) clearInterval(pollRef.current);
          pollRef.current = null;
        }
      } catch { /* continue polling */ }
    }, 5000);
  };

  const handleDownload = (url: string, format: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `game-3d-model.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Upload Section */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-[0_4px_0_#e5e7eb] p-6">
        <h3 className="font-bold text-gray-900 mb-1 text-sm uppercase tracking-wide">Image to 3D</h3>
        <p className="text-gray-500 text-xs mb-4">Upload a game asset image and convert it to a 3D model.</p>

        <div className="flex gap-4 items-start">
          {/* Upload area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`w-64 h-64 rounded-xl border-2 border-dashed cursor-pointer flex items-center justify-center transition-all overflow-hidden ${
              previewUrl ? 'border-[#58cc02]' : 'border-gray-300 hover:border-[#58cc02] hover:bg-green-50'
            }`}
          >
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center p-4">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 text-xs font-medium">Click to upload image</p>
                <p className="text-gray-400 text-[10px] mt-1">PNG, JPG, WEBP</p>
              </div>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFileSelect} className="hidden" />

          {/* Generate button + info */}
          <div className="flex-1 space-y-3">
            {error && (
              <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs">{error}</div>
            )}
            <button
              onClick={startGeneration}
              disabled={!imageBase64 || isGenerating}
              className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                imageBase64 && !isGenerating
                  ? 'bg-[#58cc02] text-white shadow-[0_4px_0_#58a700] hover:shadow-[0_2px_0_#58a700] hover:translate-y-[2px]'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isGenerating ? (
                <><Loader2 size={16} className="animate-spin" /> Starting...</>
              ) : (
                <><Sparkles size={16} /> Convert to 3D (3 credits)</>
              )}
            </button>
            {credits && (
              <p className="text-center text-[11px] text-gray-400">{credits.remaining} credits remaining</p>
            )}
            <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
              <p className="text-blue-700 text-xs font-medium mb-1">How it works</p>
              <ul className="text-blue-600 text-[11px] space-y-1">
                <li>1. Upload any game art or concept image</li>
                <li>2. Meshy AI generates a textured 3D model</li>
                <li>3. Download in GLB, FBX, OBJ, or USDZ format</li>
              </ul>
              <p className="text-blue-500 text-[10px] mt-2">Generation takes 5-10 minutes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Model Progress */}
      {activeModel && (activeModel.status === 'PENDING' || activeModel.status === 'IN_PROGRESS') && (
        <div className="bg-gray-900 rounded-2xl border-2 border-gray-700 p-8 text-center">
          <div className="flex justify-center gap-8 mb-6">
            <div className={`text-center ${activeModel.progress < 80 ? 'opacity-100' : 'opacity-40'}`}>
              <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2 ${
                activeModel.progress < 80 ? 'bg-[#58cc02]/20 ring-2 ring-[#58cc02]' : 'bg-gray-700'
              }`}>
                <Box className={`w-6 h-6 ${activeModel.progress < 80 ? 'text-[#58cc02] animate-spin' : 'text-green-400'}`}
                  style={{ animationDuration: '3s' }} />
              </div>
              <p className="text-xs text-white/60">{activeModel.progress >= 80 ? 'Mesh Done' : 'Building Mesh'}</p>
            </div>
            <div className={`text-center ${activeModel.progress >= 80 ? 'opacity-100' : 'opacity-40'}`}>
              <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2 ${
                activeModel.progress >= 80 ? 'bg-purple-500/20 ring-2 ring-purple-400' : 'bg-gray-700'
              }`}>
                <Box className={`w-6 h-6 ${activeModel.progress >= 80 ? 'text-purple-400 animate-pulse' : 'text-gray-500'}`} />
              </div>
              <p className="text-xs text-white/60">Texturing</p>
            </div>
          </div>
          <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden mb-3">
            <div className="h-full bg-[#58cc02] rounded-full transition-all duration-500" style={{ width: `${activeModel.progress}%` }} />
          </div>
          <p className="text-white font-medium">{activeModel.progress}% Complete</p>
          <p className="text-white/40 text-xs mt-1">This usually takes 5-10 minutes</p>
        </div>
      )}

      {/* Completed Models */}
      {models.filter((m) => m.status === 'SUCCEEDED').length > 0 && (
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-[0_4px_0_#e5e7eb] p-4">
          <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide">Your 3D Models</h3>
          <div className="grid grid-cols-2 gap-4">
            {models.filter((m) => m.status === 'SUCCEEDED').map((model) => (
              <div key={model.id} className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                {model.thumbnailUrl && (
                  <div className="aspect-square rounded-lg overflow-hidden bg-gray-200 mb-2">
                    <img src={model.thumbnailUrl} alt="3D Model" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex flex-wrap gap-1">
                  {model.glbUrl && (
                    <button onClick={() => handleDownload(model.glbUrl!, 'glb')}
                      className="px-2 py-1 rounded-lg bg-[#58cc02] text-white text-[10px] font-bold flex items-center gap-1 shadow-[0_2px_0_#58a700]">
                      <Download size={10} /> GLB
                    </button>
                  )}
                  {model.fbxUrl && (
                    <button onClick={() => handleDownload(model.fbxUrl!, 'fbx')}
                      className="px-2 py-1 rounded-lg bg-gray-200 text-gray-700 text-[10px] font-bold flex items-center gap-1">
                      <Download size={10} /> FBX
                    </button>
                  )}
                  {model.objUrl && (
                    <button onClick={() => handleDownload(model.objUrl!, 'obj')}
                      className="px-2 py-1 rounded-lg bg-gray-200 text-gray-700 text-[10px] font-bold flex items-center gap-1">
                      <Download size={10} /> OBJ
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Failed Models */}
      {models.filter((m) => m.status === 'FAILED').map((model) => (
        <div key={model.id} className="bg-red-50 rounded-xl border border-red-200 p-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <span className="text-red-600 text-xs">Generation failed: {model.errorMessage || 'Unknown error'}</span>
        </div>
      ))}
    </div>
  );
}

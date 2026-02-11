'use client';

import { useState, useRef, useEffect } from 'react';
import { Music, Loader2, Play, Pause, Download, Sparkles, RefreshCw } from 'lucide-react';
import { useProject } from '@/hooks/useProject';
import { CreditInfo } from '@/lib/credits';

interface GeneratedTrack {
  id: string;
  title: string;
  duration: number;
  musicFileUrl: string;
  bpm: number | null;
  prompt: string;
}

interface Props {
  credits: CreditInfo | null;
  onCreditsUpdate: () => void;
}

const PROMPT_SUGGESTIONS = [
  'Epic orchestral boss battle music with intense drums',
  'Peaceful village background music with acoustic guitar',
  'Retro 8-bit chiptune adventure theme',
  'Ambient horror atmosphere with eerie synths',
  'Upbeat electronic racing game soundtrack',
  'Fantasy RPG exploration music with harp and flute',
  'Tense stealth mission music with low bass',
  'Cheerful puzzle game background music',
];

export function MusicGenerator({ credits, onCreditsUpdate }: Props) {
  const { project } = useProject();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tracks, setTracks] = useState<GeneratedTrack[]>([]);
  const [loadingTracks, setLoadingTracks] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load saved tracks on mount
  useEffect(() => {
    if (project?.id) loadSavedTracks();
    else setLoadingTracks(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id]);

  const loadSavedTracks = async () => {
    try {
      const res = await fetch(`/api/ai/generate-music?projectId=${project!.id}`);
      if (res.ok) {
        const data = await res.json();
        const loaded: GeneratedTrack[] = data
          .filter((item: any) => item.musicFileUrl)
          .map((item: any) => ({
            id: item.id,
            title: item.title || 'AI Generated Track',
            duration: item.duration || 0,
            musicFileUrl: item.musicFileUrl,
            bpm: item.bpm || null,
            prompt: item.prompt || '',
          }));
        setTracks(loaded);
      }
    } catch {
      // Silently fail - not critical
    } finally {
      setLoadingTracks(false);
    }
  };

  const handleRandomPrompt = () => {
    const random = PROMPT_SUGGESTIONS[Math.floor(Math.random() * PROMPT_SUGGESTIONS.length)];
    setPrompt(random);
  };

  const generateMusic = async () => {
    if (!prompt.trim()) { setError('Please describe the music you want.'); return; }

    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/generate-music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, projectId: project?.id }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }

      setTracks((prev) => [{
        id: data.id,
        title: data.title,
        duration: data.duration,
        musicFileUrl: data.musicFileUrl,
        bpm: data.bpm,
        prompt,
      }, ...prev]);
      onCreditsUpdate();
    } catch (err: any) {
      setError(err.message || 'Failed to generate music.');
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePlay = (track: GeneratedTrack) => {
    if (playingId === track.id) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(track.musicFileUrl);
      audioRef.current.play();
      audioRef.current.onended = () => setPlayingId(null);
      setPlayingId(track.id);
    }
  };

  const downloadTrack = (track: GeneratedTrack) => {
    const link = document.createElement('a');
    link.href = track.musicFileUrl;
    link.download = `${track.title || 'game-music'}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => { audioRef.current?.pause(); };
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Generator */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-[0_4px_0_#e5e7eb] p-6">
        <h3 className="font-bold text-gray-900 mb-1 text-sm uppercase tracking-wide">AI Music Generator</h3>
        <p className="text-gray-500 text-xs mb-4">Describe the music you want for your game and AI will create it.</p>

        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-gray-700">Describe your music</label>
              <button onClick={handleRandomPrompt} className="flex items-center gap-1 text-[10px] text-[#1cb0f6] font-bold hover:underline">
                <RefreshCw size={10} /> Random idea
              </button>
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Epic orchestral boss battle music with intense drums..."
              className="w-full h-20 px-3 py-2 rounded-xl bg-gray-50 border-2 border-gray-200 text-gray-900 text-sm placeholder:text-gray-400 resize-none focus:outline-none focus:border-[#58cc02]"
            />
          </div>

          {/* Quick suggestions */}
          <div className="flex flex-wrap gap-1.5">
            {PROMPT_SUGGESTIONS.slice(0, 4).map((s) => (
              <button
                key={s}
                onClick={() => setPrompt(s)}
                className="px-2 py-1 rounded-lg bg-gray-100 text-gray-600 text-[10px] font-medium hover:bg-gray-200 transition-all"
              >
                {s.split(' ').slice(0, 4).join(' ')}...
              </button>
            ))}
          </div>

          {error && (
            <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs">{error}</div>
          )}

          <button
            onClick={generateMusic}
            disabled={!prompt.trim() || isGenerating}
            className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
              prompt.trim() && !isGenerating
                ? 'bg-[#58cc02] text-white shadow-[0_4px_0_#58a700] hover:shadow-[0_2px_0_#58a700] hover:translate-y-[2px]'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isGenerating ? (
              <><Loader2 size={16} className="animate-spin" /> Generating music...</>
            ) : (
              <><Sparkles size={16} /> Generate Music (1 credit)</>
            )}
          </button>

          {credits && (
            <p className="text-center text-[11px] text-gray-400">{credits.remaining} credits remaining</p>
          )}
        </div>
      </div>

      {/* Generated Tracks */}
      {loadingTracks ? (
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-[0_4px_0_#e5e7eb] p-8 text-center">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400 mx-auto" />
          <p className="text-xs text-gray-400 mt-2">Loading saved tracks...</p>
        </div>
      ) : tracks.length > 0 ? (
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-[0_4px_0_#e5e7eb] p-4">
          <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide">
            Your Tracks ({tracks.length})
          </h3>
          <div className="space-y-2">
            {tracks.map((track) => (
              <div key={track.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                {/* Play button */}
                <button
                  onClick={() => togglePlay(track)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    playingId === track.id
                      ? 'bg-[#58cc02] text-white shadow-[0_3px_0_#58a700]'
                      : 'bg-white text-gray-600 border-2 border-gray-200 hover:border-[#58cc02]'
                  }`}
                >
                  {playingId === track.id ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
                </button>

                {/* Track info */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 text-sm truncate">{track.title}</div>
                  <div className="flex items-center gap-2 text-[10px] text-gray-500">
                    {track.duration > 0 && <span>{formatDuration(track.duration)}</span>}
                    {track.bpm && <span>{track.bpm} BPM</span>}
                    <span className="truncate">{track.prompt}</span>
                  </div>
                </div>

                {/* Download */}
                <button
                  onClick={() => downloadTrack(track)}
                  className="px-3 py-1.5 rounded-lg bg-gray-200 text-gray-700 text-xs font-bold flex items-center gap-1 hover:bg-gray-300 transition-all"
                >
                  <Download size={12} /> Save
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Copyright info */}
      <p className="text-center text-[10px] text-gray-400">
        Music generated by Loudly AI. Royalty-free for commercial use.
      </p>
    </div>
  );
}

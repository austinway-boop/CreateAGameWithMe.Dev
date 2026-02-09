'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef, Suspense } from 'react';
import { ArrowLeft, CheckCircle2, Loader2, Play, ChevronRight, Check, Phone, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PLANS } from '@/lib/plans';

export default function SubscribePage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    }>
      <SubscribeContent />
    </Suspense>
  );
}

function SubscribeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [loading, setLoading] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [videoWatched, setVideoWatched] = useState(false);
  const [videoStarted, setVideoStarted] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);

  const success = searchParams.get('success') === 'true';
  const cancelled = searchParams.get('cancelled') === 'true';

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        router.push('/validation');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, router]);

  const handleSubscribe = async (plan: 'starter' | 'pro') => {
    setLoading(plan);
    setCheckoutError(null);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setCheckoutError(data.error || 'Something went wrong. Please try again.');
        setLoading(null);
      }
    } catch (err) {
      setCheckoutError('Could not connect. Please try again.');
      setLoading(null);
    }
  };

  const handleVideoEnd = async () => {
    setVideoWatched(true);
    setUnlocking(true);
    try {
      await fetch('/api/video-unlock', { method: 'POST' });
    } catch {
      // silent
    } finally {
      setUnlocking(false);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.duration) {
      setVideoProgress(
        Math.round((videoRef.current.currentTime / videoRef.current.duration) * 100)
      );
    }
  };

  if (success) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-[#d7ffb8] border-2 border-[#58cc02] rounded-2xl shadow-[0_4px_0_#58a700] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-[#58a700]" />
          </div>
          <h1 className="text-xl font-black text-gray-900">You&apos;re in.</h1>
          <p className="text-gray-500 text-sm">Loading your full results...</p>
          <Loader2 className="w-5 h-5 animate-spin mx-auto text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto pb-8 bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-gray-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => router.push('/validation')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <span className="font-bold text-gray-900">Unlock Results</span>
          <div className="w-16" />
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-5">
        {cancelled && (
          <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-3 text-center">
            <p className="text-amber-700 font-medium text-sm">No worries -- try again or watch the video instead.</p>
          </div>
        )}

        {checkoutError && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-3 text-center">
            <p className="text-red-700 font-medium text-sm">{checkoutError}</p>
          </div>
        )}

        {/* Headline */}
        <div className="text-center pt-2">
          <h1 className="text-lg font-black text-gray-900">Watch this video or subscribe to see your full breakdown</h1>
        </div>

        {/* Video - large, prominent */}
        <div className="rounded-2xl overflow-hidden border-2 border-gray-200 shadow-[0_4px_0_#e5e7eb] bg-black">
          <div className="relative" style={{ paddingBottom: '56.25%' }}>
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              onEnded={handleVideoEnd}
              onPlay={() => setVideoStarted(true)}
              onTimeUpdate={handleTimeUpdate}
              controls={videoStarted && !videoWatched}
              playsInline
              preload="metadata"
            >
              {/* Placeholder video source */}
              <source src="" type="video/mp4" />
            </video>

            {/* Play overlay before video starts */}
            {!videoStarted && !videoWatched && (
              <div
                className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer group bg-gray-900"
                onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.play();
                  }
                }}
              >
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                  <Play className="w-9 h-9 text-gray-900 ml-1" />
                </div>
                <p className="text-white/60 text-sm mt-4 font-medium">Watch to unlock your results for free</p>
              </div>
            )}

            {/* Completed overlay */}
            {videoWatched && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90">
                <div className="w-16 h-16 bg-[#d7ffb8] border-2 border-[#58cc02] rounded-full flex items-center justify-center shadow-[0_4px_0_#58a700] mb-3">
                  <CheckCircle2 className="w-8 h-8 text-[#58a700]" />
                </div>
                <p className="text-white font-bold">Video complete</p>
              </div>
            )}
          </div>

          {/* Progress bar while playing */}
          {videoStarted && !videoWatched && (
            <div className="h-1 bg-gray-800">
              <div
                className="h-full bg-[#58cc02] transition-all duration-300"
                style={{ width: `${videoProgress}%` }}
              />
            </div>
          )}

          {/* Unlock button after video ends */}
          {videoWatched && (
            <div className="p-4 bg-white border-t border-gray-100">
              <button
                onClick={() => router.push('/validation')}
                disabled={unlocking}
                className="w-full bg-[#58cc02] hover:bg-[#4caf00] text-white font-bold py-4 rounded-2xl shadow-[0_4px_0_#58a700] hover:shadow-[0_2px_0_#58a700] hover:translate-y-[2px] transition-all uppercase tracking-wide text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {unlocking ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    View Full Results
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 py-1">
          <div className="flex-1 h-px bg-gray-300" />
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">or</span>
          <div className="flex-1 h-px bg-gray-300" />
        </div>

        {/* Plan Cards */}
        <div className="space-y-4">

          {/* Starter Plan */}
          <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-[0_4px_0_#e5e7eb] overflow-hidden">
            <div className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-black text-gray-900">Starter</h3>
                  <p className="text-gray-500 text-xs mt-0.5">{PLANS.starter.creditsLabel}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-gray-900">{PLANS.starter.priceDisplay}</div>
                  <div className="text-xs text-gray-400 -mt-0.5">/month</div>
                </div>
              </div>

              <div className="space-y-2.5 mb-5">
                {PLANS.starter.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-[#1cb0f6]" />
                    </div>
                    <span className="text-sm text-gray-700">{f}</span>
                  </div>
                ))}
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                    <Phone className="w-3 h-3 text-amber-500" />
                  </div>
                  <span className="text-sm text-gray-700">
                    {PLANS.starter.founderCall}
                    <span className="ml-1.5 text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded uppercase">Limited time</span>
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleSubscribe('starter')}
                disabled={!!loading}
                className="w-full bg-[#1cb0f6] hover:bg-[#1899d6] text-white font-bold py-3.5 rounded-xl shadow-[0_4px_0_#1899d6] hover:shadow-[0_2px_0_#1899d6] hover:translate-y-[2px] transition-all uppercase tracking-wide text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading === 'starter' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>Get Starter</>
                )}
              </button>
            </div>
          </div>

          {/* Pro Plan */}
          <div className="bg-white rounded-2xl border-2 border-[#58cc02] shadow-[0_4px_0_#58a700] overflow-hidden relative">
            {/* Badge */}
            <div className="bg-[#58cc02] text-white text-center py-1.5 px-4">
              <div className="flex items-center justify-center gap-1.5">
                <Star className="w-3.5 h-3.5 fill-white" />
                <span className="text-xs font-bold uppercase tracking-wide">Most Popular</span>
                <Star className="w-3.5 h-3.5 fill-white" />
              </div>
            </div>

            <div className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-black text-gray-900">Pro</h3>
                  <p className="text-gray-500 text-xs mt-0.5">{PLANS.pro.creditsLabel}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-gray-900">{PLANS.pro.priceDisplay}</div>
                  <div className="text-xs text-gray-400 -mt-0.5">/month</div>
                </div>
              </div>

              <div className="space-y-2.5 mb-5">
                {PLANS.pro.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-[#58cc02]" />
                    </div>
                    <span className="text-sm text-gray-700">{f}</span>
                  </div>
                ))}
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                    <Phone className="w-3 h-3 text-amber-500" />
                  </div>
                  <span className="text-sm text-gray-700">
                    {PLANS.pro.founderCall}
                    <span className="ml-1.5 text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded uppercase">Limited time</span>
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleSubscribe('pro')}
                disabled={!!loading}
                className="w-full bg-[#58cc02] hover:bg-[#4caf00] text-white font-bold py-3.5 rounded-xl shadow-[0_4px_0_#58a700] hover:shadow-[0_2px_0_#58a700] hover:translate-y-[2px] transition-all uppercase tracking-wide text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading === 'pro' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>Get Pro</>
                )}
              </button>
            </div>
          </div>

        </div>

        <p className="text-center text-[11px] text-gray-400 pb-2">
          Cancel anytime. Payments via Stripe.
        </p>
      </div>
    </div>
  );
}

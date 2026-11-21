'use client';

import { useEffect, useRef, useState } from 'react';
import { ExternalLink, PlayCircle, ShieldCheck } from 'lucide-react';

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiLoader: Promise<void> | null = null;

function loadYouTubeApi() {
  if (typeof window === 'undefined') return Promise.reject(new Error('YouTube player is only available in the browser.'));
  if (window.YT?.Player) return Promise.resolve();
  if (apiLoader) return apiLoader;
  apiLoader = new Promise<void>((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve();
    };
    const scriptExists = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
    if (!scriptExists) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      script.onerror = () => reject(new Error('The YouTube player could not be loaded. Check network or content-blocking settings.'));
      document.head.appendChild(script);
    }
    window.setTimeout(() => {
      if (!window.YT?.Player) reject(new Error('The YouTube player did not finish loading.'));
    }, 12000);
  }).catch(error => {
    apiLoader = null;
    throw error;
  });
  return apiLoader;
}

export function YouTubeWatchPlayer({ videoId, title, onStarted, onCompleted }: {
  videoId: string;
  title: string;
  onStarted: () => void;
  onCompleted: () => void;
}) {
  const containerRef = useRef<HTMLDivElement|null>(null);
  const playerRef = useRef<any>(null);
  const timerRef = useRef<number|null>(null);
  const watchedSecondsRef = useRef(0);
  const lastTimeRef = useRef<number|null>(null);
  const completionRef = useRef(false);
  const startedRef = useRef(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let player: any = null;
    const stopTimer = () => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
      timerRef.current = null;
    };
    const checkProgress = () => {
      if (!player || player.getPlayerState?.() !== 1) return;
      const current = Number(player.getCurrentTime?.() || 0);
      const total = Number(player.getDuration?.() || 0);
      if (total > 0) setDuration(total);
      if (lastTimeRef.current !== null) {
        const delta = current - lastTimeRef.current;
        // Credit only continuous playback. Seeking across a section does not
        // count as watching it; buffering and short seeks are ignored.
        if (delta > 0 && delta <= 4.5) watchedSecondsRef.current += Math.min(delta, 1.5);
      }
      lastTimeRef.current = current;
      if (total > 0) {
        const ratio = Math.min(1, watchedSecondsRef.current / total);
        setProgress(ratio);
        if (!completionRef.current && ratio >= 0.9) {
          completionRef.current = true;
          onCompleted();
        }
      }
    };

    loadYouTubeApi().then(() => {
      if (cancelled || !containerRef.current || !window.YT?.Player) return;
      player = new window.YT.Player(containerRef.current, {
        width: '100%',
        height: '390',
        videoId,
        playerVars: { playsinline: 1, rel: 0, modestbranding: 1, enablejsapi: 1, origin: window.location.origin },
        events: {
          onReady: (event: any) => {
            player = event.target;
            playerRef.current = event.target;
            setError('');
          },
          onStateChange: (event: any) => {
            if (event.data === 1) {
              if (!startedRef.current) { startedRef.current = true; onStarted(); }
              lastTimeRef.current = Number(event.target.getCurrentTime?.() || 0);
              if (timerRef.current === null) timerRef.current = window.setInterval(checkProgress, 1000);
            } else {
              checkProgress();
              stopTimer();
            }
          },
          onError: () => setError('YouTube could not play this video. It may be restricted, removed or unavailable for embedding.'),
        },
      });
      playerRef.current = player;
    }).catch(cause => {
      if (!cancelled) setError(cause instanceof Error ? cause.message : 'YouTube player failed to load.');
    });

    return () => {
      cancelled = true;
      stopTimer();
      try { playerRef.current?.destroy?.(); } catch { /* Ignore teardown errors. */ }
      playerRef.current = null;
    };
  }, [videoId, onStarted, onCompleted]);

  const percent = Math.round(progress * 100);
  return <section className="youtube-watch-player" aria-label={`Video player: ${title}`}>
    <div className="youtube-player-heading"><div><PlayCircle size={18}/><b>{title}</b></div><a href={`https://www.youtube.com/watch?v=${videoId}`} target="_blank" rel="noopener noreferrer">Open on YouTube <ExternalLink size={13}/></a></div>
    <div className="youtube-player-frame"><div ref={containerRef} className="youtube-player-mount"/></div>
    {error&&<p className="auth-message error" role="alert">{error} <a href={`https://www.youtube.com/watch?v=${videoId}`} target="_blank" rel="noopener noreferrer">Open the original video</a></p>}
    <div className="youtube-watch-progress"><div><span>Watched in this player</span><b>{percent}%</b></div><div className="youtube-watch-track"><span style={{width:`${percent}%`}}/></div><small><ShieldCheck size={13}/> Completion is recorded after at least 90% continuous playback. Seeking does not count.</small></div>
  </section>;
}

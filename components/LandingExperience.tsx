'use client';

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { ArrowUpRight, BookOpen, CheckCircle2, GraduationCap } from 'lucide-react';

export function LandingExperience({ children }: { children: ReactNode }) {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      const height = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(height > 0 ? Math.min(100, window.scrollY / height * 100) : 0);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <>
      <div className="landing-scroll-progress" style={{ transform: `scaleX(${scrollProgress / 100})` }} aria-hidden="true" />
      {children}
    </>
  );
}

export function LandingScene() {
  const sceneRef = useRef<HTMLDivElement>(null);

  function move(event: ReactPointerEvent<HTMLDivElement>) {
    if (!sceneRef.current) return;
    const rect = sceneRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    sceneRef.current.style.setProperty('--tilt-x', `${-y * 7}deg`);
    sceneRef.current.style.setProperty('--tilt-y', `${x * 9}deg`);
  }

  function reset() {
    sceneRef.current?.style.setProperty('--tilt-x', '0deg');
    sceneRef.current?.style.setProperty('--tilt-y', '0deg');
  }

  return (
    <div className="landing-art" ref={sceneRef} onPointerMove={move} onPointerLeave={reset} aria-label="Interactive BuildBridge career journey preview">
      <div className="landing-art-glow" />
      <div className="landing-orbit orbit-one" />
      <div className="landing-orbit orbit-two" />
      <div className="landing-art-card">
        <div className="landing-art-top"><div className="landing-art-icon"><GraduationCap size={27}/></div><span className="landing-status"><i /> Journey active</span></div>
        <b>Learn. Build. Prove.</b>
        <span>Your career, in motion.</span>
        <div className="landing-progress"><i /></div>
        <div className="landing-art-footer"><small>One meaningful step at a time</small><ArrowUpRight size={15}/></div>
      </div>
      <div className="landing-float landing-float-one"><BookOpen size={17}/> <span><small>Next milestone</small>Skill plan</span></div>
      <div className="landing-float landing-float-two"><CheckCircle2 size={17}/> <span><small>Evidence</small>Project proof</span></div>
      <div className="landing-art-dots" aria-hidden="true"><i/><i/><i/><i/><i/></div>
    </div>
  );
}

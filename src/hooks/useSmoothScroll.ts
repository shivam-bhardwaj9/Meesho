import { useEffect, useRef } from 'react';
import Lenis from 'lenis';

interface UseSmoothScrollOptions {
  paused?: boolean;
  routeKey?: string | number;
}

export function useSmoothScroll({ paused = false, routeKey }: UseSmoothScrollOptions = {}) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const lenis = new Lenis({
      lerp: 0.09,
      smoothWheel: true,
      wheelMultiplier: 0.95,
      touchMultiplier: 1.1,
      autoRaf: true,
      allowNestedScroll: true,
      anchors: true,
      respectReducedMotion: true,
      prevent: (node) =>
        Boolean(
          node.closest('[data-lenis-prevent], .meesho-scroll, .overflow-y-auto, .no-scrollbar')
        ),
    });

    lenisRef.current = lenis;
    (window as Window & { __lenis?: Lenis }).__lenis = lenis;

    return () => {
      lenis.destroy();
      lenisRef.current = null;
      delete (window as Window & { __lenis?: Lenis }).__lenis;
    };
  }, []);

  useEffect(() => {
    const lenis = lenisRef.current;
    if (!lenis) return;

    if (paused) {
      lenis.stop();
    } else {
      lenis.start();
    }
  }, [paused]);

  useEffect(() => {
    const lenis = lenisRef.current;
    if (!lenis) return;

    const frame = window.requestAnimationFrame(() => {
      lenis.resize();
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [routeKey]);

  return lenisRef;
}

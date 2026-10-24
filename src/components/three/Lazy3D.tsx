"use client";

import { Component, useCallback, useEffect, useRef, useState, type ComponentType, type ReactNode } from "react";
import { isMobileViewport, prefersReducedMotion, supportsWebGL } from "./lib/env";
import type { SceneProps } from "./lib/types";
import { useNearViewport } from "./lib/useInView";

/* Yengil o'rab oluvchi: avval bo'sh konteyner, viewport yaqinlashganda (rootMargin) sahna chunk'i yuklanadi.
   Ko'rinmaganda render to'xtaydi. WebGL yo'q / kontekst yo'qoldi / xato — hech narsa chizilmaydi */

class SceneBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

type Env = { ok: boolean; reduced: boolean; mobile: boolean };

export default function Lazy3D({
  className,
  Scene,
  rootMargin = "200px",
}: {
  className?: string;
  Scene: ComponentType<SceneProps>;
  rootMargin?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { near, seen } = useNearViewport(ref, rootMargin);
  const [env, setEnv] = useState<Env | null>(null);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setEnv({ ok: supportsWebGL(), reduced: prefersReducedMotion(), mobile: isMobileViewport() });
    let mq: MediaQueryList | null = null;
    try {
      mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    } catch {
      return;
    }
    const onChange = () => setEnv((e) => (e ? { ...e, reduced: mq?.matches ?? false } : e));
    mq.addEventListener?.("change", onChange);
    return () => mq?.removeEventListener?.("change", onChange);
  }, []);

  const onFail = useCallback(() => setFailed(true), []);
  const onReady = useCallback(() => setReady(true), []);
  const show = !!env?.ok && seen && !failed;

  return (
    <div ref={ref} aria-hidden="true" className={className} style={{ touchAction: "pan-y", pointerEvents: "none" }}>
      {show && env && (
        <div
          style={{
            width: "100%",
            height: "100%",
            opacity: ready ? 1 : 0,
            transition: env.reduced ? "none" : "opacity 0.9s ease",
          }}
        >
          <SceneBoundary onError={onFail}>
            <Scene active={near} reduced={env.reduced} mobile={env.mobile} trackRef={ref} onFail={onFail} onReady={onReady} />
          </SceneBoundary>
        </div>
      )}
    </div>
  );
}

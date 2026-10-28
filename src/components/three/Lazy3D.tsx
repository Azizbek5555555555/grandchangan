"use client";

import { Component, useCallback, useEffect, useRef, useState, type ComponentType, type ReactNode } from "react";
import { isMobileViewport, prefersReducedMotion, supportsWebGL } from "./lib/env";
import type { SceneProps } from "./lib/types";
import { useNearViewport } from "./lib/useInView";

/* Yengil o'rab oluvchi: sahna chunk'i sahifa yuklangach bo'sh vaqtda oldindan yuklanadi (load), canvas
   bo'limga ~1.5 ekran qolganda o'rnatilib bitta kadr chiziladi (shader'lar tayyor), viewport yaqinida (rootMargin)
   animatsiya yoqiladi — bo'limga kelganda 3D kutmasdan darhol ochiladi. Ko'rinmaganda render to'xtaydi.
   WebGL yo'q / kontekst yo'qoldi / xato — hech narsa chizilmaydi */

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
  mountMargin = "150% 0px",
  load,
  poster,
  fallback,
}: {
  className?: string;
  Scene: ComponentType<SceneProps>;
  rootMargin?: string;
  /** Canvas qancha oldindan o'rnatiladi (IntersectionObserver rootMargin) */
  mountMargin?: string;
  /** Sahna chunk'ini oldindan yuklovchi (dynamic import bilan bir xil) */
  load?: () => Promise<unknown>;
  /**
   * Shu sahnaning statik rasmi (shaffof fon, konteyner bilan bir xil nisbat). SSR'da darhol chiziladi, 3D tayyor
   * bo'lgach silliq almashadi; WebGL yo'q bo'lsa — zaxira bo'lib qoladi. Birinchi ekrandagi sahnalar uchun.
   */
  poster?: string;
  /**
   * 3D tayyor bo'lguncha (shader'lar kompilyatsiyasi, chunk yuklanishi) ko'rsatiladigan element — masalan taom rasmi;
   * 3D chizilgach silliq yo'qoladi, WebGL yo'q yoki sahna yiqilsa — qolib ketadi. Bo'lim hech qachon bo'sh turmaydi.
   */
  fallback?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { near, seen } = useNearViewport(ref, rootMargin, mountMargin);
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

  // Sahna kodini bo'sh vaqtda oldindan yuklab qo'yish (three.js chunk'i keshda turadi)
  useEffect(() => {
    if (!load) return;
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
    const run = () => { load().catch(() => {}); };
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(run, { timeout: 1500 });
      return () => w.cancelIdleCallback?.(id);
    }
    const id = window.setTimeout(run, 600);
    return () => window.clearTimeout(id);
  }, [load]);

  const onFail = useCallback(() => setFailed(true), []);
  const onReady = useCallback(() => setReady(true), []);
  const show = !!env?.ok && seen && !failed;
  const live = show && ready;

  return (
    // data-3d — 3D holati (avtomatik tekshiruvlar uchun): loading → ready (chizildi) yoki off (WebGL yo'q / yiqildi)
    <div
      ref={ref}
      aria-hidden="true"
      data-3d={live ? "ready" : env && (!env.ok || failed) ? "off" : "loading"}
      className={className}
      style={{ touchAction: "pan-y", pointerEvents: "none" }}
    >
      <div style={{ position: "relative", width: "100%", height: "100%" }}>
        {poster && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={poster}
            alt=""
            decoding="async"
            fetchPriority="high"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "fill",
              opacity: live ? 0 : 1,
              transition: env?.reduced ? "none" : "opacity 0.6s ease 0.15s",
            }}
          />
        )}
        {fallback && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: live ? 0 : 1,
              transition: env?.reduced ? "none" : "opacity 0.6s ease 0.1s",
            }}
          >
            {fallback}
          </div>
        )}
        {show && env && (
          <div
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
              opacity: ready ? 1 : 0,
              transition: env.reduced ? "none" : "opacity 0.45s ease",
            }}
          >
            <SceneBoundary onError={onFail}>
              <Scene active={near} reduced={env.reduced} mobile={env.mobile} trackRef={ref} onFail={onFail} onReady={onReady} />
            </SceneBoundary>
          </div>
        )}
      </div>
    </div>
  );
}

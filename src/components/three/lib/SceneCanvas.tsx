"use client";

import { Canvas, useFrame, useThree, type CanvasProps } from "@react-three/fiber";
import * as THREE from "three";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { SceneProps } from "./types";

type Props = Omit<SceneProps, "trackRef"> & {
  camera: CanvasProps["camera"];
  children: ReactNode;
};

/**
 * Umumiy Canvas: shaffof fon, dpr chegarasi, kontekst yo'qolsa — onFail. Avval barcha shader'lar fonda
 * (KHR_parallel_shader_compile, compileAsync) kompilyatsiya qilinadi — sahifa qotmaydi; shu vaqtda chizilmaydi
 * ("never"). Keyin ko'rinmaganda "demand": bitta kadr chiziladi, ko'ringanda — "always".
 */
export default function SceneCanvas({ active, reduced, mobile, onFail, onReady, camera, children }: Props) {
  const [compiled, setCompiled] = useState(false);
  return (
    <Canvas
      frameloop={!compiled ? "never" : active && !reduced ? "always" : "demand"}
      dpr={[1, mobile ? 1.5 : 1.75]}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      camera={camera}
      style={{ pointerEvents: "none", touchAction: "pan-y" }}
      onCreated={({ gl }) => {
        // Neutral — taom ranglarini (qizil, yashil) siljitmaydi
        gl.toneMapping = THREE.NeutralToneMapping;
        gl.toneMappingExposure = 1;
        gl.setClearColor(0x000000, 0);
        // Prod'da shader xatolarini tekshirmaslik: getProgramInfoLog kompilyatsiyani sinxron kutadi (sahifa qotadi)
        if (process.env.NODE_ENV === "production") gl.debug.checkShaderErrors = false;
        // R3F unmount'da forceContextLoss chaqiradi — dasturiy GPU'li qurilmalarda bu asosiy oqimni soniyalab
        // to'xtatadi (sahifadan sahifaga o'tishda qotish). Resurslar dispose bilan tozalanadi, kontekst canvas bilan GC'da bo'shaydi.
        gl.forceContextLoss = () => gl.dispose();
        gl.domElement.addEventListener(
          "webglcontextlost",
          (e) => {
            e.preventDefault();
            onFail();
          },
          { once: true },
        );
      }}
    >
      <FirstFrame onReady={onReady} />
      {children}
      <Precompile done={compiled} onDone={() => setCompiled(true)} />
    </Canvas>
  );
}

/** Birinchi kadr haqiqatda chizilgach (shader'lar kompilyatsiya bo'lgan) — onReady: poster shundan keyin almashadi */
function FirstFrame({ onReady }: { onReady: () => void }) {
  const done = useRef(false);
  useFrame(() => {
    if (done.current) return;
    done.current = true;
    requestAnimationFrame(() => onReady());
  });
  return null;
}

/**
 * Sahnadagi barcha material shader'larini fonda kompilyatsiya qiladi (brauzer parallel bajaradi, asosiy oqim bo'sh),
 * tugagach chizish boshlanadi. Bir kadr kutiladi — bolalarning layout effektlari (kamera, instanced matritsalar,
 * muhit xaritasi) tayyor bo'lsin.
 */
function Precompile({ done, onDone }: { done: boolean; onDone: () => void }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const invalidate = useThree((s) => s.invalidate);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  useEffect(() => {
    let alive = true;
    const finish = () => { if (alive) doneRef.current(); };
    const id = requestAnimationFrame(() => {
      gl.compileAsync(scene, camera).then(finish, finish);
    });
    return () => {
      alive = false;
      cancelAnimationFrame(id);
    };
  }, [gl, scene, camera]);
  // "never" → "demand" o'tgach birinchi kadrni chizdirish
  useEffect(() => {
    if (done) invalidate();
  }, [done, invalidate]);
  return null;
}

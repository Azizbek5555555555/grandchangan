"use client";

import { Canvas, type CanvasProps } from "@react-three/fiber";
import * as THREE from "three";
import type { ReactNode } from "react";
import type { SceneProps } from "./types";

type Props = Omit<SceneProps, "trackRef"> & {
  camera: CanvasProps["camera"];
  children: ReactNode;
};

/**
 * Umumiy Canvas: shaffof fon, dpr chegarasi, kontekst yo'qolsa — onFail. Ko'rinmaganda "demand": oldindan
 * o'rnatilganda bitta kadr chiziladi (shader kompilyatsiyasi bo'limga yetmasdan bo'ladi), keyin to'xtaydi.
 */
export default function SceneCanvas({ active, reduced, mobile, onFail, onReady, camera, children }: Props) {
  return (
    <Canvas
      frameloop={active && !reduced ? "always" : "demand"}
      dpr={[1, mobile ? 1.5 : 1.75]}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      camera={camera}
      style={{ pointerEvents: "none", touchAction: "pan-y" }}
      onCreated={({ gl }) => {
        // Neutral — taom ranglarini (qizil, yashil) siljitmaydi
        gl.toneMapping = THREE.NeutralToneMapping;
        gl.toneMappingExposure = 1;
        gl.setClearColor(0x000000, 0);
        gl.domElement.addEventListener(
          "webglcontextlost",
          (e) => {
            e.preventDefault();
            onFail();
          },
          { once: true },
        );
        onReady();
      }}
    >
      {children}
    </Canvas>
  );
}

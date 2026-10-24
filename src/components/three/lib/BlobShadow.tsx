"use client";

import { forwardRef, useEffect, useMemo } from "react";
import * as THREE from "three";
import type { ThreeElements } from "@react-three/fiber";
import { softDotTexture } from "./textures";

/** Arzon yumshoq soya — radial gradient tekislik (ContactShadows o'rniga, har kadr qayta render yo'q) */
const BlobShadow = forwardRef<THREE.Mesh, { color: string; opacity?: number; scale?: [number, number] } & Omit<ThreeElements["mesh"], "scale" | "ref">>(
  function BlobShadow({ color, opacity = 0.5, scale = [3, 3], ...rest }, ref) {
    const tex = useMemo(() => softDotTexture(128), []);
    const mat = useMemo(
      () =>
        new THREE.MeshBasicMaterial({
          color,
          alphaMap: tex,
          transparent: true,
          opacity,
          depthWrite: false,
          toneMapped: false,
        }),
      [color, opacity, tex],
    );
    const geo = useMemo(() => new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), []);
    useEffect(() => () => tex.dispose(), [tex]);
    useEffect(() => () => mat.dispose(), [mat]);
    useEffect(() => () => geo.dispose(), [geo]);
    return <mesh ref={ref} geometry={geo} material={mat} scale={[scale[0], 1, scale[1]]} renderOrder={-1} {...rest} />;
  },
);

export default BlobShadow;

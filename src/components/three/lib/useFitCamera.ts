"use client";

import { useThree } from "@react-three/fiber";
import { useLayoutEffect } from "react";
import * as THREE from "three";

/**
 * Kamerani konteyner nisbatiga moslaydi: `width`×`height` o'lchamdagi kadr har doim sig'adi.
 * dir — nishondan kameraga yo'nalish (balandlik burchagi shu bilan beriladi).
 */
export function useFitCamera(
  target: [number, number, number],
  dir: [number, number, number],
  width: number,
  height: number,
) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);
  useLayoutEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;
    const aspect = size.width / Math.max(1, size.height);
    const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const dist = Math.max(height / 2 / tan, width / 2 / (tan * aspect));
    const d = new THREE.Vector3(...dir).normalize().multiplyScalar(dist);
    camera.position.set(target[0] + d.x, target[1] + d.y, target[2] + d.z);
    camera.lookAt(target[0], target[1], target[2]);
    camera.near = Math.max(0.1, dist - 20);
    camera.far = dist + 30;
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, size.width, size.height, target, dir, width, height, invalidate]);
}

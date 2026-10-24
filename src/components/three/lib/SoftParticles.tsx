"use client";

import { useFrame, type ThreeElements } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { rng } from "./motion";
import { softDotTexture, steamTexture } from "./textures";

export type SoftParticlesHandle = { opacity: number };

type Props = {
  count: number;
  /** boshlang'ich doira radiusi (xz) */
  radius: number;
  /** ko'tarilish balandligi */
  height: number;
  /** kengayish (yuqoriga chiqqanda) */
  spread?: number;
  /** zarracha o'lchami */
  size?: number;
  /** tezlik (sikl/sek) */
  speed?: number;
  color: string;
  opacity?: number;
  /** "steam" — bulutcha, "ember" — yumaloq uchqun */
  kind?: "steam" | "ember";
  /** tashqaridan opacity boshqarish (lid ochilishi) */
  control?: RefObject<SoftParticlesHandle | null>;
  /** statik kadr (reduced motion) uchun vaqt */
  frozenTime?: number | null;
  seed?: number;
} & Omit<ThreeElements["group"], "children" | "ref">;

const vert = /* glsl */ `
  attribute vec4 aSeed;
  uniform float uTime;
  uniform float uSpeed;
  uniform float uHeight;
  uniform float uSpread;
  uniform float uSize;
  uniform float uSwirl;
  varying float vLife;
  varying vec2 vUv;
  void main() {
    float life = fract(uTime * uSpeed * (0.75 + aSeed.y * 0.5) + aSeed.x);
    vec3 p = vec3(aSeed.z, 0.0, aSeed.w);
    p.xz *= 1.0 + life * uSpread;
    p.y = life * uHeight;
    p.x += sin(life * 5.0 + aSeed.x * 31.0) * uSwirl * life;
    p.z += cos(life * 4.0 + aSeed.x * 17.0) * uSwirl * 0.7 * life;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    float s = uSize * (0.55 + life * 1.1) * (0.7 + aSeed.y * 0.6);
    float a = aSeed.x * 6.2831 + life * 1.3 * (aSeed.y - 0.5);
    vec2 q = mat2(cos(a), -sin(a), sin(a), cos(a)) * position.xy;
    mv.xy += q * s;
    gl_Position = projectionMatrix * mv;
    vLife = life;
    vUv = uv;
  }
`;

const frag = /* glsl */ `
  uniform sampler2D uMap;
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uFadeIn;
  varying float vLife;
  varying vec2 vUv;
  void main() {
    float m = texture2D(uMap, vUv).r;
    float fade = smoothstep(0.0, uFadeIn, vLife) * (1.0 - smoothstep(0.5, 1.0, vLife));
    float a = m * fade * uOpacity;
    if (a < 0.003) discard;
    gl_FragColor = vec4(uColor, a);
    #include <colorspace_fragment>
  }
`;

/** Ko'tariluvchi yumshoq zarrachalar (bug', uchqun) — bitta draw call, billboard instancing */
export default function SoftParticles({
  count,
  radius,
  height,
  spread = 0.8,
  size = 0.6,
  speed = 0.12,
  color,
  opacity = 0.35,
  kind = "steam",
  control,
  frozenTime = null,
  seed = 1,
  ...group
}: Props) {
  const tex = useMemo(() => (kind === "steam" ? steamTexture(128, seed) : softDotTexture(64)), [kind, seed]);
  const geo = useMemo(() => {
    const base = new THREE.PlaneGeometry(1, 1);
    const g = new THREE.InstancedBufferGeometry();
    g.index = base.index;
    g.setAttribute("position", base.getAttribute("position"));
    g.setAttribute("uv", base.getAttribute("uv"));
    const r = rng(seed * 97 + 13);
    const arr = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
      const a = r() * Math.PI * 2;
      const d = Math.sqrt(r()) * radius;
      arr[i * 4] = i / count + r() * 0.05;
      arr[i * 4 + 1] = r();
      arr[i * 4 + 2] = Math.cos(a) * d;
      arr[i * 4 + 3] = Math.sin(a) * d;
    }
    g.setAttribute("aSeed", new THREE.InstancedBufferAttribute(arr, 4));
    g.instanceCount = count;
    return g;
  }, [count, radius, seed]);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uTime: { value: frozenTime ?? 0 },
          uSpeed: { value: speed },
          uHeight: { value: height },
          uSpread: { value: spread },
          uSize: { value: size },
          uSwirl: { value: kind === "steam" ? 0.25 : 0.4 },
          uMap: { value: tex },
          uColor: { value: new THREE.Color(color) },
          uOpacity: { value: opacity },
          uFadeIn: { value: kind === "steam" ? 0.25 : 0.1 },
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tex],
  );
  useEffect(() => {
    mat.uniforms.uSpeed.value = speed;
    mat.uniforms.uHeight.value = height;
    mat.uniforms.uSpread.value = spread;
    mat.uniforms.uSize.value = size;
    (mat.uniforms.uColor.value as THREE.Color).set(color);
  }, [mat, speed, height, spread, size, color]);
  useEffect(() => () => tex.dispose(), [tex]);
  useEffect(() => () => mat.dispose(), [mat]);
  useEffect(() => () => geo.dispose(), [geo]);

  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    mat.uniforms.uTime.value = frozenTime ?? state.clock.elapsedTime;
    const k = control?.current ? control.current.opacity : 1;
    mat.uniforms.uOpacity.value = opacity * k;
    if (ref.current) ref.current.visible = opacity * k > 0.002;
  });

  return (
    <group {...group}>
      <mesh ref={ref} geometry={geo} material={mat} frustumCulled={false} renderOrder={5} />
    </group>
  );
}

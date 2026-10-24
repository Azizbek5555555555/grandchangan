"use client";

import { Environment, Lightformer } from "@react-three/drei";
import { P } from "../palette";

type Variant = "fire" | "wine" | "night";

/**
 * Yumshoq studiya yorug'ligi: faqat Lightformer'lardan yasalgan muhit (HDR/CDN yo'q) +
 * asosiy (key) va kontur (rim) chiroqlar. Pastdan fon rangidagi qaytgan nur — sahnani fonga "bog'laydi".
 */
export default function StudioLights({ variant, keyIntensity = 2.2 }: { variant: Variant; keyIntensity?: number }) {
  const bounce = variant === "fire" ? P.bounceRed : variant === "wine" ? P.bounceWine : P.lanternGlow;
  return (
    <>
      <ambientLight intensity={variant === "night" ? 0.08 : 0.25} color={P.keyWarm} />
      <directionalLight position={[-4, 7, 5]} intensity={keyIntensity} color={P.keyWarm} />
      <directionalLight position={[5, 3, -6]} intensity={variant === "night" ? 0.6 : 1.6} color={P.rimWarm} />
      <hemisphereLight args={[P.keyWarm, bounce, variant === "night" ? 0.15 : 0.35]} />
      <Environment resolution={256} frames={1}>
        {/* katta yumshoq softbox — tepada-old chapda */}
        <Lightformer form="rect" intensity={3} color={P.keyWarm} position={[-3, 5, 4]} scale={[7, 4, 1]} target={[0, 0, 0]} />
        {/* yuqoridan halqa — sir/sho'rvada chiroyli yaltirash */}
        <Lightformer form="ring" intensity={2} color={P.white} position={[0, 7, 0]} scale={4} target={[0, 0, 0]} />
        {/* orqadan past softbox — sho'rva va sirda yaltiroq aks */}
        <Lightformer form="rect" intensity={2.2} color={P.keyWarm} position={[-1, 3, -7]} scale={[6, 2.5, 1]} target={[0, 0, 0]} />
        {/* orqa-o'ng kontur */}
        <Lightformer form="rect" intensity={4} color={P.rimWarm} position={[6, 2, -4]} scale={[3, 6, 1]} target={[0, 0, 0]} />
        {/* chap yon ingichka chiziq — silindrlarda vertikal yaltirash */}
        <Lightformer form="rect" intensity={1.6} color={P.keyWarm} position={[-6, 1, -1]} scale={[1, 6, 1]} target={[0, 0, 0]} />
        {/* pastdan fon rangidagi qaytish */}
        <Lightformer form="rect" intensity={variant === "night" ? 0.5 : 1.2} color={bounce} position={[0, -5, 3]} scale={[10, 4, 1]} target={[0, 0, 0]} />
      </Environment>
    </>
  );
}

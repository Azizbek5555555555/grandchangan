"use client";

import * as THREE from "three";
import { useDisposable } from "../lib/dispose";
import { arcPoints, resample, splinePoints } from "../lib/geometry";
import { bowlTexture, brothTexture, noiseTexture } from "../lib/textures";

/* Chinni lag'mon kosasi: lathe profil (tagcha → tashqi devor → yumaloq lab → ichki devor),
   qizil lab + huiwen lentasi + bulut naqshi CanvasTexture bilan */

export const BOWL = {
  rimY: 1.0,
  rimR: 1.315,
  brothY: 0.8,
};

function bowlProfile() {
  const foot: THREE.Vector2[] = [
    new THREE.Vector2(0, 0.035),
    new THREE.Vector2(0.47, 0.035),
    new THREE.Vector2(0.5, 0.004),
    new THREE.Vector2(0.6, 0),
    new THREE.Vector2(0.625, 0.025),
    new THREE.Vector2(0.635, 0.09),
  ];
  const wall = splinePoints(
    [
      [0.66, 0.1],
      [0.86, 0.2],
      [1.06, 0.38],
      [1.21, 0.6],
      [1.3, 0.82],
      [1.34, 0.975],
    ],
    70,
  );
  const lip = arcPoints(1.315, 0.975, 0.025, 0, Math.PI, 14);
  const inner = splinePoints(
    [
      [1.29, 0.975],
      [1.255, 0.82],
      [1.17, 0.6],
      [1.02, 0.4],
      [0.8, 0.24],
      [0.5, 0.15],
      [0.2, 0.125],
      [0, 0.12],
    ],
    70,
  );
  const dense = [...foot, ...wall.slice(1), ...lip.slice(1), ...inner.slice(1)];
  const footIdx = foot.length - 1;
  const apexIdx = foot.length - 1 + wall.length - 1 + 7;

  const innerRadiusAt = (y: number) => {
    for (let i = 1; i < inner.length; i++) {
      const a = inner[i - 1];
      const b = inner[i];
      if ((a.y - y) * (b.y - y) <= 0) {
        const f = (y - a.y) / (b.y - a.y || 1);
        return a.x + (b.x - a.x) * f;
      }
    }
    return 1;
  };
  return { dense, footIdx, apexIdx, innerRadiusAt };
}

const PROFILE = bowlProfile();

/** Ichki devor radiusi berilgan balandlikda (masalliqlarni joylash uchun) */
export const innerRadiusAt = PROFILE.innerRadiusAt;

function buildBowl(segments: number, profileN: number) {
  const { points, acc, total } = resample(PROFILE.dense, profileN);
  const geo = new THREE.LatheGeometry(points, segments);
  return { geo, total, apex: acc[PROFILE.apexIdx], footTop: acc[PROFILE.footIdx], innerRadiusAt };
}

/** part: "bowl" — faqat kosa, "broth" — faqat sho'rva (qatlamli ko'rinish uchun) */
export default function Bowl({ mobile, part = "all" }: { mobile: boolean; part?: "all" | "bowl" | "broth" }) {
  const res = useDisposable(() => {
    const b = buildBowl(mobile ? 72 : 112, mobile ? 56 : 80);
    const tex = bowlTexture({
      total: b.total,
      apex: b.apex,
      footTop: b.footTop,
      bandRadius: 1.32,
      w: mobile ? 1024 : 2048,
      h: mobile ? 512 : 1024,
    });
    const mat = new THREE.MeshPhysicalMaterial({
      map: tex,
      roughness: 0.2,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
      envMapIntensity: 1.1,
    });
    const brothR = b.innerRadiusAt(BOWL.brothY);
    const brothGeo = new THREE.CircleGeometry(brothR + 0.004, mobile ? 64 : 96);
    brothGeo.rotateX(-Math.PI / 2);
    const brothMap = brothTexture(mobile ? 512 : 1024);
    const ripple = noiseTexture(256, 5, 4, 1.2, 17);
    ripple.repeat.set(3, 3);
    const brothMat = new THREE.MeshPhysicalMaterial({
      map: brothMap,
      roughness: 0.12,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.03,
      bumpMap: ripple,
      bumpScale: 0.12,
      envMapIntensity: 0.75,
    });
    return { geo: b.geo, tex, mat, brothGeo, brothMap, ripple, brothMat };
  }, [mobile]);

  return (
    <group>
      {part !== "broth" && <mesh geometry={res.geo} material={res.mat} />}
      {part !== "bowl" && <mesh geometry={res.brothGeo} material={res.brothMat} position={[0, BOWL.brothY, 0]} />}
    </group>
  );
}

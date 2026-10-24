"use client";

import { forwardRef } from "react";
import * as THREE from "three";
import { useDisposable } from "../lib/dispose";
import { bambooBandTexture, bambooWallTexture, slatsTexture, weaveTexture } from "../lib/textures";
import { P } from "../palette";
import { dumplingGeometry, doughMaterial } from "./Dumpling";

/* Bambuk bug'latgich: savat (devor + 2 halqa + reykali taglik + pergament), ichida chuchvaralar.
   Qopqoq alohida komponent — sahna uni ko'taradi/egadi */

export const STEAMER = { r: 1.5, h: 0.62, lidH: 0.34 };

/** Chuchvaralar joylashuvi (savat ichida, markaz + aylana) */
const SPOTS: [number, number, number][] = [
  [0, 0, 0],
  [0.72, 0, 0.18],
  [-0.62, 0, 0.4],
  [-0.2, 0, -0.7],
  [0.5, 0, -0.6],
];

function useBambooMats(mobile: boolean) {
  return useDisposable(() => {
    const wall = bambooWallTexture(mobile ? 512 : 1024, mobile ? 128 : 256);
    wall.repeat.set(3, 1);
    const band = bambooBandTexture(mobile ? 512 : 1024, 64);
    band.repeat.set(3, 1);
    const wallMat = new THREE.MeshStandardMaterial({ map: wall, roughness: 0.62, side: THREE.DoubleSide });
    const bandMat = new THREE.MeshStandardMaterial({ map: band, roughness: 0.5 });
    return { wall, band, wallMat, bandMat };
  }, [mobile]);
}

export function SteamerBasket({ mobile }: { mobile: boolean }) {
  const m = useBambooMats(mobile);
  const res = useDisposable(() => {
    const seg = mobile ? 48 : 72;
    const wallGeo = new THREE.CylinderGeometry(STEAMER.r, STEAMER.r, STEAMER.h, seg, 1, true);
    const bandGeo = new THREE.CylinderGeometry(STEAMER.r + 0.035, STEAMER.r + 0.035, 0.13, seg, 1, true);
    const slats = slatsTexture(mobile ? 256 : 512, 14);
    const floorGeo = new THREE.CircleGeometry(STEAMER.r - 0.02, seg).rotateX(-Math.PI / 2);
    const floorMat = new THREE.MeshStandardMaterial({ map: slats, roughness: 0.7 });
    const paperGeo = new THREE.CircleGeometry(STEAMER.r * 0.86, seg).rotateX(-Math.PI / 2);
    const paperMat = new THREE.MeshStandardMaterial({ color: P.parchment, roughness: 0.85 });
    const dGeo = dumplingGeometry(mobile, 18);
    const dMat = doughMaterial();
    return { wallGeo, bandGeo, slats, floorGeo, floorMat, paperGeo, paperMat, dGeo, dMat };
  }, [mobile]);

  return (
    <group>
      <mesh geometry={res.wallGeo} material={m.wallMat} position={[0, STEAMER.h / 2, 0]} />
      <mesh geometry={res.bandGeo} material={m.bandMat} position={[0, STEAMER.h - 0.06, 0]} />
      <mesh geometry={res.bandGeo} material={m.bandMat} position={[0, 0.06, 0]} />
      <mesh geometry={res.floorGeo} material={res.floorMat} position={[0, 0.1, 0]} />
      <mesh geometry={res.paperGeo} material={res.paperMat} position={[0, 0.115, 0]} />
      {SPOTS.map((s, i) => (
        <mesh
          key={i}
          geometry={res.dGeo}
          material={res.dMat}
          position={[s[0], 0.12, s[2]]}
          rotation={[0, i * 1.3, 0]}
          scale={i === 0 ? 0.56 : 0.5}
        />
      ))}
    </group>
  );
}

/** Qopqoq: past gumbaz (to'qima) + yon halqa. Pivot — qopqoq markazi (sahna joylaydi) */
export const SteamerLid = forwardRef<THREE.Group, { mobile: boolean }>(function SteamerLid({ mobile }, ref) {
  const m = useBambooMats(mobile);
  const res = useDisposable(() => {
    const seg = mobile ? 48 : 72;
    const r = STEAMER.r + 0.06;
    const sideGeo = new THREE.CylinderGeometry(r, r, STEAMER.lidH, seg, 1, true);
    // yassi gumbaz: lathe profil (chetdan markazga biroz ko'tariladi)
    const prof: THREE.Vector2[] = [];
    for (let i = 0; i <= 16; i++) {
      const t = i / 16;
      prof.push(new THREE.Vector2(r * (1 - t), STEAMER.lidH / 2 + Math.sin((t * Math.PI) / 2) * 0.16));
    }
    const domeGeo = new THREE.LatheGeometry(prof.reverse(), seg);
    const weave = weaveTexture(mobile ? 256 : 512, 16);
    weave.repeat.set(2, 2);
    const domeMat = new THREE.MeshStandardMaterial({ map: weave, roughness: 0.66, side: THREE.DoubleSide });
    const knobGeo = new THREE.TorusGeometry(0.16, 0.035, 10, 28);
    return { sideGeo, domeGeo, weave, domeMat, knobGeo };
  }, [mobile]);

  return (
    <group ref={ref}>
      <mesh geometry={res.sideGeo} material={m.wallMat} />
      <mesh geometry={res.domeGeo} material={res.domeMat} />
      <mesh geometry={res.knobGeo} material={m.bandMat} position={[0, STEAMER.lidH / 2 + 0.2, 0]} rotation={[0, 0, 0]} />
    </group>
  );
});

import { getTranslations } from "next-intl/server";
import { Hand, Layers, ShieldCheck } from "lucide-react";
import ExplodeStage from "@/components/site/explode/ExplodeStage";
import { HOME_LAGMAN, HOME_LAGMAN_VIEW } from "@/lib/menu/recipes";

/**
 * Bosh sahifa: "Bir kosada — butun hikoya" — lag'mon kosasi scroll'da qatlamlarga ajraladi
 * (umumiy ExplodeStage + ExplodedDishScene; lag'monning asl modellari va kadri).
 */
export default async function ExplodeSection({ locale }: { locale: string }) {
  const h2 = await getTranslations({ locale, namespace: "Home2" });
  return (
    <ExplodeStage
      cn="一碗面"
      eyebrow={h2("explodeEyebrow")}
      title={h2("explodeTitle")}
      accent={h2("explodeAccent")}
      sub={h2("explodeSub")}
      labels={[1, 2, 3, 4, 5, 6].map((i) => h2(`layer${i}`))}
      facts={[
        { icon: Layers, label: h2("explodeFact1") },
        { icon: Hand, label: h2("explodeFact2") },
        { icon: ShieldCheck, label: h2("explodeFact3") },
      ]}
      fig={h2("explodeFig")}
      figCn="手工拉面"
      glyph="面"
      poem="一碗面 · 千般味"
      recipe={HOME_LAGMAN}
      view={HOME_LAGMAN_VIEW}
      waveTop="text-sand"
    />
  );
}

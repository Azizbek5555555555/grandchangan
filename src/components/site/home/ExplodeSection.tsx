import { getTranslations } from "next-intl/server";
import ExplodedBowl from "@/components/three/ExplodedBowl";
import SectionHead from "@/components/site/kit/SectionHead";
import Wave from "@/components/site/kit/Wave";

/**
 * "Bir kosada — butun hikoya": baland bo'lim, ichida yopishqoq (sticky) ekran. Scroll qilinganda
 * 3D lag'mon kosasi qatlamlarga ajraladi va har qatlam nomi chiqadi (namuna: qatlamli salat/banan).
 * ExplodedBowl progressni shu bo'limning [data-explode-track] scroll'idan oladi.
 */
export default async function ExplodeSection({ locale }: { locale: string }) {
  const h2 = await getTranslations({ locale, namespace: "Home2" });
  const labels = [1, 2, 3, 4, 5, 6].map((i) => h2(`layer${i}`));

  return (
    <section data-explode-track className="relative h-[230vh] bg-night text-brand-cream lg:h-[260vh]">
      <Wave top className="text-sand" variant="c" />
      <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden">
        <span aria-hidden="true" className="lattice-bg pointer-events-none absolute inset-0 text-brand-gold/[0.04]" />
        <span aria-hidden="true" className="pointer-events-none absolute -left-40 top-1/3 size-[32rem] rounded-full bg-fire-deep/25 blur-3xl" />
        <div className="relative mx-auto grid w-full max-w-7xl items-center gap-2 px-5 pt-16 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-8 lg:pt-0">
          <SectionHead
            tone="dark"
            font="serif"
            cn="一碗面"
            eyebrow={h2("explodeEyebrow")}
            title={h2("explodeTitle")}
            accent={h2("explodeAccent")}
            sub={h2("explodeSub")}
          />
          <div>
            <ExplodedBowl labels={labels} className="h-[46svh] w-full sm:h-[60svh] lg:h-[88svh]" />
            {/* Telefon: qatlam nomlari ro'yxat ko'rinishida (3D yorliqlar tor ekranda sig'maydi) */}
            <ol className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-brand-cream/80 md:hidden">
              {labels.map((l, i) => (
                <li key={l} className="flex items-start gap-2">
                  <span className="font-poster text-xs leading-5 text-saffron">0{i + 1}</span>
                  <span className="font-display italic leading-5">{l}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}

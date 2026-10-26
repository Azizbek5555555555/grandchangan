import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ArrowLeft } from "lucide-react";
import ButtonLink, { btnClass } from "@/components/site/kit/ButtonLink";
import FretBand from "@/components/site/kit/FretBand";
import SiteHeader from "@/components/site/Header";
import { PHOTOS } from "@/lib/photos";

const BG = PHOTOS.extGate;

/**
 * 404 — sayt uslubidagi sahifa: header, fonda restoranning kirish darvozasi (qorong'i qatlam ostida),
 * ulkan oltin "404" (o'rtadagi 0 — likopcha ichida 迷), "迷路" (yo'ldan adashish) bezagi,
 * bosh sahifaga va menyuga tugmalar. Noma'lum manzillar [...rest] orqali shu yerga keladi.
 */
export default async function NotFound() {
  const tc = await getTranslations("Common");
  const st = await getTranslations("Site");
  const T = await getTranslations("Chrome");

  return (
    <>
      <SiteHeader />
      <main id="main" className="relative isolate flex min-h-svh flex-col overflow-hidden bg-night text-brand-cream">
        {/* Fon: kirish darvozasi rasmi, qorong'i qatlamlar */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={BG.md}
          srcSet={`${BG.md} 1200w, ${BG.src} ${BG.w}w`}
          sizes="100vw"
          alt=""
          fetchPriority="high"
          className="absolute inset-0 -z-20 h-full w-full object-cover opacity-35"
        />
        <span aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-b from-night/70 via-night/80 to-night" />
        <span aria-hidden="true" className="lattice-bg pointer-events-none absolute inset-0 -z-10 text-brand-gold/[0.05]" />
        <span
          aria-hidden="true"
          lang="zh"
          className="font-cn pointer-events-none absolute -left-4 top-1/2 -z-10 -translate-y-1/2 select-none text-[clamp(9rem,36vw,30rem)] leading-none text-brand-gold/[0.07] sm:left-6"
        >
          迷路
        </span>

        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-5 pb-20 pt-32 text-center sm:px-8">
          <p className="font-display flex items-center justify-center gap-[0.04em] text-[clamp(6.5rem,30vw,15rem)] leading-[1.05] text-brand-gold-light">
            <span className="sr-only">404</span>
            <span aria-hidden="true">4</span>
            {/* 0 — likopcha: oltin halqa ichida mo'yqalamdagi belgi */}
            <span aria-hidden="true" className="relative inline-flex h-[0.8em] w-[0.8em] translate-y-[0.06em] items-center justify-center rounded-full border-[0.06em] border-brand-gold bg-fire/80">
              <span className="absolute inset-[0.07em] rounded-full border-[0.012em] border-dashed border-brand-gold/70" />
              <span lang="zh" className="font-cn text-[0.36em] leading-none text-saffron">迷</span>
            </span>
            <span aria-hidden="true">4</span>
          </p>

          <h1 className="mt-6 text-balance font-display text-[clamp(1.8rem,5.5vw,3rem)] leading-[1.1]">{st("notFound")}</h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-brand-cream/85 sm:text-lg">{T("notFoundText")}</p>

          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/" variant="fire" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron">
              <ArrowLeft size={18} aria-hidden="true" /> {tc("home")}
            </ButtonLink>
            <Link href="/menu" className={`${btnClass("gold-outline", "lg")} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron`}>
              {tc("menu")}
            </Link>
          </div>
        </div>

        <FretBand className="text-brand-gold/25" />
      </main>
    </>
  );
}

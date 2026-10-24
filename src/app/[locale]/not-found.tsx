import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ArrowLeft } from "lucide-react";
import ButtonLink, { btnClass } from "@/components/site/kit/ButtonLink";
import Blob from "@/components/site/kit/Blob";
import FretBand from "@/components/site/kit/FretBand";
import Logo from "@/components/site/chrome/Logo";

/**
 * 404 — o'zi yetarli sahifa (header/footer'siz, bazaga murojaat yo'q): qizil fon, panjara naqsh,
 * ulkan "404" (o'rtadagi 0 — zafar likopcha), "迷路" (yo'ldan adashish) bezagi va bosh sahifaga tugma.
 */
export default async function NotFound() {
  const tc = await getTranslations("Common");
  const st = await getTranslations("Site");
  const T = await getTranslations("Chrome");

  return (
    <main className="relative isolate flex min-h-svh flex-col overflow-hidden bg-fire text-brand-cream">
      <span aria-hidden="true" className="lattice-bg pointer-events-none absolute inset-0 -z-10 text-fire-deep/45" />
      <Blob variant="a" className="absolute -right-40 -top-40 -z-10 w-[30rem] text-fire-deep/70 sm:w-[44rem]" />
      <Blob variant="c" className="absolute -bottom-48 -left-32 -z-10 w-[26rem] text-wine/40 sm:w-[36rem]" />
      <span
        aria-hidden="true"
        lang="zh"
        className="font-cn pointer-events-none absolute -left-4 top-1/2 -z-10 -translate-y-1/2 select-none text-[clamp(9rem,36vw,30rem)] leading-none text-fire-deep sm:left-6"
      >
        迷路
      </span>

      <div className="mx-auto flex h-20 w-full max-w-7xl items-center px-5 sm:px-8">
        <Link href="/" aria-label={`GrandChangan — ${tc("home")}`} className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron">
          <Logo size="md" />
        </Link>
      </div>

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-5 pb-20 pt-6 text-center sm:px-8">
        <p className="font-poster flex items-center justify-center gap-[0.04em] text-[clamp(6.5rem,30vw,15rem)] leading-[1.05] text-brand-cream">
          <span className="sr-only">404</span>
          <span aria-hidden="true">4</span>
          {/* 0 — likopcha: zafar halqa ichida mo'yqalamdagi belgi */}
          <span aria-hidden="true" className="relative inline-flex h-[0.82em] w-[0.82em] items-center justify-center rounded-full border-[0.075em] border-saffron">
            <span className="absolute inset-[0.07em] rounded-full border-[0.012em] border-dashed border-saffron/70" />
            <span lang="zh" className="font-cn text-[0.36em] leading-none text-saffron">迷</span>
          </span>
          <span aria-hidden="true">4</span>
        </p>

        <h1 className="font-poster mt-6 text-balance text-[clamp(1.6rem,5.5vw,2.75rem)] leading-[1.1]">{st("notFound")}</h1>
        <p className="mt-4 max-w-md text-base leading-relaxed text-brand-cream/90 sm:text-lg">{T("notFoundText")}</p>

        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/" variant="saffron" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cream">
            <ArrowLeft size={18} aria-hidden="true" /> {tc("home")}
          </ButtonLink>
          <Link href="/menu" className={`${btnClass("ghost-light", "lg")} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron`}>
            {tc("menu")}
          </Link>
        </div>
      </div>

      <FretBand className="text-fire-deep" />
    </main>
  );
}

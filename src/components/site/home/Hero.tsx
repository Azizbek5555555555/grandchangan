import { useLocale, useTranslations } from "next-intl";
import HeroShow from "./hero/HeroShow";
import GoldSeal from "./hero/GoldSeal";
import { HeroCopy, HeroFacts, type HeroFact } from "./hero/HeroCopy";
import { HERO_SLIDES } from "./hero/slides";

export type { HeroFact };

/**
 * 1-bo'lim: HERO — restoranning tashqi rasmlaridan kinematik slayd-shou (Aziz: "tashqaridan olingan 3–4 rasm
 * almashib tursin, chiroyli animatsiya bilan"). To'liq ekran, shaffof header ostidan boshlanadi; qorong'i/yorug'
 * temada bir xil (rasm ustida doim tungi qatlamlar).
 *
 * Bu fayl — server qismi: matnlar (sarlavha, tugmalar, raqamlar) server'da render bo'ladi, slayd-shou va
 * boshqaruv — `hero/HeroShow` (client). Tuzilish: `hero/` papkasi (slides — kadrlash, HeroCopy — matn,
 * GoldSeal — muhr).
 */

type Props = {
  tag: string;
  lines: string[];
  /** Kursiv oltin qator indeksi */
  accentLine: number;
  sub: string;
  /** zh tilida sarlavha mo'yqalam shriftida */
  cnHeadline: boolean;
  bookLabel: string;
  menuLabel: string;
  facts: HeroFact[];
  hours: { value: string; label: string };
  sticker: { ring: string; center: string } | null;
  /** Pastki to'lqin rangi — keyingi bo'lim foni */
  waveClass?: string;
};

export default function Hero({ tag, lines, accentLine, sub, cnHeadline, bookLabel, menuLabel, facts, hours, sticker, waveClass = "text-paper" }: Props) {
  const t = useTranslations("Home2");
  const tp = useTranslations("Photos");
  const locale = useLocale();

  const names = HERO_SLIDES.map((s) => t(`heroSlide${s.key}`));
  const exterior = tp("exterior");

  return (
    <HeroShow
      names={names}
      alts={names.map((nm) => `${exterior} · ${nm}`)}
      showCn={locale !== "zh"}
      labels={{
        region: t("heroShowLabel"),
        role: t("heroShowRole"),
        slide: t("heroSlideRole"),
        prev: t("heroPrev"),
        next: t("heroNext"),
        pause: t("heroPause"),
        play: t("heroPlay"),
        scroll: t("heroScroll"),
      }}
      copy={<HeroCopy tag={tag} lines={lines} accentLine={accentLine} sub={sub} cnHeadline={cnHeadline} bookLabel={bookLabel} menuLabel={menuLabel} />}
      facts={<HeroFacts facts={facts} hours={hours} />}
      seal={sticker ? <GoldSeal ring={sticker.ring} center={sticker.center} /> : null}
      waveClass={waveClass}
    />
  );
}

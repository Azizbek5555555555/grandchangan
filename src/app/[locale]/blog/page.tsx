import { setRequestLocale, getTranslations } from "next-intl/server";
import { ArrowUpRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";
import { t } from "@/lib/utils";
import SiteHeader from "@/components/site/Header";
import SiteFooter from "@/components/site/Footer";
import PageHero from "@/components/site/PageHero";
import SectionHead from "@/components/site/kit/SectionHead";
import RevealGroup from "@/components/motion/RevealGroup";
import Reveal from "@/components/motion/Reveal";
import SafeImg from "@/components/site/home/SafeImg";
import { GlyphPanel } from "@/components/site/home/Decor";
import { Birds, Mountains } from "@/components/site/pages/InkDecor";

export const dynamic = "force-dynamic";
const CHARS = ["文", "茶", "宴", "福", "春", "味"];

export default async function BlogListPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [st, tc] = await Promise.all([
    getTranslations({ locale, namespace: "Site" }),
    getTranslations({ locale, namespace: "Common" }),
  ]);
  const posts = await prisma.blogPost.findMany({ where: { status: "PUBLISHED" }, orderBy: { publishedAt: "desc" } });
  const dateFmt = new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Samarkand" });

  return (
    <>
      <SiteHeader />
      <PageHero title={tc("blog")} subtitle={st("blogSub")} cn="文章" />
      <main className="relative isolate overflow-x-clip bg-paper pb-28 pt-10">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="mb-12">
            <SectionHead font="serif" cn="新闻" eyebrow={st("blogSub")} title={tc("blog")} />
          </div>
          {posts.length > 0 ? (
            <RevealGroup className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3" stagger={0.1} y={40}>
              {posts.map((p, i) => (
                <Link key={p.id} href={`/blog/${p.slug}`} className="group flex flex-col overflow-hidden rounded-[28px] border border-line bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-content/10">
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <SafeImg src={p.coverImage} className="h-full w-full" imgClassName="h-full w-full object-cover transition duration-700 group-hover:scale-105" fallback={<GlyphPanel char={CHARS[i % CHARS.length]} tone={i % 2 ? "wine" : "fire"} size="text-7xl" />} />
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    {p.publishedAt && <p className="text-xs font-semibold uppercase tracking-[0.18em] text-fire-ink">{dateFmt.format(p.publishedAt)}</p>}
                    <h3 className="mt-2 font-display text-2xl leading-snug text-content">{t(p.title, locale)}</h3>
                    {p.excerpt ? <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">{t(p.excerpt, locale)}</p> : null}
                    <span className="mt-auto inline-flex items-center gap-1 pt-5 text-sm font-semibold text-fire-ink transition group-hover:gap-2">{st("more")} <ArrowUpRight size={16} /></span>
                  </div>
                </Link>
              ))}
            </RevealGroup>
          ) : (
            <Reveal className="relative overflow-hidden rounded-[2rem] bg-sand px-6 pb-36 pt-16 text-center">
              <Birds className="mx-auto w-40 text-content/30" />
              <p className="mx-auto mt-6 max-w-md font-display text-2xl text-content">{st("blogSoon")}</p>
              <Mountains className="absolute inset-x-0 bottom-0 h-28 w-full text-paper" />
            </Reveal>
          )}
        </div>
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}

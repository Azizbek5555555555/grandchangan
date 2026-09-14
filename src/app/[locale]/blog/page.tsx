import { setRequestLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";
import { t } from "@/lib/utils";
import SiteHeader from "@/components/site/Header";
import SiteFooter from "@/components/site/Footer";
import PageHero from "@/components/site/PageHero";
import RevealGroup from "@/components/motion/RevealGroup";

export const dynamic = "force-dynamic";

export default async function BlogListPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const st = await getTranslations({ locale, namespace: "Site" });
  const tc = await getTranslations({ locale, namespace: "Common" });
  const posts = await prisma.blogPost.findMany({ where: { status: "PUBLISHED" }, orderBy: { publishedAt: "desc" } });
  return (
    <>
      <SiteHeader />
      <PageHero title={tc("blog")} subtitle={st("blogSub")} />
      <div className="mx-auto max-w-6xl px-5 py-16">
        <RevealGroup className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <Link key={p.id} href={`/blog/${p.slug}`} className="group overflow-hidden rounded-3xl border border-line bg-card transition hover:shadow-xl">
              {p.coverImage ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={p.coverImage} alt="" className="h-44 w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="h-44 bg-surface-2" />}
              <div className="p-5">
                <h3 className="font-display text-xl text-content">{t(p.title, locale)}</h3>
                {p.excerpt ? <p className="mt-2 line-clamp-2 text-sm text-muted">{t(p.excerpt, locale)}</p> : null}
              </div>
            </Link>
          ))}
        </RevealGroup>
        {posts.length === 0 && <p className="text-center text-muted">{st("blogSoon")}</p>}
      </div>
      <SiteFooter locale={locale} />
    </>
  );
}

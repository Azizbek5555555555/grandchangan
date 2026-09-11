import { setRequestLocale } from "next-intl/server";
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
  const posts = await prisma.blogPost.findMany({ where: { status: "PUBLISHED" }, orderBy: { publishedAt: "desc" } });
  return (
    <>
      <SiteHeader />
      <PageHero title="Blog" subtitle="Yangiliklar va hikoyalar" />
      <div className="mx-auto max-w-6xl px-5 py-16">
        <RevealGroup className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <Link key={p.id} href={`/blog/${p.slug}`} className="group overflow-hidden rounded-3xl border border-neutral-200 bg-white transition hover:shadow-xl">
              {p.coverImage ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={p.coverImage} alt="" className="h-44 w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="h-44 bg-neutral-100" />}
              <div className="p-5">
                <h3 className="font-display text-xl text-brand-ink">{t(p.title, locale)}</h3>
                {p.excerpt ? <p className="mt-2 line-clamp-2 text-sm text-neutral-500">{t(p.excerpt, locale)}</p> : null}
              </div>
            </Link>
          ))}
        </RevealGroup>
        {posts.length === 0 && <p className="text-center text-neutral-400">Tez orada maqolalar chiqadi.</p>}
      </div>
      <SiteFooter locale={locale} />
    </>
  );
}

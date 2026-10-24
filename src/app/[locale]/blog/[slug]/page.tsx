import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Link } from "@/i18n/navigation";
import { t } from "@/lib/utils";
import SiteHeader from "@/components/site/Header";
import SiteFooter from "@/components/site/Footer";
import PageHero from "@/components/site/PageHero";
import Reveal from "@/components/motion/Reveal";
import { CloudLine } from "@/components/site/pages/Ornament";

export const dynamic = "force-dynamic";

export default async function BlogPostPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const post = await prisma.blogPost.findUnique({ where: { slug } });
  if (!post || post.status !== "PUBLISHED") notFound();
  await prisma.blogPost.update({ where: { id: post.id }, data: { views: { increment: 1 } } });
  const tc = await getTranslations({ locale, namespace: "Common" });
  const dateFmt = new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Samarkand" });

  return (
    <>
      <SiteHeader />
      <PageHero title={t(post.title, locale)} subtitle={post.publishedAt ? dateFmt.format(post.publishedAt) : undefined} cn="文" tone="night" bgImage={post.coverImage} />
      <main className="bg-paper pb-28 pt-6">
        <article className="mx-auto max-w-3xl px-5 sm:px-8">
          <Link href="/blog" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-fire-ink hover:gap-3">
            <ArrowLeft size={16} /> {tc("blog")}
          </Link>
          {post.coverImage && (
            <Reveal y={30}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={post.coverImage} alt="" className="mt-6 w-full rounded-[28px] shadow-xl shadow-content/10" />
            </Reveal>
          )}
          <CloudLine className="mx-auto my-10 w-40 text-fire/40" />
          <div className="whitespace-pre-wrap text-lg leading-[1.85] text-content first-letter:float-left first-letter:mr-3 first-letter:font-display first-letter:text-6xl first-letter:leading-none first-letter:text-fire">{t(post.content, locale)}</div>
        </article>
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}

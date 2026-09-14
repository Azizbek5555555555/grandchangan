import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { t } from "@/lib/utils";
import SiteHeader from "@/components/site/Header";
import SiteFooter from "@/components/site/Footer";
export const dynamic = "force-dynamic";
export default async function BlogPostPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const post = await prisma.blogPost.findUnique({ where: { slug } });
  if (!post || post.status !== "PUBLISHED") notFound();
  await prisma.blogPost.update({ where: { id: post.id }, data: { views: { increment: 1 } } });
  return (
    <>
      <SiteHeader />
      <article className="mx-auto max-w-3xl px-5 pb-16 pt-36">
        <h1 className="mb-6 font-display text-4xl text-content sm:text-5xl">{t(post.title, locale)}</h1>
        {post.coverImage && /* eslint-disable-next-line @next/next/no-img-element */ <img src={post.coverImage} alt="" className="mb-8 w-full rounded-3xl" />}
        <div className="whitespace-pre-wrap text-lg leading-relaxed text-content">{t(post.content, locale)}</div>
      </article>
      <SiteFooter locale={locale} />
    </>
  );
}

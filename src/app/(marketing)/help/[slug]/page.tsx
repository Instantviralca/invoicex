import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Container } from "@/components/marketing/container";
import {
  getHelpArticleMeta,
  helpArticleContent,
  helpArticleSlugs,
} from "@/lib/help-content";
import { createPageMetadata } from "@/lib/metadata";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return helpArticleSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const article = getHelpArticleMeta(slug);

  if (!article) {
    return {};
  }

  return createPageMetadata({
    title: article.title,
    description: article.description,
    path: `/help/${slug}`,
  });
}

export default async function HelpArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = getHelpArticleMeta(slug);
  const content = helpArticleContent[slug];

  if (!article || !content) {
    notFound();
  }

  return (
    <>
      <section className="border-b border-border-soft bg-background-elevated/70 py-10 sm:py-14">
        <Container>
          <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1.5 text-sm text-foreground-muted">
            <Link href="/help" className="hover:text-brand">
              Help Centre
            </Link>
            <ChevronRight className="size-3.5" aria-hidden />
            <span className="text-foreground-subtle">{article.category}</span>
          </nav>

          <div className="mx-auto max-w-prose">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-deep">
              {article.category}
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {article.title}
            </h1>
            <p className="mt-4 text-base leading-relaxed text-foreground-muted">
              {article.description}
            </p>
          </div>
        </Container>
      </section>

      <section className="py-12 sm:py-16">
        <Container>
          <article className="mx-auto max-w-prose">
            <div className="space-y-5 text-base leading-[1.75] text-foreground-muted [&_a]:font-medium [&_a]:text-brand [&_a]:hover:underline [&_h3]:font-display [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-foreground [&_li]:ml-4 [&_ol]:list-decimal [&_ol]:space-y-2 [&_p+p]:mt-4 [&_ul]:list-disc [&_ul]:space-y-2">
              {content}
            </div>

            <footer className="mt-12 flex flex-wrap gap-4 border-t border-border-soft pt-8 text-sm">
              <Link href="/help" className="font-medium text-brand hover:underline">
                ← Back to Help Centre
              </Link>
              <Link href="/contact" className="font-medium text-brand hover:underline">
                Contact support
              </Link>
            </footer>
          </article>
        </Container>
      </section>
    </>
  );
}

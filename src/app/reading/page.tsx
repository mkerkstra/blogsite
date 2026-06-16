import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import { SocialMeta } from "@/components/social-meta";
import { bookLink, reading, type Book, type ReadingShelf } from "@/features/reading/data/reading";
import { SectionLabel } from "@/features/resume/components/section-label";
import { buildPageSchema } from "@/lib/seo-schema";

const DESCRIPTION =
  "Books Matt Kerkstra keeps reaching for: engineering, sci-fi, and the slow-moving stack.";

export const metadata: Metadata = {
  title: "Reading",
  description: DESCRIPTION,
  alternates: { canonical: "/reading" },
};

export const revalidate = 86400;

const books = reading.flatMap((shelf) => shelf.books);

function BookRow({ book }: { book: Book }) {
  return (
    <div className="grid grid-cols-1 gap-2 border-t border-border py-4 md:grid-cols-[7rem_1fr] md:gap-8">
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground md:text-right">
        {book.year ?? ""}
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex items-baseline gap-2 text-[15px] leading-snug">
          <a
            href={bookLink(book)}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground no-underline transition-colors hover:text-accent"
          >
            {book.title}
          </a>
          <span className="text-muted-foreground">· {book.author}</span>
        </div>
        {book.note ? (
          <p className="text-[12.5px] leading-relaxed text-muted-foreground">{book.note}</p>
        ) : null}
      </div>
    </div>
  );
}

function Shelf({ shelf, index }: { shelf: ReadingShelf; index: string }) {
  return (
    <section id={shelf.id} className="reveal flex flex-col gap-4 scroll-mt-20">
      <SectionLabel index={index}>{shelf.label}</SectionLabel>
      {shelf.blurb ? (
        <p className="text-[13px] leading-relaxed text-muted-foreground">{shelf.blurb}</p>
      ) : null}
      <div className="flex flex-col">
        {shelf.books.map((book) => (
          <BookRow key={book.title} book={book} />
        ))}
      </div>
    </section>
  );
}

export default function ReadingPage() {
  return (
    <div className="flex flex-col gap-12" style={{ viewTransitionName: "page-body" }}>
      <SocialMeta
        title="Reading · kerkstra.dev"
        description={DESCRIPTION}
        url="/reading"
        type="website"
      />
      <JsonLd
        data={buildPageSchema({
          name: "Reading",
          description: DESCRIPTION,
          path: "/reading",
          type: "CollectionPage",
          extra: {
            mainEntity: {
              "@type": "ItemList",
              itemListElement: books.map((book, index) => ({
                "@type": "ListItem",
                position: index + 1,
                item: {
                  "@type": "Book",
                  name: book.title,
                  author: book.author,
                  ...(book.year ? { datePublished: String(book.year) } : {}),
                  url: bookLink(book),
                },
              })),
            },
          },
          breadcrumbs: [
            { name: "Home", path: "/" },
            { name: "Reading", path: "/reading" },
          ],
        })}
      />
      <header className="reveal flex flex-col gap-3">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Reading" }]} />
        <h1
          className="display-name font-display text-[clamp(2.5rem,8vw,4.5rem)] font-normal italic leading-[0.92] tracking-tight text-foreground"
          style={{ viewTransitionName: "display-heading" }}
        >
          books I keep reaching for.
        </h1>
      </header>
      {reading.map((shelf, i) => (
        <Shelf key={shelf.id} shelf={shelf} index={String(i + 1).padStart(2, "0")} />
      ))}
    </div>
  );
}

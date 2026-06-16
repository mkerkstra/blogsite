import { Breadcrumbs } from "@/components/breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import { SocialMeta } from "@/components/social-meta";

import { buildLabSchema, findExperiment } from "@/features/lab/lib/lab-schema";

/**
 * Per-lab head content, rendered in-tree (server component):
 *  - og:* tags via <SocialMeta> (no twitter — see social-meta.tsx)
 *  - CreativeWork + BreadcrumbList JSON-LD via <JsonLd>
 *
 * Driven by slug; title/description/section come from the experiments
 * registry so a lab page only needs `<LabHead slug="..." />`. The OG
 * image is the dark preview already generated under public/lab-previews.
 */
export function LabHead({
  slug,
  rendersOwnHeading = false,
}: {
  slug: string;
  rendersOwnHeading?: boolean;
}) {
  const exp = findExperiment(slug);
  const schema = buildLabSchema(slug);

  return (
    <>
      {exp ? (
        <>
          <SocialMeta
            title={`${exp.title} · kerkstra.dev`}
            description={exp.description}
            url={`/lab/${slug}`}
            image={`/lab-previews/${slug}.dark.png`}
            type="article"
          />
          <div className="fixed left-5 top-16 z-10 hidden md:left-8 md:block">
            <Breadcrumbs
              items={[
                { label: "Home", href: "/" },
                { label: "Lab", href: "/lab" },
                { label: exp.title },
              ]}
            />
          </div>
          {!rendersOwnHeading && <h1 className="sr-only">{exp.title}</h1>}
        </>
      ) : null}
      {schema ? <JsonLd data={schema} /> : null}
    </>
  );
}

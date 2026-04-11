/**
 * JSON-LD Person schema generator. Renders a schema.org Person record
 * with current employer, alumni, contact info, and known skills.
 *
 * Built from the same data files as the rest of the site so it stays
 * in sync. Embedded in the homepage as a <script type="application/ld+json">
 * tag for Google rich-results / knowledge graph.
 *
 * Reference: https://schema.org/Person
 */
import { aboutMe } from "../data/about-me";
import { education } from "../data/education";
import { experience } from "../data/experience";
import { toolbox } from "../data/toolbox";

const SITE_URL = "https://www.kerkstra.dev";

export function buildPersonSchema(): Record<string, unknown> {
  const currentJob = experience.find((j) => !j.role.time.end) ?? experience[0];
  if (!currentJob) {
    throw new Error("buildPersonSchema: experience data is empty");
  }
  const primaryEducation = education[0];
  // Flatten all toolbox tools as `knowsAbout` keywords.
  const knowsAbout = toolbox.flatMap((g) => g.tools.map((t) => t.name));
  const [city, region] = aboutMe.location.split(",").map((s) => s.trim());

  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: aboutMe.name,
    url: SITE_URL,
    image: `${SITE_URL}/profilePic.jpg`,
    jobTitle: currentJob.role.title,
    description: aboutMe.blurb,
    email: `mailto:${aboutMe.contact.email}`,
    telephone: aboutMe.contact.phone,
    address: {
      "@type": "PostalAddress",
      addressLocality: city,
      addressRegion: region,
      addressCountry: "US",
    },
    sameAs: [aboutMe.contact.githubUrl, aboutMe.contact.linkedinUrl],
    worksFor: {
      "@type": "Organization",
      name: currentJob.company.name,
      url: currentJob.company.link,
      description: currentJob.company.blurb,
    },
    ...(primaryEducation
      ? {
          alumniOf: {
            "@type": "CollegeOrUniversity",
            name: primaryEducation.school,
            url: primaryEducation.schoolUrl,
          },
        }
      : {}),
    knowsAbout,
  };
}

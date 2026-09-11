import { aboutMe } from "@/features/resume/data/about-me";
import { aiPositioning } from "@/features/resume/data/positioning";

export const dynamic = "force-static";

export async function GET() {
  const roles = aiPositioning.targetRoleFamilies
    .map((role) => `- ${role.title}: ${role.rationale}`)
    .join("\n");
  const evidence = aiPositioning.evidence
    .map((item) => `- ${item.label}: ${item.proof}`)
    .join("\n");
  const boundaries = aiPositioning.boundaries.map((item) => `- ${item}`).join("\n");

  const body = `# ${aboutMe.name}\n\n> ${aboutMe.blurb}\n\n## Canonical pages\n\n- [Resume](https://www.kerkstra.dev/)\n- [AI engineer profile](https://www.kerkstra.dev/ai-engineer)\n- [Resume PDF](https://www.kerkstra.dev/resume.pdf)\n- [Machine-readable resume](https://www.kerkstra.dev/api/resume.json)\n- [Machine-readable AI profile](https://www.kerkstra.dev/api/ai-profile.json)\n\n## Target roles\n\n${roles}\n\n## Evidence\n\n${evidence}\n\n## Boundaries\n\n${boundaries}\n`;

  return new Response(body, {
    headers: {
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}

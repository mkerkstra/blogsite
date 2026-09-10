import { NextResponse } from "next/server";

import { aboutMe } from "@/features/resume/data/about-me";
import { aiPositioning } from "@/features/resume/data/positioning";

export const dynamic = "force-static";
export const revalidate = 86400;

export async function GET() {
  return NextResponse.json(
    {
      name: aboutMe.name,
      headline: aboutMe.title,
      summary: aboutMe.blurb,
      canonicalProfile: "https://www.kerkstra.dev/ai-engineer",
      resume: "https://www.kerkstra.dev/resume.pdf",
      machineReadableResume: "https://www.kerkstra.dev/api/resume.json",
      ...aiPositioning,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
        "X-Robots-Tag": "noindex",
      },
    },
  );
}

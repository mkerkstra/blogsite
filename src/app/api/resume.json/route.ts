/**
 * Machine-readable resume in jsonresume schema v1.0.0.
 * https://jsonresume.org/schema/
 *
 * Built from the same data files as the web and PDF — single source
 * of truth. Cached at the edge.
 */
import { NextResponse } from "next/server";

import { aboutMe } from "@/features/resume/data/about-me";
import { education } from "@/features/resume/data/education";
import { experience } from "@/features/resume/data/experience";
import { projects } from "@/features/resume/data/projects";
import { toolbox } from "@/features/resume/data/toolbox";

export const dynamic = "force-static";
export const revalidate = 86400;

function stripBold(s: string): string {
  return s.replace(/\*\*([^*]+)\*\*/g, "$1");
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function GET() {
  const body = {
    $schema: "https://raw.githubusercontent.com/jsonresume/resume-schema/v1.0.0/schema.json",
    basics: {
      name: aboutMe.name,
      label: "Software Engineer",
      email: aboutMe.contact.email,
      phone: aboutMe.contact.phone,
      url: "https://www.kerkstra.dev",
      summary: aboutMe.blurb,
      location: {
        city: aboutMe.location.split(",")[0]?.trim(),
        region: aboutMe.location.split(",")[1]?.trim(),
        countryCode: "US",
      },
      profiles: [
        {
          network: "GitHub",
          username: "mkerkstra",
          url: aboutMe.contact.githubUrl,
        },
        {
          network: "LinkedIn",
          username: "matt-kerkstra",
          url: aboutMe.contact.linkedinUrl,
        },
      ],
    },
    work: experience.map((job) => ({
      name: job.company.name,
      position: job.role.title,
      url: job.company.link,
      startDate: isoDate(job.role.time.start),
      ...(job.role.time.end ? { endDate: isoDate(job.role.time.end) } : {}),
      summary: job.role.overview ?? job.company.blurb,
      highlights: job.highlights.map(stripBold),
      location: job.role.location,
    })),
    education: education.map((row) => ({
      institution: row.school,
      url: row.schoolUrl,
      area: "",
      studyType: row.degree,
      endDate: `${row.year}-05`,
      ...(row.gpa ? { score: row.gpa.toString() } : {}),
    })),
    projects: projects.map((project) => ({
      name: project.name,
      description: project.blurb,
      url: project.href,
      keywords: project.role
        .split(/[·,]/)
        .map((s) => s.trim())
        .filter(Boolean),
    })),
    skills: toolbox.map((group) => ({
      name: group.label,
      keywords: group.tools.map((t) => t.name),
    })),
    meta: {
      canonical: "https://www.kerkstra.dev/api/resume.json",
      version: "v1.0.0",
      lastModified: new Date().toISOString(),
    },
  };

  return NextResponse.json(body, {
    headers: {
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}

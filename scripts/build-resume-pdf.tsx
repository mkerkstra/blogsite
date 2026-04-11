/**
 * Build-time script — renders the resume data files into a printable
 * single-page PDF written to public/resume.pdf. Mirrors the layout of
 * ~/projects/videa/resume.html (cream paper, ink text, italic Times
 * accents on bold Helvetica). Uses built-in PDF fonts so no font
 * registration is needed.
 *
 * Run with `pnpm build:pdf`. Wired into `pnpm build`.
 */
import { Document, Page, StyleSheet, Text, View, renderToFile } from "@react-pdf/renderer";
import * as path from "node:path";
import * as React from "react";

import { aboutMe } from "../src/features/resume/data/about-me";
import { education } from "../src/features/resume/data/education";
import { experience } from "../src/features/resume/data/experience";
import { projects } from "../src/features/resume/data/projects";
import { toolbox } from "../src/features/resume/data/toolbox";
import { formatMonthYearUpper } from "../src/features/resume/lib/dates";
import { clean, splitLede, splitName } from "./lib/pdf-text";

const COLORS = {
  paper: "#fafaf7",
  ink: "#0a0908",
  body: "#1c1b18",
  dim: "#5c5a52",
  rule: "#c9c5b3",
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: COLORS.paper,
    paddingTop: 32,
    paddingBottom: 28,
    paddingHorizontal: 47,
    fontFamily: "Helvetica",
    fontSize: 8,
    color: COLORS.body,
    lineHeight: 1.45,
  },

  // ── Header ──
  header: {
    paddingBottom: 8,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.ink,
    borderBottomStyle: "solid",
  },
  nameRow: {
    height: 28,
    marginBottom: 8,
  },
  nameLine: {
    fontSize: 24,
    lineHeight: 1.1,
    color: COLORS.ink,
  },
  nameFirst: {
    fontFamily: "Helvetica-Bold",
    fontSize: 24,
    color: COLORS.ink,
    letterSpacing: -0.6,
  },
  nameLast: {
    fontFamily: "Times-Italic",
    fontSize: 24,
    color: COLORS.ink,
    letterSpacing: -0.4,
  },
  contact: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 0,
    fontFamily: "Courier",
    fontSize: 6.5,
    color: COLORS.dim,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  contactItem: {
    marginRight: 14,
  },

  // ── Section header ──
  section: {
    marginBottom: 10,
  },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 5,
  },
  sectionLabel: {
    fontFamily: "Courier-Bold",
    fontSize: 6,
    color: COLORS.ink,
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  sectionRule: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.rule,
  },

  // ── Summary ──
  summaryWrap: {},
  summary: {
    fontSize: 8.4,
    color: COLORS.body,
    lineHeight: 1.5,
  },
  summaryLede: {
    fontFamily: "Times-Italic",
    fontSize: 9,
    color: COLORS.ink,
  },

  // ── Skills grid ──
  skills: {
    flexDirection: "column",
    gap: 2,
  },
  skillRow: {
    flexDirection: "row",
    gap: 12,
  },
  skillLabel: {
    width: 76,
    fontFamily: "Courier-Bold",
    fontSize: 5.8,
    color: COLORS.dim,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    paddingTop: 1.5,
  },
  skillValue: {
    flex: 1,
    fontFamily: "Helvetica",
    fontSize: 7.6,
    color: COLORS.body,
    lineHeight: 1.4,
  },

  // ── Job ──
  job: {
    marginBottom: 6,
  },
  jobHead: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 1,
  },
  jobRole: {
    flex: 1,
    fontSize: 8.5,
    color: COLORS.ink,
    fontFamily: "Helvetica-Bold",
  },
  jobAt: {
    fontFamily: "Times-Italic",
    fontSize: 8.5,
    fontWeight: "normal",
    color: COLORS.dim,
  },
  jobCompany: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
    color: COLORS.ink,
  },
  jobLoc: {
    fontFamily: "Helvetica",
    fontSize: 8.5,
    color: COLORS.body,
    fontWeight: "normal",
  },
  jobDates: {
    fontFamily: "Courier",
    fontSize: 6.5,
    color: COLORS.dim,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  jobTagline: {
    fontFamily: "Times-Italic",
    fontSize: 7.8,
    color: COLORS.dim,
    marginBottom: 3,
  },
  jobBullets: {
    flexDirection: "column",
    gap: 1.5,
    marginTop: 1,
  },
  bullet: {
    flexDirection: "row",
    gap: 6,
  },
  bulletDash: {
    fontFamily: "Helvetica",
    fontSize: 7.6,
    color: COLORS.ink,
    paddingTop: 1,
  },
  bulletText: {
    flex: 1,
    fontFamily: "Helvetica",
    fontSize: 7.6,
    color: COLORS.body,
    lineHeight: 1.42,
  },
  bulletBold: {
    fontFamily: "Helvetica-Bold",
    color: COLORS.ink,
  },

  // ── Projects ──
  project: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    gap: 10,
    marginBottom: 2,
  },
  projectName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
    color: COLORS.ink,
  },
  projectAt: {
    fontFamily: "Times-Italic",
    fontSize: 8.5,
    color: COLORS.dim,
  },
  projectUrl: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
    color: COLORS.ink,
  },
  projectMeta: {
    fontFamily: "Helvetica",
    fontSize: 8.5,
    color: COLORS.body,
  },
  projectRole: {
    fontFamily: "Courier",
    fontSize: 6.5,
    color: COLORS.dim,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  projectBlurb: {
    fontFamily: "Helvetica",
    fontSize: 7.6,
    color: COLORS.body,
    lineHeight: 1.42,
    marginLeft: 0,
    marginBottom: 4,
  },

  // ── Education ──
  edRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    fontSize: 8.2,
  },
  edSchool: {
    fontFamily: "Helvetica-Bold",
    color: COLORS.ink,
  },
  edDegree: {
    fontFamily: "Helvetica",
    color: COLORS.body,
    marginLeft: 4,
  },
  edEmDash: {
    fontFamily: "Times-Italic",
    color: COLORS.dim,
    marginHorizontal: 4,
  },
  edMeta: {
    fontFamily: "Courier",
    fontSize: 6.5,
    color: COLORS.dim,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
});

/**
 * Render a highlight string with **bold** spans → <Text> with bold style.
 * Stays local to the PDF renderer because it outputs react-pdf <Text>
 * nodes; the web equivalent is renderBold() in
 * src/features/resume/lib/render-bold.tsx and outputs DOM spans.
 */
function renderBullet(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <Text key={i} style={styles.bulletBold}>
          {clean(part.slice(2, -2))}
        </Text>
      );
    }
    return <Text key={i}>{clean(part)}</Text>;
  });
}

const SKILL_GROUPS = toolbox.map((g) => ({
  label: g.label,
  list: g.tools.map((t) => clean(t.name)).join(", "),
}));

function ResumeDocument() {
  const [first, last] = splitName(aboutMe.name);

  // Split summary into lede + rest. The lede is the first sentence,
  // rendered italic Times to match videa/resume.html.
  const [lede, rest] = splitLede(aboutMe.blurb);

  return (
    <Document title="Matt Kerkstra — Resume" author={aboutMe.name} subject="Resume">
      <Page size="LETTER" style={styles.page}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.nameRow}>
            <Text style={styles.nameLine}>
              <Text style={styles.nameFirst}>{first}</Text>
              <Text> </Text>
              <Text style={styles.nameLast}>{last}</Text>
            </Text>
          </View>
          <View style={styles.contact}>
            <Text style={styles.contactItem}>{clean(aboutMe.location)}</Text>
            <Text style={styles.contactItem}>{aboutMe.contact.phone}</Text>
            <Text style={styles.contactItem}>{aboutMe.contact.email}</Text>
            <Text style={styles.contactItem}>{aboutMe.contact.github}</Text>
            <Text style={styles.contactItem}>{aboutMe.contact.linkedin}</Text>
          </View>
        </View>

        {/* ── Summary ── */}
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionLabel}>Summary</Text>
            <View style={styles.sectionRule} />
          </View>
          <Text style={styles.summary}>
            <Text style={styles.summaryLede}>{clean(lede)}</Text>
            {rest ? ` ${clean(rest)}` : ""}
          </Text>
        </View>

        {/* ── Core Skills ── */}
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionLabel}>Core Skills</Text>
            <View style={styles.sectionRule} />
          </View>
          <View style={styles.skills}>
            {SKILL_GROUPS.map((group) => (
              <View key={group.label} style={styles.skillRow}>
                <Text style={styles.skillLabel}>{group.label}</Text>
                <Text style={styles.skillValue}>{group.list}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Experience ── */}
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionLabel}>Experience</Text>
            <View style={styles.sectionRule} />
          </View>
          {experience.map((job) => {
            const start = job.role.time.start;
            const end = job.role.time.end;
            const dateStr = `${formatMonthYearUpper(start)} - ${
              end ? formatMonthYearUpper(end) : "PRESENT"
            }`;
            return (
              <View key={job.company.name} style={styles.job} wrap={false}>
                <View style={styles.jobHead}>
                  <Text style={styles.jobRole}>
                    {clean(job.role.title)} <Text style={styles.jobAt}>at</Text>{" "}
                    <Text style={styles.jobCompany}>{clean(job.company.name)}</Text>
                    <Text style={styles.jobLoc}> · {clean(job.role.location)}</Text>
                  </Text>
                  <Text style={styles.jobDates}>{dateStr}</Text>
                </View>
                {job.role.overview ? (
                  <Text style={styles.jobTagline}>{clean(job.role.overview)}</Text>
                ) : null}
                <View style={styles.jobBullets}>
                  {job.highlights.map((h) => (
                    <View key={h.text} style={styles.bullet}>
                      <Text style={styles.bulletDash}>−</Text>
                      <Text style={styles.bulletText}>{renderBullet(h.text)}</Text>
                    </View>
                  ))}
                </View>
              </View>
            );
          })}
        </View>

        {/* ── Side Projects ── */}
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionLabel}>Side Projects</Text>
            <View style={styles.sectionRule} />
          </View>
          {projects.map((project) => (
            <View key={project.name} wrap={false}>
              <View style={styles.project}>
                <Text style={styles.projectName}>
                  {clean(project.name)} <Text style={styles.projectAt}>at</Text>{" "}
                  <Text style={styles.projectUrl}>{clean(project.url)}</Text>
                  <Text style={styles.projectMeta}> · {clean(project.blurb)}</Text>
                </Text>
                <Text style={styles.projectRole}>{clean(project.role)}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── Education ── */}
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionLabel}>Education</Text>
            <View style={styles.sectionRule} />
          </View>
          {education.map((row) => (
            <View key={row.school} style={styles.edRow}>
              <Text>
                <Text style={styles.edSchool}>{clean(row.school)}</Text>
                <Text style={styles.edEmDash}> — </Text>
                <Text style={styles.edDegree}>{row.degree}</Text>
              </Text>
              <Text style={styles.edMeta}>
                {row.year}
                {row.gpa ? ` · GPA ${row.gpa}` : ""}
              </Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
}

const outputPath = path.resolve(process.cwd(), "public/resume.pdf");

renderToFile(<ResumeDocument />, outputPath)
  .then(() => {
    console.log(`✓ resume.pdf written to ${outputPath}`);
  })
  .catch((err) => {
    console.error("× failed to render resume.pdf:", err);
    process.exit(1);
  });

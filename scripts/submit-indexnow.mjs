#!/usr/bin/env node

import { readFile } from "node:fs/promises";

import { absoluteUrlsForChangedFiles } from "./lib/indexnow-url-mapper.mjs";

const siteUrl = process.env.SITE_URL ?? "https://www.kerkstra.dev";
const sitemapUrl = process.env.SITEMAP_URL ?? `${siteUrl}/sitemap.xml`;
const indexNowEndpoint = process.env.INDEXNOW_ENDPOINT ?? "https://api.indexnow.org/indexnow";
const key = process.env.INDEXNOW_KEY ?? "b0767cf79c5547c7a2d5853ebbb9c16e";
const keyFile = process.env.INDEXNOW_KEY_FILE ?? `public/${key}.txt`;
const dryRun = process.env.INDEXNOW_DRY_RUN === "1";

function hostFromUrl(url) {
  return new URL(url).host;
}

function keyLocation() {
  return `${siteUrl}/${key}.txt`;
}

function parseSitemap(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) =>
    match[1].replaceAll("&amp;", "&").trim(),
  );
}

function explicitUrls() {
  const value = process.env.INDEXNOW_URLS;
  if (!value) return null;
  return value
    .split(/[,\n]/)
    .map((url) => url.trim())
    .filter(Boolean);
}

function changedFiles() {
  const value = process.env.INDEXNOW_CHANGED_FILES;
  if (!value) return null;
  return value
    .split(/\n/)
    .map((path) => path.trim())
    .filter(Boolean);
}

async function urlList() {
  const explicit = explicitUrls();
  if (explicit) return explicit;

  const changed = changedFiles();
  if (changed) return absoluteUrlsForChangedFiles(changed, siteUrl);

  const response = await fetch(sitemapUrl);
  if (!response.ok) {
    throw new Error(
      `Unable to fetch sitemap ${sitemapUrl}: ${response.status} ${response.statusText}`,
    );
  }
  return parseSitemap(await response.text());
}

async function assertKeyFile() {
  const contents = (await readFile(keyFile, "utf8")).trim();
  if (contents !== key) {
    throw new Error(`${keyFile} does not match INDEXNOW_KEY`);
  }
}

async function submit(urls) {
  if (urls.length === 0) {
    console.log("No URLs to submit to IndexNow.");
    return;
  }

  const body = {
    host: hostFromUrl(siteUrl),
    key,
    keyLocation: keyLocation(),
    urlList: urls,
  };

  if (dryRun) {
    console.log(JSON.stringify(body, null, 2));
    return;
  }

  const response = await fetch(indexNowEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  });

  if (!response.ok && response.status !== 202) {
    const text = await response.text();
    throw new Error(
      `IndexNow submission failed: ${response.status} ${response.statusText}\n${text}`,
    );
  }

  console.log(
    `Submitted ${urls.length} URL(s) to IndexNow: ${response.status} ${response.statusText}`,
  );
}

await assertKeyFile();
await submit(await urlList());

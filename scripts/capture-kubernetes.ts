/** Capture the Kubernetes tool in both themes, at kiosk level, and on a phone. */
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import puppeteer from "puppeteer-core";
import { launch } from "chrome-launcher";

const base = process.env.TOOLS_PREVIEW_URL ?? "http://localhost:3000";
const chrome = await launch({
  chromeFlags: ["--headless=new", "--hide-scrollbars", "--no-sandbox"],
});
const response = await fetch(`http://127.0.0.1:${chrome.port}/json/version`);
const { webSocketDebuggerUrl } = await response.json();
const browser = await puppeteer.connect({ browserWSEndpoint: webSocketDebuggerUrl });
mkdirSync(resolve("docs/screenshots/kubernetes"), { recursive: true });
mkdirSync(resolve("public/tool-previews"), { recursive: true });
try {
  const page = await browser.newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1 });
  await page.evaluateOnNewDocument(() => localStorage.setItem("theme", "dark"));
  await page.goto(`${base}/tools/kubernetes`, { waitUntil: "networkidle2" });
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
  await page.locator('button[aria-label="Pause simulation"]').click();
  await page.screenshot({ path: resolve("docs/screenshots/kubernetes/campus-dark.png") });
  await page.evaluate(() => document.documentElement.classList.remove("dark"));
  await new Promise((resolve) => setTimeout(resolve, 350));
  await page.screenshot({ path: resolve("docs/screenshots/kubernetes/campus-light.png") });
  await page.evaluate(() => document.documentElement.classList.add("dark"));
  await page.locator('button[aria-label="Take a walk: enter first-person view"]').click();
  await page.screenshot({ path: resolve("docs/screenshots/kubernetes/first-person.png") });
  await page.locator('button[aria-label="Campus map: switch to overview"]').click();
  await page.select("select", "4");
  await page.locator('button[aria-label^="Capacity:"]').click();
  for (let i = 0; i < 5; i++) await page.locator('button[aria-label="Increase Replicas"]').click();
  const step = async () =>
    page.locator('button[aria-label="Step: advance one reconciliation step"]').click();
  await step();
  await step();
  let stats = await page
    .locator('[aria-label="Cluster status"]')
    .map((el) => el.textContent)
    .wait();
  if (!stats?.includes("4/8")) throw new Error(`Expected four of eight ready: ${stats}`);
  await page.screenshot({ path: resolve("docs/screenshots/kubernetes/pending-capacity.png") });
  await page.locator('button[aria-label^="Capacity:"]').click();
  for (let i = 0; i < 5; i++) await step();
  stats = await page
    .locator('[aria-label="Cluster status"]')
    .map((el) => el.textContent)
    .wait();
  if (!stats?.includes("8/8")) throw new Error(`Expected eight ready: ${stats}`);
  await page.select("select", "5");
  await page.locator('button[aria-label^="Istio:"]').click();
  await page.locator('button[aria-label="Send a tea request"]').click();
  await page.screenshot({ path: resolve("docs/screenshots/kubernetes/mesh.png") });
  await page.select("select", "6");
  await page.locator('button[aria-label^="Operator:"]').click();
  await step();
  await step();
  stats = await page
    .locator('[aria-label="Cluster status"]')
    .map((el) => el.textContent)
    .wait();
  if (!stats?.includes("5/5")) throw new Error(`Expected operator to restore five: ${stats}`);
  await page.screenshot({ path: resolve("docs/screenshots/kubernetes/operator.png") });
  await page.locator('button[aria-label="Reset campus"]').click();
  await page.locator('button[aria-label="Pause simulation"]').click();
  for (const theme of ["dark", "light"]) {
    await page.evaluate(
      (theme) => document.documentElement.classList.toggle("dark", theme === "dark"),
      theme,
    );
    await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
    await new Promise((resolve) => setTimeout(resolve, 350));
    await page.screenshot({ path: resolve(`public/tool-previews/kubernetes.${theme}.png`) });
  }
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  await page.evaluate(() => document.documentElement.classList.add("dark"));
  await new Promise((resolve) => setTimeout(resolve, 350));
  await page.screenshot({ path: resolve("docs/screenshots/kubernetes/mobile.png") });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  if (overflow) throw new Error("Mobile page has horizontal overflow");
  await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
  await page.reload({ waitUntil: "networkidle2" });
  await page.locator('button[aria-label="Play simulation"]').wait();
  if (errors.length) throw new Error(errors.join("\n"));
  console.log(
    "Browser checks passed: capacity queue/recovery, operator reconciliation, mobile layout, reduced motion; screenshots captured.",
  );
} finally {
  await browser.close();
  await chrome.kill();
}

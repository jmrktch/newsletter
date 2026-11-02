const fs = require("fs"), path = require("path");
const { pathToFileURL } = require("url");
const { chromium } = require("playwright");

const ROOT = path.join(__dirname, "..");
const OUTPUT = path.join(ROOT, "site", "newsletter", "latest");
const SOURCE_URL = (process.env.NEWSLETTER_SOURCE_URL || "https://jmrktch.github.io/widgets/snapshot-renders/latest").replace(/\/$/, "");
const SOURCE_DIR = process.env.NEWSLETTER_SOURCE_DIR ? path.resolve(process.env.NEWSLETTER_SOURCE_DIR) : null;
const PUBLIC_BASE = (process.env.NEWSLETTER_PUBLIC_BASE || "https://jmrktch.github.io/newsletter/newsletter/latest").replace(/\/$/, "");
const SCANS = ["top-gainers", "top-losers", "gapped-up", "gapped-down", "trading-halt", "52-week-high", "52-week-low", "rsi-oversold", "rsi-overbought"];
const esc = (v) => String(v ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const urlFor = (relative) => SOURCE_DIR ? pathToFileURL(path.join(SOURCE_DIR, relative)).toString() : `${SOURCE_URL}/${relative}`;
const assetPath = (relative) => path.join(OUTPUT, "assets", relative);
const assetUrl = (relative) => `${PUBLIC_BASE}/assets/${relative.replace(/\\/g,"/")}`;

async function capture(locator, target) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const box = await locator.boundingBox();
  if (!box) throw new Error(`Missing capture target: ${target}`);
  await locator.screenshot({ path: target, type: "png", omitBackground: true, animations: "disabled" });
  return { width: Math.round(box.width), height: Math.round(box.height) };
}

async function main() {
  fs.rmSync(OUTPUT, { recursive: true, force: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1200, height: 1200 }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  const manifest = { generatedAt: new Date().toISOString(), source: SOURCE_URL, assets: [] };
  try {
    await page.goto(urlFor("heatmap.html"), { waitUntil: "load" });
    const heatmap = page.locator(".snapshot-heatmap-tiles");
    if (await heatmap.count() !== 1) throw new Error("Published heatmap does not expose exactly one heatmap target.");
    const heatmapFile = assetPath("heatmap.png"), heatmapSize = await capture(heatmap, heatmapFile);
    manifest.assets.push({ kind: "heatmap", file: "assets/heatmap.png", ...heatmapSize });
    const sections = [];
    for (const scan of SCANS) {
      await page.goto(urlFor(`scans/${scan}.html`), { waitUntil: "load" });
      const sparks = page.locator("svg.snapshot-sparkline");
      const count = await sparks.count(), rows = [];
      for (let i = 0; i < count; i++) {
        // Replacing the SVG shrinks the live locator list, so capture the
        // first remaining node on each pass rather than advancing its index.
        const spark = sparks.nth(0);
        const identity = await spark.evaluate((node) => ({ scan: node.dataset.scan, symbol: node.dataset.symbol }));
        if (identity.scan !== scan || !/^[A-Z0-9]{1,12}$/.test(identity.symbol || "")) throw new Error(`Invalid sparkline identity in ${scan}.`);
        const relative = `sparklines/${scan}/${identity.symbol}.png`;
        const size = await capture(spark, assetPath(relative));
        manifest.assets.push({ kind: "sparkline", scan, symbol: identity.symbol, file: `assets/${relative}`, ...size });
        await spark.evaluate((node, src) => { const img=document.createElement("img"); img.src=src; img.alt="Daily sparkline"; img.width=92; img.height=30; img.style.cssText="display:block;border:0;width:92px;height:30px"; node.replaceWith(img); }, assetUrl(relative));
      }
      const section = await page.evaluate(() => ({ title: document.querySelector("h3")?.outerHTML || "", subtitle: document.querySelector("p")?.outerHTML || "", table: document.querySelector("table[role='presentation']")?.outerHTML || "" }));
      if (!section.table) throw new Error(`No scan table found for ${scan}.`);
      sections.push({ scan, count, ...section });
    }
    const body = sections.map((s) => `<tr><td style="padding:14px 12px 0">${s.title}${s.subtitle}${s.table}</td></tr>`).join("");
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Daily Focus</title></head><body style="margin:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center"><table role="presentation" width="640" cellpadding="0" cellspacing="0" style="width:640px;max-width:640px;background:#fff"><tr><td style="padding:18px 12px 8px;text-align:center"><h1 style="margin:0;color:#17212b;font-size:24px">The Daily Focus</h1></td></tr><tr><td style="padding:0 12px"><a href="https://focus.marketech.com.au/#/?uf_action=heatmap"><img src="${assetUrl("heatmap.png")}" alt="Australian Top 200 Heatmap" width="616" style="display:block;width:100%;height:auto;border:0"></a></td></tr>${body}<tr><td style="padding:22px 12px;color:#667481;font-size:11px;line-height:16px;text-align:center">Generated from the latest Marketech Focus market snapshot.</td></tr></table></td></tr></table></body></html>`;
    fs.writeFileSync(path.join(OUTPUT, "index.html"), html);
    fs.writeFileSync(path.join(OUTPUT, "manifest.json"), JSON.stringify({ ...manifest, scans: sections.map(({scan,count})=>({scan,sparklines:count})) }, null, 2)+"\n");
    console.log(JSON.stringify({ ok:true, output:"site/newsletter/latest", heatmap:heatmapSize, sparklines:manifest.assets.filter(a=>a.kind==="sparkline").length },null,2));
  } finally { await context.close(); await browser.close(); }
}
main().catch((e)=>{ console.error(e.stack||e); process.exitCode=1; });

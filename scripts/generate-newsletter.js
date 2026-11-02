const fs = require("fs"), path = require("path");
const { pathToFileURL } = require("url");
const { chromium } = require("playwright");

const ROOT = path.join(__dirname, "..");
const OUTPUT = path.join(ROOT, "site", "newsletter", "latest");
const SOURCE_URL = (process.env.NEWSLETTER_SOURCE_URL || "https://jmrktch.github.io/widgets/snapshot-renders/latest").replace(/\/$/, "");
const SOURCE_DIR = process.env.NEWSLETTER_SOURCE_DIR ? path.resolve(process.env.NEWSLETTER_SOURCE_DIR) : null;
const PUBLIC_BASE = (process.env.NEWSLETTER_PUBLIC_BASE || "https://jmrktch.github.io/newsletter/newsletter/latest").replace(/\/$/, "");
const HEADER_IMAGE = "https://marketech23137.activehosted.com/content/4PzAd/2026/09/08/6ddfa2d5-a304-4e1a-8710-d2f83f5fe0c4.png";
const FOCUS = "https://focus.marketech.com.au/#/";
const SCANS = ["top-gainers", "top-losers", "gapped-up", "gapped-down", "trading-halt", "52-week-high", "52-week-low", "rsi-oversold", "rsi-overbought"];
const esc = (v) => String(v ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const urlFor = (relative) => SOURCE_DIR ? pathToFileURL(path.join(SOURCE_DIR, relative)).toString() : `${SOURCE_URL}/${relative}`;
const assetPath = (relative) => path.join(OUTPUT, "assets", relative);
const assetUrl = (relative) => `${PUBLIC_BASE}/assets/${relative.replace(/\\/g,"/")}`;

function button(label, href, width = 210) {
  return `<div style="margin:10px 0 0;text-align:center"><table role="presentation" align="center" border="0" cellpadding="0" cellspacing="0"><tr><td align="center" valign="middle"><!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${href}" style="height:38px;v-text-anchor:middle;width:${width}px;" arcsize="11%" strokecolor="#FF745F" fillcolor="#FF745F"><w:anchorlock/><center style="color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:bold;">${esc(label)}</center></v:roundrect><![endif]--><!--[if !mso]><!--><a href="${href}" target="_blank" rel="noopener noreferrer" style="background-color:#FF745F;border:1px solid #FF745F;border-radius:4px;color:#ffffff;display:inline-block;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;line-height:18px;padding:9px 21px;text-align:center;text-decoration:none;-webkit-text-size-adjust:none">${esc(label)}</a><!--<![endif]--></td></tr></table></div>`;
}

function formatSnapshotTime(iso) {
  if (!iso) return "Latest published snapshot";
  return new Intl.DateTimeFormat("en-AU", { timeZone:"Australia/Sydney", weekday:"long", day:"numeric", month:"short", year:"numeric", hour:"numeric", minute:"2-digit", hour12:true, timeZoneName:"short" }).format(new Date(iso));
}

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
      const section = await page.evaluate(() => ({
        title: document.querySelector("h3")?.textContent?.trim() || "Market scan",
        subtitle: document.querySelector("p")?.textContent?.trim() || "",
        table: document.querySelector("table[role='presentation']")?.outerHTML || ""
      }));
      if (!section.table) throw new Error(`No scan table found for ${scan}.`);
      sections.push({ scan, count, ...section });
    }
    const sourceManifest = SOURCE_DIR ? path.resolve(SOURCE_DIR, "..", "..", "snapshot", "latest", "manifest.json") : null;
    let snapshotTime = null;
    try {
      if (sourceManifest && fs.existsSync(sourceManifest)) snapshotTime = JSON.parse(fs.readFileSync(sourceManifest, "utf8")).generatedAt;
      else snapshotTime = (await (await fetch("https://jmrktch.github.io/widgets/snapshot/latest/manifest.json")).json()).generatedAt;
    } catch { /* The email remains usable if the optional summary cannot load. */ }
    const timestamp = formatSnapshotTime(snapshotTime);
    const body = sections.map((s) => `<tr><td class="pad" style="padding:10px 28px 14px;background:#ffffff" bgcolor="#ffffff"><h3 style="margin:0 0 7px;color:#111b24;font-size:14px;line-height:20px;font-weight:700">${esc(s.title)}</h3><p style="margin:0 0 7px;color:#667481;font-size:13px;line-height:18px">${esc(s.subtitle)}</p>${s.table}<p style="margin:7px 0 0;text-align:left"><a href="${FOCUS}?uf_action=scan" target="_blank" rel="noopener noreferrer" style="color:#0000EE;font-size:12px;line-height:17px;font-weight:400;font-style:italic;text-decoration:underline">+ more scan results, charts, and filters in Focus</a></p></td></tr>`).join("");
    const heatmapHref = `${FOCUS}?uf_action=heatmap`;
    const html = `<!DOCTYPE html><html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>The Daily Focus</title><style>body{margin:0;color:#17212b;font-family:Arial,Helvetica,sans-serif}table{border-collapse:collapse}@media screen and (max-width:800px){.container{width:100%!important}.pad{padding-left:16px!important;padding-right:16px!important}}</style></head><body bgcolor="#ffffff"><center style="width:100%;background:#ffffff"><table role="presentation" class="container" width="760" align="center" border="0" cellpadding="0" cellspacing="0" style="width:760px;max-width:760px;background:#ffffff;border:0;margin:0 auto"><tr><td class="pad" align="center" style="padding:20px 28px 5px;background:#ffffff;text-align:center"><img class="header-image" width="704" src="${HEADER_IMAGE}" alt="Your Daily Market Snapshot" style="display:block;border:0;width:704px;max-width:704px;height:auto;margin:0 auto"></td></tr><tr><td class="pad" style="padding:0 28px 20px;background:#ffffff;color:#17212b;font-size:11px;line-height:16px;text-align:left"><b>Forwarded this email?</b> <a href="https://focus.marketech.com.au/#/register?redirect=%2F" target="_blank" rel="noopener noreferrer" style="color:#0000EE;text-decoration:underline">Sign up here to receive it daily</a>.</td></tr><tr><td class="pad" align="center" style="padding:0 28px 10px;background:#ffffff;text-align:center"><div style="margin:0;color:#17212b;font-size:13px;line-height:24px;text-align:center">A daily Focus market snapshot—log in or upgrade for live data and full scans</div><div style="font-size:14px;line-height:17px;font-weight:400;padding-bottom:3px"><b><u>${esc(timestamp)}</u></b></div></td></tr><tr><td class="pad" style="padding:0 28px 18px;background:#ffffff"><h3 style="margin:0 0 7px;color:#111b24;font-size:14px;line-height:20px;font-weight:700">ASX Top 200 Heatmap</h3><a href="${heatmapHref}" target="_blank" rel="noopener noreferrer"><img src="${assetUrl("heatmap.png")}" width="704" alt="ASX Top 200 Heatmap" style="display:block;border:0;width:100%;max-width:704px;height:auto;margin:0 auto"></a><p style="margin:7px 0 0;text-align:left"><a href="${heatmapHref}" target="_blank" rel="noopener noreferrer" style="color:#0000EE;font-size:12px;line-height:17px;font-weight:400;font-style:italic;text-decoration:underline">+ live heatmap, filters, &amp; charts in Focus</a></p>${button("Explore Today's ASX Heatmap", heatmapHref, 217)}</td></tr>${body}<tr><td class="pad" style="padding:22px 28px 8px;text-align:center;background:#ffffff">${button("Explore Marketech Focus", FOCUS, 190)}</td></tr><tr><td class="pad" style="padding:18px 26px;color:#7d8893;font-size:11px;line-height:17px;text-align:center;background:#ffffff">Content generated at ${esc(timestamp)} by Marketech Online Trading Pty Ltd (ACN 654 674 432), Authorised Representative (1293528) of Sanlam Private Wealth Pty Ltd (AFSL 337927). This content includes third-party information and/or analysis generated using mathematical models. The content has been prepared for general information purposes only and does not consider your objectives, financial situation, or needs. Before making any investment decisions, consider its appropriateness and seek professional advice where needed. Model outputs have limitations and do not guarantee future results. Investing involves risk, including loss of capital. Past performance is not a reliable indicator of future performance. Refer to our <a href="https://marketech.com.au/terms-and-conditions/" target="_blank" rel="noopener noreferrer" style="color:#0000EE;text-decoration:underline">Terms and Conditions</a> for more information. <strong>Data provided by TMX Australia Exchange.</strong></td></tr></table></center></body></html>`;
    const emailBytes = Buffer.byteLength(html, "utf8");
    if (emailBytes > 100000) throw new Error(`Email HTML is ${emailBytes.toLocaleString()} bytes; it must remain below 100 KB.`);
    fs.writeFileSync(path.join(OUTPUT, "index.html"), html);
    fs.writeFileSync(path.join(OUTPUT, "manifest.json"), JSON.stringify({ ...manifest, sourceGeneratedAt: snapshotTime, emailBytes, scans: sections.map(({scan,count})=>({scan,sparklines:count})) }, null, 2)+"\n");
    console.log(JSON.stringify({ ok:true, output:"site/newsletter/latest", heatmap:heatmapSize, sparklines:manifest.assets.filter(a=>a.kind==="sparkline").length, emailBytes },null,2));
  } finally { await context.close(); await browser.close(); }
}
main().catch((e)=>{ console.error(e.stack||e); process.exitCode=1; });

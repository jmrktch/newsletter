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

function usualEmailFooter() {
  const appStore = "https://ac.marketech.com.au/lt.php?x=4DZy~GE3UFHK55B7yd~NhhRt2H_RjdEiles0XnjGV6agDXN9zEy7wODiCqtkygAhxTYw08QGWqUK5w4_MN34iV5w2XzzjdT3nuVAYnTJJk";
  const playStore = "https://ac.marketech.com.au/lt.php?x=4DZy~GE3UFHK55B7yd~NhhRt2H_RjdEiles0XnjGV6agDXN9zEy7wODiCqtkygAhxTYw08QGWqUK5w4_MN34iV5w2XzzjdT3nuVAYnTJJ0";
  return `<tr><td class="pad" style="padding:0 28px 6px;background:#ffffff" bgcolor="#ffffff"><table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0"><tr><td height="1" bgcolor="#0b3861" style="height:1px;line-height:1px;background:#0b3861;font-size:0">&nbsp;</td></tr></table></td></tr>
<tr><td style="padding:40px 50px 15px;background:#f2f2f2;text-align:center;color:#555555;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:17px" bgcolor="#f2f2f2">Download the Marketech Focus app:</td></tr>
<tr><td style="padding:5px 50px 20px;background:#f2f2f2" bgcolor="#f2f2f2"><table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0"><tr><td width="50%" align="right" style="padding-right:10px"><a href="${appStore}" target="_blank" rel="noopener noreferrer"><img src="https://marketech23137.img-us10.com/public//4fe0acf2a9d5150806fce656dbac3daa.png?r=1188656793" alt="App Store" width="120" style="display:block;border:0;width:120px;height:auto"></a></td><td width="50%" align="left" style="padding-left:10px"><a href="${playStore}" target="_blank" rel="noopener noreferrer"><img src="https://marketech23137.img-us10.com/public//4f9ce0ff0e0d5b91fd7838438dd40138.png?r=1982256529" alt="Play Store" width="115" style="display:block;border:0;width:115px;height:auto"></a></td></tr></table></td></tr>
<tr><td style="padding:0 26px 20px;background:#f2f2f2;text-align:center;color:#555555;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px" bgcolor="#f2f2f2"><a href="${appStore}" target="_blank" rel="noopener noreferrer" style="color:#000000;text-decoration:underline">Download on the App Store</a><br><a href="${playStore}" target="_blank" rel="noopener noreferrer" style="color:#000000;text-decoration:underline">Get it on Google Play</a><br><br><a href="https://marketech.com.au/financial-services-guide/" target="_blank" rel="noopener noreferrer" style="color:#000000;text-decoration:underline">Financial Services Guide</a>&nbsp; |&nbsp; <a href="https://marketech.com.au/terms-and-conditions/" target="_blank" rel="noopener noreferrer" style="color:#000000;text-decoration:underline">Terms &amp; Conditions</a><br><br>© 2026 Marketech Online Trading Pty Ltd (ACN 654 674 432)<br>Authorised Representative (1293528) of Sanlam Private Wealth Pty Ltd (AFSL 337927)<br><br><a href="https://marketech.com.au" target="_blank" rel="noopener noreferrer" style="color:#000000;text-decoration:underline;font-weight:700">marketech.com.au</a></td></tr>
<tr><td style="padding:20px 28px;background:#ffffff" bgcolor="#ffffff"><table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0"><tr><td width="50%" align="left" valign="middle"><a href="https://marketech.com.au" target="_blank" rel="noopener noreferrer"><img src="https://marketech23137.activehosted.com/cdn-cgi/image/fit=scale-down,width=650,dpr=2,format=auto,onerror=redirect/content/4PzAd/2026/05/14/7c80cc9d-ddff-463f-ba98-b8665e93829c.png?r=1360625741" alt="Marketech" width="200" style="display:block;border:0;width:200px;max-width:100%;height:auto"></a></td><td width="50%" align="right" valign="middle"><a href="https://x.com/marketechau" target="_blank" rel="noopener noreferrer"><img src="https://ac-marketech-com-au.img-us3.com/_social_/flat-dark-round-x.png" alt="X" width="30" style="display:inline-block;border:0;width:30px"></a>&nbsp;&nbsp;<a href="https://www.linkedin.com/company/marketech-au" target="_blank" rel="noopener noreferrer"><img src="https://ac-marketech-com-au.img-us3.com/_social_/flat-dark-round-linkedin.png" alt="LinkedIn" width="30" style="display:inline-block;border:0;width:30px"></a>&nbsp;&nbsp;<a href="https://marketech.com.au" target="_blank" rel="noopener noreferrer"><img src="https://ac-marketech-com-au.img-us3.com/_social_/flat-dark-round-website.png" alt="Website" width="30" style="display:inline-block;border:0;width:30px"></a>&nbsp;&nbsp;<a href="mailto:support@marketech.com.au"><img src="https://ac-marketech-com-au.img-us3.com/_social_/flat-dark-round-email.png" alt="Email" width="30" style="display:inline-block;border:0;width:30px"></a></td></tr></table></td></tr>`;
}

function reorderedUsualEmailFooter() {
  const footer = usualEmailFooter();
  const dividerEnd = footer.indexOf("\n") + 1;
  const brandStart = footer.lastIndexOf('<tr><td style="padding:20px 28px;background:#ffffff"');
  if (dividerEnd < 1 || brandStart < dividerEnd) throw new Error("Standard email footer structure is invalid.");
  const brandRow = footer.slice(brandStart).replace('padding:20px 28px;background:#ffffff', 'padding:10px 28px 20px;background:#ffffff');
  // Logo/socials first; omit the now-unneeded navy divider.
  return `${brandRow}${footer.slice(dividerEnd, brandStart)}`;
}

function formatSnapshotTime(iso) {
  if (!iso) return "Latest published snapshot";
  return new Intl.DateTimeFormat("en-AU", { timeZone:"Australia/Sydney", weekday:"long", day:"numeric", month:"short", year:"numeric", hour:"numeric", minute:"2-digit", hour12:true, timeZoneName:"short" }).format(new Date(iso));
}

async function capture(page, locator, target) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  // `omitBackground` alone cannot overcome the source pages' white body.
  // Make only the document canvas transparent: coloured heatmap tiles and
  // sparkline strokes remain intact, while their surrounding PNG pixels do
  // not become a fixed white rectangle in a dark-mode email client.
  await locator.evaluate(() => {
    let style = document.getElementById("newsletter-transparent-capture-canvas");
    if (!style) {
      style = document.createElement("style");
      style.id = "newsletter-transparent-capture-canvas";
      style.textContent = "html,body,*[bgcolor='#ffffff'],*[style*='background:#ffffff'],*[style*='background:#fff']{background:transparent!important}";
      document.head.appendChild(style);
    }
  });
  const box = await locator.boundingBox();
  if (!box) throw new Error(`Missing capture target: ${target}`);
  // Page screenshots honour omitBackground consistently; locator screenshots
  // can flatten the page canvas before the option is applied.
  await page.screenshot({ path: target, type: "png", omitBackground: true, animations: "disabled", clip: box });
  return { width: Math.round(box.width), height: Math.round(box.height) };
}

async function readPanel(page, relative, mode = "", manifest = null) {
  await page.goto(urlFor(relative), { waitUntil: "load" });
  if (relative === "dividends.html") {
    const sparks = page.locator("table[role='presentation'] svg.snapshot-sparkline");
    const count = await sparks.count();
    for (let i = 0; i < count; i++) {
      // The locator list shrinks as SVG nodes are replaced.
      const spark = sparks.nth(0);
      const symbol = await spark.evaluate((node) => node.closest("tr")?.querySelector("td")?.textContent?.trim() || "");
      if (!/^[A-Z0-9]{1,12}$/.test(symbol)) throw new Error("Invalid dividend sparkline symbol.");
      const assetRelative = `sparklines/dividends/${symbol}.png`;
      const size = await capture(page, spark, assetPath(assetRelative));
      manifest?.assets.push({ kind: "dividend-sparkline", symbol, file: `assets/${assetRelative}`, ...size });
      await spark.evaluate((node, src) => {
        const image = document.createElement("img");
        image.src = src;
        image.alt = "52-week price chart";
        image.width = 92;
        image.height = 30;
        image.style.cssText = "display:block;border:0;width:92px;height:30px";
        node.replaceWith(image);
      }, assetUrl(assetRelative));
    }
  }
  const panel = await page.evaluate((panelMode) => {
    const table = document.querySelector("table[role='presentation']");
    if (table && panelMode === "media") {
      const safe = (value) => String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
      const rows = [...table.querySelectorAll("tbody > tr")].map((row) => {
        const logo = row.querySelector("img:not([src^='data:'])");
        const divs = row.querySelectorAll("div");
        return { src: logo?.getAttribute("src") || "", alt: logo?.getAttribute("alt") || "", meta: divs[0]?.textContent?.trim() || "", headline: divs[1]?.textContent?.trim() || "" };
      }).filter((row) => row.headline);
      const compactRows = rows.map((row) => `<tr><td width="78" align="center" valign="middle" style="padding:10px 0;border-bottom:1px solid #edf1f5;width:78px;text-align:center">${row.src ? `<img src="${safe(row.src)}" alt="${safe(row.alt)}" width="42" style="display:block;border:0;width:42px;height:auto;margin:0 auto">` : ""}</td><td valign="middle" style="padding:10px 0 10px 10px;border-bottom:1px solid #edf1f5;color:#263442;font-size:12px;line-height:17px"><div style="margin-bottom:4px;color:#697784;font-size:11px;line-height:15px;font-weight:700">${safe(row.meta)}</div><div style="color:#1e2a36;font-size:13px;line-height:18px">${safe(row.headline)}</div></td></tr>`).join("");
      return { title: document.querySelector("h3")?.textContent?.trim() || "Market update", subtitle: "", table: `<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt"><tbody>${compactRows}</tbody></table>` };
    }
    if (table && panelMode === "compact") {
      table.removeAttribute("bgcolor");
      table.setAttribute("cellpadding", "7");
      table.setAttribute("style", "width:100%;border-collapse:collapse;font-size:12px;line-height:17px;mso-table-lspace:0pt;mso-table-rspace:0pt");
      table.querySelectorAll("th").forEach((cell) => {
        cell.removeAttribute("class");
        cell.removeAttribute("bgcolor");
        cell.setAttribute("style", "background:#f1f5f8;color:#5d6b78;font-size:11px;line-height:17px;text-align:left;font-weight:700");
      });
      table.querySelectorAll("td").forEach((cell) => {
        const sourceStyle = cell.getAttribute("style") || "";
        const colour = (sourceStyle.match(/color:\s*(#[0-9a-f]{6})/i) || [])[1];
        cell.removeAttribute("class");
        cell.removeAttribute("align");
        cell.removeAttribute("bgcolor");
        const colourStyle = colour && colour.toLowerCase() !== "#263442" ? `;color:${colour}` : "";
        cell.setAttribute("valign", "middle");
        cell.setAttribute("style", `border-bottom:1px solid #edf1f5${colourStyle}`);
      });
    }
    return {
      title: document.querySelector("h3")?.textContent?.trim() || "Market update",
      subtitle: document.querySelector("p")?.textContent?.trim() || "",
      // The first presentation table is the panel itself. The later one is the
      // source page's disclaimer/footer and deliberately is not included.
      table: table?.outerHTML || ""
    };
  }, mode);
  if (!panel.table) throw new Error(`No content table found for ${relative}.`);
  return panel;
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
    const heatmapIndex = await page.evaluate(() => {
      const heading = document.querySelector("h3");
      const box = heading?.previousElementSibling;
      const lines = box ? [...box.querySelectorAll(":scope > div")] : [];
      return { label: lines[0]?.textContent?.trim() || "", values: lines[1]?.textContent?.trim() || "", color: lines[1] ? getComputedStyle(lines[1]).color : "" };
    });
    const heatmapFile = assetPath("heatmap.png"), heatmapSize = await capture(page, heatmap, heatmapFile);
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
        const size = await capture(page, spark, assetPath(relative));
        manifest.assets.push({ kind: "sparkline", scan, symbol: identity.symbol, file: `assets/${relative}`, ...size });
        await spark.evaluate((node, src) => { const img=document.createElement("img"); img.src=src; img.alt="Daily sparkline"; img.width=92; img.height=30; img.style.cssText="display:block;border:0;width:92px;height:30px"; node.replaceWith(img); }, assetUrl(relative));
      }
      const section = await page.evaluate(() => {
        const table = document.querySelector("table[role='presentation']");
        if (table) {
          // Structural table styles repeat hundreds of times. Keep a compact
          // inline version so Outlook and dark-mode email clients still get
          // deterministic table geometry and positive/negative colouring.
          table.removeAttribute("bgcolor");
          table.setAttribute("cellpadding", "7");
          table.setAttribute("style", "width:100%;border-collapse:collapse;font-size:12px;line-height:17px;mso-table-lspace:0pt;mso-table-rspace:0pt");
          table.querySelectorAll("th").forEach((cell) => {
            cell.removeAttribute("class");
            cell.removeAttribute("bgcolor");
            cell.setAttribute("style", "background:#f1f5f8;color:#5d6b78;font-size:11px;line-height:17px;text-align:left;font-weight:700");
          });
          table.querySelectorAll("td").forEach((cell) => {
            const sourceStyle = cell.getAttribute("style") || "";
            const colour = (sourceStyle.match(/color:\s*(#[0-9a-f]{6})/i) || [])[1];
            cell.removeAttribute("class");
            cell.removeAttribute("align");
            cell.removeAttribute("bgcolor");
            const colourStyle = colour && colour.toLowerCase() !== "#263442" ? `;color:${colour}` : "";
            cell.setAttribute("valign", "middle");
            cell.setAttribute("style", `border-bottom:1px solid #edf1f5${colourStyle}`);
          });
        }
        return {
          title: document.querySelector("h3")?.textContent?.trim() || "Market scan",
          subtitle: document.querySelector("p")?.textContent?.trim() || "",
          table: table?.outerHTML || ""
        };
      });
      if (!section.table) throw new Error(`No scan table found for ${scan}.`);
      sections.push({ scan, count, ...section });
    }
    const media = await readPanel(page, "media.html", "media", manifest);
    const raises = await readPanel(page, "raises.html", "compact", manifest);
    const dividends = await readPanel(page, "dividends.html", "compact", manifest);
    const sourceManifest = SOURCE_DIR ? path.resolve(SOURCE_DIR, "..", "..", "snapshot", "latest", "manifest.json") : null;
    let snapshotTime = null;
    try {
      if (sourceManifest && fs.existsSync(sourceManifest)) snapshotTime = JSON.parse(fs.readFileSync(sourceManifest, "utf8")).generatedAt;
      else snapshotTime = (await (await fetch("https://jmrktch.github.io/widgets/snapshot/latest/manifest.json")).json()).generatedAt;
    } catch { /* The email remains usable if the optional summary cannot load. */ }
    const timestamp = formatSnapshotTime(snapshotTime);
    const scanById = new Map(sections.map((section) => [section.scan, section]));
    const orderedPanels = [
      { ...media, href: `${FOCUS}?uf_action=media`, link: "+ more articles, results, and announcements in Focus", cta: "Browse Today's Media Feed", ctaWidth: 203 },
      scanById.get("top-gainers"),
      { ...scanById.get("top-losers"), cta: "See All Market Movers in Focus", ctaWidth: 238 },
      { ...raises, href: `${FOCUS}?uf_action=raises`, link: "+ past raises, results and more in Focus" },
      { ...dividends, href: `${FOCUS}?uf_action=dividends`, link: "+ more results, dates, and filters in Focus", cta: "Open the Dividend Calendar", ctaWidth: 210 },
      ...["gapped-up", "gapped-down", "52-week-high", "52-week-low", "rsi-oversold", "rsi-overbought"].map((scan) => scan === "gapped-down" ? { ...scanById.get(scan), cta: "See All Market Scans in Focus", ctaWidth: 230 } : scanById.get(scan))
    ];
    const body = orderedPanels.map((panel) => {
      const link = panel.link ?? (panel.scan ? "+ more scan results, charts, and filters in Focus" : "");
      const sourceLink = link ? `<p style="margin:7px 0 0;text-align:left"><a href="${panel.href || `${FOCUS}?uf_action=scan`}" target="_blank" rel="noopener noreferrer" style="color:#0000EE;font-size:12px;line-height:17px;font-weight:400;font-style:italic;text-decoration:underline">${link}</a></p>` : "";
      const orangeCta = panel.cta ? button(panel.cta, panel.href || `${FOCUS}?uf_action=scan`, panel.ctaWidth) : "";
      return `<tr><td class="pad" style="padding:10px 28px 14px;background:#ffffff" bgcolor="#ffffff"><h3 style="margin:0 0 7px;color:#111b24;font-size:14px;line-height:20px;font-weight:700">${esc(panel.title)}</h3>${panel.subtitle ? `<p style="margin:0 0 7px;color:#667481;font-size:13px;line-height:18px">${esc(panel.subtitle)}</p>` : ""}${panel.table}${sourceLink}${orangeCta}</td></tr>`;
    }).join("");
    const heatmapHref = `${FOCUS}?uf_action=heatmap`;
    const html = `<!DOCTYPE html><html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>The Daily Focus</title><style>body{margin:0;color:#17212b;font-family:Arial,Helvetica,sans-serif}table{border-collapse:collapse}@media screen and (max-width:800px){.container{width:100%!important}.pad{padding-left:16px!important;padding-right:16px!important}}</style></head><body bgcolor="#ffffff"><center style="width:100%;background:#ffffff"><table role="presentation" class="container" width="760" align="center" border="0" cellpadding="0" cellspacing="0" style="width:760px;max-width:760px;background:#ffffff;border:0;margin:0 auto"><tr><td class="pad" align="center" style="padding:20px 28px 5px;background:#ffffff;text-align:center"><img class="header-image" width="704" src="${HEADER_IMAGE}" alt="Your Daily Market Snapshot" style="display:block;border:0;width:704px;max-width:704px;height:auto;margin:0 auto"></td></tr><tr><td class="pad" style="padding:0 28px 20px;background:#ffffff;color:#17212b;font-size:11px;line-height:16px;text-align:left"><b>Forwarded this email?</b> <a href="https://focus.marketech.com.au/#/register?redirect=%2F" target="_blank" rel="noopener noreferrer" style="color:#0000EE;text-decoration:underline">Sign up here to receive it daily</a>.</td></tr><tr><td class="pad" align="center" style="padding:0 28px 10px;background:#ffffff;text-align:center"><div style="margin:0;color:#17212b;font-size:13px;line-height:24px;text-align:center">A daily Focus market snapshot—log in or upgrade for live data and full scans</div><div style="font-size:14px;line-height:17px;font-weight:400;padding-bottom:3px"><b><u>${esc(timestamp)}</u></b></div></td></tr><tr><td class="pad" style="padding:0 28px 18px;background:#ffffff"><h3 style="margin:0 0 7px;color:#111b24;font-size:14px;line-height:20px;font-weight:700">ASX Top 200 Heatmap</h3><a href="${heatmapHref}" target="_blank" rel="noopener noreferrer"><img src="${assetUrl("heatmap.png")}" width="704" alt="ASX Top 200 Heatmap" style="display:block;border:0;width:100%;max-width:704px;height:auto;margin:0 auto"></a><p style="margin:7px 0 0;text-align:left"><a href="${heatmapHref}" target="_blank" rel="noopener noreferrer" style="color:#0000EE;font-size:12px;line-height:17px;font-weight:400;font-style:italic;text-decoration:underline">+ live heatmap, filters, &amp; charts in Focus</a></p>${button("Explore Today's ASX Heatmap", heatmapHref, 217)}</td></tr>${body}<tr><td class="pad" style="padding:22px 28px 8px;text-align:center;background:#ffffff">${button("Explore Marketech Focus", FOCUS, 190)}</td></tr><tr><td class="pad" style="padding:18px 26px;color:#7d8893;font-size:11px;line-height:17px;text-align:center;background:#ffffff">Content generated at ${esc(timestamp)} by Marketech Online Trading Pty Ltd (ACN 654 674 432), Authorised Representative (1293528) of Sanlam Private Wealth Pty Ltd (AFSL 337927). This content includes third-party information and/or analysis generated using mathematical models. The content has been prepared for general information purposes only and does not consider your objectives, financial situation, or needs. Before making any investment decisions, consider its appropriateness and seek professional advice where needed. Model outputs have limitations and do not guarantee future results. Investing involves risk, including loss of capital. Past performance is not a reliable indicator of future performance. Refer to our <a href="https://marketech.com.au/terms-and-conditions/" target="_blank" rel="noopener noreferrer" style="color:#0000EE;text-decoration:underline">Terms and Conditions</a> for more information. <strong>Data provided by TMX Australia Exchange.</strong></td></tr></table></center></body></html>`;
    const indexColour = heatmapIndex.values.includes("▼") ? "#c23a31" : heatmapIndex.values.includes("▲") ? "#137a4b" : "#677684";
    const heatmapTitle = heatmapIndex.label ? `<div style="margin:0 0 7px;text-align:center"><div style="display:inline-block;margin:0 0 3px;padding:2px 6px;color:#17212b;font-size:14px;line-height:20px;font-weight:700;border:1px solid #111111;border-radius:4px">${esc(heatmapIndex.label)}</div><div style="color:${indexColour};font-size:12px;line-height:17px;font-weight:400">${esc(heatmapIndex.values)}</div></div><h3 style="margin:0 0 7px;color:#111b24;font-size:14px;line-height:20px;font-weight:700">Australian Top 200 Heatmap</h3>` : "<h3 style=\"margin:0 0 7px;color:#111b24;font-size:14px;line-height:20px;font-weight:700\">Australian Top 200 Heatmap</h3>";
    let finalHtml = html.replace("<h3 style=\"margin:0 0 7px;color:#111b24;font-size:14px;line-height:20px;font-weight:700\">ASX Top 200 Heatmap</h3>", heatmapTitle);
    finalHtml = finalHtml.replaceAll("Explore Today's ASX Heatmap", "Explore Today's Top 200 Heatmap");
    finalHtml = finalHtml.replaceAll("Explore Marketech Focus", "Explore More Scans in Focus");
    finalHtml = finalHtml.replaceAll('href="https://focus.marketech.com.au/#/"', 'href="https://focus.marketech.com.au/#/?uf_action=scan"');
    const disclaimerMarker = '<tr><td class="pad" style="padding:18px 26px;color:#7d8893;font-size:11px;line-height:17px;text-align:center;background:#ffffff">';
    if (!finalHtml.includes(disclaimerMarker)) throw new Error("Newsletter disclaimer marker is missing.");
    finalHtml = finalHtml.replace(disclaimerMarker, `${reorderedUsualEmailFooter()}${disclaimerMarker}`);
    const emailBytes = Buffer.byteLength(finalHtml, "utf8");
    if (emailBytes > 100000) throw new Error(`Email HTML is ${emailBytes.toLocaleString()} bytes; it must remain below 100 KB.`);
    fs.writeFileSync(path.join(OUTPUT, "index.html"), finalHtml);
    fs.writeFileSync(path.join(OUTPUT, "manifest.json"), JSON.stringify({ ...manifest, sourceGeneratedAt: snapshotTime, emailBytes, scans: sections.map(({scan,count})=>({scan,sparklines:count})) }, null, 2)+"\n");
    console.log(JSON.stringify({ ok:true, output:"site/newsletter/latest", heatmap:heatmapSize, sparklines:manifest.assets.filter(a=>a.kind==="sparkline").length, emailBytes },null,2));
  } finally { await context.close(); await browser.close(); }
}
main().catch((e)=>{ console.error(e.stack||e); process.exitCode=1; });

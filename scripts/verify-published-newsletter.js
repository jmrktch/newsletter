const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const OUTPUT = path.join(ROOT, "site", "newsletter", "latest");
const PUBLIC_BASE = (process.env.NEWSLETTER_PUBLIC_BASE || "https://jmrktch.github.io/newsletter/newsletter/latest").replace(/\/$/, "");
const timeoutSeconds = Number(process.env.PAGES_VERIFY_TIMEOUT_SECONDS || 180);

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function isPng(buffer) {
  return buffer.length >= 8
    && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47
    && buffer[4] === 0x0d && buffer[5] === 0x0a && buffer[6] === 0x1a && buffer[7] === 0x0a;
}

async function main() {
  if (!Number.isFinite(timeoutSeconds) || timeoutSeconds < 1) throw new Error("PAGES_VERIFY_TIMEOUT_SECONDS must be a positive number.");
  const expected = JSON.parse(fs.readFileSync(path.join(OUTPUT, "manifest.json"), "utf8"));
  const heatmap = expected.assets?.find((asset) => asset.kind === "heatmap");
  if (!expected.generatedAt || !heatmap?.file) throw new Error("Generated newsletter manifest lacks the expected heatmap asset.");

  const deadline = Date.now() + timeoutSeconds * 1000;
  let lastResult = "No public response received.";
  while (Date.now() < deadline) {
    const cacheKey = Date.now();
    try {
      const manifestResponse = await fetch(`${PUBLIC_BASE}/manifest.json?verify=${cacheKey}`, { cache: "no-store" });
      if (!manifestResponse.ok) {
        lastResult = `manifest HTTP ${manifestResponse.status}`;
      } else {
        const published = await manifestResponse.json();
        if (published.generatedAt !== expected.generatedAt) {
          lastResult = `manifest is from ${published.generatedAt || "an unknown run"}, expected ${expected.generatedAt}`;
        } else {
          const imageResponse = await fetch(`${PUBLIC_BASE}/${heatmap.file}?verify=${cacheKey}`, { cache: "no-store" });
          const image = Buffer.from(await imageResponse.arrayBuffer());
          if (imageResponse.ok && isPng(image)) {
            console.log(JSON.stringify({ ok: true, generatedAt: expected.generatedAt, heatmap: heatmap.file, bytes: image.length }, null, 2));
            return;
          }
          lastResult = `heatmap ${heatmap.file} returned HTTP ${imageResponse.status}, ${image.length} bytes`;
        }
      }
    } catch (error) {
      lastResult = error.message;
    }
    await sleep(5000);
  }
  throw new Error(`Published Pages verification failed after ${timeoutSeconds} seconds: ${lastResult}`);
}

main().catch((error) => { console.error(error.stack || error); process.exitCode = 1; });

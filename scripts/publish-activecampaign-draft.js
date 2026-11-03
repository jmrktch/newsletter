/*
 * Creates or updates the current Daily Focus ActiveCampaign draft, then sends
 * one test email. This script deliberately contains no campaign-send or
 * campaign-scheduling operation.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const EMAIL_FILE = path.join(ROOT, "site", "newsletter", "latest", "index.html");
const LIST_ID = 42; // The Daily Focus List
const ADDRESS_ID = 2;
const SUBJECT = "The Daily Focus";
const TEST_RECIPIENTS = ["jwilson@marketech.com.au", "tjwilson.w@gmail.com"];
const SENDER = {
  fromname: "Marketech Support",
  fromemail: "support@marketech.com.au",
  reply2: "support@marketech.com.au",
};

function todayInSydney() {
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Sydney", day: "2-digit", month: "2-digit", year: "numeric"
  }).formatToParts(new Date()).reduce((result, part) => ({ ...result, [part.type]: part.value }), {});
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function fail(message) { throw new Error(message); }

async function api(baseUrl, token, endpoint, options = {}) {
  const response = await fetch(`${baseUrl}/api/3/${endpoint}`, {
    ...options,
    headers: {
      "Api-Token": token,
      ...(options.body ? { "Content-Type": "application/json" } : {}),
    },
  });
  const raw = await response.text();
  let body = raw;
  try { body = raw ? JSON.parse(raw) : null; } catch { /* Test-send may be plain text. */ }
  if (!response.ok) fail(`${endpoint}: HTTP ${response.status}: ${typeof body === "string" ? body : JSON.stringify(body)}`);
  return body;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const baseUrl = (process.env.ACTIVE_CAMPAIGN_URL || "").replace(/\/+$/, "");
  const token = process.env.ACTIVE_CAMPAIGN_API_TOKEN || "";
  if (!fs.existsSync(EMAIL_FILE)) fail(`Generated newsletter HTML is missing: ${EMAIL_FILE}`);
  const html = fs.readFileSync(EMAIL_FILE, "utf8");
  const campaignName = `Daily Market Update_TDF ${todayInSydney()}`;

  if (dryRun) {
    console.log(JSON.stringify({ ok: true, dryRun: true, campaignName, listId: LIST_ID, addressId: ADDRESS_ID, testRecipients: TEST_RECIPIENTS, htmlBytes: Buffer.byteLength(html), note: "No ActiveCampaign request was made." }, null, 2));
    return;
  }
  if (!baseUrl || !token) fail("ACTIVE_CAMPAIGN_URL and ACTIVE_CAMPAIGN_API_TOKEN must be configured.");

  const campaigns = await api(baseUrl, token, `campaigns?filters[listid]=${LIST_ID}&limit=100&orders[id]=DESC`);
  let campaign = (campaigns.campaigns || []).find((candidate) => candidate.name === campaignName);
  let message;
  let created = false;

  if (campaign) {
    if (campaign.status !== "0") fail(`Refusing to alter campaign ${campaign.id}: it is not a draft (status ${campaign.status}).`);
    if (!campaign.message_id) fail(`Draft campaign ${campaign.id} has no message to update.`);
    const updated = await api(baseUrl, token, `messages/${campaign.message_id}`, {
      method: "PUT", body: JSON.stringify({ message: { subject: SUBJECT, html } }),
    });
    message = updated.message;
  } else {
    const createdMessage = await api(baseUrl, token, "messages", {
      method: "POST", body: JSON.stringify({ message: { ...SENDER, subject: SUBJECT, html } }),
    });
    message = createdMessage.message;
    const createdCampaign = await api(baseUrl, token, "campaigns", {
      method: "POST",
      body: JSON.stringify({ campaign: {
        name: campaignName, type: "single", listIds: [LIST_ID],
        messages: [{ messageId: Number(message.id), percentage: 100 }],
        addressId: ADDRESS_ID, trackLinks: "all", trackReads: true,
      } }),
    });
    campaign = createdCampaign.campaign;
    if (campaign.status !== "0") fail(`New campaign ${campaign.id} was not created as a draft (status ${campaign.status}).`);
    created = true;
  }

  const tests = [];
  for (const toEmail of TEST_RECIPIENTS) {
    tests.push({ toEmail, result: await api(baseUrl, token, "campaigns/test-send", {
      method: "POST",
      body: JSON.stringify({ campaignId: Number(campaign.id), messageId: Number(message.id), subject: SUBJECT, toEmail }),
    }) });
  }
  console.log(JSON.stringify({
    ok: true, created, campaign: { id: campaign.id, name: campaignName, status: "draft", listId: LIST_ID, addressId: ADDRESS_ID },
    message: { id: message.id, subject: SUBJECT, htmlBytes: Buffer.byteLength(html) }, tests,
    note: "This script never enables, schedules, or sends a campaign to subscribers.",
  }, null, 2));
}

main().catch((error) => { console.error(error.stack || error); process.exitCode = 1; });

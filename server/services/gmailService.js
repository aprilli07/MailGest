import { google } from "googleapis";

//Convert a time range (1d, 1w, 1m) into a Gmail "after:YYYY-MM-DD" query.
function buildQuery(dateRange) {
  if (!dateRange) return "";

  const now = new Date();
  let afterDate;

  // compute cutoff date based on selected range 
  if (dateRange === "1d") {
    afterDate = new Date(now - 1 * 24 * 60 * 60 * 1000);
  } else if (dateRange === "1w") {
    afterDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
  } else if (dateRange === "1m") {
    afterDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
  }

  const formatted = afterDate.toISOString().split("T")[0];
  return `after:${formatted}`;
}

// fetch latest emails from Gmail with optional count and date range filters
export async function listLatestEmails(auth, emailCount = 10, dateRange = "") {
  const gmail = google.gmail({ version: "v1", auth });

  const dateQuery = buildQuery(dateRange);

  // combine primary inbox + date filtering
  const q = ["category:primary", dateQuery].filter(Boolean).join(" ");

  // get list of message IDs
  const result = await gmail.users.messages.list({
    userId: "me",
    maxResults: emailCount > 0 ? emailCount : 100,
    q,
  });

  const messages = result.data.messages || [];
  if (!messages.length) return [];

  const out = [];

  // fetch full details for each message
  for (const m of messages) {
    const full = await gmail.users.messages.get({
      userId: "me",
      id: m.id,
    });

    const headers = full.data.payload.headers || [];

    const from = headers.find((h) => h.name === "From")?.value || "";
    const subject = headers.find((h) => h.name === "Subject")?.value || "";
    const dateRaw = headers.find((h) => h.name === "Date")?.value || "";
    const date = new Date(dateRaw).toISOString().split("T")[0];
    const snippet = full.data.snippet ?? "";

    out.push({
      id: m.id,
      threadId: m.threadId,
      from,
      subject,
      date,
      snippet,
    });
  }

  return out;
}

// get the contents of an email thread
export async function getThreadBodies(auth, threadId) {
  const gmail = google.gmail({ version: "v1", auth });
  // fetch the full thread
  const { data } = await gmail.users.threads.get({
    userId: "me",
    id: threadId,
    format: "full",
  });

  const parts = [];

  // recursively walk the parts to extract text/plain bodies
  const walk = (p) => {
    if (!p) return;
    if (p.mimeType === "text/plain" && p.body?.data) {
      parts.push(Buffer.from(p.body.data, "base64").toString("utf8"));
    }
    if (p.parts) p.parts.forEach(walk);
  };

  for (const msg of data.messages || []) {
    walk(msg.payload);
  }

  // use snippets if no text/plain parts found
  if (parts.length === 0) {
    return (data.messages || []).map((m) => m.snippet || "").join("\n");
  }

  // combine all text parts
  return parts.join("\n---\n");
}
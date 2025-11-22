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

// list latest message IDs to cheaply detect new messages
export async function listLatestEmailIds(auth, emailCount = 10, dateRange = "") {
  const gmail = google.gmail({ version: "v1", auth });

  const dateQuery = buildQuery(dateRange);
  const q = ["category:primary", dateQuery].filter(Boolean).join(" ");

  const result = await gmail.users.messages.list({
    userId: "me",
    maxResults: emailCount > 0 ? emailCount : 100,
    q,
  });

  const messages = result.data.messages || [];
  // messages are like { id, threadId }
  return messages;
}

// fetch full details for a given array of message IDs
export async function getMessagesByIds(auth, ids = []) {
  const gmail = google.gmail({ version: "v1", auth });
  if (!ids || ids.length === 0) return [];

  const out = [];
  for (const id of ids) {
    const full = await gmail.users.messages.get({ userId: "me", id });
    const headers = full.data.payload.headers || [];
    const from = headers.find((h) => h.name === "From")?.value || "";
    const subject = headers.find((h) => h.name === "Subject")?.value || "";
    const dateRaw = headers.find((h) => h.name === "Date")?.value || "";
    const date = dateRaw ? new Date(dateRaw).toISOString().split("T")[0] : "";
    const snippet = full.data.snippet ?? "";

    out.push({ id, threadId: full.data.threadId, from, subject, date, snippet });
  }

  return out;
}
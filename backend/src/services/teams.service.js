import { ConfidentialClientApplication } from "@azure/msal-node";
import { env } from "../config/env.js";

const GRAPH_SCOPE = ["https://graph.microsoft.com/.default"];

const canUseTeams = () =>
  Boolean(env.msTenantId && env.msClientId && env.msClientSecret && env.msTeamsOrganizerUpn);

let cachedToken = null;
let cachedTokenExpiresAtMs = 0;

async function getGraphAccessToken() {
  if (!canUseTeams()) return null;

  const now = Date.now();
  if (cachedToken && cachedTokenExpiresAtMs - now > 60_000) return cachedToken;

  const cca = new ConfidentialClientApplication({
    auth: {
      clientId: env.msClientId,
      authority: `https://login.microsoftonline.com/${env.msTenantId}`,
      clientSecret: env.msClientSecret,
    },
  });

  const result = await cca.acquireTokenByClientCredential({ scopes: GRAPH_SCOPE });
  const token = result?.accessToken || null;
  const exp = result?.expiresOn ? result.expiresOn.getTime() : now + 45 * 60_000;

  cachedToken = token;
  cachedTokenExpiresAtMs = exp;
  return token;
}

function mustHaveGlobalFetch() {
  if (typeof fetch !== "function") {
    throw new Error("Global fetch is not available. Use Node 18+ or add a fetch polyfill.");
  }
}

function slotToStartEndIso(scheduledDate, timeSlot) {
  // Treat scheduledDate/timeSlot as local time (server); store/communicate IST in UI.
  // Graph expects ISO 8601 string with time zone separately; we use organizer's local time zone setting.
  const [hh, mm] = String(timeSlot).split(":").map((x) => Number(x));
  const start = new Date(`${scheduledDate}T00:00:00`);
  start.setHours(hh, mm, 0, 0);
  const end = new Date(start);
  end.setMinutes(end.getMinutes() + 30);
  return { startIso: start.toISOString(), endIso: end.toISOString() };
}

export async function createTeamsOnlineMeeting({
  subject,
  scheduledDate,
  timeSlot,
  candidateEmail,
}) {
  if (!canUseTeams()) return null;
  mustHaveGlobalFetch();

  const token = await getGraphAccessToken();
  if (!token) return null;

  const { startIso, endIso } = slotToStartEndIso(scheduledDate, timeSlot);

  const payload = {
    subject,
    startDateTime: startIso,
    endDateTime: endIso,
    participants: candidateEmail
      ? { attendees: [{ identity: { user: { displayName: candidateEmail } } }] }
      : undefined,
  };

  const url = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(env.msTeamsOrganizerUpn)}/onlineMeetings`;
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    let detail = "";
    try {
      detail = JSON.stringify(await resp.json());
    } catch {
      // ignore
    }
    throw new Error(`Teams meeting create failed (${resp.status}). ${detail}`);
  }

  const data = await resp.json();
  return {
    joinUrl: data?.joinWebUrl || null,
    meetingId: data?.id || null,
  };
}


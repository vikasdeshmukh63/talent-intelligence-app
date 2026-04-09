/** Helpers: match candidate resume (RAG) only against recruiter-posted open jobs. */

export function formatOpenJobsForPrompt(jobs, maxDesc = 1200) {
  if (!jobs?.length) return "(No open positions.)";
  return jobs
    .map((j, i) => {
      const desc = (j.description || "").slice(0, maxDesc);
      return `${i + 1}. Title: "${j.title}" (id: ${j.id})\n   Role summary: ${desc || "Use the title and typical expectations for this role."}`;
    })
    .join("\n\n");
}

export function buildResumeJobMatchPrompt(jobsBlock) {
  return `You are a talent intelligence assistant for eNlight Talent. The candidate's resume content is provided via retrieved context (RAG) from their uploaded file.

OPEN POSITIONS posted by recruiters. You MUST ONLY recommend matches from this list. Each returned profile should include the exact "job_id" from the list below and the exact "title" from that same row.

${jobsBlock}

Rules:
- Compare the resume to each open position.
- Return at most 4 matches, best fit first.
- Include a position only if there is a reasonable fit (skills/experience align). Use "match" from 45 (borderline) to 99 (exceptional).
- If there are no open positions, OR none are a reasonable fit, set "no_match" to true, "profiles" to [], and "message" to a short friendly note (max 2 sentences) asking the candidate to check back later for new roles.
- If you return any matches, set "no_match" to false; "message" may be a brief encouraging line or empty string.

Respond with JSON only, following the provided schema.`;
}

export const resumeJobMatchJsonSchema = {
  type: "object",
  properties: {
    candidate_name: { type: "string" },
    summary: { type: "string" },
    no_match: { type: "boolean" },
    message: { type: "string" },
    profiles: {
      type: "array",
      items: {
        type: "object",
        properties: {
          job_id: { type: ["number", "string"] },
          title: { type: "string" },
          match: { type: "number" },
          skills: { type: "array", items: { type: "string" } },
          reason: { type: "string" },
        },
      },
    },
  },
};

export function normalizeResumeJobMatch(response, openJobs, fallbackMessages = {}) {
  const unwrapResponse = (value) => {
    if (!value || typeof value !== "object") return {};
    if (Array.isArray(value.profiles)) return value;
    if (value.data && typeof value.data === "object") {
      if (Array.isArray(value.data.profiles)) return value.data;
      if (value.data.properties && typeof value.data.properties === "object") {
        return value.data.properties;
      }
    }
    if (value.properties && typeof value.properties === "object") {
      return value.properties;
    }
    return value;
  };
  const normalizedResponse = unwrapResponse(response);
  const jobs = Array.isArray(openJobs) ? openJobs : [];
  const normalizeTitle = (value) =>
    String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  const jobsById = new Map(jobs.map((j) => [String(j.id), j]));
  const jobsByNormalizedTitle = new Map(jobs.map((j) => [normalizeTitle(j.title), j]));
  const titleTokens = (value) =>
    normalizeTitle(value)
      .split(" ")
      .filter((t) => t && t.length > 1);
  const findByFuzzyTitle = (value) => {
    const tokens = new Set(titleTokens(value));
    if (!tokens.size) return null;
    let best = null;
    let bestScore = 0;
    for (const job of jobs) {
      const jt = new Set(titleTokens(job.title));
      if (!jt.size) continue;
      let overlap = 0;
      for (const token of tokens) if (jt.has(token)) overlap += 1;
      const score = overlap / Math.max(tokens.size, jt.size);
      if (score > bestScore) {
        bestScore = score;
        best = job;
      }
    }
    return bestScore >= 0.4 ? best : null;
  };
  let profiles = Array.isArray(normalizedResponse?.profiles)
    ? normalizedResponse.profiles
    : [];
  profiles = profiles
    .map((p) => {
      if (!p || typeof p.match !== "number") return null;
      const fromId = p.job_id != null ? jobsById.get(String(p.job_id)) : null;
      const fromTitle = jobsByNormalizedTitle.get(normalizeTitle(p.title));
      const fromFuzzyTitle = findByFuzzyTitle(p.title);
      const matchedJob = fromId || fromTitle || fromFuzzyTitle;
      if (!matchedJob) return null;
      return {
        ...p,
        title: matchedJob.title,
        job_id: matchedJob.id,
      };
    })
    .filter((p) => p && p.match >= 45);
  profiles.sort((a, b) => b.match - a.match);
  profiles = profiles.slice(0, 4);
  if (profiles.length === 0) {
    return {
      ...response,
      candidate_name: normalizedResponse?.candidate_name || "",
      summary: normalizedResponse?.summary || "",
      no_match: true,
      profiles: [],
      message:
        normalizedResponse?.message ||
        fallbackMessages.none ||
        "We couldn’t find a strong match among current openings. Please check back later — our recruiters add new roles regularly.",
    };
  }
  return {
    ...response,
    candidate_name: normalizedResponse?.candidate_name || "",
    summary: normalizedResponse?.summary || "",
    no_match: false,
    profiles,
    message: normalizedResponse?.message || "",
  };
}

export const NO_OPEN_JOBS_MESSAGE =
  "There are no open positions right now. Please come back later — new roles are posted as they open.";

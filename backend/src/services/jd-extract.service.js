import { createRequire } from "module";
import { runPrompt } from "./ai.service.js";

const require = createRequire(import.meta.url);
// Import the core parser directly to avoid pdf-parse's debug-mode side effect in ESM.
const pdfParse = require("pdf-parse/lib/pdf-parse.js");

export const jdExtractJsonSchema = {
  type: "object",
  properties: {
    job_title: { type: "string" },
    role: { type: "string" },
    seniority: { type: "string" },
    experience_min_years: { type: "number" },
    experience_max_years: { type: "number" },
    employment_type: { type: "string" },
    salary_currency: { type: "string" },
    salary_range_type: { type: "string" },
    salary_min: { type: "number" },
    salary_max: { type: "number" },
    work_arrangement: { type: "string" },
    policy: { type: "string" },
    locations: { type: "array", items: { type: "string" } },
    job_summary: { type: "string" },
    responsibilities: { type: "array", items: { type: "string" } },
    perks_and_benefits: { type: "array", items: { type: "string" } },
    skills: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          is_mandatory: { type: "boolean" },
        },
      },
    },
    minimum_education_qualification: { type: "string" },
    course_or_specialization: { type: "string" },
    additional_requirements: { type: "array", items: { type: "string" } },
    status_of_jd: { type: "string" },
    application_deadline: { type: "string" },
    employment_start_date: { type: "string" },
    key_callout: { type: "string" },
    google_maps_url_of_office_location: { type: "string" },
  },
};

const ensureArray = (v) => (Array.isArray(v) ? v : []);
const ensureString = (v) => (typeof v === "string" ? v : "");
const ensureNumberOrNull = (v) =>
  typeof v === "number" && Number.isFinite(v) ? v : null;
const ensureBoolean = (v) => v === true;

const normalizeExtractionShape = (input) => {
  const obj = input && typeof input === "object" && !Array.isArray(input) ? input : {};
  const dataLayer = obj.data && typeof obj.data === "object" && !Array.isArray(obj.data) ? obj.data : obj;
  const raw = dataLayer.properties && typeof dataLayer.properties === "object" ? dataLayer.properties : dataLayer;

  const normalized = {
    job_title: ensureString(raw.job_title),
    role: ensureString(raw.role),
    seniority: ensureString(raw.seniority),
    experience_min_years: ensureNumberOrNull(raw.experience_min_years),
    experience_max_years: ensureNumberOrNull(raw.experience_max_years),
    employment_type: ensureString(raw.employment_type),
    salary_currency: ensureString(raw.salary_currency),
    salary_range_type: ensureString(raw.salary_range_type),
    salary_min: ensureNumberOrNull(raw.salary_min),
    salary_max: ensureNumberOrNull(raw.salary_max),
    work_arrangement: ensureString(raw.work_arrangement),
    policy: ensureString(raw.policy),
    locations: ensureArray(raw.locations).map((x) => String(x || "")).filter(Boolean),
    job_summary: ensureString(raw.job_summary),
    responsibilities: ensureArray(raw.responsibilities).map((x) => String(x || "")).filter(Boolean),
    perks_and_benefits: ensureArray(raw.perks_and_benefits).map((x) => String(x || "")).filter(Boolean),
    skills: ensureArray(raw.skills)
      .map((s) => ({
        name: ensureString(s?.name),
        is_mandatory: ensureBoolean(s?.is_mandatory ?? s?.mandatory),
      }))
      .filter((s) => s.name),
    minimum_education_qualification: ensureString(raw.minimum_education_qualification),
    course_or_specialization: ensureString(raw.course_or_specialization),
    additional_requirements: ensureArray(raw.additional_requirements).map((x) => String(x || "")).filter(Boolean),
    status_of_jd: ensureString(raw.status_of_jd),
    application_deadline: ensureString(raw.application_deadline),
    employment_start_date: ensureString(raw.employment_start_date),
    key_callout: ensureString(raw.key_callout),
    google_maps_url_of_office_location: ensureString(raw.google_maps_url_of_office_location),
  };
  return normalized;
};

export const extractJdFieldsFromPdfBuffer = async ({ buffer }) => {
  const parsed = await pdfParse(buffer);
  const text = (parsed?.text || "").trim();
  if (!text) {
    return { ok: false, message: "No text extracted from PDF." };
  }

  const prompt = [
    "You are an expert recruitment operations assistant.",
    "Extract structured job posting fields from the following JD text.",
    "If a field is not present, return an empty string, null, or empty array as appropriate.",
    "For dates: return ISO-like strings if possible (e.g. 2026-04-30), otherwise empty string.",
    "salary_range_type must be one of: yearly, monthly, weekly, hourly, fixed, other, or empty string.",
    "work_arrangement must be one of: onsite, remote, hybrid, or empty string.",
    "skills[].is_mandatory should be true if required/mandatory; false if nice-to-have/optional.",
    "",
    "JD TEXT:",
    text.slice(0, 20000),
  ].join("\n");

  const data = await runPrompt({ prompt, responseJsonSchema: jdExtractJsonSchema, fileUrls: [] });
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { ok: false, message: "JD extraction returned invalid output." };
  }
  if (data.raw) {
    return { ok: false, message: "JD extraction failed to return structured JSON. Please try again." };
  }
  return { ok: true, data: normalizeExtractionShape(data) };
};


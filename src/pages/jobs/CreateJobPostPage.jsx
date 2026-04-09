import React, { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, FileText, RefreshCw, Star, Upload, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiClient } from "@/api/client";

const SENIORITY_OPTIONS = ["Intern", "Junior", "Mid-level", "Senior", "Lead", "Principal", "Staff"];
const EMPLOYMENT_OPTIONS = ["Full-time", "Part-time", "Contract", "Internship", "Freelance", "Other"];
const SALARY_FREQUENCY_OPTIONS = ["yearly", "monthly", "weekly", "hourly", "fixed", "other"];

const normalizeCurrency = (v) => {
  const t = String(v || "").trim();
  if (!t) return "INR";
  if (t.toUpperCase().includes("INR") || t.includes("₹")) return "INR";
  if (t.toUpperCase().includes("USD") || t.includes("$")) return "USD";
  if (t.toUpperCase().includes("EUR") || t.includes("€")) return "EUR";
  return t.toUpperCase();
};

const coerceOption = (value, options) => {
  const raw = (value || "").trim();
  if (!raw) return "";
  const exact = options.find((o) => o.toLowerCase() === raw.toLowerCase());
  if (exact) return exact;
  const incl = options.find((o) => o.toLowerCase().includes(raw.toLowerCase()));
  if (incl) return incl;
  return raw;
};

const pick = (obj, ...keys) => {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null) return v;
  }
  return undefined;
};

const parseMaybeJson = (value) => {
  if (typeof value !== "string") return value;
  const t = value.trim();
  if (!t) return value;
  if (!(t.startsWith("{") || t.startsWith("["))) return value;
  try {
    return JSON.parse(t);
  } catch {
    return value;
  }
};

const toDateInputValue = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const direct = raw.match(/^(\d{4}-\d{2}-\d{2})$/);
  if (direct) return direct[1];
  const fromIso = raw.match(/^(\d{4}-\d{2}-\d{2})T/);
  if (fromIso) return fromIso[1];
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "";
  const yyyy = parsed.getFullYear();
  const mm = String(parsed.getMonth() + 1).padStart(2, "0");
  const dd = String(parsed.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const openNativeDatePicker = (event) => {
  event.currentTarget.showPicker?.();
};

const coerceExtractPayload = (payload) => {
  // Handle shapes: { ...fields }, { data: {...fields} }, { type, properties }, or JSON-string variants.
  const first = parseMaybeJson(payload);
  const maybeData = first && typeof first === "object" && !Array.isArray(first) ? first.data : undefined;
  const second = parseMaybeJson(maybeData);
  const candidate =
    second && typeof second === "object" && !Array.isArray(second)
      ? second
      : first && typeof first === "object" && !Array.isArray(first)
        ? first
        : {};
  if (candidate && typeof candidate === "object" && !Array.isArray(candidate) && candidate.properties && typeof candidate.properties === "object") {
    return candidate.properties;
  }
  return candidate;
};

const salaryTypeLabel = (v) => {
  const map = {
    yearly: "Yearly",
    monthly: "Monthly",
    weekly: "Weekly",
    hourly: "Hourly",
    fixed: "Fixed",
    other: "Other",
  };
  return map[v] || v;
};

const defaultDraft = () => ({
  jobTitle: "",
  role: "",
  seniority: "",
  experienceMin: "",
  experienceMax: "",
  employmentType: "",
  salaryCurrency: "INR",
  salaryMin: "",
  salaryMax: "",
  salaryFrequency: "yearly",
  workArrangement: "on-site",
  hybridPolicy: "",
  locations: [],
  jobSummary: "",
  responsibilities: "",
  perks: "",
  skills: [],
  minEducation: "",
  courseSpecialization: "",
  additionalRequirements: "",
  status: "Published",
  applicationDeadline: "",
  employmentStartDate: "",
  keyCallout: "",
  mapsUrl: "",
});

const normalizeExtractedToDraft = (data) => {
  // `data` follows ai_service JDExtractionSchema keys.
  const d = defaultDraft();
  d.jobTitle = pick(data, "job_title", "jobTitle") || "";
  d.role = pick(data, "role") || "";
  d.seniority = coerceOption(pick(data, "seniority"), SENIORITY_OPTIONS);
  const expMin = pick(data, "experience_min_years", "experienceMinYears", "experience_years");
  const expMax = pick(data, "experience_max_years", "experienceMaxYears");
  d.experienceMin = expMin != null ? String(expMin) : "";
  d.experienceMax = expMax != null ? String(expMax) : "";
  d.employmentType = coerceOption(pick(data, "employment_type", "employmentType"), EMPLOYMENT_OPTIONS);
  d.salaryCurrency = normalizeCurrency(pick(data, "salary_currency"));
  const salaryObj = pick(data, "salary");
  const salaryMin = pick(data, "salary_min", "salaryMin") ?? (salaryObj && typeof salaryObj === "object" ? salaryObj.min : undefined);
  const salaryMax = pick(data, "salary_max", "salaryMax") ?? (salaryObj && typeof salaryObj === "object" ? salaryObj.max : undefined);
  const salaryFreq = pick(data, "salary_range_type", "salaryFrequency") ?? (salaryObj && typeof salaryObj === "object" ? salaryObj.frequency : undefined);
  d.salaryMin = salaryMin != null ? String(salaryMin) : "";
  d.salaryMax = salaryMax != null ? String(salaryMax) : "";
  d.salaryFrequency = salaryFreq || "yearly";
  d.workArrangement =
    pick(data, "work_arrangement") === "remote"
      ? "remote"
      : pick(data, "work_arrangement") === "hybrid"
        ? "hybrid"
        : "on-site";
  d.hybridPolicy = pick(data, "policy") || "";
  d.locations = Array.isArray(pick(data, "locations")) ? pick(data, "locations") : [];
  d.jobSummary = pick(data, "job_summary", "jobSummary") || "";
  const resp = pick(data, "responsibilities");
  d.responsibilities = Array.isArray(resp) ? resp.join("\n") : (resp || "");
  const perks = pick(data, "perks_and_benefits", "perksAndBenefits");
  d.perks = Array.isArray(perks) ? perks.join("\n") : (perks || "");
  const skills = pick(data, "skills");
  d.skills = Array.isArray(skills)
    ? skills
        .filter((s) => (s?.name || "").trim())
        .map((s) => ({
          id:
            typeof crypto !== "undefined" && crypto.randomUUID
              ? crypto.randomUUID()
              : `skill-${Date.now()}-${Math.random()}`,
          name: s.name,
          mandatory: !!(s.is_mandatory ?? s.mandatory),
        }))
    : [];
  d.minEducation = pick(data, "minimum_education_qualification", "minimumEducationQualification") || "";
  d.courseSpecialization = pick(data, "course_or_specialization", "courseOrSpecialization") || "";
  const addReq = pick(data, "additional_requirements", "additionalRequirements");
  d.additionalRequirements = Array.isArray(addReq) ? addReq.join("\n") : (addReq || "");
  d.status = pick(data, "status_of_jd", "status") || "Published";
  d.applicationDeadline = toDateInputValue(pick(data, "application_deadline", "applicationDeadline"));
  d.employmentStartDate = toDateInputValue(pick(data, "employment_start_date", "employmentStartDate"));
  d.keyCallout = pick(data, "key_callout", "keyCallout") || "";
  d.mapsUrl = pick(data, "google_maps_url_of_office_location", "googleMapsOfficeLocationUrl", "mapsUrl") || "";
  return d;
};

const descriptionFromDraft = (draft) => {
  const lines = [];
  lines.push(`Job Title: ${draft.jobTitle}`);
  if (draft.role) lines.push(`Role: ${draft.role}`);
  if (draft.seniority) lines.push(`Seniority: ${draft.seniority}`);
  if (draft.employmentType) lines.push(`Employment type: ${draft.employmentType}`);
  if (draft.experienceMin || draft.experienceMax) lines.push(`Experience: ${draft.experienceMin}-${draft.experienceMax} years`);
  if (draft.workArrangement) lines.push(`Work arrangement: ${draft.workArrangement}`);
  if (draft.hybridPolicy) lines.push(`Policy: ${draft.hybridPolicy}`);
  if ((draft.locations || []).length) lines.push(`Locations: ${(draft.locations || []).join(", ")}`);
  if (draft.salaryMin || draft.salaryMax) {
    lines.push(`Salary: ${draft.salaryCurrency} ${draft.salaryMin}-${draft.salaryMax} (${salaryTypeLabel(draft.salaryFrequency)})`);
  }
  if (draft.jobSummary) lines.push(`\nJob summary:\n${draft.jobSummary}`);
  if (draft.responsibilities) lines.push(`\nResponsibilities:\n${draft.responsibilities}`);
  if (draft.perks) lines.push(`\nPerks & benefits:\n${draft.perks}`);
  if (draft.additionalRequirements) lines.push(`\nAdditional requirements:\n${draft.additionalRequirements}`);
  if ((draft.skills || []).length) {
    lines.push(
      `\nSkills:\n${draft.skills.map((s) => `- ${s.name}${s.mandatory ? " (mandatory)" : ""}`).join("\n")}`,
    );
  }
  return lines.join("\n");
};

export default function CreateJobPostPage() {
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState(null);
  const [cityDraft, setCityDraft] = useState("");
  const [skillDraft, setSkillDraft] = useState("");

  const canSubmit = useMemo(() => !!draft?.jobTitle && !saving && !extracting, [draft, saving, extracting]);

  const onUpload = async (f) => {
    if (!f) return;
    setFile(f);
    setExtracting(true);
    setDraft(null);
    try {
      const apiData = await apiClient.jobs.extractFromPdf(f);
      const coerced = coerceExtractPayload(apiData);
      const normalized = normalizeExtractedToDraft(coerced);

      setDraft(normalized);
    } catch (error) {
      alert(error?.message || "Failed to extract job details from PDF.");
    } finally {
      setExtracting(false);
    }
  };

  const onSubmit = async () => {
    if (!draft?.jobTitle) return;
    setSaving(true);
    try {
      await apiClient.jobs.create({
        title: draft.jobTitle.trim(),
        description: descriptionFromDraft(draft),
        details: { ...draft, _source: "jd_pdf_extract_step1" },
      });
      navigate("/dashboard/recruiter");
    } catch (error) {
      alert(error?.message || "Failed to post job.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Create Job Post</h1>
          <button
            type="button"
            onClick={() => navigate("/dashboard/recruiter")}
            className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" /> Close
          </button>
        </div>

        {!draft && (
          <div className="rounded-2xl border border-border/40 bg-card/50 p-6 sm:p-8">
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-primary/25 hover:border-primary/50 rounded-xl p-10 text-center cursor-pointer transition-all"
            >
              <input
                ref={fileRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => onUpload(e.target.files?.[0])}
              />
              {file ? (
                <div className="flex items-center justify-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  <span className="font-mono text-sm text-primary">{file.name}</span>
                </div>
              ) : (
                <>
                  <Upload className="w-10 h-10 text-primary/50 mx-auto mb-3" />
                  <p className="font-mono text-sm text-muted-foreground">Upload JD PDF to auto-fill the form</p>
                  <p className="font-mono text-[11px] text-muted-foreground/60 mt-1">PDF only</p>
                </>
              )}
            </div>

            {extracting && (
              <div className="mt-5 flex items-center justify-center gap-2 font-mono text-xs text-muted-foreground">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Extracting job fields from PDF...
              </div>
            )}
          </div>
        )}

        {draft && (
          <div className="rounded-2xl border border-border/40 bg-card/50 p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle2 className="w-4 h-4" />
                <span className="font-mono text-[10px] uppercase tracking-wider">Autofilled from JD PDF</span>
              </div>
              <button type="button" className="text-xs font-mono text-primary hover:underline" onClick={() => fileRef.current?.click()}>
                Change PDF
              </button>
              <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={(e) => onUpload(e.target.files?.[0])} />
            </div>

            {/* Important Fields (matches frontend step-1 schema) */}
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-sm text-foreground">
                  Job Title <span className="text-destructive">*</span>
                </Label>
                <Input value={draft.jobTitle} onChange={(e) => setDraft({ ...draft, jobTitle: e.target.value })} placeholder='e.g. "Engineer (Platforms)"' />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm text-foreground">Role</Label>
                  <Input value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })} placeholder='e.g. "Full-stack Developer"' />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-foreground">
                    Seniority <span className="text-destructive">*</span>
                  </Label>
                  <Select value={draft.seniority} onValueChange={(v) => setDraft({ ...draft, seniority: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select seniority" />
                    </SelectTrigger>
                    <SelectContent>
                      {SENIORITY_OPTIONS.map((o) => (
                        <SelectItem key={o} value={o}>
                          {o}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm text-foreground">
                    Experience <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={draft.experienceMin}
                      onChange={(e) => setDraft({ ...draft, experienceMin: e.target.value })}
                      placeholder="Min"
                    />
                    <span className="text-sm text-muted-foreground">to</span>
                    <Input
                      type="number"
                      value={draft.experienceMax}
                      onChange={(e) => setDraft({ ...draft, experienceMax: e.target.value })}
                      placeholder="Max"
                    />
                    <span className="text-sm text-muted-foreground">years</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-foreground">
                    Employment type <span className="text-destructive">*</span>
                  </Label>
                  <Select value={draft.employmentType} onValueChange={(v) => setDraft({ ...draft, employmentType: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employment type" />
                    </SelectTrigger>
                    <SelectContent>
                      {EMPLOYMENT_OPTIONS.map((o) => (
                        <SelectItem key={o} value={o}>
                          {o}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-foreground">Salary range</Label>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <Select value={draft.salaryCurrency} onValueChange={(v) => setDraft({ ...draft, salaryCurrency: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {["INR", "USD", "EUR"].map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input value={draft.salaryMin} onChange={(e) => setDraft({ ...draft, salaryMin: e.target.value })} placeholder="Min" />
                  <Input value={draft.salaryMax} onChange={(e) => setDraft({ ...draft, salaryMax: e.target.value })} placeholder="Max" />
                  <Select value={draft.salaryFrequency} onValueChange={(v) => setDraft({ ...draft, salaryFrequency: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      {SALARY_FREQUENCY_OPTIONS.map((o) => (
                        <SelectItem key={o} value={o}>
                          {salaryTypeLabel(o)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-foreground">
                  Work arrangement <span className="text-destructive">*</span>
                </Label>
                <RadioGroup
                  value={draft.workArrangement}
                  onValueChange={(v) => setDraft({ ...draft, workArrangement: v })}
                  className="flex flex-wrap gap-6"
                >
                  {[
                    { id: "on-site", label: "On-site" },
                    { id: "remote", label: "Remote" },
                    { id: "hybrid", label: "Hybrid" },
                  ].map((o) => (
                    <div key={o.id} className="flex items-center gap-2">
                      <RadioGroupItem value={o.id} id={`wa-${o.id}`} />
                      <Label htmlFor={`wa-${o.id}`} className="text-sm text-foreground">
                        {o.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {(draft.workArrangement === "hybrid" || draft.workArrangement === "on-site") && (
                <div className="space-y-2">
                  <Label className="text-sm text-foreground">Location(s)</Label>
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      value={cityDraft}
                      onChange={(e) => setCityDraft(e.target.value)}
                      placeholder="Add city..."
                      className="max-w-xs"
                    />
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-md border border-border px-3 py-2 text-sm text-foreground hover:bg-accent"
                      onClick={() => {
                        const t = cityDraft.trim();
                        if (!t) return;
                        if (draft.locations.includes(t)) {
                          setCityDraft("");
                          return;
                        }
                        setDraft({ ...draft, locations: [...draft.locations, t] });
                        setCityDraft("");
                      }}
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {draft.locations.map((loc) => (
                      <span key={loc} className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs">
                        {loc}
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-foreground"
                          onClick={() => setDraft({ ...draft, locations: draft.locations.filter((x) => x !== loc) })}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-sm text-foreground">
                  Job summary <span className="text-destructive">*</span>
                </Label>
                <Textarea value={draft.jobSummary} onChange={(e) => setDraft({ ...draft, jobSummary: e.target.value })} />
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-foreground">Responsibilities</Label>
                <Textarea value={draft.responsibilities} onChange={(e) => setDraft({ ...draft, responsibilities: e.target.value })} />
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-foreground">Perks & benefits</Label>
                <Textarea value={draft.perks} onChange={(e) => setDraft({ ...draft, perks: e.target.value })} />
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-foreground">
                  Skills <span className="text-destructive">*</span>
                </Label>
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    value={skillDraft}
                    onChange={(e) => setSkillDraft(e.target.value)}
                    placeholder="Type skill and press Add"
                    className="max-w-xs"
                  />
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-md border border-border px-3 py-2 text-sm text-foreground hover:bg-accent"
                    onClick={() => {
                      const t = skillDraft.trim();
                      if (!t) return;
                      if (draft.skills.some((s) => s.name.toLowerCase() === t.toLowerCase())) {
                        setSkillDraft("");
                        return;
                      }
                      const id =
                        typeof crypto !== "undefined" && crypto.randomUUID
                          ? crypto.randomUUID()
                          : `skill-${Date.now()}-${Math.random()}`;
                      setDraft({ ...draft, skills: [...draft.skills, { id, name: t, mandatory: true }] });
                      setSkillDraft("");
                    }}
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {draft.skills.map((s) => (
                    <span
                      key={s.id}
                      className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs"
                    >
                      <button
                        type="button"
                        className={s.mandatory ? "text-amber-500" : "text-muted-foreground hover:text-foreground"}
                        title={s.mandatory ? "Mandatory" : "Nice-to-have"}
                        onClick={() =>
                          setDraft({
                            ...draft,
                            skills: draft.skills.map((x) => (x.id === s.id ? { ...x, mandatory: !x.mandatory } : x)),
                          })
                        }
                      >
                        <Star className="w-4 h-4" />
                      </button>
                      <span>{s.name}</span>
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => setDraft({ ...draft, skills: draft.skills.filter((x) => x.id !== s.id) })}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm text-foreground">Minimum Education Qualification</Label>
                  <Input value={draft.minEducation} onChange={(e) => setDraft({ ...draft, minEducation: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-foreground">Course / Specialization</Label>
                  <Input
                    value={draft.courseSpecialization}
                    onChange={(e) => setDraft({ ...draft, courseSpecialization: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-foreground">Additional requirements</Label>
                <Textarea
                  value={draft.additionalRequirements}
                  onChange={(e) => setDraft({ ...draft, additionalRequirements: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm text-foreground">Status</Label>
                  <Input value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-foreground">Application deadline</Label>
                  <input
                    type="date"
                    value={draft.applicationDeadline || ""}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, applicationDeadline: toDateInputValue(e.target.value) }))
                    }
                    onFocus={openNativeDatePicker}
                    onClick={openNativeDatePicker}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-foreground">Employment start date</Label>
                  <input
                    type="date"
                    value={draft.employmentStartDate || ""}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, employmentStartDate: toDateInputValue(e.target.value) }))
                    }
                    onFocus={openNativeDatePicker}
                    onClick={openNativeDatePicker}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm text-foreground">Key callout</Label>
                  <Input value={draft.keyCallout} onChange={(e) => setDraft({ ...draft, keyCallout: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-foreground">Google Maps URL of office location</Label>
                  <Input value={draft.mapsUrl} onChange={(e) => setDraft({ ...draft, mapsUrl: e.target.value })} />
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={!canSubmit}
              onClick={onSubmit}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
              {saving ? "Posting..." : "Post Job"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


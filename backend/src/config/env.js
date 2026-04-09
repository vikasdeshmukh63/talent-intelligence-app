import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 4000),
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  databaseUrl: process.env.DATABASE_URL || "",
  uploadDir: process.env.UPLOAD_DIR || "uploads",
  openAiApiKey: process.env.OPENAI_API_KEY || "",
  openAiModel: process.env.OPENAI_MODEL || "gpt-4o-mini",
  qdrantUrl: process.env.QDRANT_URL || "http://localhost:6333",
  qdrantApiKey: process.env.QDRANT_API_KEY || "",
  qdrantCollection: process.env.QDRANT_COLLECTION || "talent_documents",
  jwtSecret: process.env.JWT_SECRET || "change_this_secret",
  smtpHost: process.env.SMTP_HOST || "",
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpSecure: String(process.env.SMTP_SECURE || "false") === "true",
  smtpUser: process.env.SMTP_USER || "",
  smtpPass: process.env.SMTP_PASS || "",
  smtpFrom: process.env.SMTP_FROM || "",
  minioEndpoint: process.env.MINIO_ENDPOINT || "localhost",
  minioPort: Number(process.env.MINIO_PORT || 9000),
  minioUseSSL: String(process.env.MINIO_USE_SSL || "false") === "true",
  minioAccessKey: process.env.MINIO_ACCESS_KEY || "minioadmin",
  minioSecretKey: process.env.MINIO_SECRET_KEY || "minioadmin",
  minioBucket: process.env.MINIO_BUCKET || "talent-resumes",
  minioPublicBaseUrl: process.env.MINIO_PUBLIC_BASE_URL || "",

  // Microsoft Teams / Graph (optional)
  msTenantId: process.env.MS_TENANT_ID || "",
  msClientId: process.env.MS_CLIENT_ID || "",
  msClientSecret: process.env.MS_CLIENT_SECRET || "",
  // If set, we create the online meeting under this AAD user.
  // Must exist in the same tenant and have a Teams license.
  msTeamsOrganizerUpn: process.env.MS_TEAMS_ORGANIZER_UPN || "",
};

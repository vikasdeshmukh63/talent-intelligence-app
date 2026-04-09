import path from "path";
import fs from "fs/promises";
import os from "os";
import { ingestDocument, deleteDocumentVectors } from "../services/rag.service.js";
import { ResumeFile } from "../models/resume-file.model.js";
import { uploadObject, deleteObject, getObjectStream } from "../services/object-store.service.js";

export const uploadFile = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "file is required" });
  }
  const safeName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
  const objectKey = `${Date.now()}-${safeName}`;
  const fileUrl = await uploadObject({
    objectKey,
    buffer: req.file.buffer,
    contentType: req.file.mimetype,
  });

  const tempPath = path.join(os.tmpdir(), objectKey);
  await fs.writeFile(tempPath, req.file.buffer);
  let indexing = { indexed: false };
  try {
    indexing = await ingestDocument({
      absolutePath: tempPath,
      fileUrl,
    });
  } catch (error) {
    indexing = { indexed: false, reason: error.message };
  } finally {
    await fs.unlink(tempPath).catch(() => {});
  }
  await ResumeFile.upsert({
    objectKey,
    fileUrl,
    fileName: req.file.originalname,
    indexed: Boolean(indexing?.indexed),
  });
  return res.json({ file_url: fileUrl, indexing });
};

export const deleteFile = async (req, res) => {
  const { file_url: fileUrl } = req.query || {};
  if (!fileUrl || typeof fileUrl !== "string") {
    return res.status(400).json({ message: "valid file_url is required" });
  }
  const resume = await ResumeFile.findOne({ where: { fileUrl } });
  const objectKey = resume?.objectKey || path.basename(new URL(fileUrl).pathname);
  const vectorDeletion = await deleteDocumentVectors({ fileUrl });
  await ResumeFile.destroy({ where: { fileUrl } });
  try {
    await deleteObject({ objectKey });
    return res.json({ success: true, vectorDeletion });
  } catch (error) {
    if (error?.code === "NotFound") return res.json({ success: true, vectorDeletion });
    return res.status(500).json({ message: "Failed to delete file" });
  }
};

export const downloadFile = async (req, res) => {
  const { file_url: fileUrl } = req.query || {};
  if (!fileUrl || typeof fileUrl !== "string") {
    return res.status(400).json({ message: "valid file_url is required" });
  }
  let objectKey = null;
  let fileName = "resume";
  try {
    const resume = await ResumeFile.findOne({ where: { fileUrl } });
    if (resume) {
      objectKey = resume.objectKey;
      fileName = resume.fileName || fileName;
    } else {
      objectKey = path.basename(new URL(fileUrl).pathname);
      fileName = objectKey;
    }
    const stream = await getObjectStream({ objectKey });
    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName.replace(/"/g, "")}"`);
    return stream.pipe(res);
  } catch (_error) {
    return res.status(404).json({ message: "File not found or inaccessible." });
  }
};

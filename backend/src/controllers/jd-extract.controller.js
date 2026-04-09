import { extractJdFieldsFromPdfBuffer } from "../services/jd-extract.service.js";

export const extractJdFromPdf = async (req, res) => {
  const file = req.file;
  if (!file?.buffer) return res.status(400).json({ message: "file is required" });
  if (!file.mimetype?.includes("pdf")) {
    return res.status(400).json({ message: "Only PDF is supported for extraction." });
  }

  const result = await extractJdFieldsFromPdfBuffer({ buffer: file.buffer });
  if (!result.ok) return res.status(400).json({ message: result.message || "Extraction failed" });
  return res.json({ data: result.data });
};


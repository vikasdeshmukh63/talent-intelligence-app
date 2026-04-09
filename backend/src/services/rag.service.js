import fs from "fs/promises";
import path from "path";
import mammoth from "mammoth";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { QdrantClient } from "@qdrant/js-client-rest";
import { env } from "../config/env.js";

const qdrantClient = new QdrantClient({
  url: env.qdrantUrl,
  apiKey: env.qdrantApiKey || undefined,
});

const embeddings = env.openAiApiKey
  ? new OpenAIEmbeddings({ apiKey: env.openAiApiKey, model: "text-embedding-3-small" })
  : null;

let vectorStore = null;

const splitText = (text, size = 1200, overlap = 200) => {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(text.length, start + size);
    chunks.push(text.slice(start, end));
    start = Math.max(end - overlap, start + 1);
  }
  return chunks;
};

const loadFileText = async (absolutePath) => {
  const ext = path.extname(absolutePath).toLowerCase();
  if (ext === ".pdf") {
    const docs = await new PDFLoader(absolutePath).load();
    return docs.map((d) => d.pageContent).join("\n");
  }
  if (ext === ".docx") {
    const result = await mammoth.extractRawText({ path: absolutePath });
    return result.value || "";
  }
  return fs.readFile(absolutePath, "utf-8");
};

const ensureCollection = async () => {
  if (!embeddings) return null;
  if (vectorStore) return vectorStore;

  try {
    await qdrantClient.getCollection(env.qdrantCollection);
  } catch (_error) {
    await qdrantClient.createCollection(env.qdrantCollection, {
      vectors: { size: 1536, distance: "Cosine" },
    });
  }

  vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
    client: qdrantClient,
    collectionName: env.qdrantCollection,
  });
  return vectorStore;
};

export const ingestDocument = async ({ absolutePath, fileUrl }) => {
  if (!env.openAiApiKey) return { indexed: false, reason: "OPENAI_API_KEY missing" };
  const store = await ensureCollection();
  const text = await loadFileText(absolutePath);
  const chunks = splitText(text).filter((chunk) => chunk.trim().length > 0);
  if (!chunks.length) return { indexed: false, reason: "No text extracted" };

  await store.addDocuments(
    chunks.map((chunk, index) => ({
      pageContent: chunk,
      metadata: { source: fileUrl, chunkIndex: index },
    }))
  );
  return { indexed: true, chunks: chunks.length };
};

export const retrieveContext = async ({ question, fileUrls = [], k = 6 }) => {
  if (!env.openAiApiKey) return [];
  const store = await ensureCollection();
  const filter =
    fileUrls.length > 0
      ? {
          should: fileUrls.map((url) => ({
            key: "metadata.source",
            match: { value: url },
          })),
        }
      : undefined;

  const retriever = store.asRetriever({ k, filter });
  const docs = await retriever.invoke(question);
  return docs.map((d) => ({
    content: d.pageContent,
    source: d.metadata?.source || "unknown",
  }));
};

export const deleteDocumentVectors = async ({ fileUrl }) => {
  try {
    await qdrantClient.delete(env.qdrantCollection, {
      filter: {
        should: [
          { key: "metadata.source", match: { value: fileUrl } },
          { key: "source", match: { value: fileUrl } },
        ],
      },
    });
    return { deleted: true };
  } catch (error) {
    return { deleted: false, reason: error.message };
  }
};

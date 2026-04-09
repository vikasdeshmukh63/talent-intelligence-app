import { ChatOpenAI } from "@langchain/openai";
import { Annotation, StateGraph } from "@langchain/langgraph";
import { env } from "../config/env.js";
import { retrieveContext } from "./rag.service.js";

const fallbackText = "AI pipeline unavailable. Configure OPENAI_API_KEY and Qdrant.";

const llm = env.openAiApiKey
  ? new ChatOpenAI({
      apiKey: env.openAiApiKey,
      model: env.openAiModel,
      temperature: 0.2,
    })
  : null;

const State = Annotation.Root({
  prompt: Annotation(),
  responseJsonSchema: Annotation(),
  fileUrls: Annotation(),
  contextDocs: Annotation(),
  ragUsed: Annotation(),
  output: Annotation(),
});

const extractJson = (text) => {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch (_error) {
    return null;
  }
};

const retrieveNode = async (state) => {
  try {
    const contextDocs = await retrieveContext({
      question: state.prompt,
      fileUrls: state.fileUrls || [],
      k: 6,
    });
    return { contextDocs, ragUsed: true };
  } catch (error) {
    // If vector DB is unavailable, continue with plain LLM completion.
    console.warn("[ai] RAG retrieve failed, falling back to plain LLM:", error?.message || error);
    return { contextDocs: [], ragUsed: false };
  }
};

const generateNode = async (state) => {
  if (!llm) {
    return { output: fallbackText };
  }

  const contextBlock =
    state.contextDocs?.length > 0
      ? state.contextDocs
          .map((doc, i) => `[${i + 1}] source=${doc.source}\n${doc.content}`)
          .join("\n\n")
      : "No context documents found.";

  const schemaInstruction = state.responseJsonSchema
    ? `Return a valid JSON object following this schema exactly:\n${JSON.stringify(
        state.responseJsonSchema
      )}`
    : "Return plain text.";

  const finalPrompt = [
    "You are an enterprise talent intelligence assistant.",
    "Use retrieved context when relevant.",
    schemaInstruction,
    `User prompt:\n${state.prompt}`,
    `Retrieved context:\n${contextBlock}`,
  ].join("\n\n");

  const response = await llm.invoke(finalPrompt);
  const raw = typeof response.content === "string" ? response.content : JSON.stringify(response.content);

  if (state.responseJsonSchema) {
    const parsed = extractJson(raw);
    return { output: parsed || { raw } };
  }
  return { output: raw };
};

const graph = new StateGraph(State).addNode("retrieve", retrieveNode).addNode("generate", generateNode).addEdge("__start__", "retrieve").addEdge("retrieve", "generate").addEdge("generate", "__end__").compile();

export const runPrompt = async ({ prompt, responseJsonSchema, fileUrls = [] }) => {
  const result = await graph.invoke({
    prompt,
    responseJsonSchema,
    fileUrls,
    contextDocs: [],
    ragUsed: false,
    output: null,
  });
  return {
    output: result.output,
    ragUsed: Boolean(result.ragUsed),
  };
};

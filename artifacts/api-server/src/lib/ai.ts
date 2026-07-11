import { GoogleGenAI, Type } from "@google/genai";
import { logger } from "./logger";

const apiKey = process.env["GEMINI_API_KEY"];

const genAI = apiKey ? new GoogleGenAI({ apiKey }) : null;

export interface AiTriageResult {
  suggestedTitle: string;
  suggestedCategory: string;
  suggestedPriority: "low" | "medium" | "high" | "critical";
  possibleCauses: string[];
  diagnosticChecks: string[];
  safetyNotes: string;
}

const FALLBACK_RESULT = (
  title: string,
  category: string,
  priority: string,
): AiTriageResult => ({
  suggestedTitle: title,
  suggestedCategory: category,
  suggestedPriority: (["low", "medium", "high", "critical"].includes(
    priority,
  )
    ? priority
    : "medium") as AiTriageResult["suggestedPriority"],
  possibleCauses: [],
  diagnosticChecks: [],
  safetyNotes:
    "AI triage is currently unavailable. A technician will review this report manually.",
});

export async function triageIssueWithAi(input: {
  assetName: string;
  assetCategory: string;
  title: string;
  description: string;
  category: string;
  priority: string;
}): Promise<AiTriageResult> {
  if (!genAI) {
    logger.warn("GEMINI_API_KEY not configured; returning fallback triage");
    return FALLBACK_RESULT(input.title, input.category, input.priority);
  }

  try {
    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are a maintenance triage assistant for facilities equipment. An issue was reported on this asset:
Asset: ${input.assetName} (category: ${input.assetCategory})
Reported title: ${input.title}
Reported description: ${input.description}
Reported category: ${input.category}
Reported priority: ${input.priority}

Analyze the report and produce a structured triage suggestion for the maintenance team.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedTitle: { type: Type.STRING },
            suggestedCategory: { type: Type.STRING },
            suggestedPriority: {
              type: Type.STRING,
              enum: ["low", "medium", "high", "critical"],
            },
            possibleCauses: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            diagnosticChecks: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            safetyNotes: { type: Type.STRING },
          },
          required: [
            "suggestedTitle",
            "suggestedCategory",
            "suggestedPriority",
            "possibleCauses",
            "diagnosticChecks",
            "safetyNotes",
          ],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty response from Gemini");
    }

    const parsed = JSON.parse(text) as AiTriageResult;
    return parsed;
  } catch (error) {
    logger.error({ err: error }, "AI triage request failed");
    return FALLBACK_RESULT(input.title, input.category, input.priority);
  }
}

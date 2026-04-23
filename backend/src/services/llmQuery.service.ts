import { GoogleGenAI } from "@google/genai";
import { ENV } from "@config/config";
import { ParsedClinicaQuery } from "@types/clinica-query.types";

export class LlmQueryService {
  private readonly client = new GoogleGenAI({
    apiKey: ENV.geminiApiKey,
  });

  async parseQuery(query: string): Promise<ParsedClinicaQuery> {
    if (!ENV.geminiApiKey) {
      throw new Error("Missing GEMINI_API_KEY");
    }

    const prompt = `
Convert the veterinary clinic query into strict JSON only.

Return JSON in this exact structure:
{
  "entity": "patient" | "patient_with_treatments",
  "filters": {
    "ownerName": string?,
    "ownerPhone": string?,
    "patientName": string?
  },
  "includeTreatments": boolean
}

Examples:
"תביא לי את לונה של דנה"
"תביא לי את לונה של דנה עם כל הטיפולים"
"חפש חיה בשם מיצי"
"חפש לפי טלפון 0541234567"

User query:
${query}
`;

    const response = await this.client.models.generateContent({
      model: ENV.geminiModel,
      contents: prompt,
    });

    const text = response.text?.trim() ?? "{}";
    return JSON.parse(text) as ParsedClinicaQuery;
  }
}

export const llmQueryService = new LlmQueryService();
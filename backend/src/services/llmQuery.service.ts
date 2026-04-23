import { GoogleGenAI } from "@google/genai";
import { ENV } from "../config/config.js";
import {
  ImportedClinicaAggregate,
  ParsedClinicaQuery,
} from "../utils/clinica-query.types.js";

class LlmQueryService {
  private getClient(): GoogleGenAI {
    if (!ENV.geminiApiKey) {
      throw new Error("Missing GEMINI_API_KEY");
    }

    return new GoogleGenAI({
      apiKey: ENV.geminiApiKey,
    });
  }

  private extractJson(text: string): string {
    const cleaned = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const firstObjectIndex = cleaned.indexOf("{");
    const firstArrayIndex = cleaned.indexOf("[");

    if (firstArrayIndex !== -1 && (firstObjectIndex === -1 || firstArrayIndex < firstObjectIndex)) {
      return cleaned.slice(firstArrayIndex);
    }

    if (firstObjectIndex !== -1) {
      return cleaned.slice(firstObjectIndex);
    }

    return cleaned;
  }

  async parseUserQuery(query: string): Promise<ParsedClinicaQuery> {
    const client = this.getClient();

    const prompt = `
You are helping a veterinary management system search an external clinic website.

Convert the user's request into strict JSON only.

Return this exact JSON structure:
{
  "searchText": string,
  "includeTreatments": boolean
}

Rules:
- searchText should be the best value to search in the external website.
- Prefer patient name, owner phone, or owner name.
- includeTreatments should be true if the user asks for treatments, history, visits, medicines, or medical file.

User request:
${query}
`;

    const response = await client.models.generateContent({
      model: ENV.geminiModel,
      contents: prompt,
    });

    const text = this.extractJson(response.text ?? "{}");
    return JSON.parse(text) as ParsedClinicaQuery;
  }

  async mapRawTextToClinicaData(rawText: string): Promise<ImportedClinicaAggregate[]> {
    const client = this.getClient();

    const prompt = `
You receive raw text copied from an external veterinary clinic website.

Extract patients and treatments from the text.

Return strict JSON only.
Return an array with this exact structure:
[
  {
    "patient": {
      "externalPatientId": string?,
      "name": string,
      "owner": {
        "name": string,
        "phone": string
      },
      "photoName": string?
    },
    "treatments": [
      {
        "externalTreatmentId": string?,
        "treatmentDate": string?,
        "type": string,
        "description": string?
      }
    ]
  }
]

Rules:
- If you cannot find a patient name, do not include that item.
- If you cannot find owner phone, use an empty string.
- Do not invent data.
- Return [] if no valid patient data exists.

Raw text:
${rawText}
`;

    const response = await client.models.generateContent({
      model: ENV.geminiModel,
      contents: prompt,
    });

    const text = this.extractJson(response.text ?? "[]");
    return JSON.parse(text) as ImportedClinicaAggregate[];
  }
}

export const llmQueryService = new LlmQueryService();
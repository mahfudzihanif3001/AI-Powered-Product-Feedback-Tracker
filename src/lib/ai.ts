import { GoogleGenerativeAI } from "@google/generative-ai";
import { AIEnrichment } from "./types";

const SYSTEM_PROMPT = `You are an expert Product Management AI assistant. Your task is to analyze user feedback and categorize it strictly into a JSON object.

Rules:
1. sentiment MUST be exactly one of: "positive", "negative", "neutral".
2. category MUST be exactly one of: "Bug", "Feature", "UX", "Performance", "Other".
3. action_summary MUST be a single, actionable sentence in English recommending the next step for the product team based on the feedback.
4. You MUST return ONLY a raw, valid JSON object. Do not include markdown formatting like \`\`\`json or any conversational text.

Required JSON Output Format:
{
  "sentiment": "...",
  "category": "...",
  "action_summary": "..."
}`;

function getDefaultEnrichment(): AIEnrichment {
    return {
        sentiment: "neutral",
        category: "Other",
        action_summary: "Review this feedback manually — AI enrichment was unavailable.",
    };
}

export async function enrichFeedback(text: string): Promise<AIEnrichment> {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.warn("GEMINI_API_KEY is not set. Returning default enrichment.");
        return getDefaultEnrichment();
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const result = await model.generateContent({
            contents: [
                {
                    role: "user",
                    parts: [
                        {
                            text: `${SYSTEM_PROMPT}\n\nAnalyze the following user feedback:\n\n"${text}"`,
                        },
                    ],
                },
            ],
            generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 256,
            },
        });

        const response = result.response;
        const responseText = response.text().trim();

        // Strip potential markdown code fences
        const cleaned = responseText
            .replace(/^```json\s*/i, "")
            .replace(/^```\s*/i, "")
            .replace(/\s*```$/i, "")
            .trim();

        const parsed = JSON.parse(cleaned) as AIEnrichment;

        // Validate fields
        const validSentiments = ["positive", "negative", "neutral"];
        const validCategories = ["Bug", "Feature", "UX", "Performance", "Other"];

        if (!validSentiments.includes(parsed.sentiment)) {
            parsed.sentiment = "neutral";
        }
        if (!validCategories.includes(parsed.category)) {
            parsed.category = "Other";
        }
        if (typeof parsed.action_summary !== "string" || !parsed.action_summary) {
            parsed.action_summary = "Review this feedback for further action.";
        }

        return parsed;
    } catch (error) {
        console.error("AI enrichment failed:", error);
        return getDefaultEnrichment();
    }
}

import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getAllFeedback, addFeedback } from "@/lib/store";
import { enrichFeedback } from "@/lib/ai";
import { FeedbackItem } from "@/lib/types";

// GET /api/feedback — return all feedback items
export async function GET() {
    const items = getAllFeedback();
    return NextResponse.json(items);
}

// POST /api/feedback — create new feedback with AI enrichment
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { text } = body;

        if (!text || typeof text !== "string" || text.trim().length === 0) {
            return NextResponse.json(
                { error: "Feedback text is required." },
                { status: 400 }
            );
        }

        // AI enrichment via Gemini
        const enrichment = await enrichFeedback(text.trim());

        const newItem: FeedbackItem = {
            id: uuidv4(),
            text: text.trim(),
            status: "open",
            sentiment: enrichment.sentiment,
            category: enrichment.category,
            action_summary: enrichment.action_summary,
        };

        addFeedback(newItem);

        return NextResponse.json(newItem, { status: 201 });
    } catch (error) {
        console.error("POST /api/feedback error:", error);
        return NextResponse.json(
            { error: "Internal server error." },
            { status: 500 }
        );
    }
}

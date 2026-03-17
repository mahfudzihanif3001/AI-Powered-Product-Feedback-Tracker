import { NextRequest, NextResponse } from "next/server";
import { getFeedbackById, updateFeedbackStatus, deleteFeedback } from "@/lib/store";

// PATCH /api/feedback/[id] — update status
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { status } = body;

        const validStatuses = ["open", "in-progress", "resolved"];
        if (!status || !validStatuses.includes(status)) {
            return NextResponse.json(
                { error: "Status must be one of: open, in-progress, resolved." },
                { status: 400 }
            );
        }

        const updated = updateFeedbackStatus(id, status);
        if (!updated) {
            return NextResponse.json(
                { error: "Feedback item not found." },
                { status: 404 }
            );
        }

        return NextResponse.json(updated);
    } catch (error) {
        console.error("PATCH /api/feedback/[id] error:", error);
        return NextResponse.json(
            { error: "Internal server error." },
            { status: 500 }
        );
    }
}

// DELETE /api/feedback/[id] — delete item
export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const existing = getFeedbackById(id);
        if (!existing) {
            return NextResponse.json(
                { error: "Feedback item not found." },
                { status: 404 }
            );
        }

        deleteFeedback(id);
        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("DELETE /api/feedback/[id] error:", error);
        return NextResponse.json(
            { error: "Internal server error." },
            { status: 500 }
        );
    }
}

import { FeedbackItem } from "./types";

// In-memory storage — resets on server restart
const feedbackItems: FeedbackItem[] = [];

export function getAllFeedback(): FeedbackItem[] {
    return [...feedbackItems];
}

export function getFeedbackById(id: string): FeedbackItem | undefined {
    return feedbackItems.find((item) => item.id === id);
}

export function addFeedback(item: FeedbackItem): FeedbackItem {
    feedbackItems.push(item);
    return item;
}

export function updateFeedbackStatus(
    id: string,
    status: FeedbackItem["status"]
): FeedbackItem | null {
    const item = feedbackItems.find((item) => item.id === id);
    if (!item) return null;
    item.status = status;
    return item;
}

export function deleteFeedback(id: string): boolean {
    const index = feedbackItems.findIndex((item) => item.id === id);
    if (index === -1) return false;
    feedbackItems.splice(index, 1);
    return true;
}

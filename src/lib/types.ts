export interface FeedbackItem {
  id: string;
  text: string;
  status: "open" | "in-progress" | "resolved";
  sentiment: "positive" | "negative" | "neutral";
  category: "Bug" | "Feature" | "UX" | "Performance" | "Other";
  action_summary: string;
}

export interface AIEnrichment {
  sentiment: FeedbackItem["sentiment"];
  category: FeedbackItem["category"];
  action_summary: string;
}

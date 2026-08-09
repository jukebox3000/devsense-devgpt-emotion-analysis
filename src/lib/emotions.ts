export const EMOTIONS = ["frustration", "caution", "neutral", "satisfaction"] as const;

export type Emotion = (typeof EMOTIONS)[number];

/** CSS custom-property reference per emotion (defined in src/styles.css). */
export const emotionVar = (e: Emotion) => `var(--emotion-${e})`;

/** Ordered valence scale used for ordinal/regression style analysis. */
export const EMOTION_VALENCE: Record<Emotion, number> = {
  frustration: -1,
  caution: -0.33,
  neutral: 0.33,
  satisfaction: 1,
};

export const EMOTION_LABEL: Record<Emotion, string> = {
  frustration: "Frustration",
  caution: "Caution",
  neutral: "Neutral",
  satisfaction: "Satisfaction",
};

export const EMOTION_EMOJI: Record<Emotion, string> = {
  frustration: "😡",
  caution: "🧐",
  neutral: "😐",
  satisfaction: "🤩",
};

export const emotionBadgeClass: Record<Emotion, string> = {
  frustration: "bg-frustration/15 text-frustration border-frustration/30",
  caution: "bg-caution/15 text-caution border-caution/30",
  neutral: "bg-neutral/15 text-neutral border-neutral/30",
  satisfaction: "bg-satisfaction/15 text-satisfaction border-satisfaction/30",
};

export type Turn = {
  index: number;
  prompt: string;
  answer: string;
  promptEmotion: Emotion;
  promptScore: number;
  answerEmotion: Emotion;
  answerScore: number;
};

export type Conversation = {
  id: string;
  title: string;
  language: string;
  source: "commit" | "issue" | "pull_request" | "discussion" | "code_file";
  turns: Turn[];
};

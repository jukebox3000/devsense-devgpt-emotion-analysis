import {
  EMOTIONS,
  type Emotion,
  type Conversation,
  type Turn,
} from "./emotions";

export function getAllTurns(
  conversations: Conversation[],
): (Turn & { conv: Conversation })[] {
  return conversations.flatMap((c) => c.turns.map((t) => ({ ...t, conv: c })));
}

const share = (n: number, total: number) => (total ? n / total : 0);

export function distribution(
  conversations: Conversation[],
  key: "promptEmotion" | "answerEmotion",
) {
  const turns = getAllTurns(conversations);
  const total = turns.length;
  return EMOTIONS.map((e) => {
    const count = turns.filter((t) => t[key] === e).length;
    return { emotion: e, count, share: share(count, total) };
  });
}

/** Row-normalised P(answer emotion | prompt emotion) with raw counts. */
export function transitionMatrix(conversations: Conversation[]) {
  const turns = getAllTurns(conversations);
  return EMOTIONS.map((p) => {
    const rows = turns.filter((t) => t.promptEmotion === p);
    return {
      prompt: p,
      total: rows.length,
      cells: EMOTIONS.map((a) => {
        const count = rows.filter((t) => t.answerEmotion === a).length;
        return { answer: a, count, share: share(count, rows.length) };
      }),
    };
  });
}

/** Frustration share of developer prompts by turn depth (escalation curve). */
export function emotionByTurnDepth(conversations: Conversation[]) {
  const turns = getAllTurns(conversations);
  const maxDepth = 12;
  return Array.from({ length: maxDepth }, (_, i) => {
    const depth = i + 1;
    const rows = turns.filter((t) => t.index === depth);
    const point: { depth: number; n: number } & Record<Emotion, number> = {
      depth,
      n: rows.length,
      frustration: 0,
      caution: 0,
      neutral: 0,
      satisfaction: 0,
    };
    for (const e of EMOTIONS) {
      point[e] = share(
        rows.filter((r) => r.promptEmotion === e).length,
        rows.length,
      );
    }
    return point;
  }).filter((p) => p.n >= 25); // suppress depths with too few observations to interpret
}

const EXCLUDED_LANGUAGES = new Set([
  "unknown",
  "plpgsql",
  "shaderlab",
  "asymptote",
  "jinja",
  "dockerfile",
  "batchfile",
  "shell",
  "astro",
  "codeql",
  "jupyter notebook",
  "javascript",
  "c",
  "kotlin",
  "css",
]);

/** Language x developer-emotion share matrix for the heatmap. */
export function languageMatrix(conversations: Conversation[], minCount = 10) {
  const turns = getAllTurns(conversations);
  const langs = [...new Set(turns.map((t) => t.conv.language))].sort();
  return langs
    .map((lang) => {
      const rows = turns.filter((t) => t.conv.language === lang);
      return {
        row: lang,
        total: rows.length,
        cells: EMOTIONS.map((e) => ({
          col: e,
          share: share(
            rows.filter((r) => r.promptEmotion === e).length,
            rows.length,
          ),
          count: rows.filter((r) => r.promptEmotion === e).length,
        })),
      };
    })
    .filter(
      (r) =>
        !EXCLUDED_LANGUAGES.has(r.row.trim().toLowerCase()) &&
        r.cells.some((c) => c.count > minCount),
    )
    .sort((a, b) => {
      const aFrust = a.cells.find((c) => c.col === "frustration")?.share ?? 0;
      const bFrust = b.cells.find((c) => c.col === "frustration")?.share ?? 0;
      return aFrust - bFrust;
    });
}

export type { Conversation, Turn };

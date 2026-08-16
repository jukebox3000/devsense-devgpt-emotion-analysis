import {
  EMOTIONS,
  EMOTION_VALENCE,
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

export function meanAnswerScoreByPromptEmotion(conversations: Conversation[]) {
  const turns = getAllTurns(conversations);
  return EMOTIONS.map((e) => {
    const rows = turns.filter((t) => t.promptEmotion === e);
    const mean =
      rows.reduce((s, t) => s + t.answerScore, 0) / (rows.length || 1);
    const sd = Math.sqrt(
      rows.reduce((s, t) => s + (t.answerScore - mean) ** 2, 0) /
        (rows.length || 1),
    );
    return {
      emotion: e,
      mean,
      ci: 1.96 * (sd / Math.sqrt(rows.length || 1)),
      n: rows.length,
    };
  });
}

/** Answer valence (mean) grouped by prompt emotion — the "impact" measure. */
export function answerValenceByPromptEmotion(conversations: Conversation[]) {
  const turns = getAllTurns(conversations);
  return EMOTIONS.map((e) => {
    const rows = turns.filter((t) => t.promptEmotion === e);
    const mean =
      rows.reduce((s, t) => s + EMOTION_VALENCE[t.answerEmotion], 0) /
      (rows.length || 1);
    return { emotion: e, mean, n: rows.length };
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


export function pearson(pairs: { x: number; y: number }[]) {
  const n = pairs.length || 1;
  const mx = pairs.reduce((s, p) => s + p.x, 0) / n;
  const my = pairs.reduce((s, p) => s + p.y, 0) / n;
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (const p of pairs) {
    num += (p.x - mx) * (p.y - my);
    dx += (p.x - mx) ** 2;
    dy += (p.y - my) ** 2;
  }
  const r = num / (Math.sqrt(dx * dy) || 1);
  const slope = num / (dx || 1);
  return { r, slope, intercept: my - slope * mx, mx, my, n };
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

export function sourceMatrix(conversations: Conversation[]) {
  const turns = getAllTurns(conversations);
  const sources = [...new Set(turns.map((t) => t.conv.source))].sort();
  return sources.map((source) => {
    const rows = turns.filter((t) => t.conv.source === source);
    return {
      row: source,
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
  });
}

export function kpis(conversations: Conversation[]) {
  const turns = getAllTurns(conversations);
  const total = turns.length;
  const frustrated = turns.filter(
    (t) => t.promptEmotion === "frustration",
  ).length;
  const satisfiedAnswers = turns.filter(
    (t) => t.answerEmotion === "satisfaction",
  ).length;
  const cautiousAfterFrustration = turns.filter(
    (t) => t.promptEmotion === "frustration" && t.answerEmotion === "caution",
  ).length;
  const frustrationTurns = frustrated || 1;

  const resolved = conversations.filter(
    (c) => c.turns[c.turns.length - 1]?.promptEmotion === "satisfaction",
  ).length;

  // escalation: a conversation whose developer valence declines from first to last turn
  const escalated = conversations.filter((c) => {
    const first = EMOTION_VALENCE[c.turns[0]?.promptEmotion || "neutral"];
    const last =
      EMOTION_VALENCE[c.turns[c.turns.length - 1]?.promptEmotion || "neutral"];
    return last < first;
  }).length;

  const r = pearson(
    turns.map((t) => ({ x: t.promptScore, y: t.answerScore })),
  ).r;

  return {
    conversations: conversations.length,
    pairs: total,
    avgTurns: total / (conversations.length || 1),
    frustrationRate: share(frustrated, total),
    answerSatisfactionRate: share(satisfiedAnswers, total),
    limitRate: cautiousAfterFrustration / frustrationTurns,
    resolutionRate: share(resolved, conversations.length),
    escalationRate: share(escalated, conversations.length),
    meanConfidence: turns.reduce((s, t) => s + t.answerScore, 0) / (total || 1),
    r,
  };
}

export type { Conversation, Turn };

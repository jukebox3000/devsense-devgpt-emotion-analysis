import { useMemo, useState } from "react";
import { useLoaderData } from "@tanstack/react-router";
import {
  getAllTurns,
  scatterPoints,
  pearson,
  answerValenceByPromptEmotion,
  emotionByTurnDepth,
  transitionMatrix,
} from "@/lib/analysis";
import {
  EMOTIONS,
  EMOTION_LABEL,
  EMOTION_VALENCE,
  emotionVar,
  type Emotion,
  type Conversation,
} from "@/lib/emotions";
import { ScatterPlot, Heatmap } from "@/components/charts/ScatterHeatmap";
import { StackedBarChart } from "@/components/charts/BarCharts";
import { TrendLineChart } from "@/components/charts/LineCharts";
import { Panel, KpiCard } from "./Primitives";
import { cn } from "@/lib/utils";
import { fmtPct } from "@/components/charts/chart-utils";

export function ImpactTab({
  activeFilters = [],
}: {
  activeFilters?: Emotion[];
}) {
  const kpiData = useLoaderData({ from: "/" }) as {
    conversations: Conversation[];
  };
  const filteredConversations = useMemo(() => {
    const conversations = kpiData.conversations || [];
    if (!activeFilters.length) return conversations;
    return conversations
      .map((conv) => ({
        ...conv,
        turns: conv.turns.filter((t) =>
          activeFilters.includes(t.promptEmotion),
        ),
      }))
      .filter((conv) => conv.turns.length > 0);
  }, [activeFilters, kpiData.conversations]);

  const [colorBy, setColorBy] = useState<"promptEmotion" | "answerEmotion">(
    "promptEmotion",
  );
  const allTurns = useMemo(
    () => getAllTurns(filteredConversations),
    [filteredConversations],
  );
  const points = useMemo(
    () => scatterPoints(filteredConversations),
    [filteredConversations],
  );
  const fit = useMemo(
    () => pearson(points.map((p) => ({ x: p.x, y: p.y }))),
    [points],
  );
  const valence = useMemo(
    () => answerValenceByPromptEmotion(filteredConversations),
    [filteredConversations],
  );
  const depth = useMemo(
    () => emotionByTurnDepth(filteredConversations),
    [filteredConversations],
  );
  const matrix = useMemo(
    () => transitionMatrix(filteredConversations),
    [filteredConversations],
  );

  const stackRows = matrix.map((r) => ({
    label: EMOTION_LABEL[r.prompt],
    labelColor: emotionVar(r.prompt),
    total: r.total,
    cells: r.cells.map((c) => ({
      key: c.answer,
      share: c.share,
      count: c.count,
    })),
  }));

  const frustrationRise =
    depth[depth.length - 1]!.frustration - depth[0]!.frustration;

  // effect size: satisfaction lift of neutral/satisfied prompts over frustrated ones
  const satAfter = (e: Emotion) => {
    const rows = allTurns.filter((t) => t.promptEmotion === e);
    return (
      rows.filter((t) => t.answerEmotion === "satisfaction").length /
      (rows.length || 1)
    );
  };
  const riskRatio = satAfter("satisfaction") / (satAfter("frustration") || 1);

  const baseline =
    allTurns.reduce((s, t) => s + EMOTION_VALENCE[t.answerEmotion], 0) /
    allTurns.length;
  const frustrationGap =
    valence.find((v) => v.emotion === "frustration")!.mean - baseline;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          className="lg:col-span-2"
          title={
            <>
              <span
                style={{
                  fontWeight: 800,
                  background: "linear-gradient(90deg, #000000, #ef4444)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Longer the chat, worse the mood
              </span>
            </>
          }
          subtitle="Developer emotion share at each turn of the conversation"
          insight={
            <>
              Frustration rises {(frustrationRise * 100).toFixed(0)} points from
              turn 1 to turn {depth[depth.length - 1]!.depth} while satisfaction
              falls. Long threads signal an unsolved problem, not deeper
              engagement. Depth is the risk factor: frustration accumulates with
              each turn, so conversation length is the strongest early-warning
              signal.
            </>
          }
        >
          <TrendLineChart
            data={depth.map((d) => ({ ...d, label: String(d.depth) }))}
            emotions={activeFilters.length > 0 ? activeFilters : undefined}
            xTitle="Turn Index of the conversations"
            height={280}
          />
        </Panel>

        <Panel
          className="lg:col-span-2"
          title="Full answer mix per developer mood"
          subtitle="Each bar is 100% of the responses given to that developer emotion"
          insight={
            <>
              Every row is dominated by neutral and caution, but the
              satisfaction segment shrinks steadily as the developer's mood
              worsens. This one chart contains the core finding: emotion carries
              over into the answer, mostly as extra caution.
            </>
          }
        >
          <StackedBarChart rows={stackRows} />
        </Panel>

        <Panel
          className="lg:col-span-2"
          title="Prompt score vs answer score"
          subtitle="One point per prompt–answer pair; dashed line is the OLS fit"
          insight={
            <>
              The near-flat fit (r = {fit.r.toFixed(3)}) shows that classifier{" "}
              <em>confidence</em> does not transfer between the two sides — the
              carryover effect lives in the discrete <em>labels</em>, not the
              scores. Colour the points by answer emotion and the vertical
              banding by emotion class becomes the visible structure instead.
            </>
          }
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-1.5">
              {(["promptEmotion", "answerEmotion"] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setColorBy(c)}
                  className={cn(
                    "rounded border px-2 py-0.5 text-[10px] transition-colors",
                    colorBy === c
                      ? "border-ring bg-accent text-foreground"
                      : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  colour by {c === "promptEmotion" ? "developer" : "assistant"}
                </button>
              ))}
            </div>
          </div>
          <ScatterPlot
            points={points}
            fit={fit}
            colorBy={colorBy}
            height={360}
            xLabel="developer prompt emotion score"
            yLabel="assistant answer emotion score"
          />
        </Panel>

        <Panel
          className="lg:col-span-2"
          title="Prompt emotion → answer emotion"
          subtitle="Row-normalised share of answer labels for each prompt label"
          insight={
            <>
              This heatmap shows how the assistant responds across developer
              moods: each row is a prompt emotion, and the columns show the
              answer emotion distribution that follows.
            </>
          }
        >
          <Heatmap
            rows={matrix.map((r) => ({
              row: r.prompt,
              total: r.total,
              cells: r.cells.map((c) => ({
                col: c.answer,
                share: c.share,
                count: c.count,
              })),
            }))}
            colorFor={(col) => emotionVar(col as Emotion)}
          />
        </Panel>
      </div>
    </div>
  );
}

export { EMOTION_LABEL };

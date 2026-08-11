import { useMemo, useState } from "react";
import { useLoaderData } from "@tanstack/react-router";
import {
  getAllTurns,
  scatterPoints,
  pearson,
  answerValenceByPromptEmotion,
  emotionByTurnDepth,
  transitionMatrix,
  languageMatrix,
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
import { Panel } from "./Primitives";
import { cn } from "@/lib/utils";

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

  const [valueFormat, setValueFormat] = useState<
    "percentage" | "count" | "both"
  >("both");

  const allTurns = useMemo(
    () => getAllTurns(filteredConversations),
    [filteredConversations],
  );
  const points = useMemo(
    () => scatterPoints(filteredConversations),
    [filteredConversations],
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
  const langMatrix = useMemo(
    () => languageMatrix(filteredConversations),
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
          title="Conversation Length vs Emotion Concentration"
          subtitle="Each bubble represents a conversation (Sharing ID, length 2 to 35 turns): Y-axis is turn length, X-axis is conversation count index, bubble size is max occurring prompt emotion count, colored by dominant emotion"
          insight={
            <>
              This bubble scatterplot maps conversation length against developer affect concentration:
              longer conversations (higher turn counts) feature larger bubbles indicating repeated emotion occurrences.
              Frustration and caution dominate extended multi-turn conversations.
            </>
          }
        >
          <ScatterPlot
            points={points}
            height={360}
            xLabel="Conversation Count Index"
            yLabel="Conversation Length (Number of Turns per Sharing ID)"
          />
        </Panel>

        <Panel
          className="lg:col-span-2"
          title="Prompt Emotion by Programming Language"
          subtitle="Heatmap showing count and distribution of developer prompt emotions for languages with at least one emotion count greater than 10"
          insight={
            <>
              This heatmap displays developer prompt emotions broken down by
              the programming language used in the conversation (showing only
              languages where at least one individual prompt emotion count is
              greater than 10). Each cell shows the count and percentage of
              prompt emotions for that language.
            </>
          }
        >
          <div className="mb-4 flex flex-wrap items-center justify-end gap-3 border-b border-border/50 pb-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium text-muted-foreground mr-1">
                Values:
              </span>
              {(["both", "count", "percentage"] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setValueFormat(fmt)}
                  className={cn(
                    "rounded border px-2 py-0.5 text-[10px] capitalize transition-colors",
                    valueFormat === fmt
                      ? "border-ring bg-accent text-foreground font-semibold"
                      : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {fmt === "both" ? "% & count" : fmt}
                </button>
              ))}
            </div>
          </div>

          <Heatmap
            rows={langMatrix}
            colorFor={(col) => emotionVar(col as Emotion)}
            rowLabelWidth={130}
            valueFormat={valueFormat}
          />
        </Panel>
      </div>
    </div>
  );
}

export { EMOTION_LABEL };

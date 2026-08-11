import { useMemo } from "react";
import {
  distribution,
  transitionMatrix,
  emotionByTurnDepth,
} from "@/lib/analysis";
import { useLoaderData } from "@tanstack/react-router";
import {
  EMOTIONS,
  EMOTION_LABEL,
  EMOTION_EMOJI,
  emotionVar,
  type Emotion,
  type Conversation,
} from "@/lib/emotions";
import { DonutChart } from "@/components/charts/DonutChart";
import { StackedBarChart, MeanBarChart } from "@/components/charts/BarCharts";
import {
  GroupedBarChart,
  SeriesLegend,
} from "@/components/charts/GroupedBarChart";
import { TrendLineChart } from "@/components/charts/LineCharts";
import { DualRingDonut } from "@/components/charts/DualRingDonut";
import { Panel, KpiCard, EmotionLegend } from "./Primitives";
import { fmtPct } from "@/components/charts/chart-utils";

const DEV_COLOR = "var(--series-dev)";
const GPT_COLOR = "var(--series-gpt)";

export function OverviewTab({
  activeFilters = [],
  setActiveTab,
  setSelectedId,
}: {
  activeFilters?: Emotion[];
  setActiveTab?: (tab: string) => void;
  setSelectedId?: (id: string | null) => void;
}) {
  // Load real dataset KPI information
  const kpiData = useLoaderData({ from: "/" }) as {
    success: boolean;
    totalRows: number;
    duration: number;
    counts: Record<string, number>;
    gptCounts: Record<string, number>;
    frustrationAnswerCounts: Record<string, number>;
    promptToAnswerCounts: Record<string, Record<string, number>>;
    frustratedGptAnswers: Array<{
      prompt: string;
      answer: string;
      score: number;
    }>;
    resolutionRate: number;
    codeContent: {
      count: number;
      noCodeCount: number;
      share: number;
      noCodeShare: number;
    };
    conversations: Conversation[];
  };

  const conversations = kpiData.conversations || [];
  const promptDist = distribution(conversations, "promptEmotion");
  const answerDist = distribution(conversations, "answerEmotion");
  const matrix = transitionMatrix(conversations);
  const depth = emotionByTurnDepth(conversations);

  // Find highest emotion dynamically (developer)
  const emotionKeys = Object.keys(kpiData.counts) as (
    "satisfaction" | "neutral" | "frustration" | "caution"
  )[];
  const sortedEmotions = [...emotionKeys].sort(
    (a, b) => (kpiData.counts[b] || 0) - (kpiData.counts[a] || 0),
  );
  const highestEmotion = sortedEmotions[0] || "neutral";
  const secondHighestEmotion = sortedEmotions[1];
  const highestCount = kpiData.counts[highestEmotion] || 0;
  const totalEmotionsCount = Object.values(kpiData.counts).reduce(
    (s, c) => s + c,
    0,
  );
  const highestShare = totalEmotionsCount
    ? highestCount / totalEmotionsCount
    : 0;
  const secondHighestShare =
    totalEmotionsCount && secondHighestEmotion
      ? (kpiData.counts[secondHighestEmotion] || 0) / totalEmotionsCount
      : 0;
  const formattedHighestLabel =
    highestEmotion.charAt(0).toUpperCase() + highestEmotion.slice(1);
  const formattedSecondHighestLabel = secondHighestEmotion
    ? secondHighestEmotion.charAt(0).toUpperCase() +
    secondHighestEmotion.slice(1)
    : "";

  // Shares for all emotions (developer)
  const satShare = (kpiData.counts["satisfaction"] || 0) / totalEmotionsCount;
  const neuShare = (kpiData.counts["neutral"] || 0) / totalEmotionsCount;
  const fruShare = (kpiData.counts["frustration"] || 0) / totalEmotionsCount;
  const cauShare = (kpiData.counts["caution"] || 0) / totalEmotionsCount;

  // Find highest GPT emotion dynamically (overall)
  const gptCounts = kpiData.gptCounts || {};
  const gptEmotionKeys = Object.keys(gptCounts) as (
    "satisfaction" | "neutral" | "frustration" | "caution"
  )[];
  const sortedGptEmotions = [...gptEmotionKeys].sort(
    (a, b) => (gptCounts[b] || 0) - (gptCounts[a] || 0),
  );
  const highestGptEmotion = sortedGptEmotions[0] || "neutral";
  const secondHighestGptEmotion = sortedGptEmotions[1];
  const highestGptCount = gptCounts[highestGptEmotion] || 0;
  const totalGptEmotionsCount = Object.values(gptCounts).reduce(
    (s, c) => s + c,
    0,
  );
  const highestGptShare = totalGptEmotionsCount
    ? highestGptCount / totalGptEmotionsCount
    : 0;
  const secondHighestGptShare =
    totalGptEmotionsCount && secondHighestGptEmotion
      ? (gptCounts[secondHighestGptEmotion] || 0) / totalGptEmotionsCount
      : 0;
  const formattedHighestGptLabel =
    highestGptEmotion.charAt(0).toUpperCase() + highestGptEmotion.slice(1);
  const formattedSecondHighestGptLabel = secondHighestGptEmotion
    ? secondHighestGptEmotion.charAt(0).toUpperCase() +
    secondHighestGptEmotion.slice(1)
    : "";

  const gptSatShare =
    (gptCounts["satisfaction"] || 0) / (totalGptEmotionsCount || 1);
  const gptNeuShare =
    (gptCounts["neutral"] || 0) / (totalGptEmotionsCount || 1);
  const gptFruShare =
    (gptCounts["frustration"] || 0) / (totalGptEmotionsCount || 1);
  const gptCauShare =
    (gptCounts["caution"] || 0) / (totalGptEmotionsCount || 1);

  // Find highest answer emotion when prompt is highestEmotion (from KPI 1)
  const kpi2AnswerCounts = kpiData.promptToAnswerCounts?.[highestEmotion] || {};
  const kpi2AnswerKeys = Object.keys(kpi2AnswerCounts) as (
    "satisfaction" | "neutral" | "frustration" | "caution"
  )[];
  const sortedKpi2Answers = [...kpi2AnswerKeys].sort(
    (a, b) =>
      ((kpi2AnswerCounts[b] as number) || 0) -
      ((kpi2AnswerCounts[a] as number) || 0),
  );
  const highestKpi2Answer = sortedKpi2Answers[0] || "caution";
  const secondHighestKpi2Answer = sortedKpi2Answers[1];
  const highestKpi2AnswerCount = kpi2AnswerCounts[highestKpi2Answer] || 0;
  const totalKpi2Answers = Object.values(kpi2AnswerCounts).reduce(
    (s, c) => s + (c as number),
    0,
  );
  const highestKpi2AnswerShare = totalKpi2Answers
    ? (highestKpi2AnswerCount as number) / totalKpi2Answers
    : 0;
  const secondHighestKpi2AnswerShare =
    totalKpi2Answers && secondHighestKpi2Answer
      ? ((kpi2AnswerCounts[secondHighestKpi2Answer] as number) || 0) /
      totalKpi2Answers
      : 0;
  const formattedHighestKpi2AnswerLabel =
    highestKpi2Answer.charAt(0).toUpperCase() + highestKpi2Answer.slice(1);
  const formattedSecondHighestKpi2AnswerLabel = secondHighestKpi2Answer
    ? secondHighestKpi2Answer.charAt(0).toUpperCase() +
    secondHighestKpi2Answer.slice(1)
    : "";

  const restOfKpi2Emotions = (
    ["satisfaction", "neutral", "frustration", "caution"] as const
  ).filter((e) => e !== highestKpi2Answer);

  const restOfKpi2Hint = restOfKpi2Emotions
    .map((e) => {
      const label =
        e === "satisfaction"
          ? "Sat"
          : e === "neutral"
            ? "Neu"
            : e === "frustration"
              ? "Fru"
              : "Cau";
      const share = totalKpi2Answers
        ? ((kpi2AnswerCounts[e] as number) || 0) / totalKpi2Answers
        : 0;
      return `${label}: ${fmtPct(share, 0)}`;
    })
    .join(" · ");

  const shareOf = (list: typeof promptDist, e: Emotion) =>
    list.find((d) => d.emotion === e)!.share;

  const visibleEmotions =
    activeFilters.length > 0
      ? EMOTIONS.filter((e) => activeFilters.includes(e))
      : EMOTIONS;

  const filteredDevCounts =
    activeFilters.length > 0
      ? Object.fromEntries(
        Object.entries(kpiData.counts).filter(([k]) =>
          activeFilters.includes(k as Emotion),
        ),
      )
      : kpiData.counts;

  const filteredGptCounts =
    activeFilters.length > 0
      ? EMOTIONS.reduce(
        (acc, gptEmotion) => {
          acc[gptEmotion] = activeFilters.reduce((sum, devEmotion) => {
            const count =
              kpiData.promptToAnswerCounts?.[devEmotion]?.[gptEmotion] || 0;
            return sum + count;
          }, 0);
          return acc;
        },
        {} as Record<Emotion, number>,
      )
      : kpiData.gptCounts;

  /** P(answer emotion | developer emotion) helper. */
  const pAnswer = (dev: Emotion, ans: Emotion) =>
    matrix.find((r) => r.prompt === dev)!.cells.find((c) => c.answer === ans)!
      .share;

  const realPAnswer = (dev: string, ans: string) => {
    const countsMap = kpiData.promptToAnswerCounts?.[dev] || {};
    const totalForDev = Object.values(countsMap).reduce(
      (s, c) => s + (c as number),
      0,
    );
    if (!totalForDev) return 0;
    return ((countsMap[ans] as number) || 0) / totalForDev;
  };

  const satLift =
    realPAnswer("satisfaction", "satisfaction") /
    (realPAnswer("frustration", "satisfaction") || 1);

  const sideBySide = visibleEmotions.map((e) => ({
    label: EMOTION_LABEL[e],
    values: { dev: shareOf(promptDist, e), gpt: shareOf(answerDist, e) },
  }));

  const replyStyle = visibleEmotions.map((e) => ({
    label: EMOTION_LABEL[e],
    values: {
      helpful: realPAnswer(e, "satisfaction"),
      limited: realPAnswer(e, "caution"),
    },
  }));

  const stackRows = matrix
    .filter((r) => visibleEmotions.includes(r.prompt))
    .map((r) => ({
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

  const selectedEmotion = activeFilters[0] || highestEmotion;

  const bestExampleConv = useMemo(() => {
    if (!conversations.length) return null;

    const sorted = [...conversations].sort((a, b) => {
      const countA = a.turns.filter(
        (t) => t.promptEmotion === selectedEmotion,
      ).length;
      const countB = b.turns.filter(
        (t) => t.promptEmotion === selectedEmotion,
      ).length;
      return countB - countA;
    });

    const matching = sorted.filter((c) =>
      c.turns.some((t) => t.promptEmotion === selectedEmotion),
    );
    return matching[0] || conversations[0];
  }, [conversations, selectedEmotion]);

  const chanceOfSatData = visibleEmotions.map((e) => ({
    emotion: e,
    mean: realPAnswer(e, "satisfaction"),
    n: Object.values(kpiData.promptToAnswerCounts?.[e] || {}).reduce(
      (s, c) => s + (c as number),
      0,
    ),
  }));
  const maxChanceOfSat = Math.max(0, ...chanceOfSatData.map((d) => d.mean));
  // Add 10% padding to the max value for the y-axis, cap at 1.0
  const dynamicDomainMax = Math.min(1.0, maxChanceOfSat + 0.1);

  return (
    <div className="space-y-6 relative">
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md py-3 -mx-2 px-2 rounded-b-xl border-b border-border/40 mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 shadow-sm">
        <KpiCard
          label={
            <>
              Most common{" "}
              <strong className="font-bold text-foreground text-[11px]">
                DEV
              </strong>{" "}
              emotion
            </>
          }
          value={
            <>
              <span className="uppercase">{formattedHighestLabel}</span>
              <span className="block mt-1 font-bold font-['Oswald'] tracking-wide text-[0.8em] text-foreground">
                ({fmtPct(highestShare, 0)})
              </span>
            </>
          }
          hint={
            formattedSecondHighestLabel ? (
              <span className="display uppercase tracking-[0.09em] text-[12px]">
                <span className={`text-${secondHighestEmotion}`}>
                  {formattedSecondHighestLabel}
                </span>{" "}
                <span className="font-bold font-['Oswald'] tracking-wide text-[11px] text-foreground">
                  ({fmtPct(secondHighestShare, 0)})
                </span>
              </span>
            ) : null
          }
          tone={highestEmotion}
          className="bg-muted/80 shadow-lg border border-border/50"
          bgEmoji={EMOTION_EMOJI[highestEmotion]}
        />
        <KpiCard
          label={
            <>
              <strong
                className={`font-bold text-${highestEmotion} text-[11px]`}
              >
                {highestEmotion.toUpperCase()}
              </strong>{" "}
              most answered by
            </>
          }
          value={
            <>
              <span className="uppercase">
                {formattedHighestKpi2AnswerLabel}
              </span>
              <span className="block mt-1 font-bold font-['Oswald'] tracking-wide text-[0.8em] text-foreground">
                ({fmtPct(highestKpi2AnswerShare, 0)})
              </span>
            </>
          }
          hint={
            formattedSecondHighestKpi2AnswerLabel ? (
              <span className="display uppercase tracking-[0.09em] text-[12px]">
                <span className={`text-${secondHighestKpi2Answer}`}>
                  {formattedSecondHighestKpi2AnswerLabel}
                </span>{" "}
                <span className="font-bold font-['Oswald'] tracking-wide text-[11px] text-foreground">
                  ({fmtPct(secondHighestKpi2AnswerShare, 0)})
                </span>
              </span>
            ) : null
          }
          tone={highestKpi2Answer}
          className="border border-green-500 bg-background/50"
        />
        <KpiCard
          label={
            <>
              Most common{" "}
              <strong className="font-bold text-foreground text-[11px]">
                GPT
              </strong>{" "}
              emotion
            </>
          }
          value={
            <>
              <span className="uppercase">{formattedHighestGptLabel}</span>
              <span className="block mt-1 font-bold font-['Oswald'] tracking-wide text-[0.8em] text-foreground">
                ({fmtPct(highestGptShare, 0)})
              </span>
            </>
          }
          hint={
            formattedSecondHighestGptLabel ? (
              <span className="display uppercase tracking-[0.09em] text-[12px]">
                <span className={`text-${secondHighestGptEmotion}`}>
                  {formattedSecondHighestGptLabel}
                </span>{" "}
                <span className="font-bold font-['Oswald'] tracking-wide text-[11px] text-foreground">
                  ({fmtPct(secondHighestGptShare, 0)})
                </span>
              </span>
            ) : null
          }
          tone={highestGptEmotion}
          className="bg-muted/80 shadow-lg border border-border/50"
          bgEmoji={EMOTION_EMOJI[highestGptEmotion]}
        />
        <KpiCard
          label={
            <>
              Rows with{" "}
              <strong className="font-bold text-foreground text-[11px]">
                code
              </strong>{" "}
              content
            </>
          }
          value={
            <span className="font-bold font-['Oswald'] tracking-wide text-foreground">
              {fmtPct(kpiData.codeContent.share, 0)}
            </span>
          }
          hint={
            <span className="text-[12px]">
              No code: {fmtPct(kpiData.codeContent.noCodeShare, 0)}
            </span>
          }
          tone="neutral"
          className="border border-border/50 bg-background/60"
          progress={kpiData.codeContent.share}
        />
      </div>


      <Panel
        title="Emotion distribution - Developer vs ChatGPT"
        subtitle="Inner ring: developer prompts (solid) · Outer ring: GPT responses (stripe)"
      >
        <div className="py-2">
          <DualRingDonut
            devCounts={filteredDevCounts as Record<string, number>}
            gptCounts={filteredGptCounts as Record<string, number>}
            width={320}
            height={320}
            isFiltered={activeFilters.length > 0}
          />
        </div>
      </Panel>


      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          className="lg:col-span-2"
          title="GPT reply style per developer mood"
          subtitle="Proportion of GPT answers that were helpful vs limited for each developer prompt mood"
          insight={
            <>
              Frustrated developers are much less likely to get a helpful
              response than satisfied ones.
            </>
          }
        >
          <div className="mb-3">
            <SeriesLegend
              series={[
                {
                  key: "helpful",
                  label: "Helpful answer",
                  color: "var(--emotion-satisfaction)",
                },
                {
                  key: "limited",
                  label: "Limited answer",
                  color: "var(--emotion-caution)",
                },
              ]}
            />
          </div>
          <GroupedBarChart
            groups={replyStyle}
            series={[
              {
                key: "helpful",
                label: "Helpful answer",
                color: "var(--emotion-satisfaction)",
              },
              {
                key: "limited",
                label: "Limited answer",
                color: "var(--emotion-caution)",
              },
            ]}
            format={(v) => fmtPct(v, 0)}
            height={280}
          />
        </Panel>

        <Panel
          className="lg:col-span-2"
          title={
            <>
              Chance of a{" "}
              <span className="text-satisfaction font-bold">satisfied</span>{" "}
              answer
            </>
          }
          subtitle="Bars use the developer's emotion colour"
          insight={
            <>
              Read this as a single number per mood: a frustrated prompt gets a
              satisfied answer{" "}
              {fmtPct(realPAnswer("frustration", "satisfaction"), 0)} of the
              time, a satisfied prompt{" "}
              {fmtPct(realPAnswer("satisfaction", "satisfaction"), 0)} — a{" "}
              {satLift.toFixed(1)}× gap.
            </>
          }
        >
          <MeanBarChart
            data={chanceOfSatData}
            domain={[0, dynamicDomainMax]}
            valueFormat={(v) => fmtPct(v, 0)}
            height={280}
          />
        </Panel>
      </div>
    </div>
  );
}

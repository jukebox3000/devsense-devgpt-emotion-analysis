import { useMemo } from "react";
import { DonutChart } from "@/components/charts/DonutChart";
import { SeriesLegend } from "@/components/charts/GroupedBarChart";
import { EMOTIONS, EMOTION_LABEL, EMOTION_HEX } from "@/lib/emotions";

interface SplitDonutChartsProps {
  devCounts: Record<string, number>;
  gptCounts: Record<string, number>;
}

export function SplitDonutCharts({ devCounts, gptCounts }: SplitDonutChartsProps) {
  const devData = useMemo(() => {
    const total = Object.values(devCounts).reduce((a, b) => a + b, 0);
    return EMOTIONS.map((e) => ({
      emotion: e,
      count: devCounts[e] || 0,
      share: total ? (devCounts[e] || 0) / total : 0,
    }));
  }, [devCounts]);

  const gptData = useMemo(() => {
    const total = Object.values(gptCounts).reduce((a, b) => a + b, 0);
    return EMOTIONS.map((e) => ({
      emotion: e,
      count: gptCounts[e] || 0,
      share: total ? (gptCounts[e] || 0) / total : 0,
    }));
  }, [gptCounts]);

  return (
    <div className="flex flex-col md:flex-row items-center gap-6">
      <div className="flex flex-col items-center">
        <h3 className="text-sm font-medium mb-2">Developer Mood</h3>
        <DonutChart data={devData} height={280} />
        <SeriesLegend
          series={EMOTIONS.map((e) => ({
            key: e,
            label: EMOTION_LABEL[e],
            color: EMOTION_HEX[e],
          }))}
        />
      </div>
      <div className="flex flex-col items-center">
        <h3 className="text-sm font-medium mb-2">GPT Response Mood</h3>
        <DonutChart data={gptData} height={280} />
        <SeriesLegend
          series={EMOTIONS.map((e) => ({
            key: e,
            label: EMOTION_LABEL[e],
            color: EMOTION_HEX[e],
          }))}
        />
      </div>
    </div>
  );
}

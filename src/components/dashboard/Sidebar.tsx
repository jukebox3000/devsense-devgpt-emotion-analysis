import { EmojiMorph } from "./EmojiMorph";
import { useLoaderData } from "@tanstack/react-router";
import { type Emotion, EMOTIONS, EMOTION_EMOJI, EMOTION_LABEL, emotionVar } from "@/lib/emotions";
import { cn } from "@/lib/utils";

export function Sidebar({
  activeFilters,
  setActiveFilters,
}: {
  activeFilters: Emotion[];
  setActiveFilters: (filters: Emotion[]) => void;
}) {
  const kpiData = useLoaderData({ from: "/" }) as {
    success: boolean;
    totalRows: number;
    totalPairs: number;
    totalConversations: number;
    duration: number;
    counts: Record<string, number>;
  };

  const totalEmotionsCount = Object.values(kpiData.counts).reduce((s, c) => s + c, 0);

  const shares = {
    frustration: totalEmotionsCount ? (kpiData.counts["frustration"] || 0) / totalEmotionsCount : 0.12,
    caution: totalEmotionsCount ? (kpiData.counts["caution"] || 0) / totalEmotionsCount : 0.18,
    neutral: totalEmotionsCount ? (kpiData.counts["neutral"] || 0) / totalEmotionsCount : 0.54,
    satisfaction: totalEmotionsCount ? (kpiData.counts["satisfaction"] || 0) / totalEmotionsCount : 0.16,
  };

  return (
    <aside className="hidden lg:block h-full w-full">
      <div className="max-w-[280px] w-full">
        <div className="rounded-lg border border-border bg-background p-3">
          <div className="flex flex-col items-stretch gap-4">
            <div className="w-full">
              <EmojiMorph
                shares={shares}
                captions={{
                  frustration: "The developer is blocked and shows it.",
                  caution: "Risk-flagging gets limited responses.",
                  neutral: "Plain task requests: just code context.",
                  satisfaction: "The developer confirms something worked.",
                }}
                className="p-0 w-full"
                stacked
              />
            </div>

            <div className="w-full -mt-2">
              <p className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider mb-2 text-left px-0.5">
                Filter by developer mood
              </p>
              <div className="flex w-full items-center justify-between gap-1.5">
                {EMOTIONS.map((e) => {
                  const color = emotionVar(e);
                  const isExplicitlyActive = activeFilters.includes(e);
                  const isAnyActive = activeFilters.length === 0;
                  const showGradient = isExplicitlyActive || isAnyActive;

                  return (
                    <button
                      key={e}
                      onClick={() => {
                        if (activeFilters.includes(e)) {
                          setActiveFilters(activeFilters.filter((f) => f !== e));
                        } else {
                          setActiveFilters([...activeFilters, e]);
                        }
                      }}
                      aria-label={`Filter by ${EMOTION_LABEL[e]}`}
                      className={cn(
                        "flex-1 flex items-center justify-center rounded-md border py-2 transition-all cursor-pointer",
                        isExplicitlyActive
                          ? "scale-[1.05] shadow-md border-foreground/30 font-bold"
                          : isAnyActive
                          ? "scale-[1.02] shadow-xs border-border/80 hover:scale-[1.04]"
                          : "border-border bg-background text-muted-foreground hover:bg-accent opacity-40 hover:opacity-90"
                      )}
                      style={
                        showGradient
                          ? {
                              backgroundImage: `radial-gradient(110% 115% at 50% 0%, color-mix(in oklab, ${color} 26%, transparent), transparent 90%)`,
                              backgroundColor: `color-mix(in oklab, ${color} 10%, transparent)`,
                              borderColor: isExplicitlyActive 
                                ? `color-mix(in oklab, ${color} 45%, transparent)` 
                                : `color-mix(in oklab, ${color} 25%, transparent)`,
                            }
                          : {}
                      }
                    >
                      <span className="emoji text-lg leading-none">
                        {EMOTION_EMOJI[e]}
                      </span>
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setActiveFilters([])}
                className="mt-1.5 w-full rounded-md border border-border py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:bg-accent bg-background"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

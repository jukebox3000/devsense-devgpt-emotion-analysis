import { useEffect, useState } from "react";
import {
  EMOTIONS,
  EMOTION_LABEL,
  EMOTION_EMOJI,
  emotionVar,
  type Emotion,
} from "@/lib/emotions";
import { cn } from "@/lib/utils";

/**
 * Cinematic emoji morpher: one face that transitions between the four
 * SE-specific emotion classes, with the matching share/caption.
 */
export function EmojiMorph({
  shares,
  captions,
  intervalMs = 2600,
  className,
  stacked = false,
}: {
  shares: Record<Emotion, number>;
  captions: Record<Emotion, string>;
  intervalMs?: number;
  className?: string;
  stacked?: boolean;
}) {
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [phase, setPhase] = useState<"in" | "out">("in");

  useEffect(() => {
    if (!playing) return;
    const out = setTimeout(() => setPhase("out"), intervalMs - 420);
    const next = setTimeout(() => {
      setI((v) => (v + 1) % EMOTIONS.length);
      setPhase("in");
    }, intervalMs);
    return () => {
      clearTimeout(out);
      clearTimeout(next);
    };
  }, [i, playing, intervalMs]);

  const current = EMOTIONS[i]!;
  const color = emotionVar(current);

  return (
    <div
      className={cn("panel relative overflow-hidden p-6 sm:p-8", className)}
      style={{
        backgroundImage: `radial-gradient(120% 130% at 12% 0%, color-mix(in oklab, ${color} 12%, transparent), transparent 62%)`,
        transition: "background-image 700ms ease",
      }}
    >
      <div
        className={cn(
          stacked
            ? "flex flex-col items-center gap-4 text-center"
            : "flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8",
        )}
      >
        <div className="relative flex size-32 shrink-0 items-center justify-center sm:size-40">
          <span
            className="absolute inset-0 rounded-full"
            style={{
              background: `color-mix(in oklab, ${color} 18%, transparent)`,
              transition: "background 700ms ease",
              animation: "pulse 2.6s cubic-bezier(0.4,0,0.6,1) infinite",
            }}
          />
          <span
            key={current}
            className="emoji relative select-none text-6xl sm:text-7xl"
            style={{
              display: "inline-block",
              filter: phase === "out" ? "blur(6px)" : "blur(0px)",
              opacity: phase === "out" ? 0 : 1,
              transform:
                phase === "out"
                  ? "scale(0.7) rotate(-14deg)"
                  : "scale(1) rotate(0deg)",
              transition:
                "transform 420ms cubic-bezier(0.16,1,0.3,1), opacity 420ms ease, filter 420ms ease",
            }}
          >
            {EMOTION_EMOJI[current]}
          </span>
        </div>

        <div
          className={cn(
            "min-w-0 flex-1",
            stacked ? "text-center" : "text-center sm:text-left",
          )}
        >
          <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            Emotion in focus
          </p>
          <h3
            className="display mt-1 text-3xl leading-none sm:text-4xl"
            style={{ color, transition: "color 700ms ease" }}
          >
            {EMOTION_LABEL[current]}
          </h3>
          <p
            className={cn(
              "mt-2 text-sm leading-relaxed text-muted-foreground whitespace-pre-line min-h-[40px]",
              stacked ? "max-w-full" : "max-w-md",
            )}
          >
            {captions[current]}
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            <span className="numeral text-sm font-bold text-foreground">
              {(shares[current] * 100).toFixed(1)}%
            </span>
            <br />
            of developer prompts
          </p>
        </div>
      </div>
    </div>
  );
}

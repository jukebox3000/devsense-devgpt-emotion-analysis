import { useEffect, useRef, useState, type ReactNode } from "react";
import { EMOTIONS, EMOTION_LABEL } from "@/lib/emotions";
import { cn } from "@/lib/utils";

export function Panel({
  title,
  subtitle,
  children,
  insight,
  className,
}: {
  title: ReactNode;
  subtitle?: string;
  children: ReactNode;
  insight?: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry && entry.isIntersecting) {
          observer.disconnect();
          timeoutId = setTimeout(() => {
            setIsVisible(true);
          }, 300);
        }
      },
      {
        threshold: 0.05,
        rootMargin: "0px 0px -120px 0px"
      }
    );
    if (ref.current) {
      observer.observe(ref.current);
    }
    return () => {
      observer.disconnect();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  return (
    <section
      ref={ref}
      className={cn(
        "panel flex flex-col p-5 transition-all duration-700 ease-out",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
        className
      )}
    >
      <header className="mb-4">
        <h3 className="text-base font-semibold tracking-tight text-foreground">
          {title}
        </h3>
        {subtitle && (
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        )}
      </header>
      <div className="flex-1 min-h-[200px]">
        {isVisible ? children : null}
      </div>
      {insight && (
        <p className="mt-4 border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground">Reading: </span>
          {insight}
        </p>
      )}
    </section>
  );
}

export function KpiCard({
  label,
  value,
  hint,
  tone,
  className,
  bgEmoji,
  variant,
  progress,
  style,
  bgEmojiCentered = false
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  hint?: React.ReactNode;
  tone?: "frustration" | "caution" | "neutral" | "satisfaction";
  className?: string;
  bgEmoji?: string;
  variant?: "default" | "outline";
  progress?: number;
  style?: React.CSSProperties;
  bgEmojiCentered?: boolean;
}) {
  const bar = {
    frustration: "bg-frustration",
    caution: "bg-caution",
    neutral: "bg-neutral",
    satisfaction: "bg-satisfaction",
  };
  const outlineBorder = {
    frustration: "border-frustration",
    caution: "border-caution",
    neutral: "border-neutral",
    satisfaction: "border-satisfaction",
  };
  const textClr = {
    frustration: "text-frustration/90",
    caution: "text-caution/90",
    neutral: "text-neutral/90",
    satisfaction: "text-satisfaction/90",
  };
  return (
    <div className={cn(
      "panel rise-in relative overflow-hidden p-3 transition-transform duration-300 hover:-translate-y-0.5",
      variant === "outline" ? "bg-transparent border" : "",
      variant === "outline" && tone ? outlineBorder[tone] : "",
      className
    )}
      style={style}
    >
      {progress !== undefined && tone && (
        <div
          className={cn("absolute left-0 bottom-0 top-0 opacity-25 transition-all duration-1000 ease-out z-0", bar[tone])}
          style={{ width: `${progress * 100}%` }}
        />
      )}
      {tone && variant !== "outline" && (
        <span className={cn("absolute inset-x-0 top-0 h-1 z-10", bar[tone])} />
      )}
      {bgEmoji && (
        <div
          className={cn(
            "absolute leading-none pointer-events-none select-none z-0",
            bgEmojiCentered
              ? "left-0 right-0 bottom-0 top-0 flex items-center justify-end text-[8.5rem] overflow-hidden"
              : "right-[-3.5rem] top-1/2 -translate-y-1/2 text-[8rem] opacity-20"
          )}
          style={bgEmojiCentered ? {
            opacity: 0.12,
            maskImage: "linear-gradient(to right, transparent 5%, rgba(0, 0, 0, 0.15) 35%, rgba(0, 0, 0, 1) 100%)",
            WebkitMaskImage: "linear-gradient(to right, transparent 5%, rgba(0, 0, 0, 0.15) 35%, rgba(0, 0, 0, 1) 100%)",
            transform: "translateX(12%)",
          } : undefined}
        >
          {bgEmoji}
        </div>
      )}
      <div className="relative z-10">
        <p className="text-[10px] font-medium uppercase tracking-[0.09em] text-muted-foreground">
          {label}
        </p>
        <p className={cn("display mt-2 text-3xl leading-none", tone ? textClr[tone] : "text-foreground")}>
          {value}
        </p>
        <div className="mt-1 text-xs leading-snug text-muted-foreground">{hint}</div>
      </div>
    </div>
  );
}

export function EmotionLegend({ note }: { note?: string }) {
  const dot = {
    frustration: "bg-frustration",
    caution: "bg-caution",
    neutral: "bg-neutral",
    satisfaction: "bg-satisfaction",
  };
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
      {EMOTIONS.map((e) => (
        <span key={e} className="flex items-center gap-1.5">
          <span className={cn("size-2.5 rounded-sm", dot[e])} />
          {EMOTION_LABEL[e]}
        </span>
      ))}
      {note && <span className="text-muted-foreground/70">· {note}</span>}
    </div>
  );
}

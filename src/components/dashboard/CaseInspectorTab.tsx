import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { useLoaderData } from "@tanstack/react-router";
import {
  EMOTIONS,
  EMOTION_LABEL,
  EMOTION_EMOJI,
  type Emotion,
  type Conversation,
} from "@/lib/emotions";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { fmtPct } from "@/components/charts/chart-utils";
import {
  X,
  Minus,
  Maximize2,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Search,
  MessageSquare,
} from "lucide-react";

// Import image assets for avatars
import gptLogo from "../../../assets/black-gpt-chat-logo-on-white-background-logo-illustration-free-vector.jpg";
import devLogo from "../../../assets/user-profile-icon-free-vector-658200527.jpg";

// Standard theme hex colors for emotion tags (matching project colors, neutral = blue)
const EMOTION_COLORS: Record<Emotion, string> = {
  frustration: "#c0392b",
  caution: "#c48f0a",
  neutral: "#3b6fa5",
  satisfaction: "#27ae60",
};

export function CaseInspectorTab({
  selectedId: propSelectedId,
  setSelectedId: propSetSelectedId,
}: {
  selectedId?: string | null;
  setSelectedId?: (id: string | null) => void;
}) {
  const kpiData = useLoaderData({ from: "/" }) as {
    conversations?: Conversation[];
  };
  const conversations = useMemo<Conversation[]>(
    () => kpiData.conversations || [],
    [kpiData.conversations],
  );

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Emotion | "all">("all");

  const [localSelectedId, localSetSelectedId] = useState<string | null>(null);
  const selectedId =
    propSelectedId !== undefined ? propSelectedId : localSelectedId;
  const setSelectedId =
    propSetSelectedId !== undefined ? propSetSelectedId : localSetSelectedId;

  const [sortKey, setSortKey] = useState<
    | "id"
    | "title"
    | "turns"
    | "devEmotion"
    | "gptEmotion"
    | "confidence"
    | "source"
    | "language"
    | null
  >("turns");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const hasAutoSelected = useRef(false);

  // Auto-select the first conversation when they load
  useEffect(() => {
    if (!hasAutoSelected.current && conversations.length > 0) {
      setSelectedId(conversations[0]?.id ?? null);
      hasAutoSelected.current = true;
    }
  }, [conversations, setSelectedId]);

  // Floating window states
  const [panelWidth, setPanelWidth] = useState(480);
  const [panelHeight, setPanelHeight] = useState(0);
  const [isMinimized, setIsMinimized] = useState(true);
  const [highlightTurnId, setHighlightTurnId] = useState<number | null>(null);

  useEffect(() => {
    setPanelHeight(
      Math.round(Math.max(320, Math.min(700, window.innerHeight * 0.5))),
    );
  }, []);

  const getDominantEmotion = useCallback(
    (c: Conversation, key: "promptEmotion" | "answerEmotion") => {
      return EMOTIONS.reduce(
        (best, e) =>
          c.turns.filter((t) => t[key] === e).length >
          c.turns.filter((t) => t[key] === best).length
            ? e
            : best,
        "neutral" as Emotion,
      );
    },
    [],
  );

  const getAvgConfidence = useCallback((c: Conversation) => {
    const sum = c.turns.reduce(
      (s, t) => s + (t.promptScore + t.answerScore) / 2,
      0,
    );
    return sum / c.turns.length;
  }, []);

  // Filter list by query, emotion, and maximum turn count
  const list = useMemo(() => {
    return conversations.filter((c) => {
      const maxTurnCount = 90;
      const matchesQuery =
        !query ||
        `${c.id} ${c.title} ${c.language} ${c.source}`
          .toLowerCase()
          .includes(query.toLowerCase());
      const matchesFilter =
        filter === "all" || c.turns.some((t) => t.promptEmotion === filter);
      const matchesTurnLimit = c.turns.length <= maxTurnCount;
      return matchesQuery && matchesFilter && matchesTurnLimit;
    });
  }, [query, filter, conversations]);

  // Sort list
  const sortedList = useMemo(() => {
    const result = [...list];
    if (sortKey) {
      result.sort((a, b) => {
        let valA: string | number = "";
        let valB: string | number = "";

        if (sortKey === "id") {
          valA = a.id;
          valB = b.id;
        } else if (sortKey === "title") {
          valA = a.title.toLowerCase();
          valB = b.title.toLowerCase();
        } else if (sortKey === "turns") {
          valA = a.turns.length;
          valB = b.turns.length;
        } else if (sortKey === "devEmotion") {
          valA = getDominantEmotion(a, "promptEmotion");
          valB = getDominantEmotion(b, "promptEmotion");
        } else if (sortKey === "gptEmotion") {
          valA = getDominantEmotion(a, "answerEmotion");
          valB = getDominantEmotion(b, "answerEmotion");
        } else if (sortKey === "confidence") {
          valA = getAvgConfidence(a);
          valB = getAvgConfidence(b);
        } else if (sortKey === "source") {
          valA = a.source.toLowerCase();
          valB = b.source.toLowerCase();
        } else if (sortKey === "language") {
          valA = a.language.toLowerCase();
          valB = b.language.toLowerCase();
        }

        if (valA < valB) return sortDirection === "asc" ? -1 : 1;
        if (valA > valB) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [list, sortKey, sortDirection, getDominantEmotion, getAvgConfidence]);

  const selectedConversation = useMemo(() => {
    return conversations.find((c) => c.id === selectedId) || null;
  }, [selectedId, conversations]);

  const handleSort = (key: typeof sortKey) => {
    if (!key) return;
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const renderSortIcon = (key: typeof sortKey) => {
    if (sortKey !== key)
      return <ArrowUpDown className="ml-1 size-3.5 opacity-40 inline" />;
    return sortDirection === "asc" ? (
      <ChevronUp className="ml-1 size-3.5 text-primary inline" />
    ) : (
      <ChevronDown className="ml-1 size-3.5 text-primary inline" />
    );
  };

  // Drag resizing callback helper
  const startDrag = useCallback(
    (
      e: React.MouseEvent,
      cursor: string,
      onMove: (dx: number, dy: number) => void,
    ) => {
      e.preventDefault();
      const startX = e.clientX;
      const startY = e.clientY;
      document.body.style.cursor = cursor;
      document.body.style.userSelect = "none";

      const move = (ev: MouseEvent) => {
        onMove(ev.clientX - startX, ev.clientY - startY);
      };
      const up = () => {
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        window.removeEventListener("mousemove", move);
        window.removeEventListener("mouseup", up);
      };
      window.addEventListener("mousemove", move);
      window.addEventListener("mouseup", up);
    },
    [],
  );

  return (
    <div className="space-y-6 relative h-full">
      {/* Top Filter and Search Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-muted/20 p-4 rounded-xl border border-border/40">
        <div className="flex flex-col gap-2 self-start md:self-auto">
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            <span className="hidden sm:inline">Developer emotion</span>
            <span className="inline sm:hidden">DEV EMOTION</span>
          </span>
          <div className="flex flex-wrap gap-1.5">
            {(["all", ...EMOTIONS] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs cursor-pointer transition-all duration-200",
                  filter === f
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border text-muted-foreground hover:text-foreground hover:bg-muted/50",
                )}
              >
                {f === "all" ? "All Moods" : EMOTION_LABEL[f]}
              </button>
            ))}
          </div>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search topic, lang, source..."
            className="pl-9 h-9 text-xs rounded-full bg-background border-border/50"
          />
        </div>
      </div>

      {/* Conversation List Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm flex flex-col">
        <div className="max-h-[550px] overflow-y-auto custom-scrollbar">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="sticky top-0 bg-muted/90 backdrop-blur-md z-10 border-b border-border select-none">
              <tr>
                <th
                  onClick={() => handleSort("title")}
                  className="p-4 font-semibold text-muted-foreground cursor-pointer hover:text-foreground transition-colors w-1/3"
                >
                  Conversation Title {renderSortIcon("title")}
                </th>
                <th
                  onClick={() => handleSort("source")}
                  className="p-4 font-semibold text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                >
                  Category {renderSortIcon("source")}
                </th>
                <th
                  onClick={() => handleSort("language")}
                  className="p-4 font-semibold text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                >
                  Language {renderSortIcon("language")}
                </th>
                <th
                  onClick={() => handleSort("turns")}
                  className="p-4 font-semibold text-muted-foreground cursor-pointer hover:text-foreground transition-colors text-center"
                >
                  Turns {renderSortIcon("turns")}
                </th>
                <th
                  onClick={() => handleSort("devEmotion")}
                  className="p-4 font-semibold text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                >
                  Dev Emotion {renderSortIcon("devEmotion")}
                </th>
                <th
                  onClick={() => handleSort("gptEmotion")}
                  className="p-4 font-semibold text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                >
                  GPT Emotion {renderSortIcon("gptEmotion")}
                </th>
                <th
                  onClick={() => handleSort("confidence")}
                  className="p-4 font-semibold text-muted-foreground cursor-pointer hover:text-foreground transition-colors text-right"
                >
                  Avg Confidence {renderSortIcon("confidence")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {sortedList.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="p-8 text-center text-muted-foreground"
                  >
                    No conversations matches search parameters.
                  </td>
                </tr>
              ) : (
                sortedList.map((c) => {
                  const devEmo = getDominantEmotion(c, "promptEmotion");
                  const gptEmo = getDominantEmotion(c, "answerEmotion");
                  const avgConf = getAvgConfidence(c);
                  const isSelected = c.id === selectedId;

                  return (
                    <tr
                      key={c.id}
                      onClick={() => {
                        setSelectedId(c.id);
                      }}
                      className={cn(
                        "cursor-pointer transition-colors border-l-2",
                        isSelected
                          ? "bg-accent/40 border-l-primary font-medium"
                          : "hover:bg-muted/30 border-l-transparent",
                      )}
                    >
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          <span className="font-medium text-foreground line-clamp-1">
                            {c.title}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {c.id}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 uppercase tracking-wider font-mono text-[10px]">
                        {c.source.replace("_", " ")}
                      </td>
                      <td className="p-4 font-mono text-[10px] text-muted-foreground">
                        {c.language}
                      </td>
                      <td className="p-4 text-center numeral font-bold">
                        {c.turns.length}
                      </td>
                      <td className="p-4">
                        <span
                          className="text-[11px] font-semibold px-2 py-0.5 rounded-md"
                          style={{
                            backgroundColor: `${EMOTION_COLORS[devEmo]}15`,
                            color: EMOTION_COLORS[devEmo],
                          }}
                        >
                          {devEmo}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className="text-[11px] font-semibold px-2 py-0.5 rounded-md"
                          style={{
                            backgroundColor: `${EMOTION_COLORS[gptEmo]}15`,
                            color: EMOTION_COLORS[gptEmo],
                          }}
                        >
                          {gptEmo}
                        </span>
                      </td>
                      <td className="p-4 text-right font-mono text-muted-foreground">
                        {fmtPct(avgConf, 0)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="bg-muted/10 border-t border-border p-3 text-xs text-muted-foreground flex justify-between items-center">
          <span>
            Showing {sortedList.length} of {conversations.length} conversations
          </span>
          {selectedId && (
            <button
              onClick={() => setIsMinimized(false)}
              className="text-primary hover:underline flex items-center gap-1"
            >
              <MessageSquare className="size-3.5" /> Re-open viewer
            </button>
          )}
        </div>
      </div>

      {/* Floating resizable Chat Viewer */}
      {selectedConversation && (
        <ConversationViewer
          conversation={selectedConversation}
          panelWidth={panelWidth}
          panelHeight={panelHeight}
          setPanelWidth={setPanelWidth}
          setPanelHeight={setPanelHeight}
          isMinimized={isMinimized}
          setIsMinimized={setIsMinimized}
          onClose={() => setIsMinimized(true)}
          startDrag={startDrag}
          highlightTurnId={highlightTurnId}
        />
      )}
    </div>
  );
}

// Conversation Viewer Component
interface ConversationViewerProps {
  conversation: Conversation;
  panelWidth: number;
  panelHeight: number;
  setPanelWidth: (w: number) => void;
  setPanelHeight: (h: number) => void;
  isMinimized: boolean;
  setIsMinimized: (m: boolean) => void;
  onClose: () => void;
  startDrag: (
    e: React.MouseEvent,
    cursor: string,
    onMove: (dx: number, dy: number) => void,
  ) => void;
  highlightTurnId: number | null;
}

function ConversationViewer({
  conversation,
  panelWidth,
  panelHeight,
  setPanelWidth,
  setPanelHeight,
  isMinimized,
  setIsMinimized,
  onClose,
  startDrag,
  highlightTurnId,
}: ConversationViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to highlighted turn
  useEffect(() => {
    if (highlightTurnId !== null && containerRef.current && !isMinimized) {
      const targetElement = containerRef.current.querySelector(
        `[data-turn-id="${highlightTurnId}"]`,
      );
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [highlightTurnId, conversation, isMinimized]);

  return (
    <div
      className="fixed bottom-6 right-6 z-[9999] flex flex-col rounded-2xl border border-border bg-background/95 backdrop-blur-md overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.15)] transition-all duration-150"
      style={{ width: panelWidth, height: isMinimized ? 52 : panelHeight }}
    >
      {/* Left resize handle */}
      <div
        className="absolute left-0 top-0 w-1.5 h-full cursor-ew-resize z-50 hover:bg-primary/20"
        onMouseDown={(e) => {
          const w0 = panelWidth;
          startDrag(e, "ew-resize", (dx) => {
            setPanelWidth(Math.max(320, Math.min(800, w0 - dx)));
          });
        }}
      />
      {/* Top resize handle */}
      <div
        className="absolute left-0 top-0 h-1.5 w-full cursor-ns-resize z-50 hover:bg-primary/20"
        onMouseDown={(e) => {
          const h0 = panelHeight;
          startDrag(e, "ns-resize", (_, dy) => {
            setPanelHeight(Math.max(250, Math.min(900, h0 - dy)));
          });
        }}
      />
      {/* Top-Left corner resize handle */}
      <div
        className="absolute left-0 top-0 w-3 h-3 cursor-nwse-resize z-50 hover:bg-primary/30"
        onMouseDown={(e) => {
          const w0 = panelWidth;
          const h0 = panelHeight;
          startDrag(e, "nwse-resize", (dx, dy) => {
            setPanelWidth(Math.max(320, Math.min(800, w0 - dx)));
            setPanelHeight(Math.max(250, Math.min(900, h0 - dy)));
          });
        }}
      />

      {/* Floating window Header */}
      <header
        className="h-[52px] bg-muted/60 border-b border-border px-4 py-3 flex items-center justify-between cursor-pointer select-none shrink-0"
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <div className="flex flex-col gap-0.5 max-w-[70%]">
          <span className="text-[10px] tracking-wider text-muted-foreground uppercase font-mono truncate">
            {conversation.id} · {conversation.language}
          </span>
          <h4 className="text-sm font-extrabold text-foreground truncate">
            {conversation.title}
          </h4>
        </div>
        <div
          className="flex items-center gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title={isMinimized ? "Expand" : "Minimize"}
          >
            {isMinimized ? (
              <Maximize2 className="size-3.5" />
            ) : (
              <Minus className="size-3.5" />
            )}
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
            title="Minimize"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </header>

      {/* Floating window content */}
      {!isMinimized && (
        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar bg-slate-50/20"
        >
          {conversation.turns.map((t) => {
            const devColor = EMOTION_COLORS[t.promptEmotion];
            const gptColor = EMOTION_COLORS[t.answerEmotion];

            return (
              <div key={t.index} className="space-y-4" data-turn-id={t.index}>
                {/* Developer Turn */}
                <div className="flex justify-end items-start gap-2.5">
                  {/* Bubble */}
                  <div
                    className={cn(
                      "relative px-4 py-3 rounded-2xl border transition-all duration-300 max-w-[60%] shadow-sm rounded-tr-none",
                      highlightTurnId === t.index ? "ring-2 ring-offset-2" : "",
                    )}
                    style={{
                      // Distinctly styled developer bubble: higher opacity, solid border
                      backgroundColor: `${devColor}1e`,
                      borderColor: `${devColor}70`,
                      outlineColor:
                        highlightTurnId === t.index ? devColor : undefined,
                    }}
                  >
                    <div className="pb-1 mb-1.5 border-b border-border/30 flex items-center justify-between gap-4 text-[10px] font-semibold tracking-wider">
                      <span className="text-foreground/95 font-bold uppercase">
                        DEVELOPER · TURN {t.index}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span
                          style={{ color: devColor }}
                          className="font-black text-[10.5px] tracking-wide"
                        >
                          {t.promptEmotion.toUpperCase()}
                        </span>
                        <span className="text-foreground/95 font-bold">
                          {fmtPct(t.promptScore, 0)}
                        </span>
                      </div>
                    </div>
                    <p className="whitespace-pre-wrap break-words leading-relaxed text-xs text-foreground select-text font-medium">
                      {t.prompt}
                    </p>
                  </div>
                  {/* Avatar (image asset - zoomed in) */}
                  <div className="size-8 rounded-full border border-border shrink-0 select-none overflow-hidden shadow-sm flex items-center justify-center bg-white">
                    <img
                      src={devLogo}
                      alt="Developer avatar"
                      className="size-full scale-[1.3] object-cover object-center"
                    />
                  </div>
                </div>

                {/* GPT Turn */}
                <div className="flex justify-start items-start gap-2.5">
                  {/* Avatar (image asset - zoomed in) */}
                  <div className="size-8 rounded-full border border-border shrink-0 select-none overflow-hidden shadow-sm flex items-center justify-center bg-white">
                    <img
                      src={gptLogo}
                      alt="GPT avatar"
                      className="size-full scale-[1.35] object-cover object-center"
                    />
                  </div>
                  {/* Bubble */}
                  <div
                    className={cn(
                      "relative px-4 py-3 rounded-2xl border-2 transition-all duration-300 max-w-[75%] shadow-md rounded-tl-none",
                      highlightTurnId === t.index ? "ring-2 ring-offset-2" : "",
                    )}
                    style={{
                      // Distinctly styled assistant bubble: solid border-2, colored border, shadow-md, lower bg opacity
                      backgroundColor: `${gptColor}0b`,
                      borderColor: gptColor,
                      outlineColor:
                        highlightTurnId === t.index ? gptColor : undefined,
                    }}
                  >
                    <div className="pb-1 mb-1.5 border-b border-border/30 flex items-center justify-between gap-4 text-[10px] font-semibold tracking-wider">
                      <span className="text-foreground/95 font-bold uppercase">
                        GPT · TURN {t.index}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span
                          style={{ color: gptColor }}
                          className="font-black text-[10.5px] tracking-wide"
                        >
                          {t.answerEmotion.toUpperCase()}
                        </span>
                        <span className="text-foreground/95 font-bold">
                          {fmtPct(t.answerScore, 0)}
                        </span>
                      </div>
                    </div>
                    <p className="whitespace-pre-wrap break-words leading-relaxed text-xs text-muted-foreground select-text">
                      {t.answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

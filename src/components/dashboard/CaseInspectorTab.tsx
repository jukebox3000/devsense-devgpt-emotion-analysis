import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { useLoaderData } from "@tanstack/react-router";
import {
  EMOTIONS,
  EMOTION_LABEL,
  EMOTION_EMOJI,
  type Emotion,
  type Conversation,
} from "@/lib/emotions";
import { cn } from "@/lib/utils";
import { fmtPct } from "@/components/charts/chart-utils";
import {
  X,
  Minus,
  Maximize2,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  MessageSquare,
  Filter,
  Check,
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

  const [selectedDevEmotion, setSelectedDevEmotion] = useState<Emotion | "all">("all");
  const [selectedGptEmotion, setSelectedGptEmotion] = useState<Emotion | "all">("all");
  const [isDevDropdownOpen, setIsDevDropdownOpen] = useState(false);
  const [isGptDropdownOpen, setIsGptDropdownOpen] = useState(false);

  const hasAutoSelected = useRef(false);

  // Floating window states
  const [panelWidth, setPanelWidth] = useState(480);
  const [panelHeight, setPanelHeight] = useState(0);
  const [isMinimized, setIsMinimized] = useState(true);
  const [highlightTurnId, setHighlightTurnId] = useState<number | null>(null);

  // Automatically maximize chat window when a user selects a conversation
  const prevSelectedIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (selectedId && prevSelectedIdRef.current !== null && selectedId !== prevSelectedIdRef.current) {
      setIsMinimized(false);
    }
    prevSelectedIdRef.current = selectedId;
  }, [selectedId]);

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

  // Filter list by maximum turn count and exclude single-turn neutral ChatGPT records
  const list = useMemo(() => {
    return conversations.filter((c) => {
      const maxTurnCount = 40;
      const isSingleTurnNeutralGpt =
        c.turns.length === 1 &&
        getDominantEmotion(c, "answerEmotion") === "neutral";

      if (c.turns.length > maxTurnCount || isSingleTurnNeutralGpt) {
        return false;
      }

      if (selectedDevEmotion !== "all" && getDominantEmotion(c, "promptEmotion") !== selectedDevEmotion) {
        return false;
      }

      if (selectedGptEmotion !== "all" && getDominantEmotion(c, "answerEmotion") !== selectedGptEmotion) {
        return false;
      }

      return true;
    });
  }, [conversations, getDominantEmotion, selectedDevEmotion, selectedGptEmotion]);

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
    return conversations.find((c) => c.id === selectedId) || sortedList[0] || null;
  }, [selectedId, conversations, sortedList]);

  // Auto-select the first record of the table in the page when loaded
  useEffect(() => {
    if (!hasAutoSelected.current && sortedList.length > 0) {
      setSelectedId(sortedList[0]?.id ?? null);
      hasAutoSelected.current = true;
    }
  }, [sortedList, setSelectedId]);

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
    <div className="flex flex-col h-full space-y-3.5 relative overflow-hidden">
      {/* Top Heatmap Panel */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-card p-3.5 rounded-2xl border border-border shrink-0 shadow-sm">
        <div className="flex-1 w-full overflow-hidden">
          <SelectedConversationHeatmap
            conversation={selectedConversation}
            highlightTurnId={highlightTurnId}
            onTurnClick={(turnIndex) => {
              if (selectedConversation) {
                setSelectedId(selectedConversation.id);
                setHighlightTurnId(turnIndex);
                setIsMinimized(false);
              }
            }}
          />
        </div>
      </div>

      {/* Conversation List Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="sticky top-0 bg-card/90 backdrop-blur-md z-10 border-b border-border select-none">
              <tr>
                <th
                  onClick={() => handleSort("title")}
                  className="px-4 py-2.5 font-semibold text-muted-foreground cursor-pointer hover:text-foreground transition-colors w-1/2"
                >
                  Conversation Title {renderSortIcon("title")}
                </th>
                <th
                  onClick={() => handleSort("turns")}
                  className="px-4 py-2.5 font-semibold text-muted-foreground cursor-pointer hover:text-foreground transition-colors text-center"
                >
                  Turns {renderSortIcon("turns")}
                </th>
                {/* Dev Emotion Header with Filter Dropdown */}
                <th className="px-4 py-2.5 font-semibold text-muted-foreground relative select-none">
                  <div 
                    className="flex items-center gap-1.5 cursor-pointer hover:text-foreground transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsDevDropdownOpen(!isDevDropdownOpen);
                      setIsGptDropdownOpen(false);
                    }}
                  >
                    <span>Dev Emotion</span>
                    {selectedDevEmotion !== "all" ? (
                      <span 
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-md"
                        style={{
                          backgroundColor: `${EMOTION_COLORS[selectedDevEmotion]}15`,
                          color: EMOTION_COLORS[selectedDevEmotion],
                        }}
                      >
                        {selectedDevEmotion}
                      </span>
                    ) : (
                      <Filter className="size-3 opacity-60" />
                    )}
                    <ChevronDown className="size-3 opacity-60" />
                  </div>

                  {isDevDropdownOpen && (
                    <>
                      {/* Backdrop to close when clicking outside */}
                      <div 
                        className="fixed inset-0 z-30 cursor-default" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsDevDropdownOpen(false);
                        }} 
                      />
                      <div className="absolute left-4 top-full mt-1 w-44 bg-popover border border-border rounded-lg shadow-lg z-40 p-1 text-foreground font-normal">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDevEmotion("all");
                            setIsDevDropdownOpen(false);
                          }}
                          className={cn(
                            "w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-md hover:bg-muted text-left transition-colors cursor-pointer",
                            selectedDevEmotion === "all" && "bg-muted font-medium"
                          )}
                        >
                          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-semibold bg-muted/50 text-muted-foreground border-border">
                            <span>all</span>
                          </div>
                          {selectedDevEmotion === "all" && <Check className="size-3 text-primary" />}
                        </button>
                        <div className="h-px bg-border my-1" />
                        {EMOTIONS.map((emo) => (
                          <button
                            key={emo}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDevEmotion(emo);
                              setIsDevDropdownOpen(false);
                            }}
                            className={cn(
                              "w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-md hover:bg-muted text-left transition-colors cursor-pointer",
                              selectedDevEmotion === emo && "bg-muted font-medium"
                            )}
                          >
                            <div 
                              className="flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-semibold"
                              style={{
                                backgroundColor: `${EMOTION_COLORS[emo]}15`,
                                color: EMOTION_COLORS[emo],
                                borderColor: `${EMOTION_COLORS[emo]}30`,
                              }}
                            >
                              <span>{emo}</span>
                            </div>
                            {selectedDevEmotion === emo && <Check className="size-3 text-primary" />}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </th>

                {/* GPT Emotion Header with Filter Dropdown */}
                <th className="px-4 py-2.5 font-semibold text-muted-foreground relative select-none">
                  <div 
                    className="flex items-center gap-1.5 cursor-pointer hover:text-foreground transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsGptDropdownOpen(!isGptDropdownOpen);
                      setIsDevDropdownOpen(false);
                    }}
                  >
                    <span>GPT Emotion</span>
                    {selectedGptEmotion !== "all" ? (
                      <span 
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-md"
                        style={{
                          backgroundColor: `${EMOTION_COLORS[selectedGptEmotion]}15`,
                          color: EMOTION_COLORS[selectedGptEmotion],
                        }}
                      >
                        {selectedGptEmotion}
                      </span>
                    ) : (
                      <Filter className="size-3 opacity-60" />
                    )}
                    <ChevronDown className="size-3 opacity-60" />
                  </div>

                  {isGptDropdownOpen && (
                    <>
                      {/* Backdrop to close when clicking outside */}
                      <div 
                        className="fixed inset-0 z-30 cursor-default" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsGptDropdownOpen(false);
                        }} 
                      />
                      <div className="absolute left-4 top-full mt-1 w-44 bg-popover border border-border rounded-lg shadow-lg z-40 p-1 text-foreground font-normal">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedGptEmotion("all");
                            setIsGptDropdownOpen(false);
                          }}
                          className={cn(
                            "w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-md hover:bg-muted text-left transition-colors cursor-pointer",
                            selectedGptEmotion === "all" && "bg-muted font-medium"
                          )}
                        >
                          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-semibold bg-muted/50 text-muted-foreground border-border">
                            <span>all</span>
                          </div>
                          {selectedGptEmotion === "all" && <Check className="size-3 text-primary" />}
                        </button>
                        <div className="h-px bg-border my-1" />
                        {EMOTIONS.map((emo) => (
                          <button
                            key={emo}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedGptEmotion(emo);
                              setIsGptDropdownOpen(false);
                            }}
                            className={cn(
                              "w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-md hover:bg-muted text-left transition-colors cursor-pointer",
                              selectedGptEmotion === emo && "bg-muted font-medium"
                            )}
                          >
                            <div 
                              className="flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-semibold"
                              style={{
                                backgroundColor: `${EMOTION_COLORS[emo]}15`,
                                color: EMOTION_COLORS[emo],
                                borderColor: `${EMOTION_COLORS[emo]}30`,
                              }}
                            >
                              <span>{emo}</span>
                            </div>
                            {selectedGptEmotion === emo && <Check className="size-3 text-primary" />}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {sortedList.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="p-8 text-center text-muted-foreground"
                  >
                    No conversations available.
                  </td>
                </tr>
              ) : (
                sortedList.map((c) => {
                  const devEmo = getDominantEmotion(c, "promptEmotion");
                  const gptEmo = getDominantEmotion(c, "answerEmotion");
                  const isSelected = c.id === selectedId;

                  return (
                    <tr
                      key={c.id}
                      onClick={() => {
                        setSelectedId(c.id);
                        setIsMinimized(false);
                      }}
                      className={cn(
                        "cursor-pointer transition-colors border-l-2 h-[46px]",
                        isSelected
                          ? "bg-accent/40 border-l-primary font-medium"
                          : "hover:bg-muted/30 border-l-transparent",
                      )}
                    >
                      <td className="px-4 py-2">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-foreground line-clamp-1 text-xs">
                            {c.title}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {c.id}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-center numeral font-bold text-xs">
                        {c.turns.length}
                      </td>
                      <td className="px-4 py-2">
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
                      <td className="px-4 py-2">
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
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="bg-card border-t border-border p-3 text-xs text-muted-foreground flex justify-between items-center">
          <span>
            Displaying {sortedList.length} records
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
      className="fixed bottom-6 right-6 z-[9999] flex flex-col rounded-2xl border border-border bg-card/95 backdrop-blur-md overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.15)] transition-all duration-150"
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
        className="h-[52px] bg-card border-b border-border px-4 py-3 flex items-center justify-between cursor-pointer select-none shrink-0"
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <div className="flex items-center gap-2 max-w-[75%]">
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
                        DEVELOPER
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span
                          style={{ color: devColor }}
                          className="font-black text-[10.5px] tracking-wide"
                        >
                          {t.promptEmotion.toUpperCase()}
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
                        GPT
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span
                          style={{ color: gptColor }}
                          className="font-black text-[10.5px] tracking-wide"
                        >
                          {t.answerEmotion.toUpperCase()}
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

// Interactive Turn Emotion Heatmap Component for Selected Conversation
interface SelectedConversationHeatmapProps {
  conversation: Conversation | null;
  highlightTurnId: number | null;
  onTurnClick: (turnIndex: number) => void;
}

function SelectedConversationHeatmap({
  conversation,
  highlightTurnId,
  onTurnClick,
}: SelectedConversationHeatmapProps) {
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    role: "Developer Prompt" | "ChatGPT Response" | "Turn";
    emotion?: Emotion | undefined;
    score?: number | undefined;
    turnSeq: number;
    avatar?: string | undefined;
  }>({
    visible: false,
    x: 0,
    y: 0,
    role: "Developer Prompt",
    turnSeq: 1,
  });

  if (!conversation || conversation.turns.length === 0) {
    return (
      <div className="flex flex-col justify-center text-xs text-muted-foreground py-1">
        <span>Select a conversation from the table below to inspect its turn emotion sequence heatmap.</span>
      </div>
    );
  }

  const turns = conversation.turns;

  const handleMouseEnter = (
    e: React.MouseEvent,
    role: "Developer Prompt" | "ChatGPT Response" | "Turn",
    turnSeq: number,
    emotion?: Emotion,
    score?: number,
    avatar?: string,
  ) => {
    setTooltip({
      visible: true,
      x: e.pageX,
      y: e.pageY,
      role,
      turnSeq,
      emotion,
      score,
      avatar,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    setTooltip((prev) => ({
      ...prev,
      x: e.pageX,
      y: e.pageY,
    }));
  };

  const handleMouseLeave = () => {
    setTooltip((prev) => ({ ...prev, visible: false }));
  };

  return (
    <div className="flex flex-col gap-2 w-full overflow-hidden relative">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-base font-semibold tracking-tight text-foreground whitespace-nowrap">
          Emotion Sequence Heatmap
        </h3>

        {/* Emotion Legend */}
        <div className="hidden lg:flex items-center gap-3 text-[10px] font-medium text-muted-foreground shrink-0">
          {EMOTIONS.map((e) => (
            <span key={e} className="flex items-center gap-1">
              <span
                className="w-2.5 h-2.5 rounded-full shadow-xs"
                style={{ backgroundColor: EMOTION_COLORS[e] }}
              />
              <span className="capitalize">{EMOTION_LABEL[e]}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto custom-scrollbar pb-1 pt-0.5" key={conversation.id}>
        <div className="inline-flex flex-col min-w-max border border-border/60 rounded-md bg-card overflow-hidden shadow-xs">
          {/* Row 1: Developer Prompts */}
          <div className="flex items-stretch border-b border-border/40">
            <div className="w-10 px-2 py-1.5 bg-card text-[10px] font-extrabold text-muted-foreground flex items-center justify-end border-r border-border/40 shrink-0 select-none">
              DEV
            </div>
            <div className="flex items-stretch">
              {turns.map((t, idx) => {
                const color = EMOTION_COLORS[t.promptEmotion];
                const isSelectedTurn = highlightTurnId === t.index;
                const turnSeq = idx + 1;
                return (
                  <button
                    key={`dev-${t.index}`}
                    onClick={() => onTurnClick(t.index)}
                    onMouseEnter={(e) =>
                      handleMouseEnter(
                        e,
                        "Developer Prompt",
                        turnSeq,
                        t.promptEmotion,
                        t.promptScore,
                        devLogo,
                      )
                    }
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    className={cn(
                      "w-6 h-6 border-r border-border/30 transition-all duration-150 cursor-pointer relative hover:brightness-110 animate-block-stagger",
                      isSelectedTurn ? "ring-2 ring-primary ring-inset z-10" : "",
                    )}
                    style={{
                      backgroundColor: color,
                      animationDelay: `${idx * 35}ms`,
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* Row 2: ChatGPT Responses */}
          <div className="flex items-stretch border-b border-border/40">
            <div className="w-10 px-2 py-1.5 bg-card text-[10px] font-extrabold text-muted-foreground flex items-center justify-end border-r border-border/40 shrink-0 select-none">
              GPT
            </div>
            <div className="flex items-stretch">
              {turns.map((t, idx) => {
                const color = EMOTION_COLORS[t.answerEmotion];
                const isSelectedTurn = highlightTurnId === t.index;
                const turnSeq = idx + 1;
                return (
                  <button
                    key={`gpt-${t.index}`}
                    onClick={() => onTurnClick(t.index)}
                    onMouseEnter={(e) =>
                      handleMouseEnter(
                        e,
                        "ChatGPT Response",
                        turnSeq,
                        t.answerEmotion,
                        t.answerScore,
                        gptLogo,
                      )
                    }
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    className={cn(
                      "w-6 h-6 border-r border-border/30 transition-all duration-150 cursor-pointer relative hover:brightness-110 animate-block-stagger",
                      isSelectedTurn ? "ring-2 ring-primary ring-inset z-10" : "",
                    )}
                    style={{
                      backgroundColor: color,
                      animationDelay: `${idx * 35 + 20}ms`,
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* Row 3: X-Axis Sequential Turn Counter (1, 2, 3...) */}
          <div className="flex items-stretch bg-card">
            <div className="w-10 px-2 py-1 bg-card text-[9px] font-mono text-muted-foreground/70 flex items-center justify-end border-r border-border/40 shrink-0 select-none">
              #
            </div>
            <div className="flex items-stretch">
              {turns.map((t, idx) => {
                const turnSeq = idx + 1;
                const isSelectedTurn = highlightTurnId === t.index;
                return (
                  <div
                    key={`axis-${t.index}`}
                    onClick={() => onTurnClick(t.index)}
                    onMouseEnter={(e) =>
                      handleMouseEnter(e, "Turn", turnSeq)
                    }
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    className={cn(
                      "w-6 h-5 border-r border-border/30 flex items-center justify-center text-[9px] font-mono text-muted-foreground cursor-pointer hover:text-foreground hover:bg-muted/60 transition-colors select-none animate-block-stagger",
                      isSelectedTurn ? "font-bold text-primary bg-primary/10" : "",
                    )}
                    style={{
                      animationDelay: `${idx * 35 + 40}ms`,
                    }}
                  >
                    {turnSeq}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Tooltip Component */}
      {tooltip.visible && (
        <div
          className="fixed z-[99999] pointer-events-none transition-opacity duration-150"
          style={{
            top: tooltip.y - 70,
            left: tooltip.x + 14,
            background: "rgba(15, 23, 42, 0.95)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            padding: "8px 12px",
            borderRadius: "8px",
            color: "#fff",
            fontSize: "11px",
            fontWeight: 600,
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
          }}
        >
          <div className="flex items-center gap-1.5 mb-1">
            {tooltip.avatar && (
              <img
                src={tooltip.avatar}
                className="w-3.5 h-3.5 rounded-full object-cover shrink-0"
                alt=""
              />
            )}
            <span className="text-slate-400 font-medium text-[10px]">
              Turn {tooltip.turnSeq} · {tooltip.role}
            </span>
          </div>
          {tooltip.emotion ? (
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className="font-extrabold uppercase text-[12px] tracking-wider"
                style={{ color: EMOTION_COLORS[tooltip.emotion] }}
              >
                {EMOTION_LABEL[tooltip.emotion]}
              </span>
              <span className="text-white text-[12px] font-bold">
                {fmtPct(tooltip.score || 0, 0)}
              </span>
            </div>
          ) : (
            <span className="text-white text-xs font-bold">
              Click to jump to Turn {tooltip.turnSeq}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

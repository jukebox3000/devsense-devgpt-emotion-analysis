import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import {
  EMOTIONS,
  EMOTION_LABEL,
  EMOTION_EMOJI,
  EMOTION_HEX,
  type Emotion,
  type Conversation,
} from "@/lib/emotions";
import { useChartWidth, useIsLoading, fmtPct } from "./chart-utils";

export type SankeyDiagramProps = {
  conversations: Conversation[];
  activeFilters?: Emotion[];
  height?: number;
};

/** Safe helper to get emotion from index 0..3 */
function getEmotion(index: number): Emotion {
  return EMOTIONS[index] ?? "neutral";
}

/**
 * Computes the 4x4 transition matrix from Start Prompt Emotion (Turn 1) -> End Prompt Emotion (Final Turn)
 */
export function computeStartToEndEmotionMatrix(conversations: Conversation[]) {
  const matrix: number[][] = [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];

  let totalValidConvs = 0;

  for (const conv of conversations) {
    if (!conv.turns || conv.turns.length === 0) continue;

    // 1. Start Prompt Emotion (First turn)
    const firstTurn = conv.turns[0];
    if (!firstTurn || !firstTurn.promptEmotion || !EMOTIONS.includes(firstTurn.promptEmotion)) {
      continue;
    }
    const startEmotion = firstTurn.promptEmotion;

    // 2. End Prompt Emotion (Last turn)
    const lastTurn = conv.turns[conv.turns.length - 1];
    if (!lastTurn || !lastTurn.promptEmotion || !EMOTIONS.includes(lastTurn.promptEmotion)) {
      continue;
    }
    const endEmotion = lastTurn.promptEmotion;

    const startIdx = EMOTIONS.indexOf(startEmotion);
    const endIdx = EMOTIONS.indexOf(endEmotion);

    if (startIdx >= 0 && endIdx >= 0 && matrix[startIdx] && matrix[startIdx]![endIdx] !== undefined) {
      matrix[startIdx]![endIdx]! += 1;
      totalValidConvs++;
    }
  }

  return { matrix, totalValidConvs };
}

export function SankeyDiagram({
  conversations,
  activeFilters = [],
  height = 420,
}: SankeyDiagramProps) {
  const { ref, width } = useChartWidth();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isLoading = useIsLoading();

  const [isVisible, setIsVisible] = useState(false);
  const hasAnimatedRef = useRef(false);

  const [hoveredSourceIdx, setHoveredSourceIdx] = useState<number | null>(null);
  const [hoveredTargetIdx, setHoveredTargetIdx] = useState<number | null>(null);
  const [hoveredLinkKey, setHoveredLinkKey] = useState<string | null>(null);

  // IntersectionObserver to detect when the visualization enters the viewport
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry && entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Compute matrix data (Start -> End)
  const { matrix, totalValidConvs } = useMemo(() => {
    return computeStartToEndEmotionMatrix(conversations);
  }, [conversations]);

  // Derived statistics for key findings
  const stats = useMemo(() => {
    if (!totalValidConvs) return null;

    const rowTotals = matrix.map((row) => row.reduce((sum, v) => sum + v, 0));

    // Frustration start (index 0) -> non-frustration end
    const frustRowTotal = rowTotals[0] || 1;
    const frustToFrust = matrix[0]?.[0] ?? 0;
    const frustRecovered = frustRowTotal - frustToFrust;
    const frustRecoveryRate = frustRecovered / frustRowTotal;

    // Satisfaction start (index 3) -> satisfaction end
    const satRowTotal = rowTotals[3] || 1;
    const satRetention = (matrix[3]?.[3] ?? 0) / satRowTotal;

    // Find overall dominant transition
    let maxTransition = { src: 0, tgt: 0, count: 0 };
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const val = matrix[r]?.[c] ?? 0;
        if (val > maxTransition.count) {
          maxTransition = { src: r, tgt: c, count: val };
        }
      }
    }

    const srcEmo = getEmotion(maxTransition.src);
    const tgtEmo = getEmotion(maxTransition.tgt);

    return {
      rowTotals,
      frustRecoveryRate,
      frustRecoveredCount: frustRecovered,
      frustTotalCount: frustRowTotal,
      satRetention,
      maxTransition: {
        srcLabel: EMOTION_LABEL[srcEmo],
        srcEmoji: EMOTION_EMOJI[srcEmo],
        tgtLabel: EMOTION_LABEL[tgtEmo],
        tgtEmoji: EMOTION_EMOJI[tgtEmo],
        count: maxTransition.count,
        share: maxTransition.count / totalValidConvs,
      },
    };
  }, [matrix, totalValidConvs]);

  useEffect(() => {
    if (isLoading) return;
    if (!width || !svgRef.current || totalValidConvs === 0) return;

    const margin = { top: 32, right: 165, bottom: 24, left: 165 };
    const chartHeight = Math.max(360, height);
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = chartHeight - margin.top - margin.bottom;

    const nodeWidth = 20;
    const nodePadding = 14;
    const totalPadding = nodePadding * 3;
    const usableHeight = innerHeight - totalPadding;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const defs = svg.append("defs");

    // Reveal clipPath for left-to-right flow stream transition
    const clipRect = defs
      .append("clipPath")
      .attr("id", "sankey-reveal-clip")
      .append("rect")
      .attr("x", 0)
      .attr("y", -margin.top)
      .attr("width", hasAnimatedRef.current ? innerWidth + nodeWidth + 120 : 0)
      .attr("height", chartHeight + 100);

    // Trigger clip width animation once when comes onto screen
    if (isVisible && !hasAnimatedRef.current) {
      clipRect
        .transition()
        .duration(1100)
        .ease(d3.easeCubicInOut)
        .attr("width", innerWidth + nodeWidth + 120)
        .on("end", () => {
          hasAnimatedRef.current = true;
        });
    }

    // Add tooltip element if not present
    let tooltipDiv = d3.select<HTMLDivElement, unknown>("#chart-tooltip");
    if (tooltipDiv.empty()) {
      tooltipDiv = d3
        .select("body")
        .append("div")
        .attr("id", "chart-tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background", "rgba(9, 9, 11, 0.94)")
        .style("backdrop-filter", "blur(12px) saturate(160%)")
        .style("border", "1px solid rgba(255, 255, 255, 0.12)")
        .style("padding", "12px 16px")
        .style("border-radius", "12px")
        .style("color", "#fff")
        .style("font-family", "system-ui, -apple-system, sans-serif")
        .style("box-shadow", "0 10px 25px -5px rgba(0, 0, 0, 0.5)")
        .style("pointer-events", "none")
        .style("z-index", "99999")
        .style("min-width", "210px")
        .style("transition", "opacity 0.12s ease")
        .style("opacity", "0");
    }

    const g = svg
      .attr("viewBox", `0 0 ${width} ${chartHeight}`)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // 1. Calculate Source Nodes (Left column: Start Emotion Turn 1)
    const sourceTotals = matrix.map((row) => row.reduce((a, b) => a + b, 0));
    const sourceNodes: Array<{
      index: number;
      emotion: Emotion;
      value: number;
      y0: number;
      y1: number;
      height: number;
    }> = [];

    let currentSourceY = 0;
    for (let i = 0; i < 4; i++) {
      const val = sourceTotals[i] ?? 0;
      const h = Math.max(6, (val / totalValidConvs) * usableHeight);
      sourceNodes.push({
        index: i,
        emotion: getEmotion(i),
        value: val,
        y0: currentSourceY,
        y1: currentSourceY + h,
        height: h,
      });
      currentSourceY += h + nodePadding;
    }

    // 2. Calculate Target Nodes (Right column: End Emotion Final Turn)
    const targetTotals = [0, 0, 0, 0];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        targetTotals[c] = (targetTotals[c] ?? 0) + (matrix[r]?.[c] ?? 0);
      }
    }

    const targetNodes: Array<{
      index: number;
      emotion: Emotion;
      value: number;
      y0: number;
      y1: number;
      height: number;
    }> = [];

    let currentTargetY = 0;
    for (let j = 0; j < 4; j++) {
      const val = targetTotals[j] ?? 0;
      const h = Math.max(6, (val / totalValidConvs) * usableHeight);
      targetNodes.push({
        index: j,
        emotion: getEmotion(j),
        value: val,
        y0: currentTargetY,
        y1: currentTargetY + h,
        height: h,
      });
      currentTargetY += h + nodePadding;
    }

    // 3. Compute Links (Streams)
    type SankeyLink = {
      key: string;
      srcIndex: number;
      tgtIndex: number;
      value: number;
      sy0: number;
      sy1: number;
      ty0: number;
      ty1: number;
      srcEmo: Emotion;
      tgtEmo: Emotion;
    };

    const links: SankeyLink[] = [];

    const sourceOffsets = sourceNodes.map((n) => n.y0);
    const targetOffsets = targetNodes.map((n) => n.y0);

    for (let r = 0; r < 4; r++) {
      const sNode = sourceNodes[r];
      if (!sNode || sNode.value === 0) continue;

      for (let c = 0; c < 4; c++) {
        const val = matrix[r]?.[c] ?? 0;
        if (val === 0) continue;

        const tNode = targetNodes[c];
        if (!tNode) continue;

        const linkH_src = (val / sNode.value) * sNode.height;
        const linkH_tgt = (val / tNode.value) * tNode.height;

        const sy0 = sourceOffsets[r]!;
        const sy1 = sy0 + linkH_src;
        sourceOffsets[r] = sy1;

        const ty0 = targetOffsets[c]!;
        const ty1 = ty0 + linkH_tgt;
        targetOffsets[c] = ty1;

        links.push({
          key: `${r}-${c}`,
          srcIndex: r,
          tgtIndex: c,
          value: val,
          sy0,
          sy1,
          ty0,
          ty1,
          srcEmo: getEmotion(r),
          tgtEmo: getEmotion(c),
        });

        // Create linear gradient for link
        const gradId = `sankey-grad-${r}-${c}`;
        const gradient = defs
          .append("linearGradient")
          .attr("id", gradId)
          .attr("gradientUnits", "userSpaceOnUse")
          .attr("x1", nodeWidth)
          .attr("x2", innerWidth);

        gradient
          .append("stop")
          .attr("offset", "0%")
          .attr("stop-color", EMOTION_HEX[getEmotion(r)])
          .attr("stop-opacity", 0.75);

        gradient
          .append("stop")
          .attr("offset", "100%")
          .attr("stop-color", EMOTION_HEX[getEmotion(c)])
          .attr("stop-opacity", 0.75);
      }
    }

    // Helper to generate SVG path string for a Sankey link curve
    function generateLinkPath(d: SankeyLink) {
      const x0 = nodeWidth;
      const x1 = innerWidth;
      const dx = (x1 - x0) * 0.48;

      return `
        M ${x0} ${d.sy0}
        C ${x0 + dx} ${d.sy0}, ${x1 - dx} ${d.ty0}, ${x1} ${d.ty0}
        L ${x1} ${d.ty1}
        C ${x1 - dx} ${d.ty1}, ${x0 + dx} ${d.sy1}, ${x0} ${d.sy1}
        Z
      `;
    }

    // 4. Draw Links (Sankey Ribbons) with entrance reveal clipPath
    const linkGroup = g
      .append("g")
      .attr("class", "links")
      .attr("clip-path", "url(#sankey-reveal-clip)");

    linkGroup
      .selectAll("path")
      .data(links)
      .join("path")
      .attr("d", generateLinkPath)
      .attr("fill", (d) => `url(#sankey-grad-${d.srcIndex}-${d.tgtIndex})`)
      .attr("stroke", (d) => EMOTION_HEX[d.srcEmo])
      .attr("stroke-width", 0.4)
      .attr("stroke-opacity", 0.3)
      .style("cursor", "pointer")
      .style("transition", "opacity 0.2s ease")
      .style("opacity", (d) => {
        if (hoveredLinkKey) {
          return hoveredLinkKey === d.key ? 0.95 : 0.08;
        }
        if (hoveredSourceIdx !== null) {
          return d.srcIndex === hoveredSourceIdx ? 0.9 : 0.08;
        }
        if (hoveredTargetIdx !== null) {
          return d.tgtIndex === hoveredTargetIdx ? 0.9 : 0.08;
        }
        if (activeFilters.length > 0) {
          return activeFilters.includes(d.srcEmo) || activeFilters.includes(d.tgtEmo)
            ? 0.85
            : 0.12;
        }
        return 0.65;
      })
      .on("mouseover", (event, d) => {
        setHoveredLinkKey(d.key);

        const globalShare = d.value / totalValidConvs;
        const sNodeVal = sourceNodes[d.srcIndex]?.value || 1;
        const rowShare = d.value / sNodeVal;

        const srcColor = EMOTION_HEX[d.srcEmo];
        const tgtColor = EMOTION_HEX[d.tgtEmo];
        const srcLabelCaps = EMOTION_LABEL[d.srcEmo].toUpperCase();
        const tgtLabelCaps = EMOTION_LABEL[d.tgtEmo].toUpperCase();

        tooltipDiv
          .style("visibility", "visible")
          .style("opacity", "1")
          .html(`
            <div style="font-weight: 800; font-size: 13px; margin-bottom: 6px; border-bottom: 1px solid rgba(255,255,255,0.12); padding-bottom: 5px; display: flex; align-items: center; gap: 5px;">
              <span style="color: ${srcColor}; font-weight: 800; letter-spacing: 0.04em;">${srcLabelCaps}</span>
              <span style="color: #94a3b8; font-weight: 400;">➔</span>
              <span style="color: ${tgtColor}; font-weight: 800; letter-spacing: 0.04em;">${tgtLabelCaps}</span>
            </div>
            <div style="font-size: 11.5px; color: rgba(255,255,255,0.9); line-height: 1.6;">
              <div><strong>Volume:</strong> ${d.value.toLocaleString()} conversations</div>
              <div><strong>BEGINS WITH <span style="color: ${srcColor}; font-weight: 800;">${srcLabelCaps}</span>:</strong> ${fmtPct(rowShare, 1)}</div>
              <div><strong>Share of Total Dataset:</strong> ${fmtPct(globalShare, 1)}</div>
            </div>
          `);
      })
      .on("mousemove", (event) => {
        tooltipDiv
          .style("top", `${event.pageY - 15}px`)
          .style("left", `${event.pageX + 18}px`);
      })
      .on("mouseout", () => {
        setHoveredLinkKey(null);
        tooltipDiv.style("visibility", "hidden").style("opacity", "0");
      });

    // 5. Draw Source Nodes (Left Column - Start Emotion) with entrance scale animation
    const srcNodeGroup = g.append("g").attr("class", "source-nodes");

    const srcNodesG = srcNodeGroup
      .selectAll("g")
      .data(sourceNodes)
      .join("g")
      .attr("transform", (d) => `translate(0, ${d.y0})`);

    const srcRects = srcNodesG
      .append("rect")
      .attr("width", nodeWidth)
      .attr("rx", 3)
      .attr("fill", (d) => EMOTION_HEX[d.emotion])
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.2)
      .style("cursor", "pointer")
      .style("transition", "opacity 0.2s ease")
      .style("opacity", (d) => {
        if (hoveredSourceIdx !== null) {
          return hoveredSourceIdx === d.index ? 1.0 : 0.35;
        }
        if (activeFilters.length > 0) {
          return activeFilters.includes(d.emotion) ? 1.0 : 0.35;
        }
        return 0.95;
      });

    if (!hasAnimatedRef.current && isVisible) {
      srcRects
        .attr("height", 0)
        .attr("y", (d) => d.height / 2)
        .transition()
        .duration(600)
        .ease(d3.easeCubicOut)
        .attr("height", (d) => Math.max(4, d.height))
        .attr("y", 0);
    } else {
      srcRects
        .attr("height", (d) => Math.max(4, d.height))
        .attr("y", 0);
    }

    srcNodesG
      .on("mouseover", (event, d) => {
        setHoveredSourceIdx(d.index);

        const emoColor = EMOTION_HEX[d.emotion];
        const emoCaps = EMOTION_LABEL[d.emotion].toUpperCase();

        tooltipDiv
          .style("visibility", "visible")
          .style("opacity", "1")
          .html(`
            <div style="font-weight: 800; font-size: 13px; color: ${emoColor}; margin-bottom: 5px; border-bottom: 1px solid rgba(255,255,255,0.12); padding-bottom: 4px; letter-spacing: 0.04em;">
              ${emoCaps} (Start Mood - Turn 1)
            </div>
            <div style="font-size: 11.5px; color: rgba(255,255,255,0.9); line-height: 1.6;">
              <div><strong>Volume:</strong> ${d.value.toLocaleString()} conversations</div>
              <div><strong>Share of Total Dataset:</strong> ${fmtPct(d.value / totalValidConvs, 1)}</div>
            </div>
          `);
      })
      .on("mousemove", (event) => {
        tooltipDiv
          .style("top", `${event.pageY - 15}px`)
          .style("left", `${event.pageX + 18}px`);
      })
      .on("mouseout", () => {
        setHoveredSourceIdx(null);
        tooltipDiv.style("visibility", "hidden").style("opacity", "0");
      });

    const srcTexts = srcNodesG
      .append("text")
      .attr("x", -10)
      .attr("y", (d) => d.height / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "end")
      .style("font-size", "11px")
      .style("font-weight", "600")
      .style("fill", (d) => EMOTION_HEX[d.emotion])
      .text((d) => `${EMOTION_EMOJI[d.emotion]} ${EMOTION_LABEL[d.emotion]} (${fmtPct(d.value / totalValidConvs, 0)})`);

    if (!hasAnimatedRef.current && isVisible) {
      srcTexts
        .style("opacity", 0)
        .transition()
        .delay(650)
        .duration(400)
        .style("opacity", 1);
    }

    // Column Header Left
    const headerLeft = g
      .append("text")
      .attr("x", 0)
      .attr("y", -14)
      .attr("text-anchor", "start")
      .style("font-size", "11px")
      .style("font-weight", "700")
      .style("fill", "var(--foreground)")
      .style("letter-spacing", "0.04em")
      .text("START PROMPT MOOD (TURN 1)");

    if (!hasAnimatedRef.current && isVisible) {
      headerLeft
        .style("opacity", 0)
        .transition()
        .delay(650)
        .duration(400)
        .style("opacity", 1);
    }

    // 6. Draw Target Nodes (Right Column - End Emotion) with entrance scale animation
    const tgtNodeGroup = g.append("g").attr("class", "target-nodes");

    const tgtNodesG = tgtNodeGroup
      .selectAll("g")
      .data(targetNodes)
      .join("g")
      .attr("transform", (d) => `translate(${innerWidth}, ${d.y0})`);

    const tgtRects = tgtNodesG
      .append("rect")
      .attr("width", nodeWidth)
      .attr("rx", 3)
      .attr("fill", (d) => EMOTION_HEX[d.emotion])
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.2)
      .style("cursor", "pointer")
      .style("transition", "opacity 0.2s ease")
      .style("opacity", (d) => {
        if (hoveredTargetIdx !== null) {
          return hoveredTargetIdx === d.index ? 1.0 : 0.35;
        }
        if (activeFilters.length > 0) {
          return activeFilters.includes(d.emotion) ? 1.0 : 0.35;
        }
        return 0.95;
      });

    if (!hasAnimatedRef.current && isVisible) {
      tgtRects
        .attr("height", 0)
        .attr("y", (d) => d.height / 2)
        .transition()
        .delay(350)
        .duration(600)
        .ease(d3.easeCubicOut)
        .attr("height", (d) => Math.max(4, d.height))
        .attr("y", 0);
    } else {
      tgtRects
        .attr("height", (d) => Math.max(4, d.height))
        .attr("y", 0);
    }

    tgtNodesG
      .on("mouseover", (event, d) => {
        setHoveredTargetIdx(d.index);

        const emoColor = EMOTION_HEX[d.emotion];
        const emoCaps = EMOTION_LABEL[d.emotion].toUpperCase();

        tooltipDiv
          .style("visibility", "visible")
          .style("opacity", "1")
          .html(`
            <div style="font-weight: 800; font-size: 13px; color: ${emoColor}; margin-bottom: 5px; border-bottom: 1px solid rgba(255,255,255,0.12); padding-bottom: 4px; letter-spacing: 0.04em;">
              ${emoCaps} (End Mood - Final Turn)
            </div>
            <div style="font-size: 11.5px; color: rgba(255,255,255,0.9); line-height: 1.6;">
              <div><strong>Volume:</strong> ${d.value.toLocaleString()} conversations</div>
              <div><strong>Share of Total Dataset:</strong> ${fmtPct(d.value / totalValidConvs, 1)}</div>
            </div>
          `);
      })
      .on("mousemove", (event) => {
        tooltipDiv
          .style("top", `${event.pageY - 15}px`)
          .style("left", `${event.pageX + 18}px`);
      })
      .on("mouseout", () => {
        setHoveredTargetIdx(null);
        tooltipDiv.style("visibility", "hidden").style("opacity", "0");
      });

    const tgtTexts = tgtNodesG
      .append("text")
      .attr("x", nodeWidth + 10)
      .attr("y", (d) => d.height / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "start")
      .style("font-size", "11px")
      .style("font-weight", "600")
      .style("fill", (d) => EMOTION_HEX[d.emotion])
      .text((d) => `${EMOTION_EMOJI[d.emotion]} ${EMOTION_LABEL[d.emotion]} (${fmtPct(d.value / totalValidConvs, 0)})`);

    if (!hasAnimatedRef.current && isVisible) {
      tgtTexts
        .style("opacity", 0)
        .transition()
        .delay(650)
        .duration(400)
        .style("opacity", 1);
    }

    // Column Header Right
    const headerRight = g
      .append("text")
      .attr("x", innerWidth + nodeWidth)
      .attr("y", -14)
      .attr("text-anchor", "end")
      .style("font-size", "11px")
      .style("font-weight", "700")
      .style("fill", "var(--foreground)")
      .style("letter-spacing", "0.04em")
      .text("END PROMPT MOOD (FINAL TURN)");

    if (!hasAnimatedRef.current && isVisible) {
      headerRight
        .style("opacity", 0)
        .transition()
        .delay(650)
        .duration(400)
        .style("opacity", 1);
    }

  }, [width, height, matrix, totalValidConvs, hoveredSourceIdx, hoveredTargetIdx, hoveredLinkKey, activeFilters, isLoading, isVisible]);

  return (
    <div ref={containerRef} className="space-y-4">
      {/* SVG Container */}
      <div ref={ref} className="w-full flex justify-center items-center relative min-h-[360px]">
        {totalValidConvs === 0 ? (
          <div className="text-sm text-muted-foreground py-12">
            No valid conversation data available for Sankey visualization.
          </div>
        ) : (
          <svg
            ref={svgRef}
            className="w-full h-auto overflow-visible select-none"
            style={{ maxHeight: height }}
          />
        )}
      </div>

      {/* Summary Narrative Scorecards with viewport entrance animation */}
      {stats && (
        <div
          className={`grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-border/40 transition-all duration-700 ease-out ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <div className="p-3 rounded-lg border border-border/40 bg-muted/20">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
              Top Overall Flow
            </span>
            <div className="text-sm font-bold mt-1 text-foreground flex items-center gap-1.5">
              <span>Start {stats.maxTransition.srcLabel}</span>
              <span className="text-muted-foreground">➔</span>
              <span>End {stats.maxTransition.tgtLabel}</span>
            </div>
            <span className="text-xs font-semibold text-primary block mt-0.5">
              {stats.maxTransition.count.toLocaleString()} conversations ({fmtPct(stats.maxTransition.share, 1)})
            </span>
          </div>

          <div className="p-3 rounded-lg border border-border/40 bg-muted/20">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
              Frustration Recovery Rate
            </span>
            <div className="text-sm font-bold mt-1 text-frustration flex items-center gap-1">
              <span>Turn 1 Frustration</span>
              <span className="text-muted-foreground">➔</span>
              <span className="text-satisfaction">Non-Frustrated End</span>
            </div>
            <span className="text-xs font-semibold text-satisfaction block mt-0.5">
              {fmtPct(stats.frustRecoveryRate, 1)} ({stats.frustRecoveredCount} of {stats.frustTotalCount} convs)
            </span>
          </div>

          <div className="p-3 rounded-lg border border-border/40 bg-muted/20">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
              Satisfaction Retention Rate
            </span>
            <div className="text-sm font-bold mt-1 text-satisfaction flex items-center gap-1">
              <span>Turn 1 Satisfaction</span>
              <span className="text-muted-foreground">➔</span>
              <span>End Satisfaction</span>
            </div>
            <span className="text-xs font-semibold text-satisfaction block mt-0.5">
              {fmtPct(stats.satRetention, 1)} retained until end turn
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

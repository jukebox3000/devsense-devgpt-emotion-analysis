import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { EMOTIONS, EMOTION_LABEL, emotionVar, type Emotion } from "@/lib/emotions";
import { useChartWidth, fmtPct } from "./chart-utils";

export type TrendPoint = { label: string; n?: number } & Record<Emotion, number>;

const EMOTION_COLORS: Record<Emotion, string> = {
  frustration: "#c0392b",
  caution: "#c48f0a",
  neutral: "#3b6fa5",
  satisfaction: "#27ae60",
};

/** Multi-series line chart of emotion share over an ordered x axis. */
export function TrendLineChart({
  data,
  height = 280,
  xTitle,
  emotions,
}: {
  data: TrendPoint[];
  height?: number;
  xTitle?: string;
  emotions?: Emotion[] | undefined;
}) {
  const { ref, width } = useChartWidth();
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!width || !svgRef.current) return;
    const margin = { top: 14, right: 52, bottom: 40, left: 44 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    let tooltipDiv = d3.select<HTMLDivElement, unknown>("#chart-tooltip");
    if (tooltipDiv.empty()) {
      tooltipDiv = d3.select("body")
        .append("div")
        .attr("id", "chart-tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background", "rgba(15, 23, 42, 0.95)")
        .style("backdrop-filter", "blur(8px)")
        .style("border", "1px solid rgba(255, 255, 255, 0.15)")
        .style("padding", "8px 12px")
        .style("border-radius", "8px")
        .style("color", "#fff")
        .style("font-size", "11px")
        .style("font-weight", "600")
        .style("box-shadow", "0 4px 20px rgba(0, 0, 0, 0.3)")
        .style("pointer-events", "none")
        .style("z-index", "99999");
    }

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    const g = svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const visibleEmotions = emotions && emotions.length > 0 ? emotions : EMOTIONS;
    const visibleData = data.slice(0, 11);
    const lastPoint = visibleData[visibleData.length - 1] ?? ({} as TrendPoint);
    const dominantEmotion = visibleEmotions.reduce(
      (best, e) =>
        (lastPoint[e] ?? 0) > (lastPoint[best] ?? 0) ? e : best,
      visibleEmotions[0],
    );
    const x = d3
      .scalePoint()
      .domain(visibleData.map((d) => d.label))
      .range([0, w]);
    const maxY = Math.min(
      1,
      (d3.max(visibleData, (d) => d3.max(visibleEmotions, (e) => d[e])!) ?? 0.6) + 0.08,
    );
    const y = d3.scaleLinear([0, maxY], [h, 0]);

    g.append("g")
      .call(d3.axisLeft(y).ticks(5).tickSize(-w).tickFormat((d) => fmtPct(Number(d), 0)))
      .call((s) => s.select(".domain").remove())
      .call((s) => s.selectAll(".tick line").style("stroke", "var(--grid)").style("opacity", 0.5))
      .selectAll("text")
      .style("fill", "var(--muted-foreground)")
      .style("font-size", "10px");

    const every = data.length > 10 ? Math.ceil(data.length / 10) : 1;
    g.append("g")
      .attr("transform", `translate(0,${h})`)
      .call(
        d3
          .axisBottom(x)
          .tickValues(data.filter((_, i) => i % every === 0).map((d) => d.label))
          .tickSize(0)
          .tickPadding(8),
      )
      .call((s) => s.select(".domain").style("stroke", "var(--border)"))
      .selectAll("text")
      .style("fill", "var(--muted-foreground)")
      .style("font-size", "10px");

    if (xTitle) {
      g.append("text")
        .attr("x", w / 2)
        .attr("y", h + 34)
        .attr("text-anchor", "middle")
        .style("font-size", "10px")
        .style("fill", "var(--muted-foreground)")
        .text(xTitle);
    }

    visibleEmotions.forEach((e) => {
      const line = d3
        .line<TrendPoint>()
        .x((d) => x(d.label)!)
        .y((d) => y(d[e]))
        .curve(d3.curveMonotoneX);

      const path = g
        .append("path")
        .datum(visibleData)
        .attr("d", line)
        .style("fill", "none")
        .style("stroke", emotionVar(e))
        .style("stroke-width", e === dominantEmotion ? 3.5 : 2.25)
        .style("stroke-linecap", "round")
        .style("opacity", e === dominantEmotion ? 1 : 0.35);

      const len = (path.node() as SVGPathElement).getTotalLength();
      path
        .attr("stroke-dasharray", `${len} ${len}`)
        .attr("stroke-dashoffset", len)
        .transition()
        .duration(1200)
        .ease(d3.easeCubicInOut)
        .attr("stroke-dashoffset", 0)
        .on("end", function () {
          d3.select(this).attr("stroke-dasharray", null);
        });

      g.selectAll(`circle.${e}`)
        .data(visibleData)
        .join("circle")
        .attr("class", e)
        .attr("cx", (d) => x(d.label)!)
        .attr("cy", (d) => y(d[e]))
        .attr("r", 0)
        .style("fill", emotionVar(e))
        .style("cursor", "pointer")
        .on("mouseover", function (event, d) {
          const color = EMOTION_COLORS[e];
          const label = EMOTION_LABEL[e];
          const pct = fmtPct(d[e]);
          const turnNum = d.label;
          const sampleSize = d.n ?? "–";

          const dominant = EMOTIONS.reduce((best, em) => d[em] > d[best] ? em : best, EMOTIONS[0]);
          const isDominant = e === dominant;

          const explanation = `At turn ${turnNum}, ${pct} of developer prompts expressed <span style="color: ${color}; font-weight: 700;">${label.toLowerCase()}</span>.`;

          tooltipDiv
            .style("visibility", "visible")
            .html(
              `<div style="margin-bottom: 6px; font-size: 10px; color: #94a3b8; font-weight: 500;">Turn ${turnNum} · <span style="font-variant-numeric: tabular-nums;">n = ${sampleSize} prompts</span></div>` +
              `<div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">` +
              `<span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${color};"></span>` +
              `<span style="color: ${color}; font-weight: 800; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em;">${label}</span>` +
              `<span style="font-size: 14px; font-weight: 700; color: #fff;">${pct}</span>` +
              (isDominant ? `<span style="font-size: 9px; color: #fbbf24; font-weight: 600; margin-left: 2px;">★ DOMINANT</span>` : ``) +
              `</div>` +
              `<div style="font-size: 10px; color: #cbd5e1; font-weight: 400; line-height: 1.4; max-width: 220px;">${explanation}</div>`
            );

          d3.select(this)
            .transition()
            .duration(100)
            .attr("r", 6);
        })
        .on("mousemove", function (event) {
          tooltipDiv
            .style("top", (event.pageY - 60) + "px")
            .style("left", (event.pageX + 15) + "px");
        })
        .on("mouseout", function () {
          tooltipDiv.style("visibility", "hidden");
          d3.select(this)
            .transition()
            .duration(100)
            .attr("r", 3.5);
        })
        .transition()
        .delay((_, i) => 300 + (i / Math.max(1, data.length - 1)) * 900)
        .duration(260)
        .attr("r", 3.5);


      const last = visibleData[visibleData.length - 1]!;
      g.append("text")
        .attr("x", w + 6)
        .attr("y", y(last[e]))
        .attr("dy", "0.35em")
        .style("font-size", "9px")
        .style("fill", emotionVar(e))
        .text(EMOTION_LABEL[e].slice(0, 5));
    });

    return () => {
      d3.select("#chart-tooltip").remove();
    };
  }, [data, width, height, xTitle, emotions]);

  return (
    <div ref={ref} className="w-full">
      <svg ref={svgRef} width={width} height={height} />
    </div>
  );
}

/** Per-turn prompt/answer score line chart for one selected conversation. */
export function ConversationLineChart({
  turns,
  height = 240,
}: {
  turns: {
    index: number;
    promptScore: number;
    answerScore: number;
    promptEmotion: Emotion;
    answerEmotion: Emotion;
  }[];
  height?: number;
}) {
  const { ref, width } = useChartWidth();
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!width || !svgRef.current) return;
    const margin = { top: 16, right: 16, bottom: 34, left: 40 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    const g = svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scalePoint().domain(turns.map((t) => String(t.index))).range([0, w]).padding(0.5);
    const y = d3.scaleLinear([0.3, 1], [h, 0]);

    g.append("g")
      .call(d3.axisLeft(y).ticks(4).tickSize(-w))
      .call((s) => s.select(".domain").remove())
      .call((s) => s.selectAll(".tick line").style("stroke", "var(--grid)").style("opacity", 0.5))
      .selectAll("text")
      .style("fill", "var(--muted-foreground)")
      .style("font-size", "10px");

    g.append("g")
      .attr("transform", `translate(0,${h})`)
      .call(d3.axisBottom(x).tickSize(0).tickPadding(8))
      .call((s) => s.select(".domain").style("stroke", "var(--border)"))
      .selectAll("text")
      .style("fill", "var(--muted-foreground)")
      .style("font-size", "10px");

    g.append("text")
      .attr("x", w / 2)
      .attr("y", h + 30)
      .attr("text-anchor", "middle")
      .style("font-size", "10px")
      .style("fill", "var(--muted-foreground)")
      .text("turn");

    (
      [
        { key: "promptScore", emo: "promptEmotion", dash: "" },
        { key: "answerScore", emo: "answerEmotion", dash: "4 3" },
      ] as const
    ).forEach(({ key, emo, dash }) => {
      const line = d3
        .line<(typeof turns)[number]>()
        .x((d) => x(String(d.index))!)
        .y((d) => y(d[key]))
        .curve(d3.curveMonotoneX);

      g.append("path")
        .datum(turns)
        .attr("d", line)
        .style("fill", "none")
        .style("stroke", "var(--muted-foreground)")
        .style("stroke-width", 1.5)
        .style("stroke-dasharray", dash)
        .style("opacity", 0.55);

      g.selectAll(`circle.${key}`)
        .data(turns)
        .join("circle")
        .attr("class", key)
        .attr("cx", (d) => x(String(d.index))!)
        .attr("cy", (d) => y(d[key]))
        .attr("r", 5)
        .style("fill", (d) => emotionVar(d[emo]))
        .style("stroke", "var(--card)")
        .style("stroke-width", 1.5)
        .append("title")
        .text(
          (d) =>
            `Turn ${d.index} — ${key === "promptScore" ? "developer" : "assistant"}: ${EMOTION_LABEL[d[emo]]
            } ${d[key].toFixed(2)}`,
        );
    });
  }, [turns, width, height]);

  return (
    <div ref={ref} className="w-full">
      <svg ref={svgRef} width={width} height={height} />
    </div>
  );
}

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { EMOTION_LABEL, emotionVar, type Emotion } from "@/lib/emotions";
import { useChartWidth } from "./chart-utils";

export type Point = {
  id: string;
  x: number;
  y: number;
  dominantEmotion: Emotion;
  maxEmotionCount: number;
  counts?: Record<Emotion, number>;
};

const EMOTION_COLORS: Record<Emotion, string> = {
  frustration: "#ef4444",
  caution: "#f59e0b",
  neutral: "#6b7280",
  satisfaction: "#10b981",
};

export function ScatterPlot({
  points,
  height = 360,
  xLabel = "Conversation Index (Count)",
  yLabel = "Conversation Length (Turns per Sharing ID)",
}: {
  points: Point[];
  height?: number;
  xLabel?: string;
  yLabel?: string;
}) {
  const { ref, width } = useChartWidth();
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!width || !svgRef.current) return;
    const margin = { top: 18, right: 20, bottom: 44, left: 56 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    // Tooltip setup
    let tooltipDiv = d3.select<HTMLDivElement, unknown>("#chart-tooltip");
    if (tooltipDiv.empty()) {
      tooltipDiv = d3
        .select("body")
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

    const maxX = d3.max(points, (d) => d.x) || 100;
    const maxY = d3.max(points, (d) => d.y) || 10;
    const maxBubble = d3.max(points, (d) => d.maxEmotionCount) || 1;

    const x = d3.scaleLinear([1, maxX], [0, w]);
    const y = d3.scaleLinear([0, maxY + 2], [h, 0]);
    const rScale = d3.scaleSqrt([1, maxBubble], [3.5, 18]);

    g.append("g")
      .call(d3.axisLeft(y).ticks(6).tickSize(-w))
      .call((s) => s.select(".domain").remove())
      .call((s) =>
        s
          .selectAll(".tick line")
          .style("stroke", "var(--grid)")
          .style("opacity", 0.4),
      )
      .selectAll("text")
      .style("fill", "var(--muted-foreground)")
      .style("font-size", "10px");

    g.append("g")
      .attr("transform", `translate(0,${h})`)
      .call(d3.axisBottom(x).ticks(8).tickSize(-h))
      .call((s) => s.select(".domain").style("stroke", "var(--border)"))
      .call((s) =>
        s
          .selectAll(".tick line")
          .style("stroke", "var(--grid)")
          .style("opacity", 0.3),
      )
      .selectAll("text")
      .style("fill", "var(--muted-foreground)")
      .style("font-size", "10px");

    g.append("text")
      .attr("x", w / 2)
      .attr("y", h + 36)
      .attr("text-anchor", "middle")
      .style("font-size", "10px")
      .style("fill", "var(--muted-foreground)")
      .text(xLabel);

    g.append("text")
      .attr("transform", `rotate(-90)`)
      .attr("x", -h / 2)
      .attr("y", -42)
      .attr("text-anchor", "middle")
      .style("font-size", "10px")
      .style("fill", "var(--muted-foreground)")
      .text(yLabel);

    g.selectAll("circle")
      .data(points)
      .join("circle")
      .attr("cx", (d) => x(d.x))
      .attr("cy", (d) => y(d.y))
      .attr("r", (d) => rScale(d.maxEmotionCount))
      .style("fill", (d) => emotionVar(d.dominantEmotion))
      .style("opacity", 0.55)
      .style("stroke", "var(--background)")
      .style("stroke-width", "0.75px")
      .style("cursor", "pointer")
      .on("mouseover", function (event, d) {
        const domColor = EMOTION_COLORS[d.dominantEmotion] || "var(--foreground)";
        const domLabel = EMOTION_LABEL[d.dominantEmotion] || d.dominantEmotion;

        tooltipDiv
          .style("visibility", "visible")
          .html(
            `<div style="font-weight: 800; font-size: 11px; color: #fff; margin-bottom: 2px;">Sharing ID: ${d.id}</div>` +
              `<div style="color: #94a3b8; font-size: 10px; margin-bottom: 3px;">Conversation Length: <strong style="color: #fff;">${d.y} turns</strong></div>` +
              `<div style="font-size: 10px; margin-bottom: 2px;">Dominant Emotion: <span style="color: ${domColor}; font-weight: 800; text-transform: uppercase;">${domLabel}</span></div>` +
              `<div style="font-size: 10px; color: #cbd5e1;">Max Prompt Emotion Count: <strong>${d.maxEmotionCount}</strong></div>`,
          );

        d3.select(this)
          .transition()
          .duration(100)
          .attr("r", rScale(d.maxEmotionCount) + 3)
          .style("opacity", 0.95)
          .style("stroke", "var(--foreground)")
          .style("stroke-width", "1.5px");
      })
      .on("mousemove", function (event) {
        tooltipDiv
          .style("top", event.pageY - 70 + "px")
          .style("left", event.pageX + 15 + "px");
      })
      .on("mouseout", function (event, d) {
        tooltipDiv.style("visibility", "hidden");
        d3.select(this)
          .transition()
          .duration(100)
          .attr("r", rScale(d.maxEmotionCount))
          .style("opacity", 0.55)
          .style("stroke", "var(--background)")
          .style("stroke-width", "0.75px");
      });

    return () => {
      d3.select("#chart-tooltip").remove();
    };
  }, [points, width, height, xLabel, yLabel]);

  return (
    <div ref={ref} className="w-full">
      <svg ref={svgRef} width={width} height={height} />
    </div>
  );
}

export type HeatRow = {
  row: string;
  total: number;
  cells: { col: string; share: number; count: number }[];
};

export function Heatmap({
  rows,
  colorFor,
  height,
  rowLabelWidth = 110,
  valueFormat = "both",
}: {
  rows: HeatRow[];
  colorFor: (col: string) => string;
  height?: number;
  rowLabelWidth?: number;
  valueFormat?: "percentage" | "count" | "both";
}) {
  const { ref, width } = useChartWidth();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const chartHeight = height ?? Math.max(220, rows.length * 38 + 46);

  useEffect(() => {
    if (!width || !svgRef.current) return;
    const margin = { top: 26, right: 12, bottom: 8, left: rowLabelWidth };
    const w = width - margin.left - margin.right;
    const h = chartHeight - margin.top - margin.bottom;

    // Tooltip setup
    let tooltipDiv = d3.select<HTMLDivElement, unknown>("#chart-tooltip");
    if (tooltipDiv.empty()) {
      tooltipDiv = d3
        .select("body")
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
      .attr("viewBox", `0 0 ${width} ${chartHeight}`)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const cols = rows[0]?.cells.map((c) => c.col) ?? [];
    const x = d3.scaleBand().domain(cols).range([0, w]).padding(0.06);
    const y = d3
      .scaleBand()
      .domain(rows.map((r) => r.row))
      .range([0, h])
      .padding(0.08);

    g.selectAll("text.col")
      .data(cols)
      .join("text")
      .attr("class", "col")
      .attr("x", (d) => x(d)! + x.bandwidth() / 2)
      .attr("y", -10)
      .attr("text-anchor", "middle")
      .style("font-size", "10px")
      .style("fill", "var(--muted-foreground)")
      .text((d) => EMOTION_LABEL[d as Emotion] ?? d);

    rows.forEach((r, rIdx) => {
      const rowKey = `row-${rIdx}`;
      g.append("text")
        .attr("x", -10)
        .attr("y", y(r.row)! + y.bandwidth() / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", "end")
        .style("font-size", "11px")
        .style(
          "fill",
          EMOTION_COLORS[r.row as Emotion]
            ? emotionVar(r.row as Emotion)
            : "var(--foreground)",
        )
        .text(EMOTION_LABEL[r.row as Emotion] ?? r.row);

      g.selectAll(`rect.${rowKey}`)
        .data(r.cells)
        .join("rect")
        .attr("class", rowKey)
        .attr("x", (d) => x(d.col)!)
        .attr("y", y(r.row)!)
        .attr("width", x.bandwidth())
        .attr("height", y.bandwidth())
        .attr("rx", 3)
        .style("fill", (d) => colorFor(d.col))
        .style("opacity", (d) => 0.12 + Math.min(1, d.share / 0.6) * 0.82)
        .style("cursor", "pointer")
        .on("mouseover", function (event, d) {
          const rowEmotion = r.row as Emotion;
          const colEmotion = d.col as Emotion;
          const devColor = EMOTION_COLORS[rowEmotion] || "#38bdf8";
          const gptColor = EMOTION_COLORS[colEmotion] || "var(--foreground)";
          const devLabel = EMOTION_LABEL[rowEmotion] || r.row;
          const gptLabel = EMOTION_LABEL[colEmotion] || d.col;

          tooltipDiv
            .style("visibility", "visible")
            .html(
              `<span style="color: ${devColor}; font-weight: 800; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em;">${devLabel}</span>` +
                `<span style="color: #94a3b8; font-weight: 400; margin: 0 6px;">→</span>` +
                `<span style="color: ${gptColor}; font-weight: 800; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em;">${gptLabel}</span>` +
                `<div style="margin-top: 4px; font-size: 13px; font-weight: 700; color: #fff;">` +
                `${(d.share * 100).toFixed(1)}% <span style="font-size: 9px; color: #94a3b8; font-weight: 400;">(${d.count} count)</span>` +
                `</div>`,
            );

          d3.select(this)
            .transition()
            .duration(100)
            .attr("stroke", "var(--foreground)")
            .attr("stroke-width", "1.5px");
        })
        .on("mousemove", function (event) {
          tooltipDiv
            .style("top", event.pageY - 60 + "px")
            .style("left", event.pageX + 15 + "px");
        })
        .on("mouseout", function () {
          tooltipDiv.style("visibility", "hidden");
          d3.select(this).transition().duration(100).attr("stroke", "none");
        });

      g.selectAll(`text.v-${rowKey}`)
        .data(r.cells)
        .join("text")
        .attr("class", `v-${rowKey}`)
        .attr("x", (d) => x(d.col)! + x.bandwidth() / 2)
        .attr("y", y(r.row)! + y.bandwidth() / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", "middle")
        .style("font-size", "10px")
        .style("font-variant-numeric", "tabular-nums")
        .style("fill", (d) =>
          d.share > 0.32 ? "var(--background)" : "var(--foreground)",
        )
        .text((d) => {
          if (valueFormat === "count") return `${d.count}`;
          if (valueFormat === "both")
            return d.count > 0
              ? `${(d.share * 100).toFixed(0)}% (${d.count})`
              : "0";
          return `${(d.share * 100).toFixed(0)}%`;
        })
        .style("pointer-events", "none");
    });

    return () => {
      d3.select("#chart-tooltip").remove();
    };
  }, [rows, width, chartHeight, colorFor, rowLabelWidth, valueFormat]);

  return (
    <div
      ref={ref}
      className={
        rows.length > 10
          ? "w-full max-h-[440px] overflow-y-auto pr-1"
          : "w-full"
      }
    >
      <svg ref={svgRef} width={width} height={chartHeight} />
    </div>
  );
}

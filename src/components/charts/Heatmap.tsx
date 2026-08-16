import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { EMOTION_LABEL, emotionVar, type Emotion } from "@/lib/emotions";
import { useChartWidth, useIsLoading } from "./chart-utils";

const EMOTION_COLORS: Record<Emotion, string> = {
  frustration: "#ef4444",
  caution: "#f59e0b",
  neutral: "#6b7280",
  satisfaction: "#10b981",
};

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
  const isLoading = useIsLoading();

  useEffect(() => {
    if (isLoading) return;
    if (!width || !svgRef.current) return;
    const margin = { top: 26, right: 12, bottom: 8, left: rowLabelWidth };
    const w = width - margin.left - margin.right;
    const h = chartHeight - margin.top - margin.bottom;

    let tooltipDiv = d3.select<HTMLDivElement, unknown>("#chart-tooltip");
    if (tooltipDiv.empty()) {
      tooltipDiv = d3
        .select("body")
        .append("div")
        .attr("id", "chart-tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background", "rgba(9, 9, 11, 0.92)")
        .style("backdrop-filter", "blur(12px) saturate(160%)")
        .style("border", "1px solid rgba(255, 255, 255, 0.08)")
        .style("padding", "10px 14px")
        .style("border-radius", "10px")
        .style("color", "#fff")
        .style("font-family", "system-ui, -apple-system, sans-serif")
        .style("box-shadow", "0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)")
        .style("pointer-events", "none")
        .style("z-index", "99999")
        .style("width", "180px")
        .style("transition", "opacity 0.12s ease")
        .style("opacity", "0");
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
        .style("cursor", "pointer")
        .on("mouseover", function (event, d) {
          tooltipDiv
            .style("visibility", "visible")
            .style("opacity", "1")
            .html(
              `<div style="display: flex; align-items: center; justify-content: space-between; gap: 4px; margin-bottom: 8px;">` +
              `<span style="background: rgba(56, 189, 248, 0.12); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.25); padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 10px; text-transform: uppercase; letter-spacing: 0.02em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 80px;">${r.row}</span>` +
              `<span style="color: rgba(255, 255, 255, 0.3); font-size: 10px;">→</span>` +
              `<span style="background: ${colorFor(d.col)}15; color: ${colorFor(d.col)}; border: 1px solid ${colorFor(d.col)}30; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 10px; text-transform: uppercase; letter-spacing: 0.02em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 80px;">${EMOTION_LABEL[d.col as Emotion] || d.col}</span>` +
              `</div>` +
              `<div style="display: flex; align-items: baseline; justify-content: space-between;">` +
              `<span style="font-size: 18px; font-weight: 800; color: #fff; letter-spacing: -0.02em;">${(d.share * 100).toFixed(1)}%</span>` +
              `<span style="font-size: 10px; color: rgba(255, 255, 255, 0.5); font-weight: 500;">${d.count} response${d.count === 1 ? '' : 's'}</span>` +
              `</div>` +
              `<div style="width: 100%; height: 4px; background: rgba(255, 255, 255, 0.08); border-radius: 2px; margin-top: 8px; overflow: hidden;">` +
              `<div style="width: ${(d.share * 100)}%; height: 100%; background: ${colorFor(d.col)}; border-radius: 2px;"></div>` +
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
            .style("top", event.pageY - 68 + "px")
            .style("left", event.pageX + 15 + "px");
        })
        .on("mouseout", function () {
          tooltipDiv
            .style("opacity", "0");

          setTimeout(() => {
            if (tooltipDiv.style("opacity") === "0") {
              tooltipDiv.style("visibility", "hidden");
            }
          }, 120);

          d3.select(this).transition().duration(100).attr("stroke", "none");
        })
        .style("opacity", 0)
        .attr("transform-origin", (d) => `${x(d.col)! + x.bandwidth() / 2}px ${y(r.row)! + y.bandwidth() / 2}px`)
        .attr("transform", "scale(0.94) translate(0, 5)")
        .transition()
        .delay((d, i) => (rows.length - 1 - rIdx) * 45 + i * 20)
        .duration(450)
        .ease(d3.easeCubicOut)
        .style("opacity", (d) => 0.12 + Math.min(1, d.share / 0.6) * 0.82)
        .attr("transform", "scale(1) translate(0, 0)");

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
        .style("pointer-events", "none")
        .style("opacity", 0)
        .attr("transform-origin", (d) => `${x(d.col)! + x.bandwidth() / 2}px ${y(r.row)! + y.bandwidth() / 2}px`)
        .attr("transform", "translate(0, 5)")
        .transition()
        .delay((d, i) => (rows.length - 1 - rIdx) * 45 + i * 20 + 150)
        .duration(350)
        .ease(d3.easeCubicOut)
        .style("opacity", 1)
        .attr("transform", "translate(0, 0)");
    });

    return () => {
      d3.select("#chart-tooltip").remove();
    };
  }, [rows, width, chartHeight, colorFor, rowLabelWidth, valueFormat, isLoading]);

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

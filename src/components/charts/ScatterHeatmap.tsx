import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { EMOTION_LABEL, emotionVar, type Emotion } from "@/lib/emotions";
import { useChartWidth } from "./chart-utils";

export type Point = {
  id: string;
  x: number;
  y: number;
  promptEmotion: Emotion;
  answerEmotion: Emotion;
};

const EMOTION_COLORS: Record<Emotion, string> = {
  frustration: "#c0392b",
  caution: "#c48f0a",
  neutral: "#3b6fa5",
  satisfaction: "#27ae60",
};

export function ScatterPlot({
  points,
  fit,
  colorBy = "promptEmotion",
  height = 320,
  xLabel,
  yLabel,
}: {
  points: Point[];
  fit?: { slope: number; intercept: number };
  colorBy?: "promptEmotion" | "answerEmotion";
  height?: number;
  xLabel: string;
  yLabel: string;
}) {
  const { ref, width } = useChartWidth();
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!width || !svgRef.current) return;
    const margin = { top: 14, right: 16, bottom: 44, left: 52 };
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

    const x = d3.scaleLinear([0.3, 1], [0, w]);
    const y = d3.scaleLinear([0.3, 1], [h, 0]);

    g.append("g")
      .call(d3.axisLeft(y).ticks(5).tickSize(-w))
      .call((s) => s.select(".domain").remove())
      .call((s) =>
        s
          .selectAll(".tick line")
          .style("stroke", "var(--grid)")
          .style("opacity", 0.5),
      )
      .selectAll("text")
      .style("fill", "var(--muted-foreground)")
      .style("font-size", "10px");

    g.append("g")
      .attr("transform", `translate(0,${h})`)
      .call(d3.axisBottom(x).ticks(6).tickSize(-h))
      .call((s) => s.select(".domain").style("stroke", "var(--border)"))
      .call((s) =>
        s
          .selectAll(".tick line")
          .style("stroke", "var(--grid)")
          .style("opacity", 0.4),
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
      .attr("y", -38)
      .attr("text-anchor", "middle")
      .style("font-size", "10px")
      .style("fill", "var(--muted-foreground)")
      .text(yLabel);

    g.selectAll("circle")
      .data(points)
      .join("circle")
      .attr("cx", (d) => x(d.x))
      .attr("cy", (d) => y(d.y))
      .attr("r", 3.2)
      .style("fill", (d) => emotionVar(d[colorBy]))
      .style("opacity", 0.55)
      .style("cursor", "pointer")
      .on("mouseover", function (event, d) {
        const pColor = EMOTION_COLORS[d.promptEmotion];
        const aColor = EMOTION_COLORS[d.answerEmotion];
        const pLabel = EMOTION_LABEL[d.promptEmotion];
        const aLabel = EMOTION_LABEL[d.answerEmotion];

        tooltipDiv
          .style("visibility", "visible")
          .html(
            `<span style="color: #94a3b8; font-weight: 500;">Conversation ${d.id}</span><br/>` +
              `<span style="color: ${pColor}; font-weight: 800; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em;">DEV: ${pLabel} (${d.x.toFixed(2)})</span>` +
              `<br/><span style="color: #94a3b8; font-weight: 400; margin-right: 4px;">→</span>` +
              `<span style="color: ${aColor}; font-weight: 800; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em;">GPT: ${aLabel} (${d.y.toFixed(2)})</span>`,
          );

        d3.select(this)
          .transition()
          .duration(100)
          .attr("r", 5.5)
          .style("opacity", 0.95);
      })
      .on("mousemove", function (event) {
        tooltipDiv
          .style("top", event.pageY - 60 + "px")
          .style("left", event.pageX + 15 + "px");
      })
      .on("mouseout", function () {
        tooltipDiv.style("visibility", "hidden");
        d3.select(this)
          .transition()
          .duration(100)
          .attr("r", 3.2)
          .style("opacity", 0.55);
      });

    if (fit) {
      const x0 = 0.3;
      const x1 = 1;
      g.append("line")
        .attr("x1", x(x0))
        .attr("x2", x(x1))
        .attr("y1", y(fit.intercept + fit.slope * x0))
        .attr("y2", y(fit.intercept + fit.slope * x1))
        .style("stroke", "var(--foreground)")
        .style("stroke-width", 1.5)
        .style("stroke-dasharray", "5 4")
        .style("opacity", 0.8);
    }

    return () => {
      d3.select("#chart-tooltip").remove();
    };
  }, [points, width, height, fit, colorBy, xLabel, yLabel]);

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
  rowLabelWidth = 96,
}: {
  rows: HeatRow[];
  colorFor: (col: string) => string;
  height?: number;
  rowLabelWidth?: number;
}) {
  const { ref, width } = useChartWidth();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const chartHeight = height ?? rows.length * 42 + 46;

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

    rows.forEach((r) => {
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

      g.selectAll(`rect.c-${r.row.replace(/\W/g, "")}`)
        .data(r.cells)
        .join("rect")
        .attr("class", `c-${r.row.replace(/\W/g, "")}`)
        .attr("x", (d) => x(d.col)!)
        .attr("y", y(r.row)!)
        .attr("width", x.bandwidth())
        .attr("height", y.bandwidth())
        .attr("rx", 3)
        .style("fill", (d) => colorFor(d.col))
        .style("opacity", (d) => 0.12 + Math.min(1, d.share / 0.6) * 0.82)
        .style("cursor", "pointer")
        .on("mouseover", function (event, d) {
          const promptEmotion = r.row as Emotion;
          const answerEmotion = d.col as Emotion;
          const devColor = EMOTION_COLORS[promptEmotion] || "var(--foreground)";
          const gptColor = EMOTION_COLORS[answerEmotion] || "var(--foreground)";
          const devLabel = EMOTION_LABEL[promptEmotion] || r.row;
          const gptLabel = EMOTION_LABEL[answerEmotion] || d.col;

          tooltipDiv
            .style("visibility", "visible")
            .html(
              `<span style="color: ${devColor}; font-weight: 800; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em;">${devLabel}</span>` +
                `<span style="color: #94a3b8; font-weight: 400; margin: 0 6px;">→</span>` +
                `<span style="color: ${gptColor}; font-weight: 800; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em;">${gptLabel}</span>` +
                `<div style="margin-top: 4px; font-size: 13px; font-weight: 700; color: #fff;">` +
                `${(d.share * 100).toFixed(1)}% <span style="font-size: 9px; color: #94a3b8; font-weight: 400;">(${d.count} turns)</span>` +
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

      g.selectAll(`text.v-${r.row.replace(/\W/g, "")}`)
        .data(r.cells)
        .join("text")
        .attr("class", `v-${r.row.replace(/\W/g, "")}`)
        .attr("x", (d) => x(d.col)! + x.bandwidth() / 2)
        .attr("y", y(r.row)! + y.bandwidth() / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", "middle")
        .style("font-size", "10px")
        .style("font-variant-numeric", "tabular-nums")
        .style("fill", (d) =>
          d.share > 0.32 ? "var(--background)" : "var(--foreground)",
        )
        .text((d) => `${(d.share * 100).toFixed(0)}%`)
        .style("pointer-events", "none");
    });

    return () => {
      d3.select("#chart-tooltip").remove();
    };
  }, [rows, width, chartHeight, colorFor, rowLabelWidth]);

  return (
    <div ref={ref} className="w-full">
      <svg ref={svgRef} width={width} height={chartHeight} />
    </div>
  );
}

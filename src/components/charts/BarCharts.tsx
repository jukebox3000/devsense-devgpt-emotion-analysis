import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { EMOTIONS, EMOTION_LABEL, emotionVar, type Emotion } from "@/lib/emotions";
import { useChartWidth, fmtPct } from "./chart-utils";

export type StackRow = {
  label: string;
  labelColor?: string;
  total: number;
  cells: { key: Emotion; share: number; count: number }[];
};

/** 100% stacked horizontal bars — one row per group, segments per emotion. */
export function StackedBarChart({ rows, height = 260 }: { rows: StackRow[]; height?: number }) {
  const { ref, width } = useChartWidth();
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!width || !svgRef.current) return;
    const margin = { top: 8, right: 46, bottom: 26, left: 96 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    // Tooltip setup
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

    const svg = d3.select<SVGSVGElement, unknown>(svgRef.current);
    svg.selectAll("*").remove();
    const g = svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear([0, 1], [0, w]);
    const y = d3
      .scaleBand()
      .domain(rows.map((r) => r.label))
      .range([0, h])
      .padding(0.28);

    g.append("g")
      .attr("transform", `translate(0,${h})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat((d) => fmtPct(Number(d), 0)))
      .call((s) => s.select(".domain").remove())
      .selectAll("text")
      .style("fill", "var(--muted-foreground)")
      .style("font-size", "10px");

    rows.forEach((row) => {
      let acc = 0;
      const segs = row.cells.map((c) => {
        const seg = { ...c, x0: acc, x1: acc + c.share };
        acc += c.share;
        return seg;
      });

      g.selectAll(`rect.r-${row.label.replace(/\W/g, "")}`)
        .data(segs)
        .join("rect")
        .attr("class", `r-${row.label.replace(/\W/g, "")}`)
        .attr("x", (d) => x(d.x0))
        .attr("y", y(row.label)!)
        .attr("width", 0)
        .attr("height", y.bandwidth())
        .style("fill", (d) => emotionVar(d.key))
        .style("opacity", 0.92)
        .style("cursor", "pointer")
        .on("mouseover", function(event, d) {
          const devColor = EMOTION_COLORS[row.label.toLowerCase() as Emotion] || "#3b6fa5";
          const gptColor = EMOTION_COLORS[d.key];
          const devLabel = row.label;
          const gptLabel = EMOTION_LABEL[d.key];
          
          tooltipDiv
            .style("visibility", "visible")
            .html(
              `<span style="color: ${devColor}; font-weight: 800; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em;">${devLabel}</span>` +
              `<span style="color: #94a3b8; font-weight: 400; margin: 0 6px;">→</span>` +
              `<span style="color: ${gptColor}; font-weight: 800; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em;">${gptLabel}</span>` +
              `<div style="margin-top: 4px; font-size: 13px; font-weight: 700; color: #fff;">` +
              `${fmtPct(d.share)} <span style="font-size: 9px; color: #94a3b8; font-weight: 400;">(${d.count} responses)</span>` +
              `</div>`
            );

          d3.select(this)
            .transition()
            .duration(100)
            .style("opacity", 1.0);
        })
        .on("mousemove", function(event) {
          tooltipDiv
            .style("top", (event.pageY - 60) + "px")
            .style("left", (event.pageX + 15) + "px");
        })
        .on("mouseout", function() {
          tooltipDiv.style("visibility", "hidden");
          d3.select(this)
            .transition()
            .duration(100)
            .style("opacity", 0.92);
        })
        .transition()
        .delay((_, i) => i * 70)
        .duration(700)
        .ease(d3.easeCubicOut)
        .attr("width", (d) => Math.max(0, x(d.x1) - x(d.x0)));


      g.selectAll(`text.l-${row.label.replace(/\W/g, "")}`)
        .data(segs.filter((s) => s.share > 0.09))
        .join("text")
        .attr("class", `l-${row.label.replace(/\W/g, "")}`)
        .attr("x", (d) => x((d.x0 + d.x1) / 2))
        .attr("y", y(row.label)! + y.bandwidth() / 2)
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .style("font-size", "10px")
        .style("font-weight", "600")
        .style("fill", "var(--background)")
        .text((d) => fmtPct(d.share, 0));

      g.append("text")
        .attr("x", -10)
        .attr("y", y(row.label)! + y.bandwidth() / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", "end")
        .style("font-size", "11px")
        .style("fill", row.labelColor ?? "var(--foreground)")
        .text(row.label);

      g.append("text")
        .attr("x", w + 8)
        .attr("y", y(row.label)! + y.bandwidth() / 2)
        .attr("dy", "0.35em")
        .style("font-size", "10px")
        .style("font-variant-numeric", "tabular-nums")
        .style("fill", "var(--muted-foreground)")
        .text(`n=${row.total}`);
    });

    return () => {
      d3.select("#chart-tooltip").remove();
    };
  }, [rows, width, height]);

  return (
    <div ref={ref} className="w-full">
      <svg ref={svgRef} width={width} height={height} />
    </div>
  );
}

const EMOTION_COLORS: Record<Emotion, string> = {
  frustration: "#c0392b",
  caution:     "#c48f0a",
  neutral:     "#3b6fa5",
  satisfaction: "#27ae60",
};

/** Vertical bars of a single metric per emotion, with 95% CI whiskers. */
export function MeanBarChart({
  data,
  domain,
  height = 250,
  valueFormat = (v: number) => v.toFixed(3),
  zeroLine = false,
}: {
  data: { emotion: Emotion; mean: number; ci?: number; n: number }[];
  domain: [number, number];
  height?: number;
  valueFormat?: (v: number) => string;
  zeroLine?: boolean;
}) {
  const { ref, width } = useChartWidth();
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!width || !svgRef.current) return;
    const margin = { top: 18, right: 12, bottom: 30, left: 48 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    // Tooltip setup
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

    const svg = d3.select<SVGSVGElement, unknown>(svgRef.current);
    svg.selectAll("*").remove();
    const g = svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3
      .scaleBand()
      .domain(EMOTIONS as unknown as string[])
      .range([0, w])
      .padding(0.34);
    const y = d3.scaleLinear(domain, [h, 0]);

    g.append("g")
      .call(
        d3
          .axisLeft(y)
          .ticks(5)
          .tickSize(-w)
          .tickFormat((d) => valueFormat(Number(d))),
      )
      .call((s) => s.select(".domain").remove())
      .call((s) => s.selectAll(".tick line").style("stroke", "var(--grid)").style("opacity", 0.6))
      .selectAll("text")
      .style("fill", "var(--muted-foreground)")
      .style("font-size", "10px");

    g.append("g")
      .attr("transform", `translate(0,${h})`)
      .call(d3.axisBottom(x).tickSize(0).tickPadding(8))
      .call((s) => s.select(".domain").style("stroke", "var(--border)"))
      .selectAll("text")
      .style("font-size", "10px")
      .style("fill", "var(--muted-foreground)")
      .text((d) => EMOTION_LABEL[d as Emotion]);

    if (zeroLine) {
      g.append("line")
        .attr("x1", 0)
        .attr("x2", w)
        .attr("y1", y(0))
        .attr("y2", y(0))
        .style("stroke", "var(--muted-foreground)")
        .style("stroke-dasharray", "3 3");
    }

    const base = zeroLine ? y(0) : h;

    g.selectAll("rect")
      .data(data)
      .join("rect")
      .attr("x", (d) => x(d.emotion)!)
      .attr("width", x.bandwidth())
      .attr("y", base)
      .attr("height", 0)
      .attr("rx", 3)
      .style("fill", (d) => emotionVar(d.emotion))
      .style("fill-opacity", 0.85)
      .style("cursor", "pointer")
      .on("mouseover", function(event, d) {
        const devColor = EMOTION_COLORS[d.emotion];
        const satColor = EMOTION_COLORS["satisfaction"];
        const devLabel = EMOTION_LABEL[d.emotion];
        const satLabel = EMOTION_LABEL["satisfaction"];
        
        tooltipDiv
          .style("visibility", "visible")
          .html(
            `<span style="color: ${devColor}; font-weight: 800; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em;">${devLabel}</span>` +
            `<span style="color: #94a3b8; font-weight: 400; margin: 0 6px;">→</span>` +
            `<span style="color: ${satColor}; font-weight: 800; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em;">${satLabel}</span>` +
            `<div style="margin-top: 4px; font-size: 13px; font-weight: 700; color: #fff;">` +
            `${valueFormat(d.mean)} <span style="font-size: 9px; color: #94a3b8; font-weight: 400;">(n=${d.n})</span>` +
            `</div>`
          );

        d3.select(this)
          .transition()
          .duration(100)
          .style("fill-opacity", 1);
      })
      .on("mousemove", function(event) {
        tooltipDiv
          .style("top", (event.pageY - 60) + "px")
          .style("left", (event.pageX + 15) + "px");
      })
      .on("mouseout", function() {
        tooltipDiv.style("visibility", "hidden");
        d3.select(this)
          .transition()
          .duration(100)
          .style("fill-opacity", 0.85);
      })
      .transition()
      .delay((_, i) => i * 90)
      .duration(780)
      .ease(d3.easeCubicOut)
      .attr("y", (d) => Math.min(base, y(d.mean)))
      .attr("height", (d) => Math.abs(base - y(d.mean)));

    data.forEach((d) => {
      if (!d.ci) return;
      const cx = x(d.emotion)! + x.bandwidth() / 2;
      g.append("line")
        .attr("x1", cx)
        .attr("x2", cx)
        .attr("y1", y(d.mean - d.ci))
        .attr("y2", y(d.mean + d.ci))
        .style("stroke", "var(--foreground)")
        .style("opacity", 0.65);
    });

    g.selectAll("text.val")
      .data(data)
      .join("text")
      .attr("class", "val")
      .attr("x", (d) => x(d.emotion)! + x.bandwidth() / 2)
      .attr("y", (d) => (y(d.mean) < base ? y(d.mean) - 8 : y(d.mean) + 14))
      .attr("text-anchor", "middle")
      .style("font-size", "10px")
      .style("font-variant-numeric", "tabular-nums")
      .style("fill", "var(--foreground)")
      .text((d) => valueFormat(d.mean));

    return () => {
      d3.select("#chart-tooltip").remove();
    };
  }, [data, width, height, domain, valueFormat, zeroLine]);

  return (
    <div ref={ref} className="w-full">
      <svg ref={svgRef} width={width} height={height} />
    </div>
  );
}

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { useChartWidth } from "./chart-utils";

export type BarSeries = { key: string; label: string; color: string };
export type BarGroup = { label: string; values: Record<string, number> };

/**
 * Side-by-side (grouped) vertical bar chart with a draw-in animation.
 * Series colours are passed in, so non-emotion series never reuse emotion hues.
 */
export function GroupedBarChart({
  groups,
  series,
  height = 300,
  format = (v: number) => `${(v * 100).toFixed(0)}%`,
  yMax,
}: {
  groups: BarGroup[];
  series: BarSeries[];
  height?: number;
  format?: (v: number) => string;
  yMax?: number;
}) {
  const { ref, width } = useChartWidth();
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!width || !svgRef.current) return;
    const margin = { top: 22, right: 12, bottom: 34, left: 46 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    const g = svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x0 = d3
      .scaleBand()
      .domain(groups.map((d) => d.label))
      .range([0, w])
      .paddingInner(0.28)
      .paddingOuter(0.12);
    const x1 = d3
      .scaleBand()
      .domain(series.map((s) => s.key))
      .range([0, x0.bandwidth()])
      .padding(0.14);

    const max =
      yMax ??
      (d3.max(groups, (g2) => d3.max(series, (s) => g2.values[s.key] ?? 0)!) ??
        1) * 1.18;
    const y = d3.scaleLinear([0, max], [h, 0]);

    g.append("g")
      .call(
        d3
          .axisLeft(y)
          .ticks(5)
          .tickSize(-w)
          .tickFormat((d) => format(Number(d))),
      )
      .call((s) => s.select(".domain").remove())
      .call((s) => s.selectAll(".tick line").style("stroke", "var(--grid)"))
      .selectAll("text")
      .style("fill", "var(--muted-foreground)")
      .style("font-size", "10px");

    g.append("g")
      .attr("transform", `translate(0,${h})`)
      .call(d3.axisBottom(x0).tickSize(0).tickPadding(10))
      .call((s) => s.select(".domain").style("stroke", "var(--border)"))
      .selectAll("text")
      .style("fill", "var(--foreground)")
      .style("font-size", "11px")
      .style("font-weight", "500");

    groups.forEach((group, gi) => {
      const cell = g
        .append("g")
        .attr("transform", `translate(${x0(group.label)!},0)`);

      series.forEach((s, si) => {
        const v = group.values[s.key] ?? 0;
        const delay = gi * 90 + si * 45;

        cell
          .append("rect")
          .attr("x", x1(s.key)!)
          .attr("width", x1.bandwidth())
          .attr("y", h)
          .attr("height", 0)
          .attr("rx", 3)
          .style("fill", s.color)
          .call((sel) =>
            sel
              .append("title")
              .text(`${group.label} · ${s.label}: ${format(v)}`),
          )
          .transition()
          .delay(delay)
          .duration(750)
          .ease(d3.easeCubicOut)
          .attr("y", y(v))
          .attr("height", h - y(v));

        cell
          .append("text")
          .attr("x", x1(s.key)! + x1.bandwidth() / 2)
          .attr("y", y(v) - 7)
          .attr("text-anchor", "middle")
          .style("font-size", "10px")
          .style("font-family", "var(--font-mono)")
          .style("fill", s.color)
          .style("opacity", 0)
          .text(format(v))
          .transition()
          .delay(delay + 420)
          .duration(400)
          .style("opacity", 1);
      });
    });
  }, [groups, series, width, height, format, yMax]);

  return (
    <div ref={ref} className="w-full">
      <svg ref={svgRef} width={width} height={height} />
    </div>
  );
}

/** Small inline legend for non-emotion series. */
export function SeriesLegend({ series }: { series: BarSeries[] }) {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
      {series.map((s) => (
        <span key={s.key} className="flex items-center gap-1.5">
          <span
            className="size-2.5 rounded-sm"
            style={{ background: s.color }}
          />
          {s.label}
        </span>
      ))}
    </div>
  );
}

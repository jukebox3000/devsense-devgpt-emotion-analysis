import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { EMOTION_LABEL, emotionVar, type Emotion } from "@/lib/emotions";
import { useChartWidth, fmtPct, useIsLoading } from "./chart-utils";

type Datum = { emotion: Emotion; count: number; share: number };

export function DonutChart({
  data,
  height = 250,
}: {
  data: Datum[];
  height?: number;
}) {
  const { ref, width } = useChartWidth();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const isLoading = useIsLoading();

  useEffect(() => {
    if (isLoading) return;
    if (!width || !svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const radius = Math.min(width, height) / 2;
    const g = svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    const arcs = d3
      .pie<Datum>()
      .value((d) => d.count)
      .sort(null)
      .padAngle(0.015)(data);

    const arc = d3
      .arc<d3.PieArcDatum<Datum>>()
      .innerRadius(radius * 0.30)
      .outerRadius(radius * 0.95)
      .cornerRadius(2);

    g.selectAll("path")
      .data(arcs)
      .join("path")
      .style("fill", (d) => emotionVar(d.data.emotion))
      .style("opacity", 0.95)
      .call((sel) =>
        sel
          .append("title")
          .text((d) => `${EMOTION_LABEL[d.data.emotion]}: ${d.data.count} (${fmtPct(d.data.share)})`),
      )
      .transition()
      .duration(900)
      .ease(d3.easeCubicOut)
      .attrTween("d", function (d) {
        const i = d3.interpolate(d.startAngle, d.endAngle);
        return (t) => arc({ ...d, endAngle: i(t) }) as string;
      });


    g.selectAll("text.slice")
      .data(arcs.filter((d) => d.data.share > 0.07))
      .join("text")
      .attr("class", "slice")
      .attr("transform", (d) => `translate(${arc.centroid(d)})`)
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .style("font-size", "10px")
      .style("font-weight", "600")
      .style("fill", "#000000")
      .style("font-weight", "800")
      .text((d) => fmtPct(d.data.share, 0));

  }, [data, width, height, isLoading]);

  return (
    <div ref={ref} className="w-full">
      <svg ref={svgRef} width={width} height={height} />
    </div>
  );
}

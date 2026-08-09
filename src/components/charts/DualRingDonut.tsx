import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import type { Emotion } from "@/lib/emotions";
import { EMOTIONS, EMOTION_LABEL } from "@/lib/emotions";
import gptLogo from "../../../assets/black-gpt-chat-logo-on-white-background-logo-illustration-free-vector.jpg";
import devLogo from "../../../assets/user-profile-icon-free-vector-658200527.jpg";

const EMOTION_HEX: Record<Emotion, string> = {
  frustration: "#c0392b",
  caution:     "#c48f0a",
  neutral:     "#3b6fa5",
  satisfaction:"#27ae60",
};

function emotionGlow(emotion: Emotion): string {
  const c = EMOTION_HEX[emotion];
  const r = parseInt(c.slice(1, 3), 16);
  const g = parseInt(c.slice(3, 5), 16);
  const b = parseInt(c.slice(5, 7), 16);
  return `rgba(${r},${g},${b},0.45)`;
}

type RingDatum = { label: Emotion; count: number };
type Filter = "both" | "developer" | "gpt";

interface DualRingDonutProps {
  devCounts: Record<string, number>;
  gptCounts: Record<string, number>;
  width?: number;
  height?: number;
}

export function DualRingDonut({ devCounts, gptCounts, width = 340, height = 340 }: DualRingDonutProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [filter, setFilter] = useState<Filter>("both");

  const devData: RingDatum[] = EMOTIONS.map((e) => ({ label: e, count: devCounts[e] || 0 }));
  const gptData: RingDatum[] = EMOTIONS.map((e) => ({ label: e, count: gptCounts[e] || 0 }));
  const totalDev = devData.reduce((s, d) => s + d.count, 0);
  const totalGpt = gptData.reduce((s, d) => s + d.count, 0);

  // Toggle helpers — click the ring or selection button, click again to go back
  const toggleDev = () => setFilter((f) => (f === "developer" ? "both" : "developer"));
  const toggleGpt = () => setFilter((f) => (f === "gpt" ? "both" : "gpt"));

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    // Expand donut closer to edge
    const radius = Math.min(width, height) / 2 - 5;
    const padAngle = 0.015;

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

    // Radii shifted outwards (inner hole increased to 0.28, outer bounds pushed up)
    const radii = {
      dev: {
        both:      { inner: radius * 0.28, outer: radius * 0.65 },
        developer: { inner: radius * 0.28, outer: radius * 0.95 },
        gpt:       { inner: radius * 0.28, outer: radius * 0.28 },
      },
      gpt: {
        both:      { inner: radius * 0.68, outer: radius * 0.95 },
        developer: { inner: radius * 0.95, outer: radius * 0.95 },
        gpt:       { inner: radius * 0.28, outer: radius * 0.95 },
      },
    };

    svg.attr("width", width).attr("height", height).attr("viewBox", `0 0 ${width} ${height}`);

    let g = svg.select<SVGGElement>("g.main-group");
    if (g.empty()) {
      g = svg.append("g").attr("class", "main-group")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);
    }

    // Stripe defs & ClipPaths (preserve defs so clipPaths aren't destroyed on filter change)
    let defs = svg.select<SVGDefsElement>("defs");
    if (defs.empty()) {
      defs = svg.insert("defs", "g");
    }

    // Clip paths sized for single (r=26) and both (r=18)
    if (defs.select("#clip-logo-dev").empty()) {
      defs.append("clipPath").attr("id", "clip-logo-dev").append("circle").attr("cx", 0).attr("cy", 0).attr("r", 26);
      defs.append("clipPath").attr("id", "clip-logo-gpt").append("circle").attr("cx", 0).attr("cy", 0).attr("r", 26);
      // Small clip paths for both mode
      defs.append("clipPath").attr("id", "clip-logo-dev-sm").append("circle").attr("cx", 0).attr("cy", 0).attr("r", 18);
      defs.append("clipPath").attr("id", "clip-logo-gpt-sm").append("circle").attr("cx", 0).attr("cy", 0).attr("r", 18);
    }

    EMOTIONS.forEach((emo) => {
      const color = EMOTION_HEX[emo];
      const patternId = `pattern-dual-${emo}`;
      if (defs.select(`#${patternId}`).empty()) {
        const r = parseInt(color.slice(1, 3), 16);
        const gv = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        const pat = defs.append("pattern")
          .attr("id", patternId)
          .attr("width", 6).attr("height", 6)
          .attr("patternUnits", "userSpaceOnUse")
          .attr("patternTransform", "rotate(45)");
        pat.append("rect").attr("width", 6).attr("height", 6).attr("fill", `rgba(${r},${gv},${b},0.18)`);
        pat.append("line").attr("x1", 0).attr("y1", 0).attr("x2", 0).attr("y2", 6)
          .attr("stroke", color).attr("stroke-width", 2);
      }
    });

    const pie = d3.pie<RingDatum>().value((d) => d.count).sort(null).padAngle(padAngle);
    const devArcs = pie(devData);
    const gptArcs = pie(gptData);

    const targetDevInner = radii.dev[filter].inner;
    const targetDevOuter = radii.dev[filter].outer;
    const targetGptInner = radii.gpt[filter].inner;
    const targetGptOuter = radii.gpt[filter].outer;
    const targetDevOpacity = filter === "gpt" ? 0 : 1;
    const targetGptOpacity = filter === "developer" ? 0 : 1;

    // ── Center logos — circle-framed; DOM creation ──
    let textGroup = g.select<SVGGElement>("g.center-text");
    if (textGroup.empty()) {
      textGroup = g.append("g").attr("class", "center-text");
      const logoGroup = textGroup.append("g").attr("class", "center-logo-group");

      // Developer group (clickable, toggles developer filter)
      const devG = logoGroup.append("g").attr("class", "logo-dev-group")
        .style("cursor", "pointer")
        .on("click", (e) => {
          e.stopPropagation();
          toggleDev();
        });

      devG.append("circle").attr("class", "logo-dev-ring")
        .attr("cx", 0).attr("cy", 0).attr("r", 28)
        .attr("fill", "white")
        .attr("stroke", "rgba(59,130,246,0.5)")
        .attr("stroke-width", 2);
      devG.append("image").attr("class", "logo-dev-img")
        .attr("href", devLogo)
        .attr("preserveAspectRatio", "xMidYMid slice")
        .attr("clip-path", "url(#clip-logo-dev)")
        .attr("width", 56)
        .attr("height", 56)
        .attr("x", -28)
        .attr("y", -28);

      // GPT group (clickable, toggles gpt filter)
      const gptG = logoGroup.append("g").attr("class", "logo-gpt-group")
        .style("cursor", "pointer")
        .on("click", (e) => {
          e.stopPropagation();
          toggleGpt();
        });

      gptG.append("circle").attr("class", "logo-gpt-ring")
        .attr("cx", 0).attr("cy", 0).attr("r", 28)
        .attr("fill", "white")
        .attr("stroke", "rgba(59,130,246,0.5)")
        .attr("stroke-width", 2);
      gptG.append("image").attr("class", "logo-gpt-img")
        .attr("href", gptLogo)
        .attr("preserveAspectRatio", "xMidYMid slice")
        .attr("clip-path", "url(#clip-logo-gpt)")
        .attr("width", 56)
        .attr("height", 56)
        .attr("x", -28)
        .attr("y", -28);
    }

    // ── Dynamic D3 Transitions for Center Logos ─────────────────────────────
    const logoDevGroup = textGroup.select("g.logo-dev-group");
    const logoGptGroup = textGroup.select("g.logo-gpt-group");
    const duration = 500;
    const ease = d3.easeCubicInOut;

    if (filter === "developer") {
      // Dev solo (centered & large)
      logoDevGroup.style("pointer-events", "all").transition().duration(duration).ease(ease)
        .style("opacity", 1)
        .attr("transform", "translate(0,0)");

      logoDevGroup.select("circle.logo-dev-ring").transition().duration(duration).ease(ease)
        .attr("r", 28);

      logoDevGroup.select("image.logo-dev-img").transition().duration(duration).ease(ease)
        .attr("width", 88).attr("height", 88).attr("x", -44).attr("y", -44)
        .attr("clip-path", "url(#clip-logo-dev)");

      // GPT fade out
      logoGptGroup.style("pointer-events", "none").transition().duration(duration).ease(ease)
        .style("opacity", 0)
        .attr("transform", "translate(15,0) scale(0.6)");
    } else if (filter === "gpt") {
      // Dev fade out
      logoDevGroup.style("pointer-events", "none").transition().duration(duration).ease(ease)
        .style("opacity", 0)
        .attr("transform", "translate(-15,0) scale(0.6)");

      // GPT solo (centered & large)
      logoGptGroup.style("pointer-events", "all").transition().duration(duration).ease(ease)
        .style("opacity", 1)
        .attr("transform", "translate(0,0)");

      logoGptGroup.select("circle.logo-gpt-ring").transition().duration(duration).ease(ease)
        .attr("r", 28);

      logoGptGroup.select("image.logo-gpt-img").transition().duration(duration).ease(ease)
        .attr("width", 88).attr("height", 88).attr("x", -44).attr("y", -44)
        .attr("clip-path", "url(#clip-logo-gpt)");
    } else {
      // Both side-by-side
      logoDevGroup.style("pointer-events", "all").transition().duration(duration).ease(ease)
        .style("opacity", 1)
        .attr("transform", "translate(-22,0)");

      logoDevGroup.select("circle.logo-dev-ring").transition().duration(duration).ease(ease)
        .attr("r", 18);

      logoDevGroup.select("image.logo-dev-img").transition().duration(duration).ease(ease)
        .attr("width", 56).attr("height", 56).attr("x", -28).attr("y", -28)
        .attr("clip-path", "url(#clip-logo-dev-sm)");

      logoGptGroup.style("pointer-events", "all").transition().duration(duration).ease(ease)
        .style("opacity", 1)
        .attr("transform", "translate(22,0)");

      logoGptGroup.select("circle.logo-gpt-ring").transition().duration(duration).ease(ease)
        .attr("r", 18);

      logoGptGroup.select("image.logo-gpt-img").transition().duration(duration).ease(ease)
        .attr("width", 56).attr("height", 56).attr("x", -28).attr("y", -28)
        .attr("clip-path", "url(#clip-logo-gpt-sm)");
    }

    // ── Arc tween helper ───────────────────────────────────────────────────────
    function makeArcTween(tInner: number, tOuter: number, dInner: number, dOuter: number) {
      return function(this: SVGPathElement, d: d3.PieArcDatum<RingDatum>) {
        const el = this as any;
        const ci = el._currentInner ?? dInner;
        const co = el._currentOuter ?? dOuter;
        const ii = d3.interpolate(ci, tInner);
        const io = d3.interpolate(co, tOuter);
        el._currentInner = tInner;
        el._currentOuter = tOuter;
        return (t: number) =>
          (d3.arc<d3.PieArcDatum<RingDatum>>().innerRadius(ii(t)).outerRadius(io(t))(d) as string);
      };
    }

    // ── Developer ring (inner, solid, clickable) ───────────────────────────────
    if (g.select("g.dev-ring").empty()) g.append("g").attr("class", "dev-ring");
    const devPaths = g.select<SVGGElement>("g.dev-ring")
      .selectAll<SVGPathElement, d3.PieArcDatum<RingDatum>>("path")
      .data(devArcs, (d) => d.data.label);

    devPaths.enter().append("path")
      .attr("stroke", "var(--color-card)").attr("stroke-width", 1.5)
      .style("opacity", 0).style("cursor", "pointer")
      .on("click", toggleDev)
      .on("mouseover", function(event, d) {
        const el = this as any;
        const ci = el._currentInner ?? targetDevInner;
        const co = el._currentOuter ?? targetDevOuter;
        d3.select(this).raise().transition().duration(200).ease(d3.easeCubicOut)
          .attr("d", d3.arc<d3.PieArcDatum<RingDatum>>().innerRadius(ci - 3).outerRadius(co + 8)(d) as string)
          .style("filter", `drop-shadow(0 0 10px ${emotionGlow(d.data.label)})`).attr("stroke-width", 2);

        const color = EMOTION_HEX[d.data.label];
        const label = d.data.label.charAt(0).toUpperCase() + d.data.label.slice(1);
        const pctStr = totalDev > 0 ? Math.round((d.data.count / totalDev) * 100) : 0;
        
        tooltipDiv
          .style("visibility", "visible")
          .html(
            `<div style="display: flex; align-items: center; gap: 6px; margin-bottom: 2px;">` +
            `<img src="${devLogo}" style="width: 14px; height: 14px; border-radius: 50%; object-fit: cover;" />` +
            `<span style="color: #94a3b8; font-weight: 500;">Developer Mood</span>` +
            `</div>` +
            `<span style="color: ${color}; font-weight: 800; text-transform: uppercase; font-size: 12px; letter-spacing: 0.05em;">${label}</span>` +
            `<div style="margin-top: 4px; font-size: 13px; font-weight: 700; color: #fff;">` +
            `${pctStr}% <span style="font-size: 9px; color: #94a3b8; font-weight: 400;">(${d.data.count} prompts)</span>` +
            `</div>`
          );
      })
      .on("mousemove", function(event) {
        tooltipDiv
          .style("top", (event.pageY - 65) + "px")
          .style("left", (event.pageX + 15) + "px");
      })
      .on("mouseout", function(_, d) {
        const el = this as any;
        const ci = el._currentInner ?? targetDevInner;
        const co = el._currentOuter ?? targetDevOuter;
        d3.select(this).transition().duration(200).ease(d3.easeCubicOut)
          .attr("d", d3.arc<d3.PieArcDatum<RingDatum>>().innerRadius(ci).outerRadius(co)(d) as string)
          .style("filter", "none").attr("stroke-width", 1.5);
        tooltipDiv.style("visibility", "hidden");
      })
      .attr("d", (d) => d3.arc<d3.PieArcDatum<RingDatum>>()
        .innerRadius(radii.dev.both.inner).outerRadius(radii.dev.both.outer)(d) as string)
      .merge(devPaths as any)
      .on("click", toggleDev)
      .attr("fill", (d) => EMOTION_HEX[d.data.label])
      .transition().duration(750).ease(d3.easeCubicInOut)
      .style("opacity", targetDevOpacity)
      .style("pointer-events", filter === "gpt" ? "none" : "all")
      .attrTween("d", function(this: SVGPathElement, d) {
        return makeArcTween(targetDevInner, targetDevOuter, radii.dev.both.inner, radii.dev.both.outer).call(this, d);
      });

    // ── Dev Labels ─────────────────────────────────────────────────────────────
    if (g.select("g.dev-labels").empty()) g.append("g").attr("class", "dev-labels");
    const devLabels = g.select<SVGGElement>("g.dev-labels")
      .selectAll<SVGTextElement, d3.PieArcDatum<RingDatum>>("text")
      .data(devArcs, (d) => d.data.label);

    devLabels.enter().append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("fill", "white")
      .attr("font-size", "14px")
      .attr("font-weight", "bold")
      .style("pointer-events", "none")
      .style("opacity", 0)
      .merge(devLabels as any)
      .text(d => totalDev > 0 ? `${Math.round((d.data.count / totalDev) * 100)}%` : "")
      .transition().duration(750).ease(d3.easeCubicInOut)
      .style("opacity", filter === "developer" ? 1 : 0)
      .attrTween("transform", function(this: SVGTextElement, d) {
        const el = this as any;
        const ci = el._currentInner ?? targetDevInner;
        const co = el._currentOuter ?? targetDevOuter;
        const ii = d3.interpolate(ci, targetDevInner);
        const io = d3.interpolate(co, targetDevOuter);
        el._currentInner = targetDevInner;
        el._currentOuter = targetDevOuter;
        return (t: number) => {
          const arc = d3.arc<d3.PieArcDatum<RingDatum>>().innerRadius(ii(t)).outerRadius(io(t));
          return `translate(${arc.centroid(d)})`;
        };
      });

    // ── GPT ring (outer, stripe, clickable) ────────────────────────────────────
    if (g.select("g.gpt-ring").empty()) g.append("g").attr("class", "gpt-ring");
    const gptPaths = g.select<SVGGElement>("g.gpt-ring")
      .selectAll<SVGPathElement, d3.PieArcDatum<RingDatum>>("path")
      .data(gptArcs, (d) => d.data.label);

    gptPaths.enter().append("path")
      .attr("stroke", "var(--color-card)").attr("stroke-width", 1.5)
      .style("opacity", 0).style("cursor", "pointer")
      .on("click", toggleGpt)
      .on("mouseover", function(event, d) {
        const el = this as any;
        const ci = el._currentInner ?? targetGptInner;
        const co = el._currentOuter ?? targetGptOuter;
        d3.select(this).raise().transition().duration(200).ease(d3.easeCubicOut)
          .attr("d", d3.arc<d3.PieArcDatum<RingDatum>>().innerRadius(ci - 3).outerRadius(co + 8)(d) as string)
          .style("filter", `drop-shadow(0 0 10px ${emotionGlow(d.data.label)})`).attr("stroke-width", 2);

        const color = EMOTION_HEX[d.data.label];
        const label = d.data.label.charAt(0).toUpperCase() + d.data.label.slice(1);
        const pctStr = totalGpt > 0 ? Math.round((d.data.count / totalGpt) * 100) : 0;
        
        tooltipDiv
          .style("visibility", "visible")
          .html(
            `<div style="display: flex; align-items: center; gap: 6px; margin-bottom: 2px;">` +
            `<img src="${gptLogo}" style="width: 14px; height: 14px; border-radius: 50%; object-fit: cover;" />` +
            `<span style="color: #94a3b8; font-weight: 500;">GPT Response</span>` +
            `</div>` +
            `<span style="color: ${color}; font-weight: 800; text-transform: uppercase; font-size: 12px; letter-spacing: 0.05em;">${label}</span>` +
            `<div style="margin-top: 4px; font-size: 13px; font-weight: 700; color: #fff;">` +
            `${pctStr}% <span style="font-size: 9px; color: #94a3b8; font-weight: 400;">(${d.data.count} responses)</span>` +
            `</div>`
          );
      })
      .on("mousemove", function(event) {
        tooltipDiv
          .style("top", (event.pageY - 65) + "px")
          .style("left", (event.pageX + 15) + "px");
      })
      .on("mouseout", function(_, d) {
        const el = this as any;
        const ci = el._currentInner ?? targetGptInner;
        const co = el._currentOuter ?? targetGptOuter;
        d3.select(this).transition().duration(200).ease(d3.easeCubicOut)
          .attr("d", d3.arc<d3.PieArcDatum<RingDatum>>().innerRadius(ci).outerRadius(co)(d) as string)
          .style("filter", "none").attr("stroke-width", 1.5);
        tooltipDiv.style("visibility", "hidden");
      })
      .attr("d", (d) => d3.arc<d3.PieArcDatum<RingDatum>>()
        .innerRadius(radii.gpt.both.inner).outerRadius(radii.gpt.both.outer)(d) as string)
      .merge(gptPaths as any)
      .on("click", toggleGpt)
      .attr("fill", (d) => `url(#pattern-dual-${d.data.label})`)
      .transition().duration(750).ease(d3.easeCubicInOut)
      .style("opacity", targetGptOpacity)
      .style("pointer-events", filter === "developer" ? "none" : "all")
      .attrTween("d", function(this: SVGPathElement, d) {
        return makeArcTween(targetGptInner, targetGptOuter, radii.gpt.both.inner, radii.gpt.both.outer).call(this, d);
      });

    // ── GPT Labels ─────────────────────────────────────────────────────────────
    if (g.select("g.gpt-labels").empty()) g.append("g").attr("class", "gpt-labels");
    const gptLabels = g.select<SVGGElement>("g.gpt-labels")
      .selectAll<SVGTextElement, d3.PieArcDatum<RingDatum>>("text")
      .data(gptArcs, (d) => d.data.label);

    gptLabels.enter().append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("fill", "white")
      .attr("font-size", "14px")
      .attr("font-weight", "bold")
      .style("pointer-events", "none")
      .style("opacity", 0)
      .style("filter", "drop-shadow(0px 1px 2px rgba(0,0,0,0.8))")
      .merge(gptLabels as any)
      .text(d => totalGpt > 0 ? `${Math.round((d.data.count / totalGpt) * 100)}%` : "")
      .transition().duration(750).ease(d3.easeCubicInOut)
      .style("opacity", filter === "gpt" ? 1 : 0)
      .attrTween("transform", function(this: SVGTextElement, d) {
        const el = this as any;
        const ci = el._currentInner ?? targetGptInner;
        const co = el._currentOuter ?? targetGptOuter;
        const ii = d3.interpolate(ci, targetGptInner);
        const io = d3.interpolate(co, targetGptOuter);
        el._currentInner = targetGptInner;
        el._currentOuter = targetGptOuter;
        return (t: number) => {
          const arc = d3.arc<d3.PieArcDatum<RingDatum>>().innerRadius(ii(t)).outerRadius(io(t));
          return `translate(${arc.centroid(d)})`;
        };
      });

    // Bring center logos to the front so they aren't hidden behind the rings
    textGroup.raise();

    return () => {
      d3.select("#chart-tooltip").remove();
    };
  }, [filter, width, height, totalDev, totalGpt, devData, gptData]);

  return (
    <div className="flex flex-col md:flex-row items-center justify-around gap-6 w-full h-full py-2 px-4">
      {/* Graph on Left */}
      <div className="flex items-center justify-center shrink-0" style={{ width, height }}>
        <svg ref={svgRef} style={{ width, height }} />
      </div>

      {/* Legends on Right */}
      <div className="flex flex-col justify-center gap-5 border-l border-border/40 md:pl-8 py-2 w-full max-w-xs">
        {/* Ring Layers Section */}
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-bold text-foreground uppercase tracking-wider">
            Ring Layers
          </span>
          <div className="flex flex-col gap-2 text-xs font-medium">
            <button
              onClick={toggleDev}
              className="flex items-center gap-3.5 px-3 py-2.5 bg-card rounded-xl border cursor-pointer transition-all duration-200 group"
              style={filter === "developer" ? {
                borderColor: "#3b82f6",
                boxShadow: "0 0 0 2px rgba(59,130,246,0.20), 0 6px 20px rgba(59,130,246,0.18)",
              } : {
                borderColor: "hsl(var(--border) / 0.5)",
                boxShadow: "none",
              }}
            >
              {/* Circle-framed logo — scaled to fill, no whitespace */}
              <span
                className="relative shrink-0 w-11 h-11 rounded-full overflow-hidden"
                style={{
                  boxShadow: filter === "developer"
                    ? "0 0 0 2px #3b82f6, 0 0 0 3.5px hsl(var(--card))"
                    : "0 0 0 1.5px hsl(var(--border) / 0.4), 0 0 0 3px hsl(var(--card))"
                }}
              >
                <img
                  src={devLogo}
                  alt="Developer"
                  className="w-full h-full object-cover"
                  style={{ transform: "scale(1.55)", transformOrigin: "center" }}
                />
              </span>
              <span className="flex flex-col text-left">
                <span className={`text-[11px] font-semibold leading-tight ${
                  filter === "developer" ? "text-foreground" : "text-muted-foreground"
                }`}>Developer</span>
                <span className="text-[9px] font-mono text-muted-foreground/50 mt-0.5">inner ring</span>
              </span>
            </button>

            <button
              onClick={toggleGpt}
              className="flex items-center gap-3.5 px-3 py-2.5 bg-card rounded-xl border cursor-pointer transition-all duration-200 group"
              style={filter === "gpt" ? {
                borderColor: "#3b82f6",
                boxShadow: "0 0 0 2px rgba(59,130,246,0.20), 0 6px 20px rgba(59,130,246,0.18)",
              } : {
                borderColor: "hsl(var(--border) / 0.5)",
                boxShadow: "none",
              }}
            >
              {/* Circle-framed logo — scaled to fill */}
              <span
                className="relative shrink-0 w-11 h-11 rounded-full overflow-hidden"
                style={{
                  boxShadow: filter === "gpt"
                    ? "0 0 0 2px #3b82f6, 0 0 0 3.5px hsl(var(--card))"
                    : "0 0 0 1.5px hsl(var(--border) / 0.4), 0 0 0 3px hsl(var(--card))"
                }}
              >
                <img
                  src={gptLogo}
                  alt="GPT"
                  className="w-full h-full object-cover"
                  style={{ transform: "scale(1.55)", transformOrigin: "center" }}
                />
              </span>
              <span className="flex flex-col text-left">
                <span
                  className={`text-[11px] font-semibold leading-tight ${
                    filter === "gpt" ? "text-foreground" : "text-muted-foreground"
                  }`}
                  style={{
                    backgroundImage: 'repeating-linear-gradient(45deg, rgba(59,130,246,0.95) 0 4px, rgba(148,163,184,0.65) 0 8px)',
                    WebkitBackgroundClip: 'text',
                    color: 'transparent',
                  }}
                >
                  ChatGPT
                </span>
                <span className="text-[9px] font-mono text-muted-foreground/50 mt-0.5">outer ring</span>
              </span>
            </button>
          </div>
        </div>

        {/* Emotion Classes Section */}
        <div className="flex flex-col gap-2.5">
          <span className="text-[11px] font-bold text-foreground uppercase tracking-wider">
            Emotion Classes
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs font-medium">
            {EMOTIONS.map((e) => (
              <span key={e} className="flex items-center gap-2 p-1.5 rounded-md bg-muted/30 border border-border/30">
                <span className="w-3 h-3 rounded-full shrink-0 shadow-xs" style={{ background: EMOTION_HEX[e] }} />
                <span className="capitalize">{EMOTION_LABEL[e]}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

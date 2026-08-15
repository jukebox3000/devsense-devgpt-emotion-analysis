import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import type { Emotion } from "@/lib/emotions";
import { EMOTIONS, EMOTION_LABEL } from "@/lib/emotions";
import gptLogo from "../../../assets/black-gpt-chat-logo-on-white-background-logo-illustration-free-vector.jpg";
import devLogo from "../../../assets/user-profile-icon-free-vector-658200527.jpg";
import devgptLogo from "../../../assets/DevGPT_Logo.png";

const EMOTION_HEX: Record<Emotion, string> = {
  frustration: "#c0392b",
  caution: "#c48f0a",
  neutral: "#3b82f6",
  satisfaction: "#27ae60",
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
  isFiltered?: boolean;
  devExamples?: Record<Emotion, string>;
  gptExamples?: Record<Emotion, string>;
}

export function DualRingDonut({
  devCounts,
  gptCounts,
  width = 340,
  height = 340,
  isFiltered = false,
  devExamples = { frustration: "", caution: "", neutral: "", satisfaction: "" },
  gptExamples = { frustration: "", caution: "", neutral: "", satisfaction: "" },
}: DualRingDonutProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<Filter>("both");
  const [isVisible, setIsVisible] = useState(false);
  const hasAnimatedRef = useRef(false);

  const devData: RingDatum[] = EMOTIONS.map((e) => ({ label: e, count: devCounts[e] || 0 }));
  const gptData: RingDatum[] = EMOTIONS.map((e) => ({ label: e, count: gptCounts[e] || 0 }));
  const totalDev = devData.reduce((s, d) => s + d.count, 0);
  const totalGpt = gptData.reduce((s, d) => s + d.count, 0);

  const toggleDev = () => setFilter((f) => (f === "developer" ? "both" : "developer"));
  const toggleGpt = () => setFilter((f) => (f === "gpt" ? "both" : "gpt"));

  // IntersectionObserver to detect when chart scrolls into view
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry && entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current || !isVisible) return;
    const svg = d3.select(svgRef.current);

    const isFirstTime = !hasAnimatedRef.current;
    const radius = Math.min(width, height) / 2 - 5;
    const padAngle = 0.015;

    let tooltipDiv = d3.select<HTMLDivElement, unknown>("#chart-tooltip");
    if (tooltipDiv.empty()) {
      tooltipDiv = d3.select("body")
        .append("div")
        .attr("id", "chart-tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("opacity", "0")
        .style("background", "rgba(15, 23, 42, 0.96)")
        .style("backdrop-filter", "blur(12px) saturate(160%)")
        .style("border", "1px solid rgba(255, 255, 255, 0.15)")
        .style("padding", "10px 14px")
        .style("border-radius", "10px")
        .style("color", "#fff")
        .style("font-size", "11px")
        .style("font-weight", "600")
        .style("box-shadow", "0 10px 25px -5px rgba(0, 0, 0, 0.5)")
        .style("pointer-events", "none")
        .style("z-index", "99999")
        .style("transition", "opacity 0.12s ease");
    }

    const radii = {
      dev: {
        both: { inner: radius * 0.28, outer: radius * 0.65 },
        developer: { inner: radius * 0.28, outer: radius * 0.95 },
        gpt: { inner: radius * 0.28, outer: radius * 0.28 },
      },
      gpt: {
        both: { inner: radius * 0.68, outer: radius * 0.95 },
        developer: { inner: radius * 0.95, outer: radius * 0.95 },
        gpt: { inner: radius * 0.28, outer: radius * 0.95 },
      },
    };

    svg.attr("width", width).attr("height", height).attr("viewBox", `0 0 ${width} ${height}`);

    let g = svg.select<SVGGElement>("g.main-group");
    if (g.empty()) {
      g = svg.append("g").attr("class", "main-group")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);
    }

    let defs = svg.select<SVGDefsElement>("defs");
    if (defs.empty()) {
      defs = svg.insert("defs", "g");
    }

    if (defs.select("#clip-logo-dev").empty()) {
      defs.append("clipPath").attr("id", "clip-logo-dev").append("circle").attr("cx", 0).attr("cy", 0).attr("r", 26);
      defs.append("clipPath").attr("id", "clip-logo-gpt").append("circle").attr("cx", 0).attr("cy", 0).attr("r", 26);
      defs.append("clipPath").attr("id", "clip-logo-devgpt").append("circle").attr("cx", 0).attr("cy", 0).attr("r", 28);
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

    let textGroup = g.select<SVGGElement>("g.center-text");
    if (textGroup.empty()) {
      textGroup = g.append("g").attr("class", "center-text");
      const logoGroup = textGroup.append("g").attr("class", "center-logo-group");

      // Developer group
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

      // DevGPT group
      const devgptG = logoGroup.append("g").attr("class", "logo-devgpt-group")
        .style("cursor", "pointer")
        .on("click", (e) => {
          e.stopPropagation();
          setFilter("both");
        });

      devgptG.append("circle").attr("class", "logo-devgpt-ring")
        .attr("cx", 0).attr("cy", 0).attr("r", 28)
        .attr("fill", "white")
        .attr("stroke", "rgba(59,130,246,0.5)")
        .attr("stroke-width", 2);
      devgptG.append("image").attr("class", "logo-devgpt-img")
        .attr("href", devgptLogo)
        .attr("preserveAspectRatio", "xMidYMid slice")
        .attr("clip-path", "url(#clip-logo-devgpt)")
        .attr("width", 56)
        .attr("height", 56)
        .attr("x", -28)
        .attr("y", -28);
    }
    const logoDevGroup = textGroup.select("g.logo-dev-group");
    const logoGptGroup = textGroup.select("g.logo-gpt-group");
    const logoDevgptGroup = textGroup.select("g.logo-devgpt-group");
    const duration = isFirstTime ? 800 : 500;
    const ease = d3.easeCubicInOut;

    if (filter === "developer") {
      logoDevGroup.style("pointer-events", "all").transition().duration(duration).ease(ease)
        .style("opacity", 1)
        .attr("transform", "translate(0,0)");

      logoDevGroup.select("circle.logo-dev-ring").transition().duration(duration).ease(ease)
        .attr("r", 28);

      logoDevGroup.select("image.logo-dev-img").transition().duration(duration).ease(ease)
        .attr("width", 88).attr("height", 88).attr("x", -44).attr("y", -44)
        .attr("clip-path", "url(#clip-logo-dev)");

      logoGptGroup.style("pointer-events", "none").transition().duration(duration).ease(ease)
        .style("opacity", 0)
        .attr("transform", "translate(15,0) scale(0.6)");

      logoDevgptGroup.style("pointer-events", "none").transition().duration(duration).ease(ease)
        .style("opacity", 0)
        .attr("transform", "translate(0,0) scale(0.6)");
    } else if (filter === "gpt") {
      logoDevGroup.style("pointer-events", "none").transition().duration(duration).ease(ease)
        .style("opacity", 0)
        .attr("transform", "translate(-15,0) scale(0.6)");

      logoDevgptGroup.style("pointer-events", "none").transition().duration(duration).ease(ease)
        .style("opacity", 0)
        .attr("transform", "translate(0,0) scale(0.6)");

      logoGptGroup.style("pointer-events", "all").transition().duration(duration).ease(ease)
        .style("opacity", 1)
        .attr("transform", "translate(0,0)");

      logoGptGroup.select("circle.logo-gpt-ring").transition().duration(duration).ease(ease)
        .attr("r", 28);

      logoGptGroup.select("image.logo-gpt-img").transition().duration(duration).ease(ease)
        .attr("width", 88).attr("height", 88).attr("x", -44).attr("y", -44)
        .attr("clip-path", "url(#clip-logo-gpt)");
    } else {
      logoDevgptGroup.style("pointer-events", "all").transition().duration(duration).ease(ease)
        .style("opacity", 1)
        .attr("transform", "translate(0,0)");

      logoDevgptGroup.select("circle.logo-devgpt-ring").transition().duration(duration).ease(ease)
        .attr("r", 28);

      logoDevgptGroup.select("image.logo-devgpt-img").transition().duration(duration).ease(ease)
        .attr("width", 56).attr("height", 56).attr("x", -28).attr("y", -28)
        .attr("clip-path", "url(#clip-logo-devgpt)");

      logoDevGroup.style("pointer-events", "none").transition().duration(duration).ease(ease)
        .style("opacity", 0)
        .attr("transform", "translate(-20,0) scale(0.6)");

      logoGptGroup.style("pointer-events", "none").transition().duration(duration).ease(ease)
        .style("opacity", 0)
        .attr("transform", "translate(20,0) scale(0.6)");
    }

    function makeArcTween(tInner: number, tOuter: number, dInner: number, dOuter: number) {
      return function (this: SVGPathElement, d: d3.PieArcDatum<RingDatum>) {
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

    // 1. Developer ring (Inner chart)
    if (g.select("g.dev-ring").empty()) g.append("g").attr("class", "dev-ring");
    const devPaths = g.select<SVGGElement>("g.dev-ring")
      .selectAll<SVGPathElement, d3.PieArcDatum<RingDatum>>("path")
      .data(devArcs, (d) => d.data.label);

    const devDuration = isFirstTime ? 1400 : 500;

    const devMerged = devPaths.enter().append("path")
      .attr("stroke", "var(--color-card)").attr("stroke-width", 1.5)
      .style("opacity", 0)
      .merge(devPaths as any);

    devMerged
      .style("cursor", "pointer")
      .on("click", toggleDev)
      .on("mouseover", function (event, d) {
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
          .style("opacity", "1")
          .html(
            `<div style="display: flex; align-items: center; gap: 6px; margin-bottom: 2px;">` +
            `<img src="${devLogo}" style="width: 14px; height: 14px; border-radius: 50%; object-fit: cover;" />` +
            `<span style="color: #94a3b8; font-weight: 500;">Developer Mood</span>` +
            `</div>` +
            `<span style="color: ${color}; font-weight: 800; text-transform: uppercase; font-size: 12px; letter-spacing: 0.05em;">${label}</span>` +
            `<div style="margin-top: 4px; font-size: 13px; font-weight: 700; color: #fff;">` +
            `${pctStr}% <span style="font-size: 9px; color: #94a3b8; font-weight: 400;">(${d.data.count} prompts)</span>` +
            `</div>` +
            (devExamples[d.data.label] ?
            `<div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.1); font-size: 10px; font-weight: 400; color: #cbd5e1; max-width: 220px; line-height: 1.4; font-style: italic;">` +
            `“${devExamples[d.data.label]}”` +
            `</div>` : "")
          );
      })
      .on("mousemove", function (event) {
        tooltipDiv
          .style("top", (event.pageY - 65) + "px")
          .style("left", (event.pageX + 15) + "px");
      })
      .on("mouseout", function (_, d) {
        const el = this as any;
        const ci = el._currentInner ?? targetDevInner;
        const co = el._currentOuter ?? targetDevOuter;
        d3.select(this).transition().duration(200).ease(d3.easeCubicOut)
          .attr("d", d3.arc<d3.PieArcDatum<RingDatum>>().innerRadius(ci).outerRadius(co)(d) as string)
          .style("filter", "none").attr("stroke-width", 1.5);
        tooltipDiv.style("visibility", "hidden").style("opacity", "0");
      })
      .attr("fill", (d) => EMOTION_HEX[d.data.label])
      .transition()
      .duration(devDuration)
      .ease(d3.easeCubicOut)
      .style("opacity", targetDevOpacity)
      .style("pointer-events", filter === "gpt" ? "none" : "all")
      .attrTween("d", function (this: SVGPathElement, d) {
        const el = this as any;
        const isNew = !el._currentAngle;
        if (isNew) {
          el._currentAngle = d;
          const interpolateStart = d3.interpolate(0, d.startAngle);
          const interpolateEnd = d3.interpolate(0, d.endAngle);
          return (t: number) => {
            const tempArc = d3.arc<d3.PieArcDatum<RingDatum>>()
              .innerRadius(radii.dev.both.inner)
              .outerRadius(radii.dev.both.outer)
              .startAngle(interpolateStart(t))
              .endAngle(interpolateEnd(t))
              .padAngle(padAngle);
            return tempArc(d) as string;
          };
        } else {
          return makeArcTween(targetDevInner, targetDevOuter, radii.dev.both.inner, radii.dev.both.outer).call(this, d);
        }
      });

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
      .text(d => {
        if (isFiltered) {
          return d.data.count > 0 ? `${d.data.count}` : "";
        }
        return totalDev > 0 ? `${Math.round((d.data.count / totalDev) * 100)}%` : "";
      })
      .transition()
      .delay(isFirstTime ? 900 : 0)
      .duration(750)
      .ease(d3.easeCubicInOut)
      .style("opacity", filter === "developer" ? 1 : 0)
      .attrTween("transform", function (this: SVGTextElement, d) {
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

    // 2. GPT ring (Outer chart)
    if (g.select("g.gpt-ring").empty()) g.append("g").attr("class", "gpt-ring");
    const gptPaths = g.select<SVGGElement>("g.gpt-ring")
      .selectAll<SVGPathElement, d3.PieArcDatum<RingDatum>>("path")
      .data(gptArcs, (d) => d.data.label);

    const gptDuration = isFirstTime ? 1400 : 500;
    const gptDelay = 0; // Simultaneous entrance together with inner ring

    const gptMerged = gptPaths.enter().append("path")
      .attr("stroke", "var(--color-card)").attr("stroke-width", 1.5)
      .style("opacity", 0)
      .merge(gptPaths as any);

    gptMerged
      .style("cursor", "pointer")
      .on("click", toggleGpt)
      .on("mouseover", function (event, d) {
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
          .style("opacity", "1")
          .html(
            `<div style="display: flex; align-items: center; gap: 6px; margin-bottom: 2px;">` +
            `<img src="${gptLogo}" style="width: 14px; height: 14px; border-radius: 50%; object-fit: cover;" />` +
            `<span style="color: #94a3b8; font-weight: 500;">GPT Response</span>` +
            `</div>` +
            `<span style="color: ${color}; font-weight: 800; text-transform: uppercase; font-size: 12px; letter-spacing: 0.05em;">${label}</span>` +
            `<div style="margin-top: 4px; font-size: 13px; font-weight: 700; color: #fff;">` +
            `${pctStr}% <span style="font-size: 9px; color: #94a3b8; font-weight: 400;">(${d.data.count} responses)</span>` +
            `</div>` +
            (gptExamples[d.data.label] ?
            `<div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.1); font-size: 10px; font-weight: 400; color: #cbd5e1; max-width: 220px; line-height: 1.4; font-style: italic;">` +
            `“${gptExamples[d.data.label]}”` +
            `</div>` : "")
          );
      })
      .on("mousemove", function (event) {
        tooltipDiv
          .style("top", (event.pageY - 65) + "px")
          .style("left", (event.pageX + 15) + "px");
      })
      .on("mouseout", function (_, d) {
        const el = this as any;
        const ci = el._currentInner ?? targetGptInner;
        const co = el._currentOuter ?? targetGptOuter;
        d3.select(this).transition().duration(200).ease(d3.easeCubicOut)
          .attr("d", d3.arc<d3.PieArcDatum<RingDatum>>().innerRadius(ci).outerRadius(co)(d) as string)
          .style("filter", "none").attr("stroke-width", 1.5);
        tooltipDiv.style("visibility", "hidden").style("opacity", "0");
      })
      .attr("fill", (d) => `url(#pattern-dual-${d.data.label})`)
      .transition()
      .delay(gptDelay)
      .duration(gptDuration)
      .ease(d3.easeCubicOut)
      .style("opacity", targetGptOpacity)
      .style("pointer-events", filter === "developer" ? "none" : "all")
      .attrTween("d", function (this: SVGPathElement, d) {
        const el = this as any;
        const isNew = !el._currentAngle;
        if (isNew) {
          el._currentAngle = d;
          const interpolateStart = d3.interpolate(0, d.startAngle);
          const interpolateEnd = d3.interpolate(0, d.endAngle);
          return (t: number) => {
            const tempArc = d3.arc<d3.PieArcDatum<RingDatum>>()
              .innerRadius(radii.gpt.both.inner)
              .outerRadius(radii.gpt.both.outer)
              .startAngle(interpolateStart(t))
              .endAngle(interpolateEnd(t))
              .padAngle(padAngle);
            return tempArc(d) as string;
          };
        } else {
          return makeArcTween(targetGptInner, targetGptOuter, radii.gpt.both.inner, radii.gpt.both.outer).call(this, d);
        }
      })
      .on("end", () => {
        if (isFirstTime) {
          hasAnimatedRef.current = true;
        }
      });

    // GPT Labels
    if (g.select("g.gpt-labels").empty()) g.append("g").attr("class", "gpt-labels");
    const gptLabels = g.select<SVGGElement>("g.gpt-labels")
      .selectAll<SVGTextElement, d3.PieArcDatum<RingDatum>>("text")
      .data(gptArcs, (d) => d.data.label);

    gptLabels.enter().append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("fill", "#000000")
      .attr("font-size", "14px")
      .attr("font-weight", "bold")
      .style("pointer-events", "none")
      .style("opacity", 0)
      .merge(gptLabels as any)
      .text(d => {
        if (isFiltered) {
          return d.data.count > 0 ? `${d.data.count}` : "";
        }
        return totalGpt > 0 ? `${Math.round((d.data.count / totalGpt) * 100)}%` : "";
      })
      .transition()
      .delay(isFirstTime ? 900 : 0)
      .duration(750)
      .ease(d3.easeCubicInOut)
      .style("opacity", filter === "gpt" ? 1 : 0)
      .attrTween("transform", function (this: SVGTextElement, d) {
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
    textGroup.raise();

    return () => {
      tooltipDiv.style("visibility", "hidden").style("opacity", "0");
    };
  }, [filter, width, height, totalDev, totalGpt, devData, gptData, isFiltered, devExamples, gptExamples, isVisible]);

  return (
    <div ref={containerRef} className="flex flex-col md:flex-row items-center justify-around gap-6 w-full h-full py-2 px-4">
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
              {/* Circle-framed logo */}
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
                <span
                  className="text-[11px] font-bold leading-tight text-black dark:text-white"
                  style={{ color: '#000000' }}
                >
                  Developer
                </span>
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
              {/* Circle-framed logo */}
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
                  className="text-[11px] font-bold leading-tight text-black dark:text-white"
                  style={{ color: '#000000' }}
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

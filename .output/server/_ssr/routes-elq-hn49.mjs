import { r as __toESM } from "../_runtime.mjs";
import { n as cubicOut, t as cubicInOut } from "../_libs/d3+[...].mjs";
import { a as require_jsx_runtime, o as require_react } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { v as useLoaderData } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as DevGPT_Logo_default } from "./router-Cmo7LCNO.mjs";
import { i as Trigger, n as List, r as Root2, t as Content } from "../_libs/radix-ui__react-tabs.mjs";
import { t as clsx } from "../_libs/clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { n as max } from "../_libs/d3-array.mjs";
import { n as band, r as point, t as linear } from "../_libs/d3-scale+internmap.mjs";
import { n as axisLeft, t as axisBottom } from "../_libs/d3-axis.mjs";
import { t as select_default } from "../_libs/d3-selection.mjs";
import { n as value_default } from "../_libs/d3-interpolate.mjs";
import { i as arc_default, n as pie_default, r as line_default, t as monotoneX } from "../_libs/d3-shape.mjs";
import { a as Maximize2, c as ArrowUpDown, i as MessageSquare, n as Search, o as ChevronUp, r as Minus, s as ChevronDown, t as X } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-elq-hn49.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var Tabs = Root2;
var TabsList = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(List, {
	ref,
	className: cn("inline-flex h-10 items-center justify-center rounded-full bg-muted/50 p-1 text-muted-foreground backdrop-blur-sm border border-border/50", className),
	...props
}));
TabsList.displayName = List.displayName;
var TabsTrigger = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trigger, {
	ref,
	className: cn("inline-flex items-center justify-center whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium ring-offset-background cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-border/50", className),
	...props
}));
TabsTrigger.displayName = Trigger.displayName;
var TabsContent = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Content, {
	ref,
	className: cn("mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", className),
	...props
}));
TabsContent.displayName = Content.displayName;
var EMOTIONS = [
	"frustration",
	"caution",
	"neutral",
	"satisfaction"
];
/** CSS custom-property reference per emotion (defined in src/styles.css). */
var emotionVar = (e) => `var(--emotion-${e})`;
/** Ordered valence scale used for ordinal/regression style analysis. */
var EMOTION_VALENCE = {
	frustration: -1,
	caution: -.33,
	neutral: .33,
	satisfaction: 1
};
var EMOTION_LABEL = {
	frustration: "Frustration",
	caution: "Caution",
	neutral: "Neutral",
	satisfaction: "Satisfaction"
};
var EMOTION_EMOJI = {
	frustration: "😡",
	caution: "🧐",
	neutral: "😐",
	satisfaction: "🤩"
};
function getAllTurns(conversations) {
	return conversations.flatMap((c) => c.turns.map((t) => ({
		...t,
		conv: c
	})));
}
var share = (n, total) => total ? n / total : 0;
function distribution(conversations, key) {
	const turns = getAllTurns(conversations);
	const total = turns.length;
	return EMOTIONS.map((e) => {
		const count = turns.filter((t) => t[key] === e).length;
		return {
			emotion: e,
			count,
			share: share(count, total)
		};
	});
}
/** Row-normalised P(answer emotion | prompt emotion) with raw counts. */
function transitionMatrix(conversations) {
	const turns = getAllTurns(conversations);
	return EMOTIONS.map((p) => {
		const rows = turns.filter((t) => t.promptEmotion === p);
		return {
			prompt: p,
			total: rows.length,
			cells: EMOTIONS.map((a) => {
				const count = rows.filter((t) => t.answerEmotion === a).length;
				return {
					answer: a,
					count,
					share: share(count, rows.length)
				};
			})
		};
	});
}
/** Answer valence (mean) grouped by prompt emotion — the "impact" measure. */
function answerValenceByPromptEmotion(conversations) {
	const turns = getAllTurns(conversations);
	return EMOTIONS.map((e) => {
		const rows = turns.filter((t) => t.promptEmotion === e);
		return {
			emotion: e,
			mean: rows.reduce((s, t) => s + EMOTION_VALENCE[t.answerEmotion], 0) / (rows.length || 1),
			n: rows.length
		};
	});
}
/** Frustration share of developer prompts by turn depth (escalation curve). */
function emotionByTurnDepth(conversations) {
	const turns = getAllTurns(conversations);
	return Array.from({ length: 12 }, (_, i) => {
		const depth = i + 1;
		const rows = turns.filter((t) => t.index === depth);
		const point = {
			depth,
			n: rows.length,
			frustration: 0,
			caution: 0,
			neutral: 0,
			satisfaction: 0
		};
		for (const e of EMOTIONS) point[e] = share(rows.filter((r) => r.promptEmotion === e).length, rows.length);
		return point;
	}).filter((p) => p.n >= 25);
}
function scatterPoints(conversations) {
	return getAllTurns(conversations).map((t) => ({
		x: t.promptScore,
		y: t.answerScore,
		promptEmotion: t.promptEmotion,
		answerEmotion: t.answerEmotion,
		id: `${t.conv.id}-${t.index}`
	}));
}
function pearson(pairs) {
	const n = pairs.length || 1;
	const mx = pairs.reduce((s, p) => s + p.x, 0) / n;
	const my = pairs.reduce((s, p) => s + p.y, 0) / n;
	let num = 0;
	let dx = 0;
	let dy = 0;
	for (const p of pairs) {
		num += (p.x - mx) * (p.y - my);
		dx += (p.x - mx) ** 2;
		dy += (p.y - my) ** 2;
	}
	const r = num / (Math.sqrt(dx * dy) || 1);
	const slope = num / (dx || 1);
	return {
		r,
		slope,
		intercept: my - slope * mx,
		mx,
		my,
		n
	};
}
/** Observes a container and returns its pixel width (for responsive D3 SVGs). */
function useChartWidth() {
	const ref = (0, import_react.useRef)(null);
	const [width, setWidth] = (0, import_react.useState)(0);
	(0, import_react.useEffect)(() => {
		const el = ref.current;
		if (!el) return;
		const ro = new ResizeObserver((entries) => {
			const w = entries[0]?.contentRect.width ?? 0;
			setWidth(Math.round(w));
		});
		ro.observe(el);
		setWidth(Math.round(el.getBoundingClientRect().width));
		return () => ro.disconnect();
	}, []);
	return {
		ref,
		width
	};
}
var fmtPct = (v, digits = 1) => `${(v * 100).toFixed(digits)}%`;
/** 100% stacked horizontal bars — one row per group, segments per emotion. */
function StackedBarChart({ rows, height = 260 }) {
	const { ref, width } = useChartWidth();
	const svgRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		if (!width || !svgRef.current) return;
		const margin = {
			top: 8,
			right: 46,
			bottom: 26,
			left: 96
		};
		const w = width - margin.left - margin.right;
		const h = height - margin.top - margin.bottom;
		let tooltipDiv = select_default("#chart-tooltip");
		if (tooltipDiv.empty()) tooltipDiv = select_default("body").append("div").attr("id", "chart-tooltip").style("position", "absolute").style("visibility", "hidden").style("background", "rgba(15, 23, 42, 0.95)").style("backdrop-filter", "blur(8px)").style("border", "1px solid rgba(255, 255, 255, 0.15)").style("padding", "8px 12px").style("border-radius", "8px").style("color", "#fff").style("font-size", "11px").style("font-weight", "600").style("box-shadow", "0 4px 20px rgba(0, 0, 0, 0.3)").style("pointer-events", "none").style("z-index", "99999");
		const svg = select_default(svgRef.current);
		svg.selectAll("*").remove();
		const g = svg.attr("viewBox", `0 0 ${width} ${height}`).append("g").attr("transform", `translate(${margin.left},${margin.top})`);
		const x = linear([0, 1], [0, w]);
		const y = band().domain(rows.map((r) => r.label)).range([0, h]).padding(.28);
		g.append("g").attr("transform", `translate(0,${h})`).call(axisBottom(x).ticks(5).tickFormat((d) => fmtPct(Number(d), 0))).call((s) => s.select(".domain").remove()).selectAll("text").style("fill", "var(--muted-foreground)").style("font-size", "10px");
		rows.forEach((row) => {
			let acc = 0;
			const segs = row.cells.map((c) => {
				const seg = {
					...c,
					x0: acc,
					x1: acc + c.share
				};
				acc += c.share;
				return seg;
			});
			g.selectAll(`rect.r-${row.label.replace(/\W/g, "")}`).data(segs).join("rect").attr("class", `r-${row.label.replace(/\W/g, "")}`).attr("x", (d) => x(d.x0)).attr("y", y(row.label)).attr("width", 0).attr("height", y.bandwidth()).style("fill", (d) => emotionVar(d.key)).style("opacity", .92).style("cursor", "pointer").on("mouseover", function(event, d) {
				const devColor = EMOTION_COLORS$3[row.label.toLowerCase()] || "#3b6fa5";
				const gptColor = EMOTION_COLORS$3[d.key];
				const devLabel = row.label;
				const gptLabel = EMOTION_LABEL[d.key];
				tooltipDiv.style("visibility", "visible").html(`<span style="color: ${devColor}; font-weight: 800; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em;">${devLabel}</span><span style="color: #94a3b8; font-weight: 400; margin: 0 6px;">→</span><span style="color: ${gptColor}; font-weight: 800; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em;">${gptLabel}</span><div style="margin-top: 4px; font-size: 13px; font-weight: 700; color: #fff;">${fmtPct(d.share)} <span style="font-size: 9px; color: #94a3b8; font-weight: 400;">(${d.count} responses)</span></div>`);
				select_default(this).transition().duration(100).style("opacity", 1);
			}).on("mousemove", function(event) {
				tooltipDiv.style("top", event.pageY - 60 + "px").style("left", event.pageX + 15 + "px");
			}).on("mouseout", function() {
				tooltipDiv.style("visibility", "hidden");
				select_default(this).transition().duration(100).style("opacity", .92);
			}).transition().delay((_, i) => i * 70).duration(700).ease(cubicOut).attr("width", (d) => Math.max(0, x(d.x1) - x(d.x0)));
			g.selectAll(`text.l-${row.label.replace(/\W/g, "")}`).data(segs.filter((s) => s.share > .09)).join("text").attr("class", `l-${row.label.replace(/\W/g, "")}`).attr("x", (d) => x((d.x0 + d.x1) / 2)).attr("y", y(row.label) + y.bandwidth() / 2).attr("text-anchor", "middle").attr("dy", "0.35em").style("font-size", "10px").style("font-weight", "600").style("fill", "var(--background)").text((d) => fmtPct(d.share, 0));
			g.append("text").attr("x", -10).attr("y", y(row.label) + y.bandwidth() / 2).attr("dy", "0.35em").attr("text-anchor", "end").style("font-size", "11px").style("fill", row.labelColor ?? "var(--foreground)").text(row.label);
			g.append("text").attr("x", w + 8).attr("y", y(row.label) + y.bandwidth() / 2).attr("dy", "0.35em").style("font-size", "10px").style("font-variant-numeric", "tabular-nums").style("fill", "var(--muted-foreground)").text(`n=${row.total}`);
		});
		return () => {
			select_default("#chart-tooltip").remove();
		};
	}, [
		rows,
		width,
		height
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		ref,
		className: "w-full",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
			ref: svgRef,
			width,
			height
		})
	});
}
var EMOTION_COLORS$3 = {
	frustration: "#c0392b",
	caution: "#c48f0a",
	neutral: "#3b6fa5",
	satisfaction: "#27ae60"
};
/** Vertical bars of a single metric per emotion, with 95% CI whiskers. */
function MeanBarChart({ data, domain, height = 250, valueFormat = (v) => v.toFixed(3), zeroLine = false }) {
	const { ref, width } = useChartWidth();
	const svgRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		if (!width || !svgRef.current) return;
		const margin = {
			top: 18,
			right: 12,
			bottom: 30,
			left: 48
		};
		const w = width - margin.left - margin.right;
		const h = height - margin.top - margin.bottom;
		let tooltipDiv = select_default("#chart-tooltip");
		if (tooltipDiv.empty()) tooltipDiv = select_default("body").append("div").attr("id", "chart-tooltip").style("position", "absolute").style("visibility", "hidden").style("background", "rgba(15, 23, 42, 0.95)").style("backdrop-filter", "blur(8px)").style("border", "1px solid rgba(255, 255, 255, 0.15)").style("padding", "8px 12px").style("border-radius", "8px").style("color", "#fff").style("font-size", "11px").style("font-weight", "600").style("box-shadow", "0 4px 20px rgba(0, 0, 0, 0.3)").style("pointer-events", "none").style("z-index", "99999");
		const svg = select_default(svgRef.current);
		svg.selectAll("*").remove();
		const g = svg.attr("viewBox", `0 0 ${width} ${height}`).append("g").attr("transform", `translate(${margin.left},${margin.top})`);
		const x = band().domain(EMOTIONS).range([0, w]).padding(.34);
		const y = linear(domain, [h, 0]);
		g.append("g").call(axisLeft(y).ticks(5).tickSize(-w).tickFormat((d) => valueFormat(Number(d)))).call((s) => s.select(".domain").remove()).call((s) => s.selectAll(".tick line").style("stroke", "var(--grid)").style("opacity", .6)).selectAll("text").style("fill", "var(--muted-foreground)").style("font-size", "10px");
		g.append("g").attr("transform", `translate(0,${h})`).call(axisBottom(x).tickSize(0).tickPadding(8)).call((s) => s.select(".domain").style("stroke", "var(--border)")).selectAll("text").style("font-size", "10px").style("fill", "var(--muted-foreground)").text((d) => EMOTION_LABEL[d]);
		if (zeroLine) g.append("line").attr("x1", 0).attr("x2", w).attr("y1", y(0)).attr("y2", y(0)).style("stroke", "var(--muted-foreground)").style("stroke-dasharray", "3 3");
		const base = zeroLine ? y(0) : h;
		g.selectAll("rect").data(data).join("rect").attr("x", (d) => x(d.emotion)).attr("width", x.bandwidth()).attr("y", base).attr("height", 0).attr("rx", 3).style("fill", (d) => emotionVar(d.emotion)).style("fill-opacity", .85).style("cursor", "pointer").on("mouseover", function(event, d) {
			const devColor = EMOTION_COLORS$3[d.emotion];
			const satColor = EMOTION_COLORS$3["satisfaction"];
			const devLabel = EMOTION_LABEL[d.emotion];
			const satLabel = EMOTION_LABEL["satisfaction"];
			tooltipDiv.style("visibility", "visible").html(`<span style="color: ${devColor}; font-weight: 800; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em;">${devLabel}</span><span style="color: #94a3b8; font-weight: 400; margin: 0 6px;">→</span><span style="color: ${satColor}; font-weight: 800; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em;">${satLabel}</span><div style="margin-top: 4px; font-size: 13px; font-weight: 700; color: #fff;">${valueFormat(d.mean)} <span style="font-size: 9px; color: #94a3b8; font-weight: 400;">(n=${d.n})</span></div>`);
			select_default(this).transition().duration(100).style("fill-opacity", 1);
		}).on("mousemove", function(event) {
			tooltipDiv.style("top", event.pageY - 60 + "px").style("left", event.pageX + 15 + "px");
		}).on("mouseout", function() {
			tooltipDiv.style("visibility", "hidden");
			select_default(this).transition().duration(100).style("fill-opacity", .85);
		}).transition().delay((_, i) => i * 90).duration(780).ease(cubicOut).attr("y", (d) => Math.min(base, y(d.mean))).attr("height", (d) => Math.abs(base - y(d.mean)));
		data.forEach((d) => {
			if (!d.ci) return;
			const cx = x(d.emotion) + x.bandwidth() / 2;
			g.append("line").attr("x1", cx).attr("x2", cx).attr("y1", y(d.mean - d.ci)).attr("y2", y(d.mean + d.ci)).style("stroke", "var(--foreground)").style("opacity", .65);
		});
		g.selectAll("text.val").data(data).join("text").attr("class", "val").attr("x", (d) => x(d.emotion) + x.bandwidth() / 2).attr("y", (d) => y(d.mean) < base ? y(d.mean) - 8 : y(d.mean) + 14).attr("text-anchor", "middle").style("font-size", "10px").style("font-variant-numeric", "tabular-nums").style("fill", "var(--foreground)").text((d) => valueFormat(d.mean));
		return () => {
			select_default("#chart-tooltip").remove();
		};
	}, [
		data,
		width,
		height,
		domain,
		valueFormat,
		zeroLine
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		ref,
		className: "w-full",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
			ref: svgRef,
			width,
			height
		})
	});
}
/**
* Side-by-side (grouped) vertical bar chart with a draw-in animation.
* Series colours are passed in, so non-emotion series never reuse emotion hues.
*/
function GroupedBarChart({ groups, series, height = 300, format = (v) => `${(v * 100).toFixed(0)}%`, yMax }) {
	const { ref, width } = useChartWidth();
	const svgRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		if (!width || !svgRef.current) return;
		const margin = {
			top: 22,
			right: 12,
			bottom: 34,
			left: 46
		};
		const w = width - margin.left - margin.right;
		const h = height - margin.top - margin.bottom;
		const svg = select_default(svgRef.current);
		svg.selectAll("*").remove();
		const g = svg.attr("viewBox", `0 0 ${width} ${height}`).append("g").attr("transform", `translate(${margin.left},${margin.top})`);
		const x0 = band().domain(groups.map((d) => d.label)).range([0, w]).paddingInner(.28).paddingOuter(.12);
		const x1 = band().domain(series.map((s) => s.key)).range([0, x0.bandwidth()]).padding(.14);
		const max$1 = yMax ?? (max(groups, (g2) => max(series, (s) => g2.values[s.key] ?? 0)) ?? 1) * 1.18;
		const y = linear([0, max$1], [h, 0]);
		g.append("g").call(axisLeft(y).ticks(5).tickSize(-w).tickFormat((d) => format(Number(d)))).call((s) => s.select(".domain").remove()).call((s) => s.selectAll(".tick line").style("stroke", "var(--grid)")).selectAll("text").style("fill", "var(--muted-foreground)").style("font-size", "10px");
		g.append("g").attr("transform", `translate(0,${h})`).call(axisBottom(x0).tickSize(0).tickPadding(10)).call((s) => s.select(".domain").style("stroke", "var(--border)")).selectAll("text").style("fill", "var(--foreground)").style("font-size", "11px").style("font-weight", "500");
		groups.forEach((group, gi) => {
			const cell = g.append("g").attr("transform", `translate(${x0(group.label)},0)`);
			series.forEach((s, si) => {
				const v = group.values[s.key] ?? 0;
				const delay = gi * 90 + si * 45;
				cell.append("rect").attr("x", x1(s.key)).attr("width", x1.bandwidth()).attr("y", h).attr("height", 0).attr("rx", 3).style("fill", s.color).call((sel) => sel.append("title").text(`${group.label} · ${s.label}: ${format(v)}`)).transition().delay(delay).duration(750).ease(cubicOut).attr("y", y(v)).attr("height", h - y(v));
				cell.append("text").attr("x", x1(s.key) + x1.bandwidth() / 2).attr("y", y(v) - 7).attr("text-anchor", "middle").style("font-size", "10px").style("font-family", "var(--font-mono)").style("fill", s.color).style("opacity", 0).text(format(v)).transition().delay(delay + 420).duration(400).style("opacity", 1);
			});
		});
	}, [
		groups,
		series,
		width,
		height,
		format,
		yMax
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		ref,
		className: "w-full",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
			ref: svgRef,
			width,
			height
		})
	});
}
/** Small inline legend for non-emotion series. */
function SeriesLegend({ series }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex flex-wrap items-center gap-4 text-xs text-muted-foreground",
		children: series.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "flex items-center gap-1.5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "size-2.5 rounded-sm",
				style: { background: s.color }
			}), s.label]
		}, s.key))
	});
}
var black_gpt_chat_logo_on_white_background_logo_illustration_free_vector_default = "/assets/black-gpt-chat-logo-on-white-background-logo-illustration-free-vector-BwAIPV0z.jpg";
var user_profile_icon_free_vector_658200527_default = "/assets/user-profile-icon-free-vector-658200527-DNpqjL6l.jpg";
var EMOTION_HEX = {
	frustration: "#c0392b",
	caution: "#c48f0a",
	neutral: "#3b6fa5",
	satisfaction: "#27ae60"
};
function emotionGlow(emotion) {
	const c = EMOTION_HEX[emotion];
	return `rgba(${parseInt(c.slice(1, 3), 16)},${parseInt(c.slice(3, 5), 16)},${parseInt(c.slice(5, 7), 16)},0.45)`;
}
function DualRingDonut({ devCounts, gptCounts, width = 340, height = 340 }) {
	const svgRef = (0, import_react.useRef)(null);
	const [filter, setFilter] = (0, import_react.useState)("both");
	const devData = EMOTIONS.map((e) => ({
		label: e,
		count: devCounts[e] || 0
	}));
	const gptData = EMOTIONS.map((e) => ({
		label: e,
		count: gptCounts[e] || 0
	}));
	const totalDev = devData.reduce((s, d) => s + d.count, 0);
	const totalGpt = gptData.reduce((s, d) => s + d.count, 0);
	const toggleDev = () => setFilter((f) => f === "developer" ? "both" : "developer");
	const toggleGpt = () => setFilter((f) => f === "gpt" ? "both" : "gpt");
	(0, import_react.useEffect)(() => {
		if (!svgRef.current) return;
		const svg = select_default(svgRef.current);
		const radius = Math.min(width, height) / 2 - 5;
		const padAngle = .015;
		let tooltipDiv = select_default("#chart-tooltip");
		if (tooltipDiv.empty()) tooltipDiv = select_default("body").append("div").attr("id", "chart-tooltip").style("position", "absolute").style("visibility", "hidden").style("background", "rgba(15, 23, 42, 0.95)").style("backdrop-filter", "blur(8px)").style("border", "1px solid rgba(255, 255, 255, 0.15)").style("padding", "8px 12px").style("border-radius", "8px").style("color", "#fff").style("font-size", "11px").style("font-weight", "600").style("box-shadow", "0 4px 20px rgba(0, 0, 0, 0.3)").style("pointer-events", "none").style("z-index", "99999");
		const radii = {
			dev: {
				both: {
					inner: radius * .28,
					outer: radius * .65
				},
				developer: {
					inner: radius * .28,
					outer: radius * .95
				},
				gpt: {
					inner: radius * .28,
					outer: radius * .28
				}
			},
			gpt: {
				both: {
					inner: radius * .68,
					outer: radius * .95
				},
				developer: {
					inner: radius * .95,
					outer: radius * .95
				},
				gpt: {
					inner: radius * .28,
					outer: radius * .95
				}
			}
		};
		svg.attr("width", width).attr("height", height).attr("viewBox", `0 0 ${width} ${height}`);
		let g = svg.select("g.main-group");
		if (g.empty()) g = svg.append("g").attr("class", "main-group").attr("transform", `translate(${width / 2}, ${height / 2})`);
		let defs = svg.select("defs");
		if (defs.empty()) defs = svg.insert("defs", "g");
		if (defs.select("#clip-logo-dev").empty()) {
			defs.append("clipPath").attr("id", "clip-logo-dev").append("circle").attr("cx", 0).attr("cy", 0).attr("r", 26);
			defs.append("clipPath").attr("id", "clip-logo-gpt").append("circle").attr("cx", 0).attr("cy", 0).attr("r", 26);
		}
		EMOTIONS.forEach((emo) => {
			const color = EMOTION_HEX[emo];
			const patternId = `pattern-dual-${emo}`;
			if (defs.select(`#${patternId}`).empty()) {
				const r = parseInt(color.slice(1, 3), 16);
				const gv = parseInt(color.slice(3, 5), 16);
				const b = parseInt(color.slice(5, 7), 16);
				const pat = defs.append("pattern").attr("id", patternId).attr("width", 6).attr("height", 6).attr("patternUnits", "userSpaceOnUse").attr("patternTransform", "rotate(45)");
				pat.append("rect").attr("width", 6).attr("height", 6).attr("fill", `rgba(${r},${gv},${b},0.18)`);
				pat.append("line").attr("x1", 0).attr("y1", 0).attr("x2", 0).attr("y2", 6).attr("stroke", color).attr("stroke-width", 2);
			}
		});
		const pie = pie_default().value((d) => d.count).sort(null).padAngle(padAngle);
		const devArcs = pie(devData);
		const gptArcs = pie(gptData);
		const targetDevInner = radii.dev[filter].inner;
		const targetDevOuter = radii.dev[filter].outer;
		const targetGptInner = radii.gpt[filter].inner;
		const targetGptOuter = radii.gpt[filter].outer;
		const targetDevOpacity = filter === "gpt" ? 0 : 1;
		const targetGptOpacity = filter === "developer" ? 0 : 1;
		let textGroup = g.select("g.center-text");
		if (textGroup.empty()) {
			textGroup = g.append("g").attr("class", "center-text");
			const logoGroup = textGroup.append("g").attr("class", "center-logo-group");
			const devG = logoGroup.append("g").attr("class", "logo-dev-group").style("cursor", "pointer").on("click", (e) => {
				e.stopPropagation();
				toggleDev();
			});
			devG.append("circle").attr("class", "logo-dev-ring").attr("cx", 0).attr("cy", 0).attr("r", 28).attr("fill", "white").attr("stroke", "rgba(59,130,246,0.5)").attr("stroke-width", 2);
			devG.append("image").attr("class", "logo-dev-img").attr("href", user_profile_icon_free_vector_658200527_default).attr("preserveAspectRatio", "xMidYMid slice").attr("clip-path", "url(#clip-logo-dev)").attr("width", 56).attr("height", 56).attr("x", -28).attr("y", -28);
			const gptG = logoGroup.append("g").attr("class", "logo-gpt-group").style("cursor", "pointer").on("click", (e) => {
				e.stopPropagation();
				toggleGpt();
			});
			gptG.append("circle").attr("class", "logo-gpt-ring").attr("cx", 0).attr("cy", 0).attr("r", 28).attr("fill", "white").attr("stroke", "rgba(59,130,246,0.5)").attr("stroke-width", 2);
			gptG.append("image").attr("class", "logo-gpt-img").attr("href", black_gpt_chat_logo_on_white_background_logo_illustration_free_vector_default).attr("preserveAspectRatio", "xMidYMid slice").attr("clip-path", "url(#clip-logo-gpt)").attr("width", 56).attr("height", 56).attr("x", -28).attr("y", -28);
		}
		const logoDevGroup = textGroup.select("g.logo-dev-group");
		const logoGptGroup = textGroup.select("g.logo-gpt-group");
		const duration = 500;
		const ease = cubicInOut;
		if (filter === "developer") {
			logoDevGroup.style("pointer-events", "all").transition().duration(duration).ease(ease).style("opacity", 1).attr("transform", "translate(0,0)");
			logoDevGroup.select("circle.logo-dev-ring").transition().duration(duration).ease(ease).attr("r", 28);
			logoDevGroup.select("image.logo-dev-img").transition().duration(duration).ease(ease).attr("width", 88).attr("height", 88).attr("x", -44).attr("y", -44).attr("clip-path", "url(#clip-logo-dev)");
			logoGptGroup.style("pointer-events", "none").transition().duration(duration).ease(ease).style("opacity", 0).attr("transform", "translate(15,0) scale(0.6)");
		} else if (filter === "gpt") {
			logoDevGroup.style("pointer-events", "none").transition().duration(duration).ease(ease).style("opacity", 0).attr("transform", "translate(-15,0) scale(0.6)");
			logoGptGroup.style("pointer-events", "all").transition().duration(duration).ease(ease).style("opacity", 1).attr("transform", "translate(0,0)");
			logoGptGroup.select("circle.logo-gpt-ring").transition().duration(duration).ease(ease).attr("r", 28);
			logoGptGroup.select("image.logo-gpt-img").transition().duration(duration).ease(ease).attr("width", 88).attr("height", 88).attr("x", -44).attr("y", -44).attr("clip-path", "url(#clip-logo-gpt)");
		} else {
			logoDevGroup.style("pointer-events", "all").transition().duration(duration).ease(ease).style("opacity", 1).attr("transform", "translate(-22,0)");
			logoDevGroup.select("circle.logo-dev-ring").transition().duration(duration).ease(ease).attr("r", 18);
			logoDevGroup.select("image.logo-dev-img").transition().duration(duration).ease(ease).attr("width", 56).attr("height", 56).attr("x", -28).attr("y", -28).attr("clip-path", "url(#clip-logo-dev-sm)");
			logoGptGroup.style("pointer-events", "all").transition().duration(duration).ease(ease).style("opacity", 1).attr("transform", "translate(22,0)");
			logoGptGroup.select("circle.logo-gpt-ring").transition().duration(duration).ease(ease).attr("r", 18);
			logoGptGroup.select("image.logo-gpt-img").transition().duration(duration).ease(ease).attr("width", 56).attr("height", 56).attr("x", -28).attr("y", -28).attr("clip-path", "url(#clip-logo-gpt-sm)");
		}
		function makeArcTween(tInner, tOuter, dInner, dOuter) {
			return function(d) {
				const el = this;
				const ci = el._currentInner ?? dInner;
				const co = el._currentOuter ?? dOuter;
				const ii = value_default(ci, tInner);
				const io = value_default(co, tOuter);
				el._currentInner = tInner;
				el._currentOuter = tOuter;
				return (t) => arc_default().innerRadius(ii(t)).outerRadius(io(t))(d);
			};
		}
		if (g.select("g.dev-ring").empty()) g.append("g").attr("class", "dev-ring");
		const devPaths = g.select("g.dev-ring").selectAll("path").data(devArcs, (d) => d.data.label);
		devPaths.enter().append("path").attr("stroke", "var(--color-card)").attr("stroke-width", 1.5).style("opacity", 0).style("cursor", "pointer").on("click", toggleDev).on("mouseover", function(event, d) {
			const el = this;
			const ci = el._currentInner ?? targetDevInner;
			const co = el._currentOuter ?? targetDevOuter;
			select_default(this).raise().transition().duration(200).ease(cubicOut).attr("d", arc_default().innerRadius(ci - 3).outerRadius(co + 8)(d)).style("filter", `drop-shadow(0 0 10px ${emotionGlow(d.data.label)})`).attr("stroke-width", 2);
			const color = EMOTION_HEX[d.data.label];
			const label = d.data.label.charAt(0).toUpperCase() + d.data.label.slice(1);
			const pctStr = totalDev > 0 ? Math.round(d.data.count / totalDev * 100) : 0;
			tooltipDiv.style("visibility", "visible").html(`<div style="display: flex; align-items: center; gap: 6px; margin-bottom: 2px;"><img src="${user_profile_icon_free_vector_658200527_default}" style="width: 14px; height: 14px; border-radius: 50%; object-fit: cover;" /><span style="color: #94a3b8; font-weight: 500;">Developer Mood</span></div><span style="color: ${color}; font-weight: 800; text-transform: uppercase; font-size: 12px; letter-spacing: 0.05em;">${label}</span><div style="margin-top: 4px; font-size: 13px; font-weight: 700; color: #fff;">${pctStr}% <span style="font-size: 9px; color: #94a3b8; font-weight: 400;">(${d.data.count} prompts)</span></div>`);
		}).on("mousemove", function(event) {
			tooltipDiv.style("top", event.pageY - 65 + "px").style("left", event.pageX + 15 + "px");
		}).on("mouseout", function(_, d) {
			const el = this;
			const ci = el._currentInner ?? targetDevInner;
			const co = el._currentOuter ?? targetDevOuter;
			select_default(this).transition().duration(200).ease(cubicOut).attr("d", arc_default().innerRadius(ci).outerRadius(co)(d)).style("filter", "none").attr("stroke-width", 1.5);
			tooltipDiv.style("visibility", "hidden");
		}).attr("d", (d) => arc_default().innerRadius(radii.dev.both.inner).outerRadius(radii.dev.both.outer)(d)).merge(devPaths).on("click", toggleDev).attr("fill", (d) => EMOTION_HEX[d.data.label]).transition().duration(750).ease(cubicInOut).style("opacity", targetDevOpacity).style("pointer-events", filter === "gpt" ? "none" : "all").attrTween("d", function(d) {
			return makeArcTween(targetDevInner, targetDevOuter, radii.dev.both.inner, radii.dev.both.outer).call(this, d);
		});
		if (g.select("g.dev-labels").empty()) g.append("g").attr("class", "dev-labels");
		const devLabels = g.select("g.dev-labels").selectAll("text").data(devArcs, (d) => d.data.label);
		devLabels.enter().append("text").attr("text-anchor", "middle").attr("dy", "0.35em").attr("fill", "white").attr("font-size", "14px").attr("font-weight", "bold").style("pointer-events", "none").style("opacity", 0).merge(devLabels).text((d) => totalDev > 0 ? `${Math.round(d.data.count / totalDev * 100)}%` : "").transition().duration(750).ease(cubicInOut).style("opacity", filter === "developer" ? 1 : 0).attrTween("transform", function(d) {
			const el = this;
			const ci = el._currentInner ?? targetDevInner;
			const co = el._currentOuter ?? targetDevOuter;
			const ii = value_default(ci, targetDevInner);
			const io = value_default(co, targetDevOuter);
			el._currentInner = targetDevInner;
			el._currentOuter = targetDevOuter;
			return (t) => {
				return `translate(${arc_default().innerRadius(ii(t)).outerRadius(io(t)).centroid(d)})`;
			};
		});
		if (g.select("g.gpt-ring").empty()) g.append("g").attr("class", "gpt-ring");
		const gptPaths = g.select("g.gpt-ring").selectAll("path").data(gptArcs, (d) => d.data.label);
		gptPaths.enter().append("path").attr("stroke", "var(--color-card)").attr("stroke-width", 1.5).style("opacity", 0).style("cursor", "pointer").on("click", toggleGpt).on("mouseover", function(event, d) {
			const el = this;
			const ci = el._currentInner ?? targetGptInner;
			const co = el._currentOuter ?? targetGptOuter;
			select_default(this).raise().transition().duration(200).ease(cubicOut).attr("d", arc_default().innerRadius(ci - 3).outerRadius(co + 8)(d)).style("filter", `drop-shadow(0 0 10px ${emotionGlow(d.data.label)})`).attr("stroke-width", 2);
			const color = EMOTION_HEX[d.data.label];
			const label = d.data.label.charAt(0).toUpperCase() + d.data.label.slice(1);
			const pctStr = totalGpt > 0 ? Math.round(d.data.count / totalGpt * 100) : 0;
			tooltipDiv.style("visibility", "visible").html(`<div style="display: flex; align-items: center; gap: 6px; margin-bottom: 2px;"><img src="${black_gpt_chat_logo_on_white_background_logo_illustration_free_vector_default}" style="width: 14px; height: 14px; border-radius: 50%; object-fit: cover;" /><span style="color: #94a3b8; font-weight: 500;">GPT Response</span></div><span style="color: ${color}; font-weight: 800; text-transform: uppercase; font-size: 12px; letter-spacing: 0.05em;">${label}</span><div style="margin-top: 4px; font-size: 13px; font-weight: 700; color: #fff;">${pctStr}% <span style="font-size: 9px; color: #94a3b8; font-weight: 400;">(${d.data.count} responses)</span></div>`);
		}).on("mousemove", function(event) {
			tooltipDiv.style("top", event.pageY - 65 + "px").style("left", event.pageX + 15 + "px");
		}).on("mouseout", function(_, d) {
			const el = this;
			const ci = el._currentInner ?? targetGptInner;
			const co = el._currentOuter ?? targetGptOuter;
			select_default(this).transition().duration(200).ease(cubicOut).attr("d", arc_default().innerRadius(ci).outerRadius(co)(d)).style("filter", "none").attr("stroke-width", 1.5);
			tooltipDiv.style("visibility", "hidden");
		}).attr("d", (d) => arc_default().innerRadius(radii.gpt.both.inner).outerRadius(radii.gpt.both.outer)(d)).merge(gptPaths).on("click", toggleGpt).attr("fill", (d) => `url(#pattern-dual-${d.data.label})`).transition().duration(750).ease(cubicInOut).style("opacity", targetGptOpacity).style("pointer-events", filter === "developer" ? "none" : "all").attrTween("d", function(d) {
			return makeArcTween(targetGptInner, targetGptOuter, radii.gpt.both.inner, radii.gpt.both.outer).call(this, d);
		});
		if (g.select("g.gpt-labels").empty()) g.append("g").attr("class", "gpt-labels");
		const gptLabels = g.select("g.gpt-labels").selectAll("text").data(gptArcs, (d) => d.data.label);
		gptLabels.enter().append("text").attr("text-anchor", "middle").attr("dy", "0.35em").attr("fill", "white").attr("font-size", "14px").attr("font-weight", "bold").style("pointer-events", "none").style("opacity", 0).style("filter", "drop-shadow(0px 1px 2px rgba(0,0,0,0.8))").merge(gptLabels).text((d) => totalGpt > 0 ? `${Math.round(d.data.count / totalGpt * 100)}%` : "").transition().duration(750).ease(cubicInOut).style("opacity", filter === "gpt" ? 1 : 0).attrTween("transform", function(d) {
			const el = this;
			const ci = el._currentInner ?? targetGptInner;
			const co = el._currentOuter ?? targetGptOuter;
			const ii = value_default(ci, targetGptInner);
			const io = value_default(co, targetGptOuter);
			el._currentInner = targetGptInner;
			el._currentOuter = targetGptOuter;
			return (t) => {
				return `translate(${arc_default().innerRadius(ii(t)).outerRadius(io(t)).centroid(d)})`;
			};
		});
		textGroup.raise();
		return () => {
			select_default("#chart-tooltip").remove();
		};
	}, [
		filter,
		width,
		height,
		totalDev,
		totalGpt,
		devData,
		gptData
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col md:flex-row items-center justify-around gap-6 w-full h-full py-2 px-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex items-center justify-center shrink-0",
			style: {
				width,
				height
			},
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
				ref: svgRef,
				style: {
					width,
					height
				}
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col justify-center gap-5 border-l border-border/40 md:pl-8 py-2 w-full max-w-xs",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-[11px] font-bold text-foreground uppercase tracking-wider",
					children: "Ring Layers"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-2 text-xs font-medium",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: toggleDev,
						className: "flex items-center gap-3.5 px-3 py-2.5 bg-card rounded-xl border cursor-pointer transition-all duration-200 group",
						style: filter === "developer" ? {
							borderColor: "#3b82f6",
							boxShadow: "0 0 0 2px rgba(59,130,246,0.20), 0 6px 20px rgba(59,130,246,0.18)"
						} : {
							borderColor: "hsl(var(--border) / 0.5)",
							boxShadow: "none"
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "relative shrink-0 w-11 h-11 rounded-full overflow-hidden",
							style: { boxShadow: filter === "developer" ? "0 0 0 2px #3b82f6, 0 0 0 3.5px hsl(var(--card))" : "0 0 0 1.5px hsl(var(--border) / 0.4), 0 0 0 3px hsl(var(--card))" },
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: user_profile_icon_free_vector_658200527_default,
								alt: "Developer",
								className: "w-full h-full object-cover",
								style: {
									transform: "scale(1.55)",
									transformOrigin: "center"
								}
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "flex flex-col text-left",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: `text-[11px] font-semibold leading-tight ${filter === "developer" ? "text-foreground" : "text-muted-foreground"}`,
								children: "Developer"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[9px] font-mono text-muted-foreground/50 mt-0.5",
								children: "inner ring"
							})]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: toggleGpt,
						className: "flex items-center gap-3.5 px-3 py-2.5 bg-card rounded-xl border cursor-pointer transition-all duration-200 group",
						style: filter === "gpt" ? {
							borderColor: "#3b82f6",
							boxShadow: "0 0 0 2px rgba(59,130,246,0.20), 0 6px 20px rgba(59,130,246,0.18)"
						} : {
							borderColor: "hsl(var(--border) / 0.5)",
							boxShadow: "none"
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "relative shrink-0 w-11 h-11 rounded-full overflow-hidden",
							style: { boxShadow: filter === "gpt" ? "0 0 0 2px #3b82f6, 0 0 0 3.5px hsl(var(--card))" : "0 0 0 1.5px hsl(var(--border) / 0.4), 0 0 0 3px hsl(var(--card))" },
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: black_gpt_chat_logo_on_white_background_logo_illustration_free_vector_default,
								alt: "GPT",
								className: "w-full h-full object-cover",
								style: {
									transform: "scale(1.55)",
									transformOrigin: "center"
								}
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "flex flex-col text-left",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: `text-[11px] font-semibold leading-tight ${filter === "gpt" ? "text-foreground" : "text-muted-foreground"}`,
								style: {
									backgroundImage: "repeating-linear-gradient(45deg, rgba(59,130,246,0.95) 0 4px, rgba(148,163,184,0.65) 0 8px)",
									WebkitBackgroundClip: "text",
									color: "transparent"
								},
								children: "ChatGPT"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[9px] font-mono text-muted-foreground/50 mt-0.5",
								children: "outer ring"
							})]
						})]
					})]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-2.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-[11px] font-bold text-foreground uppercase tracking-wider",
					children: "Emotion Classes"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-2 gap-2 text-xs font-medium",
					children: EMOTIONS.map((e) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "flex items-center gap-2 p-1.5 rounded-md bg-muted/30 border border-border/30",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "w-3 h-3 rounded-full shrink-0 shadow-xs",
							style: { background: EMOTION_HEX[e] }
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "capitalize",
							children: EMOTION_LABEL[e]
						})]
					}, e))
				})]
			})]
		})]
	});
}
function Panel({ title, subtitle, children, insight, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: cn("panel rise-in flex flex-col p-5", className),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "mb-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "text-base font-semibold tracking-tight text-foreground",
					children: title
				}), subtitle && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-xs text-muted-foreground",
					children: subtitle
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex-1",
				children
			}),
			insight && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-4 border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-semibold text-foreground",
					children: "Reading: "
				}), insight]
			})
		]
	});
}
function KpiCard({ label, value, hint, tone, className, bgEmoji, variant, progress }) {
	const bar = {
		frustration: "bg-frustration",
		caution: "bg-caution",
		neutral: "bg-neutral",
		satisfaction: "bg-satisfaction"
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("panel rise-in relative overflow-hidden p-3 transition-transform duration-300 hover:-translate-y-0.5", variant === "outline" ? "bg-transparent border" : "", variant === "outline" && tone ? {
			frustration: "border-frustration",
			caution: "border-caution",
			neutral: "border-neutral",
			satisfaction: "border-satisfaction"
		}[tone] : "", className),
		children: [
			progress !== void 0 && tone && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: cn("absolute left-0 bottom-0 top-0 opacity-25 transition-all duration-1000 ease-out z-0", bar[tone]),
				style: { width: `${progress * 100}%` }
			}),
			tone && variant !== "outline" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("absolute inset-x-0 top-0 h-1 z-10", bar[tone]) }),
			bgEmoji && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute right-[-3.5rem] top-1/2 -translate-y-1/2 text-[8rem] leading-none opacity-20 pointer-events-none select-none z-0",
				children: bgEmoji
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative z-10",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[10px] font-medium uppercase tracking-[0.09em] text-muted-foreground",
						children: label
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: cn("display mt-2 text-3xl leading-none", tone ? {
							frustration: "text-frustration/90",
							caution: "text-caution/90",
							neutral: "text-neutral/90",
							satisfaction: "text-satisfaction/90"
						}[tone] : "text-foreground"),
						children: value
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-1 text-xs leading-snug text-muted-foreground",
						children: hint
					})
				]
			})
		]
	});
}
function OverviewTab({ activeFilters = [], setActiveTab, setSelectedId }) {
	const kpiData = useLoaderData({ from: "/" });
	const conversations = kpiData.conversations || [];
	const promptDist = distribution(conversations, "promptEmotion");
	const answerDist = distribution(conversations, "answerEmotion");
	const matrix = transitionMatrix(conversations);
	const depth = emotionByTurnDepth(conversations);
	const sortedEmotions = [...Object.keys(kpiData.counts)].sort((a, b) => (kpiData.counts[b] || 0) - (kpiData.counts[a] || 0));
	const highestEmotion = sortedEmotions[0] || "neutral";
	const secondHighestEmotion = sortedEmotions[1];
	const highestCount = kpiData.counts[highestEmotion] || 0;
	const totalEmotionsCount = Object.values(kpiData.counts).reduce((s, c) => s + c, 0);
	const highestShare = totalEmotionsCount ? highestCount / totalEmotionsCount : 0;
	const secondHighestShare = totalEmotionsCount && secondHighestEmotion ? (kpiData.counts[secondHighestEmotion] || 0) / totalEmotionsCount : 0;
	const formattedHighestLabel = highestEmotion.charAt(0).toUpperCase() + highestEmotion.slice(1);
	const formattedSecondHighestLabel = secondHighestEmotion ? secondHighestEmotion.charAt(0).toUpperCase() + secondHighestEmotion.slice(1) : "";
	(kpiData.counts["satisfaction"] || 0) / totalEmotionsCount;
	(kpiData.counts["neutral"] || 0) / totalEmotionsCount;
	(kpiData.counts["frustration"] || 0) / totalEmotionsCount;
	(kpiData.counts["caution"] || 0) / totalEmotionsCount;
	const gptCounts = kpiData.gptCounts || {};
	const sortedGptEmotions = [...Object.keys(gptCounts)].sort((a, b) => (gptCounts[b] || 0) - (gptCounts[a] || 0));
	const highestGptEmotion = sortedGptEmotions[0] || "neutral";
	const secondHighestGptEmotion = sortedGptEmotions[1];
	const highestGptCount = gptCounts[highestGptEmotion] || 0;
	const totalGptEmotionsCount = Object.values(gptCounts).reduce((s, c) => s + c, 0);
	const highestGptShare = totalGptEmotionsCount ? highestGptCount / totalGptEmotionsCount : 0;
	const secondHighestGptShare = totalGptEmotionsCount && secondHighestGptEmotion ? (gptCounts[secondHighestGptEmotion] || 0) / totalGptEmotionsCount : 0;
	const formattedHighestGptLabel = highestGptEmotion.charAt(0).toUpperCase() + highestGptEmotion.slice(1);
	const formattedSecondHighestGptLabel = secondHighestGptEmotion ? secondHighestGptEmotion.charAt(0).toUpperCase() + secondHighestGptEmotion.slice(1) : "";
	(gptCounts["satisfaction"] || 0) / (totalGptEmotionsCount || 1);
	(gptCounts["neutral"] || 0) / (totalGptEmotionsCount || 1);
	(gptCounts["frustration"] || 0) / (totalGptEmotionsCount || 1);
	(gptCounts["caution"] || 0) / (totalGptEmotionsCount || 1);
	const kpi2AnswerCounts = kpiData.promptToAnswerCounts?.[highestEmotion] || {};
	const sortedKpi2Answers = [...Object.keys(kpi2AnswerCounts)].sort((a, b) => (kpi2AnswerCounts[b] || 0) - (kpi2AnswerCounts[a] || 0));
	const highestKpi2Answer = sortedKpi2Answers[0] || "caution";
	const secondHighestKpi2Answer = sortedKpi2Answers[1];
	const highestKpi2AnswerCount = kpi2AnswerCounts[highestKpi2Answer] || 0;
	const totalKpi2Answers = Object.values(kpi2AnswerCounts).reduce((s, c) => s + c, 0);
	const highestKpi2AnswerShare = totalKpi2Answers ? highestKpi2AnswerCount / totalKpi2Answers : 0;
	const secondHighestKpi2AnswerShare = totalKpi2Answers && secondHighestKpi2Answer ? (kpi2AnswerCounts[secondHighestKpi2Answer] || 0) / totalKpi2Answers : 0;
	const formattedHighestKpi2AnswerLabel = highestKpi2Answer.charAt(0).toUpperCase() + highestKpi2Answer.slice(1);
	const formattedSecondHighestKpi2AnswerLabel = secondHighestKpi2Answer ? secondHighestKpi2Answer.charAt(0).toUpperCase() + secondHighestKpi2Answer.slice(1) : "";
	[
		"satisfaction",
		"neutral",
		"frustration",
		"caution"
	].filter((e) => e !== highestKpi2Answer).map((e) => {
		return `${e === "satisfaction" ? "Sat" : e === "neutral" ? "Neu" : e === "frustration" ? "Fru" : "Cau"}: ${fmtPct(totalKpi2Answers ? (kpi2AnswerCounts[e] || 0) / totalKpi2Answers : 0, 0)}`;
	}).join(" · ");
	const shareOf = (list, e) => list.find((d) => d.emotion === e).share;
	const visibleEmotions = activeFilters.length > 0 ? EMOTIONS.filter((e) => activeFilters.includes(e)) : EMOTIONS;
	const filteredDevCounts = activeFilters.length > 0 ? Object.fromEntries(Object.entries(kpiData.counts).filter(([k]) => activeFilters.includes(k))) : kpiData.counts;
	const filteredGptCounts = activeFilters.length > 0 ? EMOTIONS.reduce((acc, gptEmotion) => {
		acc[gptEmotion] = activeFilters.reduce((sum, devEmotion) => {
			return sum + (kpiData.promptToAnswerCounts?.[devEmotion]?.[gptEmotion] || 0);
		}, 0);
		return acc;
	}, {}) : kpiData.gptCounts;
	const realPAnswer = (dev, ans) => {
		const countsMap = kpiData.promptToAnswerCounts?.[dev] || {};
		const totalForDev = Object.values(countsMap).reduce((s, c) => s + c, 0);
		if (!totalForDev) return 0;
		return (countsMap[ans] || 0) / totalForDev;
	};
	const satLift = realPAnswer("satisfaction", "satisfaction") / (realPAnswer("frustration", "satisfaction") || 1);
	visibleEmotions.map((e) => ({
		label: EMOTION_LABEL[e],
		values: {
			dev: shareOf(promptDist, e),
			gpt: shareOf(answerDist, e)
		}
	}));
	const replyStyle = visibleEmotions.map((e) => ({
		label: EMOTION_LABEL[e],
		values: {
			helpful: realPAnswer(e, "satisfaction"),
			limited: realPAnswer(e, "caution")
		}
	}));
	matrix.filter((r) => visibleEmotions.includes(r.prompt)).map((r) => ({
		label: EMOTION_LABEL[r.prompt],
		labelColor: emotionVar(r.prompt),
		total: r.total,
		cells: r.cells.map((c) => ({
			key: c.answer,
			share: c.share,
			count: c.count
		}))
	}));
	depth[depth.length - 1].frustration - depth[0].frustration;
	const selectedEmotion = activeFilters[0] || highestEmotion;
	(0, import_react.useMemo)(() => {
		if (!conversations.length) return null;
		return [...conversations].sort((a, b) => {
			const countA = a.turns.filter((t) => t.promptEmotion === selectedEmotion).length;
			return b.turns.filter((t) => t.promptEmotion === selectedEmotion).length - countA;
		}).filter((c) => c.turns.some((t) => t.promptEmotion === selectedEmotion))[0] || conversations[0];
	}, [conversations, selectedEmotion]);
	const chanceOfSatData = visibleEmotions.map((e) => ({
		emotion: e,
		mean: realPAnswer(e, "satisfaction"),
		n: Object.values(kpiData.promptToAnswerCounts?.[e] || {}).reduce((s, c) => s + c, 0)
	}));
	const maxChanceOfSat = Math.max(0, ...chanceOfSatData.map((d) => d.mean));
	const dynamicDomainMax = Math.min(1, maxChanceOfSat + .1);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6 relative",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "sticky top-0 z-20 bg-background/95 backdrop-blur-md py-3 -mx-2 px-2 rounded-b-xl border-b border-border/40 mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 shadow-sm",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KpiCard, {
						label: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							"Most common",
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
								className: "font-bold text-foreground text-[11px]",
								children: "DEV"
							}),
							" ",
							"emotion"
						] }),
						value: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "uppercase",
							children: formattedHighestLabel
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "block mt-1 font-bold font-['Oswald'] tracking-wide text-[0.8em] text-foreground",
							children: [
								"(",
								fmtPct(highestShare, 0),
								")"
							]
						})] }),
						hint: formattedSecondHighestLabel ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "display uppercase tracking-[0.09em] text-[12px]",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: `text-${secondHighestEmotion}`,
									children: formattedSecondHighestLabel
								}),
								" ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "font-bold font-['Oswald'] tracking-wide text-[11px] text-foreground",
									children: [
										"(",
										fmtPct(secondHighestShare, 0),
										")"
									]
								})
							]
						}) : null,
						tone: highestEmotion,
						className: "bg-muted/80 shadow-lg border border-border/50",
						bgEmoji: EMOTION_EMOJI[highestEmotion]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KpiCard, {
						label: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
								className: `font-bold text-${highestEmotion} text-[11px]`,
								children: highestEmotion.toUpperCase()
							}),
							" ",
							"most answered by"
						] }),
						value: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "uppercase",
							children: formattedHighestKpi2AnswerLabel
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "block mt-1 font-bold font-['Oswald'] tracking-wide text-[0.8em] text-foreground",
							children: [
								"(",
								fmtPct(highestKpi2AnswerShare, 0),
								")"
							]
						})] }),
						hint: formattedSecondHighestKpi2AnswerLabel ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "display uppercase tracking-[0.09em] text-[12px]",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: `text-${secondHighestKpi2Answer}`,
									children: formattedSecondHighestKpi2AnswerLabel
								}),
								" ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "font-bold font-['Oswald'] tracking-wide text-[11px] text-foreground",
									children: [
										"(",
										fmtPct(secondHighestKpi2AnswerShare, 0),
										")"
									]
								})
							]
						}) : null,
						tone: highestKpi2Answer,
						className: "border border-green-500 bg-background/50"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KpiCard, {
						label: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							"Most common",
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
								className: "font-bold text-foreground text-[11px]",
								children: "GPT"
							}),
							" ",
							"emotion"
						] }),
						value: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "uppercase",
							children: formattedHighestGptLabel
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "block mt-1 font-bold font-['Oswald'] tracking-wide text-[0.8em] text-foreground",
							children: [
								"(",
								fmtPct(highestGptShare, 0),
								")"
							]
						})] }),
						hint: formattedSecondHighestGptLabel ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "display uppercase tracking-[0.09em] text-[12px]",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: `text-${secondHighestGptEmotion}`,
									children: formattedSecondHighestGptLabel
								}),
								" ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "font-bold font-['Oswald'] tracking-wide text-[11px] text-foreground",
									children: [
										"(",
										fmtPct(secondHighestGptShare, 0),
										")"
									]
								})
							]
						}) : null,
						tone: highestGptEmotion,
						className: "bg-muted/80 shadow-lg border border-border/50",
						bgEmoji: EMOTION_EMOJI[highestGptEmotion]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KpiCard, {
						label: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							"Rows with",
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
								className: "font-bold text-foreground text-[11px]",
								children: "code"
							}),
							" ",
							"content"
						] }),
						value: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-bold font-['Oswald'] tracking-wide text-foreground",
							children: fmtPct(kpiData.codeContent.share, 0)
						}),
						hint: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-[12px]",
							children: ["No code: ", fmtPct(kpiData.codeContent.noCodeShare, 0)]
						}),
						tone: "neutral",
						className: "border border-border/50 bg-background/60",
						progress: kpiData.codeContent.share
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
				title: "Emotion distribution - Developer vs ChatGPT",
				subtitle: "Inner ring: developer prompts (solid) · Outer ring: GPT responses (stripe)",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "py-2",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DualRingDonut, {
						devCounts: filteredDevCounts,
						gptCounts: filteredGptCounts,
						width: 320,
						height: 320
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-6 lg:grid-cols-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
					className: "lg:col-span-2",
					title: "GPT reply style per developer mood",
					subtitle: "Proportion of GPT answers that were helpful vs limited for each developer prompt mood",
					insight: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: "Frustrated developers are much less likely to get a helpful response than satisfied ones." }),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mb-3",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SeriesLegend, { series: [{
							key: "helpful",
							label: "Helpful answer",
							color: "var(--emotion-satisfaction)"
						}, {
							key: "limited",
							label: "Limited answer",
							color: "var(--emotion-caution)"
						}] })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GroupedBarChart, {
						groups: replyStyle,
						series: [{
							key: "helpful",
							label: "Helpful answer",
							color: "var(--emotion-satisfaction)"
						}, {
							key: "limited",
							label: "Limited answer",
							color: "var(--emotion-caution)"
						}],
						format: (v) => fmtPct(v, 0),
						height: 280
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
					className: "lg:col-span-2",
					title: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						"Chance of a",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-satisfaction font-bold",
							children: "satisfied"
						}),
						" ",
						"answer"
					] }),
					subtitle: "Bars use the developer's emotion colour",
					insight: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						"Read this as a single number per mood: a frustrated prompt gets a satisfied answer",
						" ",
						fmtPct(realPAnswer("frustration", "satisfaction"), 0),
						" of the time, a satisfied prompt",
						" ",
						fmtPct(realPAnswer("satisfaction", "satisfaction"), 0),
						" — a",
						" ",
						satLift.toFixed(1),
						"× gap."
					] }),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MeanBarChart, {
						data: chanceOfSatData,
						domain: [0, dynamicDomainMax],
						valueFormat: (v) => fmtPct(v, 0),
						height: 280
					})
				})]
			})
		]
	});
}
var Input = import_react.forwardRef(({ className, type, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		type,
		className: cn("flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm", className),
		ref,
		...props
	});
});
Input.displayName = "Input";
var EMOTION_COLORS$2 = {
	frustration: "#c0392b",
	caution: "#c48f0a",
	neutral: "#3b6fa5",
	satisfaction: "#27ae60"
};
function CaseInspectorTab({ selectedId: propSelectedId, setSelectedId: propSetSelectedId }) {
	const kpiData = useLoaderData({ from: "/" });
	const conversations = (0, import_react.useMemo)(() => kpiData.conversations || [], [kpiData.conversations]);
	const [query, setQuery] = (0, import_react.useState)("");
	const [filter, setFilter] = (0, import_react.useState)("all");
	const [localSelectedId, localSetSelectedId] = (0, import_react.useState)(null);
	const selectedId = propSelectedId !== void 0 ? propSelectedId : localSelectedId;
	const setSelectedId = propSetSelectedId !== void 0 ? propSetSelectedId : localSetSelectedId;
	const [sortKey, setSortKey] = (0, import_react.useState)("turns");
	const [sortDirection, setSortDirection] = (0, import_react.useState)("desc");
	const hasAutoSelected = (0, import_react.useRef)(false);
	(0, import_react.useEffect)(() => {
		if (!hasAutoSelected.current && conversations.length > 0) {
			setSelectedId(conversations[0]?.id ?? null);
			hasAutoSelected.current = true;
		}
	}, [conversations, setSelectedId]);
	const [panelWidth, setPanelWidth] = (0, import_react.useState)(480);
	const [panelHeight, setPanelHeight] = (0, import_react.useState)(0);
	const [isMinimized, setIsMinimized] = (0, import_react.useState)(true);
	const [highlightTurnId, setHighlightTurnId] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		setPanelHeight(Math.round(Math.max(320, Math.min(700, window.innerHeight * .5))));
	}, []);
	const getDominantEmotion = (0, import_react.useCallback)((c, key) => {
		return EMOTIONS.reduce((best, e) => c.turns.filter((t) => t[key] === e).length > c.turns.filter((t) => t[key] === best).length ? e : best, "neutral");
	}, []);
	const getAvgConfidence = (0, import_react.useCallback)((c) => {
		return c.turns.reduce((s, t) => s + (t.promptScore + t.answerScore) / 2, 0) / c.turns.length;
	}, []);
	const list = (0, import_react.useMemo)(() => {
		return conversations.filter((c) => {
			const maxTurnCount = 90;
			const matchesQuery = !query || `${c.id} ${c.title} ${c.language} ${c.source}`.toLowerCase().includes(query.toLowerCase());
			const matchesFilter = filter === "all" || c.turns.some((t) => t.promptEmotion === filter);
			const matchesTurnLimit = c.turns.length <= maxTurnCount;
			return matchesQuery && matchesFilter && matchesTurnLimit;
		});
	}, [
		query,
		filter,
		conversations
	]);
	const sortedList = (0, import_react.useMemo)(() => {
		const result = [...list];
		if (sortKey) result.sort((a, b) => {
			let valA = "";
			let valB = "";
			if (sortKey === "id") {
				valA = a.id;
				valB = b.id;
			} else if (sortKey === "title") {
				valA = a.title.toLowerCase();
				valB = b.title.toLowerCase();
			} else if (sortKey === "turns") {
				valA = a.turns.length;
				valB = b.turns.length;
			} else if (sortKey === "devEmotion") {
				valA = getDominantEmotion(a, "promptEmotion");
				valB = getDominantEmotion(b, "promptEmotion");
			} else if (sortKey === "gptEmotion") {
				valA = getDominantEmotion(a, "answerEmotion");
				valB = getDominantEmotion(b, "answerEmotion");
			} else if (sortKey === "confidence") {
				valA = getAvgConfidence(a);
				valB = getAvgConfidence(b);
			} else if (sortKey === "source") {
				valA = a.source.toLowerCase();
				valB = b.source.toLowerCase();
			} else if (sortKey === "language") {
				valA = a.language.toLowerCase();
				valB = b.language.toLowerCase();
			}
			if (valA < valB) return sortDirection === "asc" ? -1 : 1;
			if (valA > valB) return sortDirection === "asc" ? 1 : -1;
			return 0;
		});
		return result;
	}, [
		list,
		sortKey,
		sortDirection,
		getDominantEmotion,
		getAvgConfidence
	]);
	const selectedConversation = (0, import_react.useMemo)(() => {
		return conversations.find((c) => c.id === selectedId) || null;
	}, [selectedId, conversations]);
	const handleSort = (key) => {
		if (!key) return;
		if (sortKey === key) setSortDirection((prev) => prev === "asc" ? "desc" : "asc");
		else {
			setSortKey(key);
			setSortDirection("asc");
		}
	};
	const renderSortIcon = (key) => {
		if (sortKey !== key) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpDown, { className: "ml-1 size-3.5 opacity-40 inline" });
		return sortDirection === "asc" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronUp, { className: "ml-1 size-3.5 text-primary inline" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "ml-1 size-3.5 text-primary inline" });
	};
	const startDrag = (0, import_react.useCallback)((e, cursor, onMove) => {
		e.preventDefault();
		const startX = e.clientX;
		const startY = e.clientY;
		document.body.style.cursor = cursor;
		document.body.style.userSelect = "none";
		const move = (ev) => {
			onMove(ev.clientX - startX, ev.clientY - startY);
		};
		const up = () => {
			document.body.style.cursor = "";
			document.body.style.userSelect = "";
			window.removeEventListener("mousemove", move);
			window.removeEventListener("mouseup", up);
		};
		window.addEventListener("mousemove", move);
		window.addEventListener("mouseup", up);
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6 relative h-full",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col md:flex-row justify-between items-center gap-4 bg-muted/20 p-4 rounded-xl border border-border/40",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-2 self-start md:self-auto",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "hidden sm:inline",
							children: "Developer emotion"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "inline sm:hidden",
							children: "DEV EMOTION"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex flex-wrap gap-1.5",
						children: ["all", ...EMOTIONS].map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setFilter(f),
							className: cn("rounded-full border px-3 py-1 text-xs cursor-pointer transition-all duration-200", filter === f ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-border text-muted-foreground hover:text-foreground hover:bg-muted/50"),
							children: f === "all" ? "All Moods" : EMOTION_LABEL[f]
						}, f))
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative w-full md:w-80",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: query,
						onChange: (e) => setQuery(e.target.value),
						placeholder: "Search topic, lang, source...",
						className: "pl-9 h-9 text-xs rounded-full bg-background border-border/50"
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-2xl border border-border bg-card overflow-hidden shadow-sm flex flex-col",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "max-h-[550px] overflow-y-auto custom-scrollbar",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full border-collapse text-left text-xs",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
							className: "sticky top-0 bg-muted/90 backdrop-blur-md z-10 border-b border-border select-none",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("th", {
									onClick: () => handleSort("title"),
									className: "p-4 font-semibold text-muted-foreground cursor-pointer hover:text-foreground transition-colors w-1/3",
									children: ["Conversation Title ", renderSortIcon("title")]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("th", {
									onClick: () => handleSort("source"),
									className: "p-4 font-semibold text-muted-foreground cursor-pointer hover:text-foreground transition-colors",
									children: ["Category ", renderSortIcon("source")]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("th", {
									onClick: () => handleSort("language"),
									className: "p-4 font-semibold text-muted-foreground cursor-pointer hover:text-foreground transition-colors",
									children: ["Language ", renderSortIcon("language")]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("th", {
									onClick: () => handleSort("turns"),
									className: "p-4 font-semibold text-muted-foreground cursor-pointer hover:text-foreground transition-colors text-center",
									children: ["Turns ", renderSortIcon("turns")]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("th", {
									onClick: () => handleSort("devEmotion"),
									className: "p-4 font-semibold text-muted-foreground cursor-pointer hover:text-foreground transition-colors",
									children: ["Dev Emotion ", renderSortIcon("devEmotion")]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("th", {
									onClick: () => handleSort("gptEmotion"),
									className: "p-4 font-semibold text-muted-foreground cursor-pointer hover:text-foreground transition-colors",
									children: ["GPT Emotion ", renderSortIcon("gptEmotion")]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("th", {
									onClick: () => handleSort("confidence"),
									className: "p-4 font-semibold text-muted-foreground cursor-pointer hover:text-foreground transition-colors text-right",
									children: ["Avg Confidence ", renderSortIcon("confidence")]
								})
							] })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
							className: "divide-y divide-border/60",
							children: sortedList.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								colSpan: 7,
								className: "p-8 text-center text-muted-foreground",
								children: "No conversations matches search parameters."
							}) }) : sortedList.map((c) => {
								const devEmo = getDominantEmotion(c, "promptEmotion");
								const gptEmo = getDominantEmotion(c, "answerEmotion");
								const avgConf = getAvgConfidence(c);
								const isSelected = c.id === selectedId;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
									onClick: () => {
										setSelectedId(c.id);
									},
									className: cn("cursor-pointer transition-colors border-l-2", isSelected ? "bg-accent/40 border-l-primary font-medium" : "hover:bg-muted/30 border-l-transparent"),
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "p-4",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex flex-col gap-1",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "font-medium text-foreground line-clamp-1",
													children: c.title
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-[10px] text-muted-foreground font-mono",
													children: c.id
												})]
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "p-4 uppercase tracking-wider font-mono text-[10px]",
											children: c.source.replace("_", " ")
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "p-4 font-mono text-[10px] text-muted-foreground",
											children: c.language
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "p-4 text-center numeral font-bold",
											children: c.turns.length
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "p-4",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-[11px] font-semibold px-2 py-0.5 rounded-md",
												style: {
													backgroundColor: `${EMOTION_COLORS$2[devEmo]}15`,
													color: EMOTION_COLORS$2[devEmo]
												},
												children: devEmo
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "p-4",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-[11px] font-semibold px-2 py-0.5 rounded-md",
												style: {
													backgroundColor: `${EMOTION_COLORS$2[gptEmo]}15`,
													color: EMOTION_COLORS$2[gptEmo]
												},
												children: gptEmo
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "p-4 text-right font-mono text-muted-foreground",
											children: fmtPct(avgConf, 0)
										})
									]
								}, c.id);
							})
						})]
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-muted/10 border-t border-border p-3 text-xs text-muted-foreground flex justify-between items-center",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
						"Showing ",
						sortedList.length,
						" of ",
						conversations.length,
						" conversations"
					] }), selectedId && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => setIsMinimized(false),
						className: "text-primary hover:underline flex items-center gap-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageSquare, { className: "size-3.5" }), " Re-open viewer"]
					})]
				})]
			}),
			selectedConversation && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ConversationViewer, {
				conversation: selectedConversation,
				panelWidth,
				panelHeight,
				setPanelWidth,
				setPanelHeight,
				isMinimized,
				setIsMinimized,
				onClose: () => setIsMinimized(true),
				startDrag,
				highlightTurnId
			})
		]
	});
}
function ConversationViewer({ conversation, panelWidth, panelHeight, setPanelWidth, setPanelHeight, isMinimized, setIsMinimized, onClose, startDrag, highlightTurnId }) {
	const containerRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		if (highlightTurnId !== null && containerRef.current && !isMinimized) {
			const targetElement = containerRef.current.querySelector(`[data-turn-id="${highlightTurnId}"]`);
			if (targetElement) targetElement.scrollIntoView({
				behavior: "smooth",
				block: "nearest"
			});
		}
	}, [
		highlightTurnId,
		conversation,
		isMinimized
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "fixed bottom-6 right-6 z-[9999] flex flex-col rounded-2xl border border-border bg-background/95 backdrop-blur-md overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.15)] transition-all duration-150",
		style: {
			width: panelWidth,
			height: isMinimized ? 52 : panelHeight
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute left-0 top-0 w-1.5 h-full cursor-ew-resize z-50 hover:bg-primary/20",
				onMouseDown: (e) => {
					const w0 = panelWidth;
					startDrag(e, "ew-resize", (dx) => {
						setPanelWidth(Math.max(320, Math.min(800, w0 - dx)));
					});
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute left-0 top-0 h-1.5 w-full cursor-ns-resize z-50 hover:bg-primary/20",
				onMouseDown: (e) => {
					const h0 = panelHeight;
					startDrag(e, "ns-resize", (_, dy) => {
						setPanelHeight(Math.max(250, Math.min(900, h0 - dy)));
					});
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute left-0 top-0 w-3 h-3 cursor-nwse-resize z-50 hover:bg-primary/30",
				onMouseDown: (e) => {
					const w0 = panelWidth;
					const h0 = panelHeight;
					startDrag(e, "nwse-resize", (dx, dy) => {
						setPanelWidth(Math.max(320, Math.min(800, w0 - dx)));
						setPanelHeight(Math.max(250, Math.min(900, h0 - dy)));
					});
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "h-[52px] bg-muted/60 border-b border-border px-4 py-3 flex items-center justify-between cursor-pointer select-none shrink-0",
				onClick: () => setIsMinimized(!isMinimized),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-0.5 max-w-[70%]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "text-[10px] tracking-wider text-muted-foreground uppercase font-mono truncate",
						children: [
							conversation.id,
							" · ",
							conversation.language
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
						className: "text-sm font-extrabold text-foreground truncate",
						children: conversation.title
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-1.5",
					onClick: (e) => e.stopPropagation(),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setIsMinimized(!isMinimized),
						className: "p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors cursor-pointer",
						title: isMinimized ? "Expand" : "Minimize",
						children: isMinimized ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Maximize2, { className: "size-3.5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, { className: "size-3.5" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: onClose,
						className: "p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors cursor-pointer",
						title: "Minimize",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-3.5" })
					})]
				})]
			}),
			!isMinimized && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				ref: containerRef,
				className: "flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar bg-slate-50/20",
				children: conversation.turns.map((t) => {
					const devColor = EMOTION_COLORS$2[t.promptEmotion];
					const gptColor = EMOTION_COLORS$2[t.answerEmotion];
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-4",
						"data-turn-id": t.index,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-end items-start gap-2.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: cn("relative px-4 py-3 rounded-2xl border transition-all duration-300 max-w-[60%] shadow-sm rounded-tr-none", highlightTurnId === t.index ? "ring-2 ring-offset-2" : ""),
								style: {
									backgroundColor: `${devColor}1e`,
									borderColor: `${devColor}70`,
									outlineColor: highlightTurnId === t.index ? devColor : void 0
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "pb-1 mb-1.5 border-b border-border/30 flex items-center justify-between gap-4 text-[10px] font-semibold tracking-wider",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-foreground/95 font-bold uppercase",
										children: ["DEVELOPER · TURN ", t.index]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-1.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											style: { color: devColor },
											className: "font-black text-[10.5px] tracking-wide",
											children: t.promptEmotion.toUpperCase()
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-foreground/95 font-bold",
											children: fmtPct(t.promptScore, 0)
										})]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "whitespace-pre-wrap break-words leading-relaxed text-xs text-foreground select-text font-medium",
									children: t.prompt
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "size-8 rounded-full border border-border shrink-0 select-none overflow-hidden shadow-sm flex items-center justify-center bg-white",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: "/assets/user-profile-icon-free-vector-658200527-DNpqjL6l.jpg",
									alt: "Developer avatar",
									className: "size-full scale-[1.3] object-cover object-center"
								})
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-start items-start gap-2.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "size-8 rounded-full border border-border shrink-0 select-none overflow-hidden shadow-sm flex items-center justify-center bg-white",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: "/assets/black-gpt-chat-logo-on-white-background-logo-illustration-free-vector-BwAIPV0z.jpg",
									alt: "GPT avatar",
									className: "size-full scale-[1.35] object-cover object-center"
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: cn("relative px-4 py-3 rounded-2xl border-2 transition-all duration-300 max-w-[75%] shadow-md rounded-tl-none", highlightTurnId === t.index ? "ring-2 ring-offset-2" : ""),
								style: {
									backgroundColor: `${gptColor}0b`,
									borderColor: gptColor,
									outlineColor: highlightTurnId === t.index ? gptColor : void 0
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "pb-1 mb-1.5 border-b border-border/30 flex items-center justify-between gap-4 text-[10px] font-semibold tracking-wider",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-foreground/95 font-bold uppercase",
										children: ["GPT · TURN ", t.index]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-1.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											style: { color: gptColor },
											className: "font-black text-[10.5px] tracking-wide",
											children: t.answerEmotion.toUpperCase()
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-foreground/95 font-bold",
											children: fmtPct(t.answerScore, 0)
										})]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "whitespace-pre-wrap break-words leading-relaxed text-xs text-muted-foreground select-text",
									children: t.answer
								})]
							})]
						})]
					}, t.index);
				})
			})
		]
	});
}
var EMOTION_COLORS$1 = {
	frustration: "#c0392b",
	caution: "#c48f0a",
	neutral: "#3b6fa5",
	satisfaction: "#27ae60"
};
function ScatterPlot({ points, fit, colorBy = "promptEmotion", height = 320, xLabel, yLabel }) {
	const { ref, width } = useChartWidth();
	const svgRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		if (!width || !svgRef.current) return;
		const margin = {
			top: 14,
			right: 16,
			bottom: 44,
			left: 52
		};
		const w = width - margin.left - margin.right;
		const h = height - margin.top - margin.bottom;
		let tooltipDiv = select_default("#chart-tooltip");
		if (tooltipDiv.empty()) tooltipDiv = select_default("body").append("div").attr("id", "chart-tooltip").style("position", "absolute").style("visibility", "hidden").style("background", "rgba(15, 23, 42, 0.95)").style("backdrop-filter", "blur(8px)").style("border", "1px solid rgba(255, 255, 255, 0.15)").style("padding", "8px 12px").style("border-radius", "8px").style("color", "#fff").style("font-size", "11px").style("font-weight", "600").style("box-shadow", "0 4px 20px rgba(0, 0, 0, 0.3)").style("pointer-events", "none").style("z-index", "99999");
		const svg = select_default(svgRef.current);
		svg.selectAll("*").remove();
		const g = svg.attr("viewBox", `0 0 ${width} ${height}`).append("g").attr("transform", `translate(${margin.left},${margin.top})`);
		const x = linear([.3, 1], [0, w]);
		const y = linear([.3, 1], [h, 0]);
		g.append("g").call(axisLeft(y).ticks(5).tickSize(-w)).call((s) => s.select(".domain").remove()).call((s) => s.selectAll(".tick line").style("stroke", "var(--grid)").style("opacity", .5)).selectAll("text").style("fill", "var(--muted-foreground)").style("font-size", "10px");
		g.append("g").attr("transform", `translate(0,${h})`).call(axisBottom(x).ticks(6).tickSize(-h)).call((s) => s.select(".domain").style("stroke", "var(--border)")).call((s) => s.selectAll(".tick line").style("stroke", "var(--grid)").style("opacity", .4)).selectAll("text").style("fill", "var(--muted-foreground)").style("font-size", "10px");
		g.append("text").attr("x", w / 2).attr("y", h + 36).attr("text-anchor", "middle").style("font-size", "10px").style("fill", "var(--muted-foreground)").text(xLabel);
		g.append("text").attr("transform", `rotate(-90)`).attr("x", -h / 2).attr("y", -38).attr("text-anchor", "middle").style("font-size", "10px").style("fill", "var(--muted-foreground)").text(yLabel);
		g.selectAll("circle").data(points).join("circle").attr("cx", (d) => x(d.x)).attr("cy", (d) => y(d.y)).attr("r", 3.2).style("fill", (d) => emotionVar(d[colorBy])).style("opacity", .55).style("cursor", "pointer").on("mouseover", function(event, d) {
			const pColor = EMOTION_COLORS$1[d.promptEmotion];
			const aColor = EMOTION_COLORS$1[d.answerEmotion];
			const pLabel = EMOTION_LABEL[d.promptEmotion];
			const aLabel = EMOTION_LABEL[d.answerEmotion];
			tooltipDiv.style("visibility", "visible").html(`<span style="color: #94a3b8; font-weight: 500;">Conversation ${d.id}</span><br/><span style="color: ${pColor}; font-weight: 800; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em;">DEV: ${pLabel} (${d.x.toFixed(2)})</span><br/><span style="color: #94a3b8; font-weight: 400; margin-right: 4px;">→</span><span style="color: ${aColor}; font-weight: 800; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em;">GPT: ${aLabel} (${d.y.toFixed(2)})</span>`);
			select_default(this).transition().duration(100).attr("r", 5.5).style("opacity", .95);
		}).on("mousemove", function(event) {
			tooltipDiv.style("top", event.pageY - 60 + "px").style("left", event.pageX + 15 + "px");
		}).on("mouseout", function() {
			tooltipDiv.style("visibility", "hidden");
			select_default(this).transition().duration(100).attr("r", 3.2).style("opacity", .55);
		});
		if (fit) {
			const x0 = .3;
			const x1 = 1;
			g.append("line").attr("x1", x(x0)).attr("x2", x(x1)).attr("y1", y(fit.intercept + fit.slope * x0)).attr("y2", y(fit.intercept + fit.slope * x1)).style("stroke", "var(--foreground)").style("stroke-width", 1.5).style("stroke-dasharray", "5 4").style("opacity", .8);
		}
		return () => {
			select_default("#chart-tooltip").remove();
		};
	}, [
		points,
		width,
		height,
		fit,
		colorBy,
		xLabel,
		yLabel
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		ref,
		className: "w-full",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
			ref: svgRef,
			width,
			height
		})
	});
}
function Heatmap({ rows, colorFor, height, rowLabelWidth = 96 }) {
	const { ref, width } = useChartWidth();
	const svgRef = (0, import_react.useRef)(null);
	const chartHeight = height ?? rows.length * 42 + 46;
	(0, import_react.useEffect)(() => {
		if (!width || !svgRef.current) return;
		const margin = {
			top: 26,
			right: 12,
			bottom: 8,
			left: rowLabelWidth
		};
		const w = width - margin.left - margin.right;
		const h = chartHeight - margin.top - margin.bottom;
		let tooltipDiv = select_default("#chart-tooltip");
		if (tooltipDiv.empty()) tooltipDiv = select_default("body").append("div").attr("id", "chart-tooltip").style("position", "absolute").style("visibility", "hidden").style("background", "rgba(15, 23, 42, 0.95)").style("backdrop-filter", "blur(8px)").style("border", "1px solid rgba(255, 255, 255, 0.15)").style("padding", "8px 12px").style("border-radius", "8px").style("color", "#fff").style("font-size", "11px").style("font-weight", "600").style("box-shadow", "0 4px 20px rgba(0, 0, 0, 0.3)").style("pointer-events", "none").style("z-index", "99999");
		const svg = select_default(svgRef.current);
		svg.selectAll("*").remove();
		const g = svg.attr("viewBox", `0 0 ${width} ${chartHeight}`).append("g").attr("transform", `translate(${margin.left},${margin.top})`);
		const cols = rows[0]?.cells.map((c) => c.col) ?? [];
		const x = band().domain(cols).range([0, w]).padding(.06);
		const y = band().domain(rows.map((r) => r.row)).range([0, h]).padding(.08);
		g.selectAll("text.col").data(cols).join("text").attr("class", "col").attr("x", (d) => x(d) + x.bandwidth() / 2).attr("y", -10).attr("text-anchor", "middle").style("font-size", "10px").style("fill", "var(--muted-foreground)").text((d) => EMOTION_LABEL[d] ?? d);
		rows.forEach((r) => {
			g.append("text").attr("x", -10).attr("y", y(r.row) + y.bandwidth() / 2).attr("dy", "0.35em").attr("text-anchor", "end").style("font-size", "11px").style("fill", EMOTION_COLORS$1[r.row] ? emotionVar(r.row) : "var(--foreground)").text(EMOTION_LABEL[r.row] ?? r.row);
			g.selectAll(`rect.c-${r.row.replace(/\W/g, "")}`).data(r.cells).join("rect").attr("class", `c-${r.row.replace(/\W/g, "")}`).attr("x", (d) => x(d.col)).attr("y", y(r.row)).attr("width", x.bandwidth()).attr("height", y.bandwidth()).attr("rx", 3).style("fill", (d) => colorFor(d.col)).style("opacity", (d) => .12 + Math.min(1, d.share / .6) * .82).style("cursor", "pointer").on("mouseover", function(event, d) {
				const promptEmotion = r.row;
				const answerEmotion = d.col;
				const devColor = EMOTION_COLORS$1[promptEmotion] || "var(--foreground)";
				const gptColor = EMOTION_COLORS$1[answerEmotion] || "var(--foreground)";
				const devLabel = EMOTION_LABEL[promptEmotion] || r.row;
				const gptLabel = EMOTION_LABEL[answerEmotion] || d.col;
				tooltipDiv.style("visibility", "visible").html(`<span style="color: ${devColor}; font-weight: 800; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em;">${devLabel}</span><span style="color: #94a3b8; font-weight: 400; margin: 0 6px;">→</span><span style="color: ${gptColor}; font-weight: 800; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em;">${gptLabel}</span><div style="margin-top: 4px; font-size: 13px; font-weight: 700; color: #fff;">${(d.share * 100).toFixed(1)}% <span style="font-size: 9px; color: #94a3b8; font-weight: 400;">(${d.count} turns)</span></div>`);
				select_default(this).transition().duration(100).attr("stroke", "var(--foreground)").attr("stroke-width", "1.5px");
			}).on("mousemove", function(event) {
				tooltipDiv.style("top", event.pageY - 60 + "px").style("left", event.pageX + 15 + "px");
			}).on("mouseout", function() {
				tooltipDiv.style("visibility", "hidden");
				select_default(this).transition().duration(100).attr("stroke", "none");
			});
			g.selectAll(`text.v-${r.row.replace(/\W/g, "")}`).data(r.cells).join("text").attr("class", `v-${r.row.replace(/\W/g, "")}`).attr("x", (d) => x(d.col) + x.bandwidth() / 2).attr("y", y(r.row) + y.bandwidth() / 2).attr("dy", "0.35em").attr("text-anchor", "middle").style("font-size", "10px").style("font-variant-numeric", "tabular-nums").style("fill", (d) => d.share > .32 ? "var(--background)" : "var(--foreground)").text((d) => `${(d.share * 100).toFixed(0)}%`).style("pointer-events", "none");
		});
		return () => {
			select_default("#chart-tooltip").remove();
		};
	}, [
		rows,
		width,
		chartHeight,
		colorFor,
		rowLabelWidth
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		ref,
		className: "w-full",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
			ref: svgRef,
			width,
			height: chartHeight
		})
	});
}
var EMOTION_COLORS = {
	frustration: "#c0392b",
	caution: "#c48f0a",
	neutral: "#3b6fa5",
	satisfaction: "#27ae60"
};
/** Multi-series line chart of emotion share over an ordered x axis. */
function TrendLineChart({ data, height = 280, xTitle, emotions }) {
	const { ref, width } = useChartWidth();
	const svgRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		if (!width || !svgRef.current) return;
		const margin = {
			top: 14,
			right: 52,
			bottom: 40,
			left: 44
		};
		const w = width - margin.left - margin.right;
		const h = height - margin.top - margin.bottom;
		let tooltipDiv = select_default("#chart-tooltip");
		if (tooltipDiv.empty()) tooltipDiv = select_default("body").append("div").attr("id", "chart-tooltip").style("position", "absolute").style("visibility", "hidden").style("background", "rgba(15, 23, 42, 0.95)").style("backdrop-filter", "blur(8px)").style("border", "1px solid rgba(255, 255, 255, 0.15)").style("padding", "8px 12px").style("border-radius", "8px").style("color", "#fff").style("font-size", "11px").style("font-weight", "600").style("box-shadow", "0 4px 20px rgba(0, 0, 0, 0.3)").style("pointer-events", "none").style("z-index", "99999");
		const svg = select_default(svgRef.current);
		svg.selectAll("*").remove();
		const g = svg.attr("viewBox", `0 0 ${width} ${height}`).append("g").attr("transform", `translate(${margin.left},${margin.top})`);
		const visibleEmotions = emotions && emotions.length > 0 ? emotions : EMOTIONS;
		const visibleData = data.slice(0, 11);
		const lastPoint = visibleData[visibleData.length - 1] ?? {};
		const dominantEmotion = visibleEmotions.reduce((best, e) => (lastPoint[e] ?? 0) > (lastPoint[best] ?? 0) ? e : best, visibleEmotions[0]);
		const x = point().domain(visibleData.map((d) => d.label)).range([0, w]);
		const maxY = Math.min(1, (max(visibleData, (d) => max(visibleEmotions, (e) => d[e])) ?? .6) + .08);
		const y = linear([0, maxY], [h, 0]);
		g.append("g").call(axisLeft(y).ticks(5).tickSize(-w).tickFormat((d) => fmtPct(Number(d), 0))).call((s) => s.select(".domain").remove()).call((s) => s.selectAll(".tick line").style("stroke", "var(--grid)").style("opacity", .5)).selectAll("text").style("fill", "var(--muted-foreground)").style("font-size", "10px");
		const every = data.length > 10 ? Math.ceil(data.length / 10) : 1;
		g.append("g").attr("transform", `translate(0,${h})`).call(axisBottom(x).tickValues(data.filter((_, i) => i % every === 0).map((d) => d.label)).tickSize(0).tickPadding(8)).call((s) => s.select(".domain").style("stroke", "var(--border)")).selectAll("text").style("fill", "var(--muted-foreground)").style("font-size", "10px");
		if (xTitle) g.append("text").attr("x", w / 2).attr("y", h + 34).attr("text-anchor", "middle").style("font-size", "10px").style("fill", "var(--muted-foreground)").text(xTitle);
		visibleEmotions.forEach((e) => {
			const line = line_default().x((d) => x(d.label)).y((d) => y(d[e])).curve(monotoneX);
			const path = g.append("path").datum(visibleData).attr("d", line).style("fill", "none").style("stroke", emotionVar(e)).style("stroke-width", e === dominantEmotion ? 3.5 : 2.25).style("stroke-linecap", "round").style("opacity", e === dominantEmotion ? 1 : .35);
			const len = path.node().getTotalLength();
			path.attr("stroke-dasharray", `${len} ${len}`).attr("stroke-dashoffset", len).transition().duration(1200).ease(cubicInOut).attr("stroke-dashoffset", 0).on("end", function() {
				select_default(this).attr("stroke-dasharray", null);
			});
			g.selectAll(`circle.${e}`).data(visibleData).join("circle").attr("class", e).attr("cx", (d) => x(d.label)).attr("cy", (d) => y(d[e])).attr("r", 0).style("fill", emotionVar(e)).style("cursor", "pointer").on("mouseover", function(event, d) {
				const color = EMOTION_COLORS[e];
				const label = EMOTION_LABEL[e];
				const pct = fmtPct(d[e]);
				const turnNum = d.label;
				const sampleSize = d.n ?? "–";
				const isDominant = e === EMOTIONS.reduce((best, em) => d[em] > d[best] ? em : best, EMOTIONS[0]);
				const explanation = `At turn ${turnNum}, ${pct} of developer prompts expressed <span style="color: ${color}; font-weight: 700;">${label.toLowerCase()}</span>.`;
				tooltipDiv.style("visibility", "visible").html(`<div style="margin-bottom: 6px; font-size: 10px; color: #94a3b8; font-weight: 500;">Turn ${turnNum} · <span style="font-variant-numeric: tabular-nums;">n = ${sampleSize} prompts</span></div><div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;"><span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${color};"></span><span style="color: ${color}; font-weight: 800; text-transform: uppercase; font-size: 11px; letter-spacing: 0.05em;">${label}</span><span style="font-size: 14px; font-weight: 700; color: #fff;">${pct}</span>` + (isDominant ? `<span style="font-size: 9px; color: #fbbf24; font-weight: 600; margin-left: 2px;">★ DOMINANT</span>` : ``) + `</div><div style="font-size: 10px; color: #cbd5e1; font-weight: 400; line-height: 1.4; max-width: 220px;">${explanation}</div>`);
				select_default(this).transition().duration(100).attr("r", 6);
			}).on("mousemove", function(event) {
				tooltipDiv.style("top", event.pageY - 60 + "px").style("left", event.pageX + 15 + "px");
			}).on("mouseout", function() {
				tooltipDiv.style("visibility", "hidden");
				select_default(this).transition().duration(100).attr("r", 3.5);
			}).transition().delay((_, i) => 300 + i / Math.max(1, data.length - 1) * 900).duration(260).attr("r", 3.5);
			const last = visibleData[visibleData.length - 1];
			g.append("text").attr("x", w + 6).attr("y", y(last[e])).attr("dy", "0.35em").style("font-size", "9px").style("fill", emotionVar(e)).text(EMOTION_LABEL[e].slice(0, 5));
		});
		return () => {
			select_default("#chart-tooltip").remove();
		};
	}, [
		data,
		width,
		height,
		xTitle,
		emotions
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		ref,
		className: "w-full",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
			ref: svgRef,
			width,
			height
		})
	});
}
function ImpactTab({ activeFilters = [] }) {
	const kpiData = useLoaderData({ from: "/" });
	const filteredConversations = (0, import_react.useMemo)(() => {
		const conversations = kpiData.conversations || [];
		if (!activeFilters.length) return conversations;
		return conversations.map((conv) => ({
			...conv,
			turns: conv.turns.filter((t) => activeFilters.includes(t.promptEmotion))
		})).filter((conv) => conv.turns.length > 0);
	}, [activeFilters, kpiData.conversations]);
	const [colorBy, setColorBy] = (0, import_react.useState)("promptEmotion");
	const allTurns = (0, import_react.useMemo)(() => getAllTurns(filteredConversations), [filteredConversations]);
	const points = (0, import_react.useMemo)(() => scatterPoints(filteredConversations), [filteredConversations]);
	const fit = (0, import_react.useMemo)(() => pearson(points.map((p) => ({
		x: p.x,
		y: p.y
	}))), [points]);
	const valence = (0, import_react.useMemo)(() => answerValenceByPromptEmotion(filteredConversations), [filteredConversations]);
	const depth = (0, import_react.useMemo)(() => emotionByTurnDepth(filteredConversations), [filteredConversations]);
	const matrix = (0, import_react.useMemo)(() => transitionMatrix(filteredConversations), [filteredConversations]);
	const stackRows = matrix.map((r) => ({
		label: EMOTION_LABEL[r.prompt],
		labelColor: emotionVar(r.prompt),
		total: r.total,
		cells: r.cells.map((c) => ({
			key: c.answer,
			share: c.share,
			count: c.count
		}))
	}));
	const frustrationRise = depth[depth.length - 1].frustration - depth[0].frustration;
	const satAfter = (e) => {
		const rows = allTurns.filter((t) => t.promptEmotion === e);
		return rows.filter((t) => t.answerEmotion === "satisfaction").length / (rows.length || 1);
	};
	satAfter("satisfaction") / (satAfter("frustration") || 1);
	const baseline = allTurns.reduce((s, t) => s + EMOTION_VALENCE[t.answerEmotion], 0) / allTurns.length;
	valence.find((v) => v.emotion === "frustration").mean - baseline;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "space-y-6",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-6 lg:grid-cols-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
					className: "lg:col-span-2",
					title: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						style: {
							fontWeight: 800,
							background: "linear-gradient(90deg, #000000, #ef4444)",
							WebkitBackgroundClip: "text",
							WebkitTextFillColor: "transparent"
						},
						children: "Longer the chat, worse the mood"
					}) }),
					subtitle: "Developer emotion share at each turn of the conversation",
					insight: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						"Frustration rises ",
						(frustrationRise * 100).toFixed(0),
						" points from turn 1 to turn ",
						depth[depth.length - 1].depth,
						" while satisfaction falls. Long threads signal an unsolved problem, not deeper engagement. Depth is the risk factor: frustration accumulates with each turn, so conversation length is the strongest early-warning signal."
					] }),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrendLineChart, {
						data: depth.map((d) => ({
							...d,
							label: String(d.depth)
						})),
						emotions: activeFilters.length > 0 ? activeFilters : void 0,
						xTitle: "Turn Index of the conversations",
						height: 280
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
					className: "lg:col-span-2",
					title: "Full answer mix per developer mood",
					subtitle: "Each bar is 100% of the responses given to that developer emotion",
					insight: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: "Every row is dominated by neutral and caution, but the satisfaction segment shrinks steadily as the developer's mood worsens. This one chart contains the core finding: emotion carries over into the answer, mostly as extra caution." }),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StackedBarChart, { rows: stackRows })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
					className: "lg:col-span-2",
					title: "Prompt score vs answer score",
					subtitle: "One point per prompt–answer pair; dashed line is the OLS fit",
					insight: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						"The near-flat fit (r = ",
						fit.r.toFixed(3),
						") shows that classifier",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { children: "confidence" }),
						" does not transfer between the two sides — the carryover effect lives in the discrete ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { children: "labels" }),
						", not the scores. Colour the points by answer emotion and the vertical banding by emotion class becomes the visible structure instead."
					] }),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mb-3 flex flex-wrap items-center justify-between gap-3",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex gap-1.5",
							children: ["promptEmotion", "answerEmotion"].map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: () => setColorBy(c),
								className: cn("rounded border px-2 py-0.5 text-[10px] transition-colors", colorBy === c ? "border-ring bg-accent text-foreground" : "border-border text-muted-foreground hover:text-foreground"),
								children: ["colour by ", c === "promptEmotion" ? "developer" : "assistant"]
							}, c))
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScatterPlot, {
						points,
						fit,
						colorBy,
						height: 360,
						xLabel: "developer prompt emotion score",
						yLabel: "assistant answer emotion score"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
					className: "lg:col-span-2",
					title: "Prompt emotion → answer emotion",
					subtitle: "Row-normalised share of answer labels for each prompt label",
					insight: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: "This heatmap shows how the assistant responds across developer moods: each row is a prompt emotion, and the columns show the answer emotion distribution that follows." }),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Heatmap, {
						rows: matrix.map((r) => ({
							row: r.prompt,
							total: r.total,
							cells: r.cells.map((c) => ({
								col: c.answer,
								share: c.share,
								count: c.count
							}))
						})),
						colorFor: (col) => emotionVar(col)
					})
				})
			]
		})
	});
}
/**
* Cinematic emoji morpher: one face that transitions between the four
* SE-specific emotion classes, with the matching share/caption.
*/
function EmojiMorph({ shares, captions, intervalMs = 2600, className, stacked = false }) {
	const [i, setI] = (0, import_react.useState)(0);
	const [playing, setPlaying] = (0, import_react.useState)(true);
	const [phase, setPhase] = (0, import_react.useState)("in");
	(0, import_react.useEffect)(() => {
		if (!playing) return;
		const out = setTimeout(() => setPhase("out"), intervalMs - 420);
		const next = setTimeout(() => {
			setI((v) => (v + 1) % EMOTIONS.length);
			setPhase("in");
		}, intervalMs);
		return () => {
			clearTimeout(out);
			clearTimeout(next);
		};
	}, [
		i,
		playing,
		intervalMs
	]);
	const current = EMOTIONS[i];
	const color = emotionVar(current);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("panel relative overflow-hidden p-6 sm:p-8", className),
		style: {
			backgroundImage: `radial-gradient(120% 130% at 12% 0%, color-mix(in oklab, ${color} 12%, transparent), transparent 62%)`,
			transition: "background-image 700ms ease"
		},
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: cn(stacked ? "flex flex-col items-center gap-4 text-center" : "flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8"),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative flex size-32 shrink-0 items-center justify-center sm:size-40",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "absolute inset-0 rounded-full",
						style: {
							background: `color-mix(in oklab, ${color} 18%, transparent)`,
							transition: "background 700ms ease",
							animation: "pulse 2.6s cubic-bezier(0.4,0,0.6,1) infinite"
						}
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "emoji relative select-none text-6xl sm:text-7xl",
						style: {
							display: "inline-block",
							filter: phase === "out" ? "blur(6px)" : "blur(0px)",
							opacity: phase === "out" ? 0 : 1,
							transform: phase === "out" ? "scale(0.7) rotate(-14deg)" : "scale(1) rotate(0deg)",
							transition: "transform 420ms cubic-bezier(0.16,1,0.3,1), opacity 420ms ease, filter 420ms ease"
						},
						children: EMOTION_EMOJI[current]
					}, current),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setPlaying((p) => !p),
						className: "absolute -bottom-2 -right-2 z-10 rounded-full border border-border/50 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:bg-accent bg-background shadow-sm",
						children: playing ? "pause" : "play"
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: cn("min-w-0 flex-1", stacked ? "text-center" : "text-center sm:text-left"),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[10px] uppercase tracking-[0.22em] text-muted-foreground",
						children: "Emotion in focus"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "display mt-1 text-3xl leading-none sm:text-4xl",
						style: {
							color,
							transition: "color 700ms ease"
						},
						children: EMOTION_LABEL[current]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: cn("mt-2 text-sm leading-relaxed text-muted-foreground", stacked ? "max-w-full" : "max-w-md"),
						children: captions[current]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "numeral mt-3 text-sm text-foreground",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("b", { children: [(shares[current] * 100).toFixed(1), "%"] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
							" of developer prompts"
						]
					})
				]
			})]
		})
	});
}
function Sidebar({ activeFilters, setActiveFilters }) {
	const kpiData = useLoaderData({ from: "/" });
	const totalEmotionsCount = Object.values(kpiData.counts).reduce((s, c) => s + c, 0);
	const shares = {
		frustration: totalEmotionsCount ? (kpiData.counts["frustration"] || 0) / totalEmotionsCount : .12,
		caution: totalEmotionsCount ? (kpiData.counts["caution"] || 0) / totalEmotionsCount : .18,
		neutral: totalEmotionsCount ? (kpiData.counts["neutral"] || 0) / totalEmotionsCount : .54,
		satisfaction: totalEmotionsCount ? (kpiData.counts["satisfaction"] || 0) / totalEmotionsCount : .16
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("aside", {
		className: "hidden lg:block h-full w-full",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "max-w-[280px] w-full",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "rounded-lg border border-border bg-background p-3",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col items-stretch gap-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "w-full",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmojiMorph, {
								shares,
								captions: {
									frustration: "The developer is blocked and shows it.",
									caution: "Risk-flagging gets limited responses.",
									neutral: "Plain task requests: just code context.",
									satisfaction: "The developer confirms something worked."
								},
								className: "p-0 w-full",
								stacked: true
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "w-full -mt-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider mb-2 text-left px-0.5",
									children: "Filter by developer mood"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex w-full items-center justify-between gap-1.5",
									children: EMOTIONS.map((e) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										onClick: () => {
											if (activeFilters.includes(e)) setActiveFilters(activeFilters.filter((f) => f !== e));
											else setActiveFilters([...activeFilters, e]);
										},
										"aria-label": `Filter by ${EMOTION_LABEL[e]}`,
										className: cn("flex-1 flex items-center justify-center rounded-md border py-2 transition-all", activeFilters.includes(e) || activeFilters.length === 0 ? "border-foreground/25 bg-accent scale-[1.02] shadow-sm" : "border-border bg-background text-muted-foreground hover:bg-accent opacity-50 hover:opacity-100"),
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "emoji text-lg leading-none",
											children: EMOTION_EMOJI[e]
										})
									}, e))
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => setActiveFilters([]),
									className: "mt-1.5 w-full rounded-md border border-border py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:bg-accent bg-background",
									children: "Reset"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "w-full text-left",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
									className: "text-sm font-semibold text-foreground",
									children: "Dataset: DevGPT"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("hr", { className: "my-3 border-border" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
									className: "text-sm font-semibold text-foreground",
									children: "Summary"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-1 text-xs text-muted-foreground",
									children: [
										kpiData.totalPairs.toLocaleString(),
										" pairs · ",
										kpiData.totalConversations.toLocaleString(),
										" conversations"
									]
								})
							]
						})
					]
				})
			})
		})
	});
}
function Dashboard() {
	const [activeFilters, setActiveFilters] = import_react.useState([]);
	const [activeTab, setActiveTab] = import_react.useState("overview");
	const [selectedId, setSelectedId] = import_react.useState(null);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Tabs, {
		value: activeTab,
		onValueChange: setActiveTab,
		className: "h-screen flex flex-col bg-background overflow-hidden",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
			className: "shrink-0 bg-background/95 backdrop-blur-md z-30 border-b border-border",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto max-w-[1400px] px-6 pt-4 flex flex-col gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "text-left flex flex-col items-start",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "numeral text-[14px] uppercase tracking-[0.18em] text-muted-foreground",
							children: ["CHAIR OF INFORMATION VISUALIZATION ·", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								style: { color: "var(--emotion-neutral)" },
								children: "UNIVERSITY OF BAMBERG"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "display mt-1 text-3xl leading-none text-foreground sm:text-4xl",
							children: "DevGPT Emotion Analytics Dashboard"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "relative h-20 w-20 overflow-hidden rounded-full p-1",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: DevGPT_Logo_default,
							alt: "DevGPT logo",
							className: "h-full w-full"
						})
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "max-w-2xl text-xs leading-relaxed text-muted-foreground",
						children: [
							"Analyzing emotional dynamics between Developers and ChatGPT;",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
							"labelled with an SE-specific four-class scheme:",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								style: { color: "var(--emotion-frustration)" },
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: " frustration" })
							}),
							",",
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								style: { color: "var(--emotion-caution)" },
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "caution" })
							}),
							",",
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								style: { color: "var(--emotion-neutral)" },
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "neutral" })
							}),
							",",
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								style: { color: "var(--emotion-satisfaction)" },
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "satisfaction" })
							}),
							"."
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "self-start md:self-auto mb-0",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TabsList, {
							className: "bg-transparent border-none p-0 rounded-none h-auto gap-1.5 translate-y-[1px] z-10 flex",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
									value: "overview",
									className: "rounded-t-lg rounded-b-none border-t border-x border-b border-border/80 bg-muted/85 text-muted-foreground/80 hover:bg-muted hover:text-foreground data-[state=active]:border-border data-[state=active]:border-b-transparent data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-[0_-4px_10px_rgba(0,0,0,0.05)] px-5 py-2.5 text-xs md:text-sm font-semibold transition-all",
									children: "Overview"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
									value: "impact",
									className: "rounded-t-lg rounded-b-none border-t border-x border-b border-border/80 bg-muted/85 text-muted-foreground/80 hover:bg-muted hover:text-foreground data-[state=active]:border-border data-[state=active]:border-b-transparent data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-[0_-4px_10px_rgba(0,0,0,0.05)] px-5 py-2.5 text-xs md:text-sm font-semibold transition-all",
									children: "Detailed Analysis"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsTrigger, {
									value: "deep",
									className: "rounded-t-lg rounded-b-none border-t border-x border-b border-border/80 bg-muted/85 text-muted-foreground/80 hover:bg-muted hover:text-foreground data-[state=active]:border-border data-[state=active]:border-b-transparent data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-[0_-4px_10px_rgba(0,0,0,0.05)] px-5 py-2.5 text-xs md:text-sm font-semibold transition-all",
									children: "Case Inspector"
								})
							]
						})
					})]
				})]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
			className: "flex-1 flex flex-col w-full mx-auto max-w-[1400px] px-6 py-4 min-h-0",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid flex-1 h-full gap-4 lg:grid-cols-5 lg:gap-x-6 min-h-0",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "lg:col-span-1 h-full overflow-y-auto pr-2 pb-4",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mx-0 h-full",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react.Suspense, {
							fallback: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-40" }),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sidebar, {
								activeFilters,
								setActiveFilters
							})
						})
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "lg:col-span-4 h-full overflow-y-auto pl-2 pb-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
							value: "overview",
							className: "m-0 focus-visible:outline-none",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OverviewTab, {
								activeFilters,
								setActiveTab,
								setSelectedId
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
							value: "deep",
							className: "m-0 focus-visible:outline-none",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CaseInspectorTab, {
								selectedId,
								setSelectedId
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabsContent, {
							value: "impact",
							className: "m-0 focus-visible:outline-none",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImpactTab, { activeFilters })
						})
					]
				})]
			})
		})]
	});
}
//#endregion
export { Dashboard as component };

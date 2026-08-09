import { r as createServerFn, t as TSS_SERVER_FUNCTION } from "./server-BwZzRHIJ.mjs";
import processModule from "node:process";
//#region node_modules/.nitro/vite/services/ssr/assets/kpi-server-DAl2ZNVY.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
function parseCsvLine(line) {
	const result = [];
	let current = "";
	let insideQuote = false;
	for (let i = 0; i < line.length; i++) {
		const char = line[i];
		const nextChar = i + 1 < line.length ? line[i + 1] : "";
		if (char === "\"") {
			if (insideQuote && nextChar === "\"") {
				current += "\"";
				i++;
			} else insideQuote = !insideQuote;
		} else if (char === "," && !insideQuote) {
			result.push(current);
			current = "";
		} else current += char;
	}
	result.push(current);
	return result;
}
var processKpis_createServerFn_handler = createServerRpc({
	id: "a15dbfb3c2bd69dfb87d0fc3b9afc9f03987c63ee02bfbf7eddbe186c17ea438",
	name: "processKpis",
	filename: "src/lib/kpi-server.ts"
}, (opts) => processKpis.__executeServer(opts));
var processKpis = createServerFn({ method: "GET" }).handler(processKpis_createServerFn_handler, async () => {
	const fs = await import("node:fs");
	const path = await import("node:path");
	const metadataPath = path.join(processModule.cwd(), "Emotion_UNIQUE", "1_metadata.csv");
	const chatgptPath = path.join(processModule.cwd(), "Emotion_UNIQUE", "2_chatgpt_details.csv");
	const filePath = path.join(processModule.cwd(), "Emotion_UNIQUE", "unique_prompt_answer.csv");
	console.log(`[KPI Server] Starting stream-parsing files...`);
	const start = Date.now();
	const metadataMap = /* @__PURE__ */ new Map();
	if (fs.existsSync(metadataPath)) {
		const lines = fs.readFileSync(metadataPath, "utf8").split(/\r?\n/);
		for (let i = 1; i < lines.length; i++) {
			const line = lines[i]?.trim();
			if (!line) continue;
			const parts = parseCsvLine(line);
			if (parts.length >= 6) {
				const sourceId = parts[0]?.trim();
				const repoLanguage = parts[4]?.trim();
				const author = parts[2]?.trim();
				if (sourceId) metadataMap.set(sourceId, {
					RepoLanguage: repoLanguage || "Unknown",
					Author: author || "Unknown"
				});
			}
		}
	}
	const chatgptMap = /* @__PURE__ */ new Map();
	if (fs.existsSync(chatgptPath)) {
		const lines = fs.readFileSync(chatgptPath, "utf8").split(/\r?\n/);
		for (let i = 1; i < lines.length; i++) {
			const line = lines[i]?.trim();
			if (!line) continue;
			const parts = parseCsvLine(line);
			if (parts.length >= 4) {
				const sharingId = parts[0]?.trim();
				const sourceId = parts[1]?.trim();
				const title = parts[3]?.trim();
				if (sharingId) chatgptMap.set(sharingId, {
					Title: title || "New chat",
					Source_ID: sourceId || ""
				});
			}
		}
	}
	if (!fs.existsSync(filePath)) throw new Error(`File not found at ${filePath}`);
	let totalRows = 0;
	const uniqueSharingIds = /* @__PURE__ */ new Set();
	const counts = {
		satisfaction: 0,
		neutral: 0,
		frustration: 0,
		caution: 0
	};
	const frustrationAnswerCounts = {
		satisfaction: 0,
		neutral: 0,
		frustration: 0,
		caution: 0
	};
	const gptCounts = {
		satisfaction: 0,
		neutral: 0,
		frustration: 0,
		caution: 0
	};
	const promptToAnswerCounts = {
		satisfaction: {
			satisfaction: 0,
			neutral: 0,
			frustration: 0,
			caution: 0
		},
		neutral: {
			satisfaction: 0,
			neutral: 0,
			frustration: 0,
			caution: 0
		},
		frustration: {
			satisfaction: 0,
			neutral: 0,
			frustration: 0,
			caution: 0
		},
		caution: {
			satisfaction: 0,
			neutral: 0,
			frustration: 0,
			caution: 0
		}
	};
	let scoreGreater90 = 0;
	let scoreGreater80 = 0;
	let scoreGreater70 = 0;
	let satGreater90 = 0;
	let satLessEqual90 = 0;
	let satGreater80 = 0;
	let satLessEqual80 = 0;
	let satGreater70 = 0;
	let satLessEqual70 = 0;
	let codeContentCount = 0;
	let noCodeContentCount = 0;
	const frustratedGptAnswers = [];
	const convGroups = /* @__PURE__ */ new Map();
	const parseRow = (row) => {
		if (row.length < 11) return;
		const sharingId = row[1]?.trim();
		if (!sharingId) return;
		uniqueSharingIds.add(sharingId);
		const sourceId = row[2]?.trim() || "";
		const category = row[3]?.trim() || "";
		const turnIndex = parseInt(row[4]?.trim() || "0", 10);
		const prompt = row[5] || "";
		const answer = row[6] || "";
		const codeType = row[7] || "";
		const codeContent = row[8] || "";
		const codeReplaceString = row[9] || "";
		const promptEmotion = row[10]?.trim() || "neutral";
		const hasCodeContent = codeContent.trim().length > 0;
		if (hasCodeContent) codeContentCount++;
		else noCodeContentCount++;
		const promptScore = parseFloat(row[11]?.trim() || "0") / 100;
		const answerEmotion = row[12]?.trim() || "neutral";
		const answerScore = parseFloat(row[13]?.trim() || "0") / 100;
		if (!convGroups.has(sharingId)) convGroups.set(sharingId, {
			category,
			sourceId,
			turns: []
		});
		convGroups.get(sharingId).turns.push({
			index: turnIndex,
			prompt,
			answer,
			codeType,
			codeContent,
			codeReplaceString,
			promptEmotion,
			promptScore,
			answerEmotion,
			answerScore,
			hasCodeContent
		});
		if (answerEmotion) gptCounts[answerEmotion] = (gptCounts[answerEmotion] || 0) + 1;
		if (promptEmotion === "frustration" && answerEmotion) frustrationAnswerCounts[answerEmotion] = (frustrationAnswerCounts[answerEmotion] || 0) + 1;
		if (promptEmotion && answerEmotion && promptToAnswerCounts[promptEmotion] && promptToAnswerCounts[promptEmotion][answerEmotion] !== void 0) promptToAnswerCounts[promptEmotion][answerEmotion]++;
		const answerScoreRaw = answerScore * 100;
		if (answerEmotion === "frustration" && answerScoreRaw > 80 && frustratedGptAnswers.length < 50) frustratedGptAnswers.push({
			prompt,
			answer,
			score: answerScoreRaw
		});
		const score = promptScore * 100;
		if (!isNaN(score)) {
			if (score > 90) scoreGreater90++;
			if (score > 80) scoreGreater80++;
			if (score > 70) scoreGreater70++;
			if (promptEmotion === "satisfaction") {
				if (score > 90) satGreater90++;
				else satLessEqual90++;
				if (score > 80) satGreater80++;
				else satLessEqual80++;
				if (score > 70) satGreater70++;
				else satLessEqual70++;
			}
		}
	};
	const stream = fs.createReadStream(filePath, { encoding: "utf8" });
	let insideQuote = false;
	let currentCell = "";
	let currentRow = [];
	for await (const chunk of stream) for (let idx = 0; idx < chunk.length; idx++) {
		const char = chunk[idx];
		const nextChar = idx + 1 < chunk.length ? chunk[idx + 1] : "";
		if (char === "\"") {
			if (insideQuote && nextChar === "\"") {
				currentCell += "\"";
				idx++;
			} else insideQuote = !insideQuote;
		} else if (char === "," && !insideQuote) {
			currentRow.push(currentCell);
			currentCell = "";
		} else if ((char === "\n" || char === "\r") && !insideQuote) {
			if (char === "\r" && nextChar === "\n") idx++;
			currentRow.push(currentCell);
			currentCell = "";
			if (totalRows > 0) parseRow(currentRow);
			totalRows++;
			currentRow = [];
		} else currentCell += char;
	}
	if (currentCell || currentRow.length > 0) {
		currentRow.push(currentCell);
		if (totalRows > 0) parseRow(currentRow);
		totalRows++;
	}
	const duration = (Date.now() - start) / 1e3;
	console.log(`[KPI Server] Finished parsing in ${duration.toFixed(2)}s. Total rows: ${totalRows}`);
	const conversations = [];
	for (const [sharingId, group] of convGroups.entries()) {
		group.turns.sort((a, b) => a.index - b.index);
		const chatInfo = chatgptMap.get(sharingId);
		const title = chatInfo?.Title || group.turns[0]?.prompt.slice(0, 40) + "..." || "New chat";
		const sourceId = chatInfo?.Source_ID || group.sourceId;
		const language = metadataMap.get(sourceId)?.RepoLanguage || "Unknown";
		let source = "pull_request";
		const lowerCat = group.category.toLowerCase();
		if (lowerCat.includes("commit")) source = "commit";
		else if (lowerCat.includes("issue")) source = "issue";
		else if (lowerCat.includes("pull") || lowerCat.includes("pr")) source = "pull_request";
		else if (lowerCat.includes("disc")) source = "discussion";
		else if (lowerCat.includes("code")) source = "code_file";
		conversations.push({
			id: sharingId,
			title,
			language,
			source,
			turns: group.turns
		});
	}
	const endedFilePath = path.join(processModule.cwd(), "Emotion_UNIQUE", "2_chatgpt_details.csv");
	let resolutionRate = 0;
	if (fs.existsSync(endedFilePath)) {
		const lines = fs.readFileSync(endedFilePath, "utf8").split(/\r?\n/);
		let totalConvos = 0;
		let satConvos = 0;
		for (let i = 1; i < lines.length; i++) {
			const line = lines[i]?.trim();
			if (!line) continue;
			const parts = parseCsvLine(line);
			if (parts.length >= 7) {
				totalConvos++;
				if (parts[parts.length - 2]?.replace(/"/g, "").trim() === "satisfaction") satConvos++;
			}
		}
		resolutionRate = totalConvos > 0 ? satConvos / totalConvos : 0;
	}
	return {
		success: true,
		totalRows,
		totalPairs: totalRows > 0 ? totalRows - 1 : 0,
		totalConversations: uniqueSharingIds.size,
		duration,
		counts,
		gptCounts,
		frustrationAnswerCounts,
		promptToAnswerCounts,
		codeContent: {
			count: codeContentCount,
			noCodeCount: noCodeContentCount,
			share: totalRows > 1 ? codeContentCount / (totalRows - 1) : 0,
			noCodeShare: totalRows > 1 ? noCodeContentCount / (totalRows - 1) : 0
		},
		frustratedGptAnswers,
		resolutionRate,
		promptScoreCounts: {
			greaterThan90: scoreGreater90,
			greaterThan80: scoreGreater80,
			greaterThan70: scoreGreater70,
			satisfaction: {
				greaterThan90: satGreater90,
				lessEqual90: satLessEqual90,
				greaterThan80: satGreater80,
				lessEqual80: satLessEqual80,
				greaterThan70: satGreater70,
				lessEqual70: satLessEqual70
			}
		},
		conversations
	};
});
//#endregion
export { processKpis_createServerFn_handler };

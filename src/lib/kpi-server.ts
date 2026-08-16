import { createServerFn } from "@tanstack/react-start";

// Standard CSV line parser that respects double quotes and handles escaped quotes
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let insideQuote = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = i + 1 < line.length ? line[i + 1] : "";
    if (char === '"') {
      if (insideQuote && nextChar === '"') {
        current += '"';
        i++; // skip next quote
      } else {
        insideQuote = !insideQuote;
      }
    } else if (char === "," && !insideQuote) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

export const processKpis = createServerFn({ method: "GET" }).handler(
  async () => {
    const fs = await import("fs");
    const path = await import("path");

    const metadataPath = path.join(
      process.cwd(),
      "DevGPT_cleaned",
      "1_metadata.csv",
    );
    const chatgptPath = path.join(
      process.cwd(),
      "DevGPT_cleaned",
      "2_chatgpt_details.csv",
    );
    const filePath = path.join(
      process.cwd(),
      "DevGPT_cleaned",
      "unique_prompt_answer.csv",
    );

    console.log(`[KPI Server] Starting stream-parsing files...`);
    const start = Date.now();

    // 1. Load metadata mapping: Source_ID -> { RepoLanguage, Author }
    const metadataMap = new Map<
      string,
      { RepoLanguage: string; Author: string }
    >();
    if (fs.existsSync(metadataPath)) {
      const content = fs.readFileSync(metadataPath, "utf8");
      const lines = content.split(/\r?\n/);
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i]?.trim();
        if (!line) continue;
        const parts = parseCsvLine(line);
        if (parts.length >= 6) {
          const sourceId = parts[0]?.trim();
          const repoLanguage = parts[4]?.trim();
          const author = parts[2]?.trim();
          if (sourceId) {
            metadataMap.set(sourceId, {
              RepoLanguage: repoLanguage || "Unknown",
              Author: author || "Unknown",
            });
          }
        }
      }
    }

    // 2. Load ChatGPT details mapping: Sharing_ID -> { Title, Source_ID }
    const chatgptMap = new Map<string, { Title: string; Source_ID: string }>();
    if (fs.existsSync(chatgptPath)) {
      const content = fs.readFileSync(chatgptPath, "utf8");
      const lines = content.split(/\r?\n/);
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i]?.trim();
        if (!line) continue;
        const parts = parseCsvLine(line);
        if (parts.length >= 4) {
          const sharingId = parts[0]?.trim();
          const sourceId = parts[1]?.trim();
          const title = parts[3]?.trim();
          if (sharingId) {
            chatgptMap.set(sharingId, {
              Title: title || "New chat",
              Source_ID: sourceId || "",
            });
          }
        }
      }
    }

    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found at ${filePath}`);
    }

    let totalRows = 0;
    const uniqueSharingIds = new Set<string>();
    const counts: Record<string, number> = {
      satisfaction: 0,
      neutral: 0,
      frustration: 0,
      caution: 0,
    };
    const frustrationAnswerCounts: Record<string, number> = {
      satisfaction: 0,
      neutral: 0,
      frustration: 0,
      caution: 0,
    };
    const gptCounts: Record<string, number> = {
      satisfaction: 0,
      neutral: 0,
      frustration: 0,
      caution: 0,
    };
    const promptToAnswerCounts: Record<string, Record<string, number>> = {
      satisfaction: { satisfaction: 0, neutral: 0, frustration: 0, caution: 0 },
      neutral: { satisfaction: 0, neutral: 0, frustration: 0, caution: 0 },
      frustration: { satisfaction: 0, neutral: 0, frustration: 0, caution: 0 },
      caution: { satisfaction: 0, neutral: 0, frustration: 0, caution: 0 },
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

    type ConversationTurn = {
      index: number;
      prompt: string;
      answer: string;
      codeType: string;
      codeContent: string;
      codeReplaceString: string;
      promptEmotion: string;
      promptScore: number;
      answerEmotion: string;
      answerScore: number;
      hasCodeContent: boolean;
    };

    const frustratedGptAnswers: Array<{
      prompt: string;
      answer: string;
      score: number;
    }> = [];

    // Group turns by Sharing_ID
    const convGroups = new Map<
      string,
      { category: string; sourceId: string; turns: ConversationTurn[] }
    >();

    const parseRow = (row: string[]) => {
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

      if (hasCodeContent) {
        codeContentCount++;
      } else {
        noCodeContentCount++;
      }
      const promptScore = parseFloat(row[11]?.trim() || "0") / 100;
      const answerEmotion = row[12]?.trim() || "neutral";
      const answerScore = parseFloat(row[13]?.trim() || "0") / 100;

      // Add to conversation groups
      if (!convGroups.has(sharingId)) {
        convGroups.set(sharingId, { category, sourceId, turns: [] });
      }
      convGroups.get(sharingId)!.turns.push({
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
        hasCodeContent,
      });
      if (promptEmotion) {
        counts[promptEmotion] = (counts[promptEmotion] || 0) + 1;
      }
      if (answerEmotion) {
        gptCounts[answerEmotion] = (gptCounts[answerEmotion] || 0) + 1;
      }
      if (promptEmotion === "frustration" && answerEmotion) {
        frustrationAnswerCounts[answerEmotion] =
          (frustrationAnswerCounts[answerEmotion] || 0) + 1;
      }
      if (
        promptEmotion &&
        answerEmotion &&
        promptToAnswerCounts[promptEmotion] &&
        promptToAnswerCounts[promptEmotion][answerEmotion] !== undefined
      ) {
        promptToAnswerCounts[promptEmotion][answerEmotion]++;
      }

      const answerScoreRaw = answerScore * 100;
      if (
        answerEmotion === "frustration" &&
        answerScoreRaw > 80 &&
        frustratedGptAnswers.length < 50
      ) {
        frustratedGptAnswers.push({
          prompt,
          answer,
          score: answerScoreRaw,
        });
      }

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
    let currentRow: string[] = [];

    for await (const chunk of stream) {
      for (let idx = 0; idx < chunk.length; idx++) {
        const char = chunk[idx];
        const nextChar = idx + 1 < chunk.length ? chunk[idx + 1] : "";

        if (char === '"') {
          if (insideQuote && nextChar === '"') {
            currentCell += '"';
            idx++; // Skip next quote
          } else {
            insideQuote = !insideQuote;
          }
        } else if (char === "," && !insideQuote) {
          currentRow.push(currentCell);
          currentCell = "";
        } else if ((char === "\n" || char === "\r") && !insideQuote) {
          if (char === "\r" && nextChar === "\n") {
            idx++; // Skip the \n part of \r\n
          }
          currentRow.push(currentCell);
          currentCell = "";

          // Process row (row 0 is header)
          if (totalRows > 0) {
            parseRow(currentRow);
          }
          totalRows++;
          currentRow = [];
        } else {
          currentCell += char;
        }
      }
    }

    // Push last cell if file didn't end with newline
    if (currentCell || currentRow.length > 0) {
      currentRow.push(currentCell);
      if (totalRows > 0) {
        parseRow(currentRow);
      }
      totalRows++;
    }

    const duration = (Date.now() - start) / 1000;
    console.log(
      `[KPI Server] Finished parsing in ${duration.toFixed(2)}s. Total rows: ${totalRows}`,
    );

    // Build conversations list
    const conversations: Array<{
      id: string;
      title: string;
      language: string;
      source: string;
      turns: ConversationTurn[];
    }> = [];
    for (const [sharingId, group] of convGroups.entries()) {
      group.turns.sort((a, b) => a.index - b.index);

      const chatInfo = chatgptMap.get(sharingId);
      const title =
        chatInfo?.Title ||
        group.turns[0]?.prompt.slice(0, 40) + "..." ||
        "New chat";
      const sourceId = chatInfo?.Source_ID || group.sourceId;

      const metaInfo = metadataMap.get(sourceId);
      const language = metaInfo?.RepoLanguage || "Unknown";

      let source = "pull_request";
      const lowerCat = group.category.toLowerCase();
      if (lowerCat.includes("commit")) source = "commit";
      else if (lowerCat.includes("issue")) source = "issue";
      else if (lowerCat.includes("pull") || lowerCat.includes("pr"))
        source = "pull_request";
      else if (lowerCat.includes("disc")) source = "discussion";
      else if (lowerCat.includes("code")) source = "code_file";

      conversations.push({
        id: sharingId,
        title,
        language,
        source,
        turns: group.turns,
      });
    }

    // Process resolution rate (conversations ended in satisfaction)
    const endedFilePath = path.join(
      process.cwd(),
      "DevGPT_cleaned",
      "2_chatgpt_details.csv",
    );
    let resolutionRate = 0;
    if (fs.existsSync(endedFilePath)) {
      const content = fs.readFileSync(endedFilePath, "utf8");
      const lines = content.split(/\r?\n/);
      let totalConvos = 0;
      let satConvos = 0;
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i]?.trim();
        if (!line) continue;
        const parts = parseCsvLine(line);
        if (parts.length >= 7) {
          totalConvos++;
          const endPromptEmotion = parts[parts.length - 2]
            ?.replace(/"/g, "")
            .trim();
          if (endPromptEmotion === "satisfaction") {
            satConvos++;
          }
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
        noCodeShare: totalRows > 1 ? noCodeContentCount / (totalRows - 1) : 0,
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
          lessEqual70: satLessEqual70,
        },
      },
      conversations,
    };
  },
);

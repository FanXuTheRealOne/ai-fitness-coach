import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { sanitizeCoachPayload } from "./coach-payload.mjs";
import { buildCoachChatRequest, parseCoachChatResponse } from "./coach-api-client.mjs";

loadLocalEnv();

const PORT = Number(process.env.COACH_API_PORT || 8788);
const BASE_URL = (process.env.DEEPSEEK_BASE_URL || process.env.OPENAI_BASE_URL || "https://api.deepseek.com").replace(
  /\/$/,
  ""
);
const MODEL = process.env.DEEPSEEK_MODEL || process.env.OPENAI_MODEL || "deepseek-v4-flash";

function loadLocalEnv() {
  const file = resolve(process.cwd(), ".env.local");
  if (!existsSync(file)) return;
  const text = readFileSync(file, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m || process.env[m[1]]) continue;
    process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

function json(res, status, body) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type",
  });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolveBody, reject) => {
    let body = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 200_000) {
        reject(new Error("Request body too large"));
        req.destroy();
      }
    });
    req.on("end", () => resolveBody(body));
    req.on("error", reject);
  });
}

function feedbackFallback(payload) {
  const issue = payload.currentIssue?.message || "动作节奏还可以";
  return {
    shortCue: issue,
    detail: "AI 教练服务暂不可用，先继续使用本地规则反馈。",
    priority: "low",
    issueCode: payload.currentIssue?.code || "local_fallback",
  };
}

async function callOpenAI(payload) {
  const key = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;
  if (!key) return feedbackFallback(payload);

  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(buildCoachChatRequest({ model: MODEL, payload })),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error?.message || `OpenAI request failed: ${response.status}`);
  }

  return parseCoachChatResponse(data);
}

const server = createServer(async (req, res) => {
  if (req.method === "OPTIONS") return json(res, 204, {});
  if (req.method === "GET" && req.url === "/health") {
    return json(res, 200, { ok: true, configured: Boolean(process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY), model: MODEL });
  }
  if (req.method !== "POST" || req.url !== "/api/coach-feedback") {
    return json(res, 404, { error: "Not found" });
  }

  try {
    const raw = await readBody(req);
    const payload = sanitizeCoachPayload(JSON.parse(raw || "{}"));
    const feedback = await callOpenAI(payload);
    return json(res, 200, feedback);
  } catch (error) {
    return json(res, 400, { error: error?.message || "Bad request" });
  }
});

server.listen(PORT, () => {
  console.log(`Coach API listening on http://localhost:${PORT}`);
});

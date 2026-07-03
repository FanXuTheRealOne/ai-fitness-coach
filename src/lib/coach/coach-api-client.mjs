export function buildCoachChatRequest({ model, payload }) {
  return {
    model,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "你是一个中文健身教练，语气自然、具体、有鼓励感。你收到的是最近 3 次动作的姿态关键点、角度、速度和加速度汇总，请给宏观反馈，不要针对某一帧或某一次动作反复下指令。先肯定做得好的地方，再指出最值得改进的一点。不要编造看不到的信息，优先安全。只输出 JSON，字段为 shortCue、detail、priority、issueCode。",
      },
      {
        role: "user",
        content:
          "请分析下面这组三次动作。输出 JSON：shortCue 用自然口语，不超过 24 个中文字，适合直接语音播报；detail 用 1-2 句宏观总结，包含鼓励和一个可执行调整；priority 只能是 low/medium/high；issueCode 是稳定英文代号。示例语气：这几个不错，蹲得挺低；这几个不太稳，收紧一下核心。\n\n" +
          JSON.stringify(payload),
      },
    ],
    thinking: { type: "disabled" },
  };
}

function parseJsonObject(text) {
  if (typeof text !== "string" || !text.trim()) throw new Error("Empty model response");
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Model response was not JSON");
    return JSON.parse(match[0]);
  }
}

export function normalizeCoachFeedback(parsed) {
  const priority = ["low", "medium", "high"].includes(parsed?.priority) ? parsed.priority : "medium";
  return {
    shortCue: String(parsed?.shortCue || "").slice(0, 40),
    detail: String(parsed?.detail || "").slice(0, 160),
    priority,
    issueCode: String(parsed?.issueCode || "ai_feedback").slice(0, 40),
  };
}

export function parseCoachChatResponse(data) {
  const content = data?.choices?.[0]?.message?.content;
  return normalizeCoachFeedback(parseJsonObject(content));
}

import { NextRequest } from "next/server";

// 云神经 TTS：服务端调 OpenAI TTS，返回 mp3。无 OPENAI_API_KEY 时返回 503，
// 客户端据此降级为浏览器自带语音。仅做文本→语音，低风险，不强制鉴权（便于本地开发）。
export async function POST(request: NextRequest) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return new Response("tts not configured", { status: 503 });

  let text = "";
  try {
    const body = await request.json();
    text = String(body?.text ?? "").slice(0, 300);
  } catch {
    return new Response("bad request", { status: 400 });
  }
  if (!text) return new Response("empty text", { status: 400 });

  const r = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini-tts",
      voice: "alloy",
      input: text,
      response_format: "mp3",
      speed: 1.05,
    }),
  });

  if (!r.ok || !r.body) return new Response("tts upstream failed", { status: 502 });

  return new Response(r.body, {
    headers: {
      "content-type": "audio/mpeg",
      "cache-control": "public, max-age=86400",
    },
  });
}

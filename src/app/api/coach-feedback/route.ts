import { NextRequest, NextResponse } from "next/server";
import { buildCoachChatRequest, parseCoachChatResponse } from "@/lib/coach/coach-api-client.mjs";
import { sanitizeCoachPayload } from "@/lib/coach/coach-payload.mjs";

const BASE_URL = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
const MODEL = process.env.DEEPSEEK_MODEL || "deepseek-v4-flash";
const API_KEY = process.env.DEEPSEEK_API_KEY;

export async function POST(request: NextRequest) {
  if (!API_KEY) {
    return NextResponse.json({ error: "Coach API is not configured" }, { status: 503 });
  }

  let payload;
  try {
    payload = sanitizeCoachPayload(await request.json());
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid payload" },
      { status: 400 }
    );
  }

  const upstream = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(buildCoachChatRequest({ model: MODEL, payload })),
  });

  if (!upstream.ok) {
    return NextResponse.json({ error: `Coach model request failed: ${upstream.status}` }, { status: 502 });
  }

  return NextResponse.json(parseCoachChatResponse(await upstream.json()));
}

import test from "node:test";
import assert from "node:assert/strict";
import { buildCoachChatRequest, parseCoachChatResponse } from "../coach-api-client.mjs";

test("buildCoachChatRequest uses DeepSeek chat completions format", () => {
  const request = buildCoachChatRequest({
    model: "deepseek-v4-flash",
    payload: {
      exerciseId: "squat",
      exerciseName: "Squat",
      elapsed: 8,
      currentIssue: { code: "depth", message: "再蹲低" },
      samples: [
        {
          t: 1,
          exerciseId: "squat",
          exerciseName: "Squat",
          confidence: 0.8,
          formIssue: "depth",
          metrics: { kneeAngle: 128 },
          dynamics: { velocity: { kneeAngle: -15 }, acceleration: { kneeAngle: 3 } },
          landmarks: [],
        },
      ],
    },
  });

  assert.equal(request.model, "deepseek-v4-flash");
  assert.equal(request.response_format.type, "json_object");
  assert.equal(request.messages[0].role, "system");
  assert.equal(request.messages[1].role, "user");
  assert.match(request.messages[1].content, /kneeAngle/);
  assert.deepEqual(request.thinking, { type: "disabled" });
});

test("buildCoachChatRequest asks for natural macro feedback over three reps", () => {
  const request = buildCoachChatRequest({
    model: "deepseek-v4-flash",
    payload: {
      exerciseId: "squat",
      exerciseName: "Squat",
      elapsed: 22,
      currentIssue: null,
      reps: [
        { count: 1, quality: 0.9, metrics: { minKneeAngle: 92 }, issueCodes: [] },
        { count: 2, quality: 0.8, metrics: { minKneeAngle: 96 }, issueCodes: ["depth"] },
        { count: 3, quality: 0.85, metrics: { minKneeAngle: 94 }, issueCodes: [] },
      ],
    },
  });

  assert.match(request.messages[0].content, /最近 3 次/);
  assert.match(request.messages[0].content, /宏观/);
  assert.match(request.messages[0].content, /鼓励/);
  assert.match(request.messages[1].content, /自然口语/);
});

test("parseCoachChatResponse reads JSON from choices message content", () => {
  const feedback = parseCoachChatResponse({
    choices: [
      {
        message: {
          content: "{\"shortCue\":\"膝盖对脚尖\",\"detail\":\"底部时膝盖内扣，下一次主动向外推。\",\"priority\":\"high\",\"issueCode\":\"valgus\"}",
        },
      },
    ],
  });

  assert.deepEqual(feedback, {
    shortCue: "膝盖对脚尖",
    detail: "底部时膝盖内扣，下一次主动向外推。",
    priority: "high",
    issueCode: "valgus",
  });
});

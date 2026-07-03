# AI Coach Feedback Design

## Goal

Improve coaching feedback without moving real-time pose detection off-device. The browser keeps MediaPipe landmark detection, feature extraction, rep counting, and safety-critical rule checks. A local backend receives compact pose summaries and asks OpenAI to turn those signals into better coaching cues.

## Architecture

- Frontend samples `PoseFeatures` every few frames and keeps a short rolling window.
- Every few seconds, the frontend sends a summary to `POST /api/coach-feedback`.
- The backend reads `DEEPSEEK_API_KEY` from the environment, never from client code.
- The backend validates and trims incoming samples, calls DeepSeek's OpenAI-compatible Chat Completions API, and returns structured coaching text.
- If the backend is missing, unconfigured, rate-limited, or errors, the app silently falls back to the existing rule-based feedback.

## Payload

The frontend sends no raw video by default. It sends exercise id/name, elapsed time, current rule issue, and a compact sequence of derived metrics such as knee angle, elbow angle, torso inclination, body straightness, knee valgus, hip-below-knee, ankle spread, confidence, and visibility.

## Response

The backend returns:

- `shortCue`: one short screen/voice cue.
- `detail`: one concrete explanation.
- `priority`: `low`, `medium`, or `high`.
- `issueCode`: stable issue id when known.

## Constraints

Do not put API keys in source control or frontend bundles. The key supplied in chat should be revoked because it is exposed in conversation history. Use `DEEPSEEK_API_KEY`, `DEEPSEEK_BASE_URL=https://api.deepseek.com`, and `DEEPSEEK_MODEL=deepseek-v4-flash` locally.

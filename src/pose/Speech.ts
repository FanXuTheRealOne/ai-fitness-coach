// 跨平台语音播报。Web 用浏览器 SpeechSynthesis；native 上该 API 不存在则自动降级为
// no-op（iOS 迁移时在 Speech.native.ts 改用 expo-speech 即可，接口不变）。

export interface Speech {
  speak(text: string, opts?: { interrupt?: boolean }): void;
  setMuted(muted: boolean): void;
  isMuted(): boolean;
  cancel(): void;
}

export function createSpeech(lang = "zh-CN"): Speech {
  const g: any = typeof globalThis !== "undefined" ? globalThis : {};
  const synth: SpeechSynthesis | undefined = g.speechSynthesis;
  const Utter = g.SpeechSynthesisUtterance;
  let muted = false;

  return {
    speak(text, opts) {
      if (muted || !synth || !Utter) return;
      if (opts?.interrupt) synth.cancel();
      const u = new Utter(text);
      u.lang = lang;
      u.rate = 1.05;
      synth.speak(u);
    },
    setMuted(m) {
      muted = m;
      if (m && synth) synth.cancel();
    },
    isMuted() {
      return muted;
    },
    cancel() {
      synth?.cancel();
    },
  };
}

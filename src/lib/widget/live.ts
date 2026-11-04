// Server-only: mints the single-use Gemini Live token with prompt, tools and audio config locked inside.
import { EndSensitivity, GoogleGenAI, Modality, StartSensitivity } from "@google/genai";
import { LIVE_MODEL } from "@/lib/voice/agent-config";
import { buildWidgetPrompt, WIDGET_TOOLS } from "./prompt";
import type { WidgetRecord } from "./shared";

export async function mintWidgetToken(apiKey: string, w: WidgetRecord) {
  const ai = new GoogleGenAI({ apiKey, httpOptions: { apiVersion: "v1alpha" } });
  const now = Date.now();
  const token = await ai.authTokens.create({
    config: {
      uses: 1,
      expireTime: new Date(now + 30 * 60_000).toISOString(),
      newSessionExpireTime: new Date(now + 60_000).toISOString(),
      liveConnectConstraints: {
        model: LIVE_MODEL,
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: buildWidgetPrompt(w),
          tools: [{ functionDeclarations: WIDGET_TOOLS }],
          realtimeInputConfig: {
            automaticActivityDetection: {
              startOfSpeechSensitivity: StartSensitivity.START_SENSITIVITY_HIGH,
              endOfSpeechSensitivity: EndSensitivity.END_SENSITIVITY_LOW,
              prefixPaddingMs: 150,
              silenceDurationMs: 900,
            },
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
      },
      httpOptions: { apiVersion: "v1alpha" },
    },
  });
  return { token: token.name, model: LIVE_MODEL };
}

// Heavy part of the widget (realtime AI client + audio), built to public/widget-live.js.
// widget.js injects it only when a visitor starts a conversation, so pages stay light for everyone else.
import { GoogleGenAI } from "@google/genai";
import { MicCapture, Player } from "@/lib/voice/audio";

// Neutral names: the loader (widget.js) does not name the vendor SDK.
export type LiveModule = { Client: typeof GoogleGenAI; Mic: typeof MicCapture; Speaker: typeof Player };

(window as unknown as { __techthrustWidgetLive?: LiveModule }).__techthrustWidgetLive = { Client: GoogleGenAI, Mic: MicCapture, Speaker: Player };

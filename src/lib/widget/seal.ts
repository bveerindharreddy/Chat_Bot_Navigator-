// Server-only. Widget settings (including the prompt) are encrypted into the widget key with AES-GCM.
// The developer who embeds the widget only ever holds this opaque key, so the prompt cannot be read from it.
import type { WidgetPayload } from "./shared";

const enc = new TextEncoder();
const dec = new TextDecoder();

const toB64u = (b: Uint8Array) => btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const fromB64u = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

async function aesKey(): Promise<CryptoKey> {
  const secret = process.env.WIDGET_SECRET;
  if (!secret || secret.length < 16) throw new Error("WIDGET_SECRET is not configured (min 16 characters)");
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(`techthrust-widget:${secret}`));
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["encrypt", "decrypt"]);
}

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const out = new Blob([bytes as BlobPart]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

export async function sealWidget(payload: WidgetPayload): Promise<string> {
  const packed = await pipe(enc.encode(JSON.stringify(payload)), new CompressionStream("deflate-raw"));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await aesKey(), packed as BufferSource));
  const all = new Uint8Array(iv.length + ct.length);
  all.set(iv); all.set(ct, iv.length);
  return `tw1_${toB64u(all)}`;
}

/** Returns null for anything that is not a key produced by this server. */
export async function openWidget(key: unknown): Promise<WidgetPayload | null> {
  if (typeof key !== "string" || !key.startsWith("tw1_") || key.length > 30_000) return null;
  try {
    const all = fromB64u(key.slice(4));
    const packed = new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: all.slice(0, 12) }, await aesKey(), all.slice(12)));
    const p = JSON.parse(dec.decode(await pipe(packed, new DecompressionStream("deflate-raw")))) as WidgetPayload;
    return p?.v === 1 && Array.isArray(p.o) ? p : null;
  } catch {
    return null;
  }
}

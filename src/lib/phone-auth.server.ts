import { createHash, randomInt, randomBytes } from "crypto";

export const OTP_TTL_MINUTES = 5;
export const MAX_ATTEMPTS = 5;

/** Normalises an Indian/international mobile input to E.164 (default +91). */
export function normalisePhone(input: string): string {
  const raw = input.trim().replace(/[\s\-()]/g, "");
  const digits = raw.replace(/\D/g, "");
  if (raw.startsWith("+")) {
    if (digits.length < 10 || digits.length > 15) throw new Error("Enter a valid mobile number");
    return `+${digits}`;
  }
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  throw new Error("Enter a valid 10-digit mobile number");
}

export const hashCode = (phone: string, code: string) =>
  createHash("sha256").update(`${phone}:${code}`).digest("hex");

export const generateCode = () => String(randomInt(100000, 1000000));

export const generatePassword = () => randomBytes(24).toString("base64url");

/** Deterministic placeholder email so Supabase Auth can hold a phone-only user. */
export const phoneEmail = (phone: string) => `${phone.replace("+", "")}@phone.yomora.app`;

/**
 * Sends the code over the WhatsApp Cloud API when credentials are configured.
 * Returns false when no provider is set up (preview fallback).
 */
export async function sendWhatsAppCode(phone: string, code: string): Promise<boolean> {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneId) return false;

  const template = process.env.WHATSAPP_TEMPLATE_NAME || "";
  const to = phone.replace("+", "");
  const body = template
    ? {
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: template,
          language: { code: process.env.WHATSAPP_TEMPLATE_LANG || "en_US" },
          components: [
            { type: "body", parameters: [{ type: "text", text: code }] },
            { type: "button", sub_type: "url", index: "0", parameters: [{ type: "text", text: code }] },
          ],
        },
      }
    : {
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: `Your YOMORA login code is ${code}. It expires in ${OTP_TTL_MINUTES} minutes.` },
      };

  const res = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    console.error("WhatsApp send failed", res.status, await res.text());
    throw new Error("Could not send the WhatsApp code. Please try again.");
  }
  return true;
}

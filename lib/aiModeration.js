import { generateWithFallback } from "./ai.js";
import { escapeHtml, sendTelegram } from "./telegram.js";
import { applyViolation } from "./moderation.js";

const SCAM = /(guaranteed\s+profit|double\s+your\s+money|500%|airdrop|free\s+crypto|investment\s+group|dm\s+for\s+profit|signal\s+group)/i;
const PHISHING = /(send\s+otp|share\s+otp|seed\s+phrase|recovery\s+phrase|wallet\s+connect|verify\s+your\s+account|login\s+here|password)/i;
const TOXIC = /(kill\s+yourself|stupid\s+idiot|motherfucker|fuck\s+you|bastard)/i;

export async function maybeAiModerate(message, settings) {
  const ai = settings.ai || {};
  if (!ai.enabled) return false;
  const text = message.text || message.caption || "";
  if (!text) return false;

  const flags = [];
  if (ai.phishing?.enabled && PHISHING.test(text)) flags.push({ category: "phishing", confidence: 0.95, reason: "Possible phishing / credential theft" });
  if (ai.scam?.enabled && SCAM.test(text)) flags.push({ category: "scam", confidence: 0.92, reason: "Possible scam advertisement" });
  if (ai.toxicity?.enabled && TOXIC.test(text)) flags.push({ category: "toxicity", confidence: 0.86, reason: "Possible toxic abuse" });
  if (ai.impersonation?.enabled && /(official\s+admin|support\s+team|telegram\s+support)/i.test(text)) flags.push({ category: "impersonation", confidence: 0.84, reason: "Possible impersonation" });

  if (!flags.length && process.env.GEMINI_API_KEY && (ai.phishing?.enabled || ai.scam?.enabled || ai.toxicity?.enabled || ai.impersonation?.enabled)) {
    try {
      const prompt = `Classify this Telegram group message. Reply only JSON like {"flagged":true,"category":"scam|phishing|toxicity|impersonation|none","confidence":0.0,"reason":"short"}. Message: ${JSON.stringify(text.slice(0,1500))}`;
      const out = await generateWithFallback(prompt);
      const parsed = JSON.parse(String(out || "{}").replace(/```json|```/g, "").trim());
      if (parsed.flagged && parsed.category && parsed.category !== "none" && ai[parsed.category]?.enabled) {
        flags.push({ category: parsed.category, confidence: Number(parsed.confidence) || 0.75, reason: parsed.reason || `AI flagged ${parsed.category}` });
      }
    } catch (err) {
      console.error("AI moderation parse failed:", err.message);
    }
  }

  if (!flags.length) return false;
  const top = flags.sort((a,b) => b.confidence - a.confidence)[0];
  const categorySettings = ai[top.category] || {};
  const auto = categorySettings.auto_action || ai.default_action === "delete_warn";

  if (auto) {
    await applyViolation(message, { reason: `AI ${top.category}: ${top.reason}`, delete: true, warn: true });
  } else {
    await sendTelegram(message.chat.id, `🤖 AI review flag\nCategory: ${escapeHtml(top.category)}\nConfidence: ${Math.round(top.confidence * 100)}%\nReason: ${escapeHtml(top.reason)}\n\nAuto action is OFF.`, message.message_id);
  }
  return true;
}

export async function aiSummary(chatId, messages = []) {
  const text = messages.map(m => `${m.username || "User"}: ${m.message_text || ""}`).join("\n").slice(-8000);
  if (!process.env.GEMINI_API_KEY || !text) return "No enough messages to summarize.";
  const prompt = `Summarize this Telegram group chat for admins. Include main topics, problems, spam/moderation notes, and action items. Keep short.\n\n${text}`;
  return await generateWithFallback(prompt) || "Summary unavailable.";
}

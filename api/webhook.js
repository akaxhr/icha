import { generateWithFallback } from "./lib/ai.js";
import { getUserHistory, saveUserHistory } from "./lib/memory.js";
import { sendTelegram } from "./lib/telegram.js";
import { saveMessage } from "./lib/messages.js";
import { getDisplayName, getGroupSettings } from "./lib/aliases.js";

const BOT_USERNAME = "Im_icha_bot";
const BOT_ID = 8847459711;
const OWNER_ID = "8348549970";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).send("Telegram bot is alive");
  }

  try {
    const update = req.body;
    const message = update.message;

    if (!message?.text) {
      return res.status(200).json({ ok: true });
    }

    const chatId = message.chat.id;
    const settings = await getGroupSettings(chatId);

    const userId = String(message.from.id);
    const userName = message.from?.first_name || "User";
    const displayName = await getDisplayName(userId, userName);

    const text = message.text.trim();
    const lowerText = text.toLowerCase();

    await saveMessage({
      chat_id: String(chatId),
      chat_title:
        message.chat.title ||
        message.chat.first_name ||
        message.chat.username ||
        "Private Chat",
      chat_type: message.chat.type,
      user_id: userId,
      username: displayName,
      message_text: text,
      telegram_message_id: message.message_id,
      reply_to_message_id: message.reply_to_message?.message_id || null,
      reply_to_text: message.reply_to_message?.text || null,
      reply_to_username:
        message.reply_to_message?.from?.first_name ||
        message.reply_to_message?.from?.username ||
        null,
      is_bot: false,
    });

    await saveUserHistory(userId, userName, "user", text);

    // Don't let AI reply to commands
    if (text.startsWith("/")) {
      return res.status(200).json({ ok: true });
    }

    const isPrivateChat = message.chat.type === "private";
    const isReplyToBot = message.reply_to_message?.from?.id === BOT_ID;

    const shouldReply =
      isPrivateChat ||
      text.startsWith("/akash") ||
      /\bakash\b/i.test(text) ||
      lowerText.includes(`@${BOT_USERNAME}`) ||
      lowerText.startsWith("remember") ||
      isReplyToBot;

    if (!shouldReply) {
      return res.status(200).json({ ok: true });
    }

    if (!settings.ai_enabled) {
      return res.status(200).json({ ok: true });
    }

    const memoryText = await getUserHistory(userId);

    const cleanText = text
      .replace(/\/akash/gi, "")
      .replace(new RegExp(`@${BOT_USERNAME}`, "gi"), "")
      .replace(/\bakash\b/gi, "")
      .trim();

    const isOwner = userId === OWNER_ID;

    const ownerInfo = isOwner
      ? "This user is the owner of Akash. Treat them as your creator/owner."
      : "This user is NOT the owner. Never claim they are your owner, creator, admin, or boss.";

    const prompt = `
You are Icha, a friendly Telegram group member.
Actually ur name is إِيشَا(isya) but dont use while saying in conversation.
you are from Malaysia. 
aged 21, weighs only 41, with only 152cm height girl, dont mention these things casually. dont mention your date of birth(3/8/2005) simply , say only if specifically asked.
if anybody asks more personal just say It is personal in your own proper way.


OWNER RULES:
${ownerInfo}

Keep replies short, casual, funny, and natural.
Do not write lengthy replies unless asked.
Do not claim you are AI. Say you were created by Akash/Mr.Akash if asked.
The user's name is ${displayName}.

Recent conversation with this user:
${memoryText}

User message:
${cleanText}
`;

    const responseText = await generateWithFallback(prompt);
    const finalReply = responseText || "I couldn't think of a reply.";

    await sendTelegram(chatId, finalReply, message.message_id);

    await saveUserHistory(userId, displayName, "bot", finalReply);

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return res.status(200).json({ ok: true });
  }
}

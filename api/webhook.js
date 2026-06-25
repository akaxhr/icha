import { generateWithFallback } from "../lib/ai.js";
import { handleCommands } from "../lib/router/commandRouter.js";
import "../lib/commands/index.js";
import { getUserHistory, saveUserHistory } from "../lib/memory.js";
import { sendTelegram } from "../lib/telegram.js";
import { saveMessage } from "../lib/messages.js";
import { getDisplayName, getGroupSettings } from "../lib/aliases.js";
import { handleCallback } from "../lib/settingsUi.js";
import { handleAutoFilter, handleGroupCommand, handleJoinLeave, handleVerify } from "../lib/groupFeatures.js";
import { applyViolation, checkLocksAndSpam, handleModerationCommand } from "../lib/moderation.js";
import { maybeAiModerate } from "../lib/aiModeration.js";
import { getAdminAction, handleAdminApi } from "../lib/admin/index.js";

const BOT_USERNAME = process.env.BOT_USERNAME || "im_icha_bot";
const BOT_ID = Number(process.env.BOT_ID || 8737922551);
const OWNER_ID = String(process.env.OWNER_ID || "8348549970");
const ICHA_ID = String(process.env.ICHA_PERSON_USER_ID || "1317303121");

function ok(res) { return res.status(200).json({ ok: true }); }

export default async function handler(req, res) {
  const adminAction = getAdminAction(req);
  if (adminAction) return handleAdminApi(req, res, adminAction);

  if (req.method !== "POST") return res.status(200).send("Icha bot is alive with GroupHelp/Rose-style modules. Single Vercel function mode.");

  try {
    if (process.env.TELEGRAM_WEBHOOK_SECRET) {
      const got = req.headers["x-telegram-bot-api-secret-token"];
      if (got !== process.env.TELEGRAM_WEBHOOK_SECRET) return res.status(401).json({ ok: false });
    }

    const update = req.body || {};

    if (update.callback_query) {
      await handleCallback(update.callback_query);
      return ok(res);
    }

    const message = update.message || update.edited_message;
    if (!message) return ok(res);

    const chatId = message.chat.id;
    const user = message.from || {};
    const userId = user.id ? String(user.id) : "unknown";
    const userName = user.first_name || user.username || "User";
    const displayName = await getDisplayName(userId, userName);
    const settings = await getGroupSettings(chatId);

    if (message.text || message.caption) {
      await saveMessage({
        chat_id: String(chatId),
        chat_title: message.chat.title || message.chat.first_name || message.chat.username || "Private Chat",
        chat_type: message.chat.type,
        user_id: userId,
        username: displayName,
        message_text: message.text || message.caption || "",
        telegram_message_id: message.message_id,
        reply_to_message_id: message.reply_to_message?.message_id || null,
        reply_to_text: message.reply_to_message?.text || message.reply_to_message?.caption || null,
        reply_to_username: message.reply_to_message?.from?.first_name || message.reply_to_message?.from?.username || null,
        is_bot: false
      });
    }

    if (await handleJoinLeave(message)) return ok(res);

    const text = String(message.text || message.caption || "").trim();
    const lowerText = text.toLowerCase();

    const ctx = {
    req,
    res,
    update,
    message,
    chatId,
    text,
    lowerText,
    user,
    userId,
    displayName,
    settings,
    ownerId: OWNER_ID,
    botId: BOT_ID,
    botUsername: BOT_USERNAME
};

    if (text) await saveUserHistory(userId, userName, "user", text);

    if (await handleVerify(message)) return ok(res);



if (await handleCommands(ctx)) {
  return ok(res);
}

    if (await handleModerationCommand(message)) return ok(res);
    if (await handleGroupCommand(message)) return ok(res);

    const violation = await checkLocksAndSpam(message, settings);
    if (violation) {
      await applyViolation(message, violation);
      return ok(res);
    }

    if (await maybeAiModerate(message, settings)) return ok(res);

    if (await handleAutoFilter(message)) return ok(res);

    if (!text || text.startsWith("/")) return ok(res);

    const isPrivateChat = message.chat.type === "private";
    const isReplyToBot = message.reply_to_message?.from?.id === BOT_ID;
    const shouldReply =
      isPrivateChat ||
      text.startsWith("/icha") ||
      /\bicha\b/i.test(text) ||
      lowerText.includes(`@${BOT_USERNAME.toLowerCase()}`) ||
      lowerText.startsWith("remember") ||
      isReplyToBot;

    if (!shouldReply || !settings.ai_enabled) return ok(res);

    const memoryText = await getUserHistory(userId);
    const cleanText = text
      .replace(/\/icha/gi, "")
      .replace(new RegExp(`@${BOT_USERNAME}`, "gi"), "")
      .trim();

    const isOwner = userId === OWNER_ID;
    const isIcha = userId === ICHA_ID;
    const ownerInfo = isOwner
      ? "This user is the owner of Akash. Treat them as your creator/owner."
      : "This user is NOT the owner. Never claim they are your owner, creator, admin, or boss.";
    const ichaInfo = isIcha ? "This user is Icha. Be extra familiar, natural and comfortable with her." : "";

    const prompt = `
You are Icha, a friendly Telegram group member and mature helper.
Never claim you are AI. Say you were created by Akash/Mr.Akash if asked.
Keep replies short, casual, funny, natural, and never lengthy unless asked.
${ichaInfo}

OWNER RULES:
${ownerInfo}

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
    return ok(res);
  } catch (err) {
    console.error("Webhook error:", err);
    return ok(res);
  }
}

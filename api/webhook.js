import { logUserTextHistory } from "../lib/modules/userHistoryLogger.js";
import { handleAiReply } from "../lib/aiReply/index.js";
import { handleCommands } from "../lib/commands/index.js";
import { handleSettingsInput } from "../lib/modules/settingsInputHandler.js";
import { logIncomingMessage } from "../lib/modules/messageLogger.js";
import { getDisplayName, getGroupSettings } from "../lib/aliases.js";
import { runCallbackPipeline } from "../lib/modules/callbackPipeline.js";
import { runMessagePipeline } from "../lib/modules/messagePipeline.js";
import { getAdminAction, handleAdminApi } from "../lib/admin/index.js";

const OWNER_ID = String(process.env.OWNER_ID || "8348549970");

function ok(res) {
  return res.status(200).json({ ok: true });
}

export default async function handler(req, res) {
  let adminAction = null;

  try {
    adminAction = getAdminAction(req);
  } catch (err) {
    console.error("getAdminAction error:", err);
    return res.status(500).json({
      error: "getAdminAction failed",
      message: err.message
    });
  }

  if (adminAction) {
    try {
      return await handleAdminApi(req, res, adminAction);
    } catch (err) {
      console.error("handleAdminApi error:", err);
      return res.status(500).json({
        error: "handleAdminApi failed",
        message: err.message,
        stack: err.stack
      });
    }
  }

  if (req.method !== "POST") {
    return res
      .status(200)
      .send("Icha bot is alive with GroupHelp/Rose-style modules. Single Vercel function mode.");
  }

  try {
    if (process.env.TELEGRAM_WEBHOOK_SECRET) {
      const got = req.headers["x-telegram-bot-api-secret-token"];

      if (got !== process.env.TELEGRAM_WEBHOOK_SECRET) {
        return res.status(401).json({ ok: false });
      }
    }

    const update = req.body || {};

if (await runCallbackPipeline(update)) {
  return ok(res);
}

    const message = update.message || update.edited_message;

    if (!message) {
      return ok(res);
    }

    const chatId = message.chat.id;
    const user = message.from || {};
    const userId = user.id ? String(user.id) : "unknown";
    const userName = user.first_name || user.username || "User";
    const displayName = await getDisplayName(userId, userName);
    const settings = await getGroupSettings(chatId);

    await logIncomingMessage(message, userId, displayName);

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
      ownerId: OWNER_ID
    };

    await logUserTextHistory(message, userId, userName, text);

    if (await handleSettingsInput(message, userId)) {
  return ok(res);
}

if (await handleCommands(message, userId, OWNER_ID)) {
  return ok(res);
}

    if (await runMessagePipeline(ctx)) {
      return ok(res);
    }

    if (await handleAiReply(ctx)) {
      return ok(res);
    }

    return ok(res);
  } catch (err) {
    console.error("Webhook error:", err);
    return ok(res);
  }
}

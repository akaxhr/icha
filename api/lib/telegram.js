import { saveMessage } from "./messages.js";

const API = () => `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

async function tg(method, body = {}) {
  const res = await fetch(`${API()}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const json = await res.json().catch(() => ({ ok: false, description: "Invalid Telegram response" }));
  if (!json.ok) console.error(`Telegram ${method} error:`, json);
  return json;
}

export { tg };

export async function sendTelegram(chatId, text, replyTo = null, chatTitle = "Bot Reply", replyMarkup = null, replyMeta = {}) {
  const body = { chat_id: chatId, text: String(text || "").slice(0, 4096), parse_mode: "HTML", disable_web_page_preview: true };
  if (replyTo) body.reply_to_message_id = replyTo;
  if (replyMarkup) body.reply_markup = replyMarkup;
  const result = await tg("sendMessage", body);
  if (result.ok) {
    await saveMessage({
      chat_id: String(chatId), chat_title: chatTitle, user_id: "bot", username: "Icha",
      message_text: text, telegram_message_id: result.result?.message_id || null,
      reply_to_message_id: replyTo || null, reply_to_text: replyMeta.reply_to_text || null,
      reply_to_username: replyMeta.reply_to_username || null, is_bot: true
    });
  }
  return result;
}

export async function editTelegram(chatId, messageId, text, replyMarkup = null) {
  return tg("editMessageText", { chat_id: chatId, message_id: messageId, text: String(text || "").slice(0,4096), parse_mode: "HTML", reply_markup: replyMarkup || undefined });
}

export async function answerCallbackQuery(callbackQueryId, text = "Done") {
  return tg("answerCallbackQuery", { callback_query_id: callbackQueryId, text, show_alert: false });
}

export async function deleteTelegramMessage(chatId, messageId) {
  if (!messageId) return { ok: false };
  return tg("deleteMessage", { chat_id: chatId, message_id: messageId });
}

export async function restrictUser(chatId, userId, seconds = 3600) {
  const until_date = seconds ? Math.floor(Date.now() / 1000) + seconds : undefined;
  return tg("restrictChatMember", {
    chat_id: chatId,
    user_id: userId,
    permissions: { can_send_messages: false },
    until_date
  });
}

export async function unrestrictUser(chatId, userId) {
  return tg("restrictChatMember", {
    chat_id: chatId,
    user_id: userId,
    permissions: {
      can_send_messages: true,
      can_send_audios: true,
      can_send_documents: true,
      can_send_photos: true,
      can_send_videos: true,
      can_send_video_notes: true,
      can_send_voice_notes: true,
      can_send_polls: true,
      can_send_other_messages: true,
      can_add_web_page_previews: true
    }
  });
}

export async function banUser(chatId, userId, seconds = null) {
  const until_date = seconds ? Math.floor(Date.now() / 1000) + seconds : undefined;
  return tg("banChatMember", { chat_id: chatId, user_id: userId, until_date });
}

export async function unbanUser(chatId, userId) {
  return tg("unbanChatMember", { chat_id: chatId, user_id: userId, only_if_banned: true });
}

export async function kickUser(chatId, userId) {
  const r = await banUser(chatId, userId, 60);
  await unbanUser(chatId, userId);
  return r;
}

export async function getChatMember(chatId, userId) {
  return tg("getChatMember", { chat_id: chatId, user_id: userId });
}

export async function isAdmin(chatId, userId) {
  if (!chatId || !userId) return false;
  try {
    const r = await getChatMember(chatId, userId);
    const status = r.result?.status;
    return ["creator", "administrator"].includes(status);
  } catch {
    return false;
  }
}

export function userMention(user) {
  const name = escapeHtml(user?.first_name || user?.username || "User");
  return `<a href="tg://user?id=${user?.id}">${name}</a>`;
}

export function escapeHtml(text) {
  return String(text ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

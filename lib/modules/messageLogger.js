import { saveMessage } from "../messages.js";

export async function logIncomingMessage(message, userId, displayName) {
  if (!message.text && !message.caption) return;

  await saveMessage({
    chat_id: String(message.chat.id),
    chat_title:
      message.chat.title ||
      message.chat.first_name ||
      message.chat.username ||
      "Private Chat",
    chat_type: message.chat.type,
    user_id: userId,
    username: displayName,
    message_text: message.text || message.caption || "",
    telegram_message_id: message.message_id,
    reply_to_message_id: message.reply_to_message?.message_id || null,
    reply_to_text:
      message.reply_to_message?.text ||
      message.reply_to_message?.caption ||
      null,
    reply_to_username:
      message.reply_to_message?.from?.first_name ||
      message.reply_to_message?.from?.username ||
      null,
    is_bot: false
  });
}

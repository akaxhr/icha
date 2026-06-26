import { getCommandPermission } from "./storage.js";

async function isUserAdmin(chatId, userId) {
  const token = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN;
  if (!token || !chatId || !userId) return false;

  const res = await fetch(`https://api.telegram.org/bot${token}/getChatMember`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      user_id: userId
    })
  });

  const json = await res.json();
  const status = json?.result?.status;

  return ["creator", "administrator"].includes(status);
}

export async function canUseCommand(message, commandName) {
  const chatId = message.chat.id;
  const userId = message.from?.id;
  const chatType = message.chat.type;

  const permission = await getCommandPermission(chatId, commandName);

  if (permission === "none") return false;
  if (permission === "all") return true;
  if (permission === "private") return chatType === "private";

  if (permission === "staff") {
    if (chatType === "private") return true;
    return await isUserAdmin(chatId, userId);
  }

  return true;
}

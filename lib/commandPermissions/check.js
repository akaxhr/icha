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
  const permission = await getCommandPermission(message.chat.id, commandName);

  if (permission === "none") return false;
  if (permission === "all") return true;
  if (permission === "private") return message.chat.type === "private";

  if (permission === "staff") {
    if (message.chat.type === "private") return true;
    return await isUserAdmin(message.chat.id, message.from?.id);
  }

  return true;
}

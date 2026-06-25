import { sendTelegram } from "../telegram.js";

export async function handlePing(message) {
  await sendTelegram(
    message.chat.id,
    "✅ Icha is online.",
    message.message_id
  );

  return true;
}

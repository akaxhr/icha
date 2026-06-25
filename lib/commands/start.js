import { sendTelegram } from "../telegram.js";

export async function handleStart(message) {
  const chatId = message.chat.id;

  const text =
    message.chat.type === "private"
      ? `🌹 <b>Icha is ready.</b>

Add me to a group and promote me as admin.

Then use

/settings

inside the group.

I'll send the settings panel here.`
      : `🌹 <b>Icha is active.</b>

Admins:
/settings

Members:
/help`;

  await sendTelegram(chatId, text, message.message_id);

  return true;
}

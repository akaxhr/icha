import { stopMusic } from "../musicWorker.js";

export async function stopCommand(chatId, messageId, sendTelegram) {
  await stopMusic(chatId);

  await sendTelegram(
    chatId,
    "⏹ Music stopped.",
    messageId
  );
}

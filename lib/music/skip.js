import { skipMusic } from "../musicWorker.js";

export async function skipCommand(chatId, messageId, sendTelegram) {
  const result = await skipMusic(chatId);

  if (result.status === "playing") {
    await sendTelegram(
      chatId,
      `⏭ <b>Playing next</b>\n\n${result.title}`,
      messageId
    );
    return;
  }

  await sendTelegram(chatId, "⏹ Queue finished.", messageId);
}

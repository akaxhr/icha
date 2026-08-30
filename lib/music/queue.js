import { getQueue } from "../musicWorker.js";

export async function queueCommand(chatId, messageId, sendTelegram) {
  const result = await getQueue(chatId);

  let text = "🎵 <b>Queue</b>\n\n";

  if (result.current) {
    text += `▶️ ${result.current.title}\n\n`;
  }

  if (!result.queue?.length) {
    text += "Queue is empty.";
  } else {
    result.queue.forEach((song, i) => {
      text += `${i + 1}. ${song.title}\n`;
    });
  }

  await sendTelegram(chatId, text, messageId);
}

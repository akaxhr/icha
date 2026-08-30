import { playCommand } from "./play.js";
import { skipCommand } from "./skip.js";
import { stopCommand } from "./stop.js";
import { queueCommand } from "./queue.js";

export async function musicCommand(
  text,
  chatId,
  messageId,
  sendTelegram
) {
  const command = text.trim().split(/\s+/)[0].toLowerCase();

  if (command === "/play")
    return playCommand(chatId, messageId, text, sendTelegram);

  if (command === "/skip")
    return skipCommand(chatId, messageId, sendTelegram);

  if (command === "/stop")
    return stopCommand(chatId, messageId, sendTelegram);

  if (command === "/queue")
    return queueCommand(chatId, messageId, sendTelegram);

  return false;
}

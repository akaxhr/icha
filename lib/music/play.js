import { playMusic } from "../musicWorker.js";

export async function playCommand(chatId, messageId, text, sendTelegram) {
  const query = text.replace(/^\/play\s*/i, "").trim();

  if (!query) {
    await sendTelegram(chatId, "🎵 What should I play?", messageId);
    return;
  }

  const result = await playMusic(chatId, query);

  if (result.status === "playing") {
    await sendTelegram(
      chatId,
      `🎵 <b>Now Playing</b>\n\n${result.title}`,
      messageId
    );
    return;
  }

  if (result.status === "queued") {
    await sendTelegram(
      chatId,
      `🎶 Added: <b>${result.title}</b>\nPosition: ${result.position}`,
      messageId
    );
    return;
  }

  await sendTelegram(
    chatId,
    `❌ ${result.message || "Couldn't play that."}`,
    messageId
  );
}

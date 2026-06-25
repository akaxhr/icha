import { registerCommand } from "../router/commandRouter.js";
import { sendTelegram } from "../telegram.js";

registerCommand("start", async ({ chatId }) => {
  await sendTelegram(
    chatId,
    `👋 Welcome to Icha

Use /help to see commands.
Use /settings in a group to manage it.`
  );
});

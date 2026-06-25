import { registerCommand } from "../router/commandRouter.js";
import { sendTelegram } from "../telegram.js";

registerCommand("settings", async ({ chatId }) => {
  await sendTelegram(chatId, "⚙️ Settings module loading...");
});

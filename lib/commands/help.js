import { registerCommand } from "../router/commandRouter.js";
import { sendTelegram } from "../telegram.js";

registerCommand("help", async ({ chatId }) => {
  await sendTelegram(
    chatId,
`🤖 Icha

/start
/help
/settings

More modules coming soon.`
  );
});

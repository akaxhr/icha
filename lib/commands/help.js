import { registerCommand } from "../router/commandRouter.js";
import { sendTelegram } from "../telegram.js";

registerCommand("/help", async (ctx) => {
  const helpText = `🌹 <b>Icha Help</b>

<b>Basic</b>
/start - Start bot
/help - Show help
/ping - Check bot status
/settings - Open group settings

<b>Group</b>
/rules - Show group rules
/setrules - Set group rules

<b>Moderation</b>
/warn - Warn user
/resetwarns - Reset warnings
/mute - Mute user
/unmute - Unmute user
/ban - Ban user
/unban - Unban user
/kick - Kick user

More modules coming.`;

  await sendTelegram(ctx.chatId, helpText, ctx.message.message_id);
});

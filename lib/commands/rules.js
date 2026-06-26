import { sendTelegram } from "../telegram.js";
import { getGroupRules } from "../modules/groupRules.js";
import { canUseCommand } from "../commandPermissions/check.js";

export async function handleRulesCommand(message) {
  if (message.chat.type === "private") {
    await sendTelegram(
      message.chat.id,
      "Use /rules inside a group.",
      message.message_id
    );
    return true;
  }

  if (!(await canUseCommand(message, "rules"))) {
    return true;
  }

  const rules = await getGroupRules(message.chat.id);

  if (!rules?.text && !rules?.media_file_id) {
    await sendTelegram(message.chat.id, "No regulation set.", message.message_id);
    return true;
  }

  await sendTelegram(
    message.chat.id,
    rules.text || rules.media_caption || "📜 Group rules",
    message.message_id,
    null,
    rules.buttons_json?.length ? { inline_keyboard: rules.buttons_json } : null
  );

  return true;
}

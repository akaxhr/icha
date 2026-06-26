import { sendTelegram } from "../telegram.js";
import { getGroupRules } from "../modules/groupRules.js";
import { canUseCommand } from "../commandPermissions/check.js";

export async function handleRulesCommand(message) {
  if (!(await canUseCommand(message, "rules"))) {
    return true;
  }

  const rules = await getGroupRules(message.chat.id);

  await sendTelegram(
    message.chat.id,
    rules.text || "No rules set.",
    message.message_id,
    null,
    rules.buttons_json?.length ? { inline_keyboard: rules.buttons_json } : null
  );

  return true;
}

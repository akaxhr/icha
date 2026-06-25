import { answerCallback, editMessage } from "./telegramUi.js";
import { settingPageKeyboard } from "./keyboards.js";
import { toggleSetting } from "../modules/settingsToggle.js";

export async function handleSettingsToggle(callbackQuery) {
  const [, , groupId, page, value] = callbackQuery.data.split(":");
  const result = await toggleSetting(groupId, page, value);

  await answerCallback(
    callbackQuery,
    `${page} ${result.value ? "enabled" : "disabled"}`
  );

  await editMessage(
    callbackQuery.message.chat.id,
    callbackQuery.message.message_id,
    `⚙️ <b>${page.toUpperCase()} SETTINGS</b>

Group: <code>${groupId}</code>

Status: ${result.value ? "✅ Enabled" : "❌ Disabled"}

Saved: <code>${result.key}</code>`,
    settingPageKeyboard(groupId, page)
  );

  return true;
}

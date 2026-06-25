import { answerCallback, editMessage } from "./telegramUi.js";
import { settingPageKeyboard } from "./keyboards.js";
import { getPageStatus } from "../modules/settingsToggle.js";

export async function handleSettingsPage(callbackQuery) {
  const [, , groupId, page] = callbackQuery.data.split(":");
  const status = await getPageStatus(groupId, page);

  await answerCallback(callbackQuery, page);

  await editMessage(
    callbackQuery.message.chat.id,
    callbackQuery.message.message_id,
    `⚙️ <b>${page.toUpperCase()} SETTINGS</b>

Group: <code>${groupId}</code>

Status: ${status.value ? "✅ Enabled" : "❌ Disabled"}

Choose what you want to do.`,
    settingPageKeyboard(groupId, page)
  );

  return true;
}

import { answerCallback, editMessage } from "./telegramUi.js";
import { settingPageKeyboard, otherSettingsKeyboard } from "./keyboards.js";
import { getPageStatus } from "../modules/settingsToggle.js";
import { handleRulesPage } from "./pages/rules.js";

export async function handleSettingsPage(callbackQuery) {
  const [, , groupId, page] = callbackQuery.data.split(":");

  if (page === "rules") {
    return handleRulesPage(callbackQuery, groupId);
  }

  if (page === "other") {
    await answerCallback(callbackQuery, "Other settings");

    await editMessage(
      callbackQuery.message.chat.id,
      callbackQuery.message.message_id,
      `⚙️ <b>SETTINGS</b>

Group: <code>${groupId}</code>

<i>Select one of the settings that you want to change.</i>`,
      otherSettingsKeyboard(groupId)
    );

    return true;
  }

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

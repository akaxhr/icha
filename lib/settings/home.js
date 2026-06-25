import { answerCallback, editMessage } from "./telegramUi.js";
import { settingsHomeKeyboard } from "./keyboards.js";

export async function handleSettingsGroup(callbackQuery) {
  const groupId = callbackQuery.data.replace("settings:group:", "");

  await answerCallback(callbackQuery, "Opening settings");

  await editMessage(
    callbackQuery.message.chat.id,
    callbackQuery.message.message_id,
    `⚙️ <b>SETTINGS</b>

Group: <code>${groupId}</code>

<i>Select one of the settings that you want to change.</i>`,
    settingsHomeKeyboard(groupId)
  );

  return true;
}

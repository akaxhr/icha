import { getAdminGroups } from "../modules/adminGroups.js";
import { answerCallback, editMessage } from "./telegramUi.js";
import { groupListKeyboard } from "./keyboards.js";

export async function handleSettingsClose(callbackQuery) {
  await answerCallback(callbackQuery, "Closed");

  await editMessage(
    callbackQuery.message.chat.id,
    callbackQuery.message.message_id,
    "✅ Closed.",
    { inline_keyboard: [] }
  );

  return true;
}

export async function handleSettingsRefresh(callbackQuery) {
  const groups = await getAdminGroups(callbackQuery.from?.id);

  await answerCallback(callbackQuery, "Refreshed");

  await editMessage(
    callbackQuery.message.chat.id,
    callbackQuery.message.message_id,
    `⚙️ <b>Manage group Settings</b>

👉 Select the group whose settings you want to change.`,
    groupListKeyboard(groups)
  );

  return true;
}

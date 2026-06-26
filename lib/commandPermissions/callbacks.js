import { answerCallback, editMessage } from "../settings/telegramUi.js";
import { setCommandPermission } from "./storage.js";
import {
  buildCommandPermissionsText,
  buildCommandPermissionsKeyboard
} from "./ui.js";

export async function handleCommandPermissionCallback(callbackQuery) {
  const data = callbackQuery.data || "";

  if (!data.startsWith("cmdperm:")) return false;

  if (data === "cmdperm:noop") {
    await answerCallback(callbackQuery, "");
    return true;
  }

  const [, groupId, command, permission] = data.split(":");

  await setCommandPermission(
    groupId,
    command,
    permission,
    callbackQuery.from?.id
  );

  await answerCallback(callbackQuery, "Permission updated");

  await editMessage(
    callbackQuery.message.chat.id,
    callbackQuery.message.message_id,
    await buildCommandPermissionsText(groupId),
    await buildCommandPermissionsKeyboard(groupId)
  );

  return true;
}

import { handleCallback } from "../settingsUi.js";
import { handleSettingsCallback } from "../settings/router.js";

export async function runCallbackPipeline(update) {
  const callbackQuery = update.callback_query;
  if (!callbackQuery) return false;

  if (await handleSettingsCallback(callbackQuery)) {
    return true;
  }

  await handleCallback(callbackQuery);
  return true;
}

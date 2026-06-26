import { handleCallback } from "../settingsUi.js";
import { handleSettingsCallback } from "../settings/router.js";
import { handleRulesPreviewCallback } from "../commands/rules.js";

export async function runCallbackPipeline(update) {
  const callbackQuery = update.callback_query;
  if (!callbackQuery) return false;

  const data = callbackQuery.data || "";

  if (data.startsWith("rulespreview:")) {
    return handleRulesPreviewCallback(callbackQuery);
  }

  if (await handleSettingsCallback(callbackQuery)) {
    return true;
  }

  await handleCallback(callbackQuery);
  return true;
}

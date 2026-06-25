import { handleCallback } from "../settingsUi.js";

export async function runCallbackPipeline(update) {
  if (!update.callback_query) return false;

  await handleCallback(update.callback_query);
  return true;
}

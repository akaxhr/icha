import { sendSettings } from "../settingsUi.js";

export async function handleSettings(message) {
  await sendSettings(message);

  return true;
}

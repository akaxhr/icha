import { handleStart } from "./start.js";
import { handlePing } from "./ping.js";
import { handleDebug } from "./debug.js";
import { handleSettings } from "./settings.js";

export async function handleCommands(message, userId, ownerId) {
  const text = (message.text || "").trim();
  if (!text.startsWith("/")) return false;

  const command = text.split(" ")[0].split("@")[0].toLowerCase();

  switch (command) {
    case "/start":
      return await handleStart(message);

    case "/ping":
      return await handlePing(message);

    case "/debugenv":
      return await handleDebug(message, userId, ownerId);

    case "/settings":
      return await handleSettings(message);

    default:
      return false;
  }
}

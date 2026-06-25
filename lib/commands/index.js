import { handleStart } from "./start.js";
import { handlePing } from "./ping.js";
import { handleDebug } from "./debug.js";
import { handleSettings } from "./settings.js";
import { handleHelp } from "./help.js";

const COMMANDS = {
  "/start": handleStart,
  "/ping": handlePing,
  "/debugenv": handleDebug,
  "/settings": handleSettings,
  "/help": handleHelp,
};

export async function handleCommands(message, userId, ownerId) {
  const text = (message.text || "").trim();

  if (!text.startsWith("/")) {
    return false;
  }

  const command = text.split(/\s+/)[0].split("@")[0].toLowerCase();

  const handler = COMMANDS[command];

  if (!handler) {
    return false;
  }

  if (command === "/debugenv") {
    await handler(message, userId, ownerId);
  } else {
    await handler(message);
  }

  return true;
}

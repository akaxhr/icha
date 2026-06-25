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

export async function handleCommands(arg1, arg2, arg3) {
  const ctx = arg1?.message ? arg1 : null;

  const message = ctx ? ctx.message : arg1;
  const userId = ctx ? ctx.userId : arg2;
  const ownerId = ctx ? ctx.ownerId : arg3;

  const text = (message?.text || message?.caption || "").trim();
  if (!text.startsWith("/")) return false;

  const command = text.split(/\s+/)[0].split("@")[0].toLowerCase();
  const handler = COMMANDS[command];

  if (!handler) return false;

  if (command === "/debugenv") {
    await handler(message, userId, ownerId);
  } else {
    await handler(message);
  }

  return true;
}

import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";

const apiId = Number(process.env.API_ID);
const apiHash = process.env.API_HASH;
const sessionString = process.env.SESSION_STRING;

if (!apiId || !apiHash || !sessionString) {
  throw new Error(
    "Missing API_ID, API_HASH, or SESSION_STRING environment variables"
  );
}

const stringSession = new StringSession(sessionString);

export const userClient = new TelegramClient(
  stringSession,
  apiId,
  apiHash,
  {
    connectionRetries: 5,
  }
);

let connected = false;

export async function startUserClient() {
  if (connected) return userClient;

  await userClient.connect();

  const authorized = await userClient.checkAuthorization();

  if (!authorized) {
    throw new Error(
      "Telegram user session is not authorized. Generate a new SESSION_STRING."
    );
  }

  connected = true;

  console.log("✅ Telegram user account connected");

  return userClient;
}

import { saveUserHistory } from "../memory.js";

export async function logUserTextHistory(message, userId, userName, text) {
  if (!text) return;

  await saveUserHistory(userId, userName, "user", text);
}

import {
  getFullGroupSettings,
  saveFullGroupSettings
} from "../groupStore.js";

export async function handleGroupSettingsAdmin(req, res) {
  if (req.method === "GET") {
    const chatId = req.query.chat_id;

    if (!chatId) {
      return res.status(400).json({ error: "chat_id required" });
    }

    const settings = await getFullGroupSettings(chatId);

    return res.status(200).json(settings);
  }

  if (req.method === "POST") {
    const { chat_id, ...patch } = req.body || {};

    if (!chat_id) {
      return res.status(400).json({ error: "chat_id required" });
    }

    const settings = await saveFullGroupSettings(chat_id, patch);

    return res.status(200).json({
      ok: true,
      settings
    });
  }

  return res.status(405).json({ error: "Method not allowed" });
}

import { supabase } from "../supabase.js";
import { sendTelegram } from "../telegram.js";

export async function handleMessagesAdmin(req, res) {
  if (req.method === "GET") {
    const chatId = req.query.chat_id;
    const search = req.query.search || "";

    if (!chatId) {
      return res.status(400).json({ error: "chat_id required" });
    }

    let query = supabase
      .from("bot_messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true })
      .range(0, 5005);

    if (search) {
      query = query.or(`message_text.ilike.%${search}%,username.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) return res.status(500).json({ error: error.message });

    return res.status(200).json({ messages: data || [] });
  }

  if (req.method === "POST") {
    const {
      chat_id,
      text,
      reply_to_message_id,
      reply_to_username,
      reply_to_text
    } = req.body || {};

    if (!chat_id || !text) {
      return res.status(400).json({ error: "chat_id and text required" });
    }

    const result = await sendTelegram(
      chat_id,
      text,
      reply_to_message_id || null,
      "Panel Reply",
      null,
      {
        reply_to_username,
        reply_to_text
      }
    );

    return res.status(200).json({
      ok: true,
      telegram: result
    });
  }

  return res.status(405).json({ error: "Method not allowed" });
}

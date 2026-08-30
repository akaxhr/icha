import { supabase } from "../lib/supabase.js";
import { sendTelegram } from "../lib/telegram.js";

export default async function handler(req, res) {

  // GET messages
  if (req.method === "GET") {
    const chatId = req.query.chat_id;
    const search = req.query.search || "";

    let query = supabase
      .from("bot_messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true })
      .range(0, 5005);

    if (search) {
      query = query.or(
        `message_text.ilike.%${search}%,username.ilike.%${search}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ messages: data });
  }

  // POST message
  if (req.method === "POST") {
    const {
      chat_id,
      text,
      reply_to_message_id,
      reply_to_username,
      reply_to_text
    } = req.body;

    if (!chat_id || !text) {
      return res.status(400).json({
        error: "chat_id and text required"
      });
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

  return res.status(405).json({
    error: "Method not allowed"
  });
}

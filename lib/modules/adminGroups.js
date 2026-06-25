import { supabase } from "../supabase.js";

export async function saveAdminGroup(userId, chat) {
  if (!supabase || !userId || !chat?.id) return;

  await supabase
    .from("admin_groups")
    .upsert(
      {
        user_id: String(userId),
        chat_id: String(chat.id),
        chat_title: chat.title || chat.username || "Unnamed Group",
        chat_type: chat.type,
        updated_at: new Date().toISOString()
      },
      {
        onConflict: "user_id,chat_id"
      }
    );
}

export async function getAdminGroups(userId) {
  if (!supabase || !userId) return [];

  const { data, error } = await supabase
    .from("admin_groups")
    .select("*")
    .eq("user_id", String(userId))
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("getAdminGroups error:", error);
    return [];
  }

  return data || [];
}

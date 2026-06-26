import { supabase } from "../supabase.js";

export async function setPendingAction(userId, groupId, action) {
  if (!supabase) return;

  await supabase.from("pending_actions").upsert({
    user_id: String(userId),
    group_id: String(groupId),
    action,
    created_at: new Date().toISOString()
  });
}

export async function getPendingAction(userId) {
  if (!supabase) return null;

  const { data } = await supabase
    .from("pending_actions")
    .select("*")
    .eq("user_id", String(userId))
    .maybeSingle();

  return data || null;
}

export async function clearPendingAction(userId) {
  if (!supabase) return;

  await supabase
    .from("pending_actions")
    .delete()
    .eq("user_id", String(userId));
}

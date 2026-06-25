import { supabase } from "./supabase.js";
import { getFullGroupSettings, saveFullGroupSettings } from "./groupStore.js";

export async function getDisplayName(userId, fallbackName) {
  try {
    const { data } = await supabase
      .from("user_aliases")
      .select("nickname")
      .eq("user_id", userId)
      .maybeSingle();
    return data?.nickname || fallbackName || "User";
  } catch {
    return fallbackName || "User";
  }
}

export async function getGroupSettings(chatId) {
  return getFullGroupSettings(chatId);
}

export async function updateGroupSettings(chatId, settings) {
  return saveFullGroupSettings(chatId, settings);
}

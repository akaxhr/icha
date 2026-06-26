import { supabase } from "../supabase.js";

export const DEFAULT_COMMAND_PERMISSIONS = {
  staff: "all",
  rules: "staff",
  me: "private",
  translate: "all",
  link: "all"
};

export const PERMISSIONS = {
  none: "❌",
  staff: "👮",
  all: "👥",
  private: "🤖"
};

export async function getCommandPermission(chatId, command) {
  const fallback = DEFAULT_COMMAND_PERMISSIONS[command] || "all";

  if (!supabase) return fallback;

  const { data, error } = await supabase
    .from("command_permissions")
    .select("permission")
    .eq("chat_id", String(chatId))
    .eq("command", command)
    .maybeSingle();

  if (error) {
    console.error("getCommandPermission error:", error);
    return fallback;
  }

  return data?.permission || fallback;
}

export async function setCommandPermission(chatId, command, permission, userId) {
  if (!supabase) return false;

  const { error } = await supabase.from("command_permissions").upsert(
    {
      chat_id: String(chatId),
      command,
      permission,
      updated_by: String(userId || ""),
      updated_at: new Date().toISOString()
    },
    {
      onConflict: "chat_id,command"
    }
  );

  if (error) {
    console.error("setCommandPermission error:", error);
    return false;
  }

  return true;
}

export async function getAllCommandPermissions(chatId) {
  const result = { ...DEFAULT_COMMAND_PERMISSIONS };

  if (!supabase) return result;

  const { data, error } = await supabase
    .from("command_permissions")
    .select("command, permission")
    .eq("chat_id", String(chatId));

  if (error) {
    console.error("getAllCommandPermissions error:", error);
    return result;
  }

  for (const row of data || []) {
    result[row.command] = row.permission;
  }

  return result;
}

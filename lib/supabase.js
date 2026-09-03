import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export async function claimTelegramUpdate(updateId) {
  const { error } = await supabase
    .from("telegram_processed_updates")
    .insert({
      update_id: Number(updateId),
    });

  // Duplicate primary key = this Telegram update was already claimed.
  if (error?.code === "23505") {
    return false;
  }

  if (error) {
    throw error;
  }

  return true;
}

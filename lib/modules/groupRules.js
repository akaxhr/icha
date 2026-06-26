import { supabase } from "../supabase.js";

export async function saveRuleText(groupId, text, userId) {
  await supabase.from("group_rules").upsert({
    chat_id: String(groupId),
    text,
    updated_by: String(userId),
    updated_at: new Date().toISOString()
  });
}

export async function saveRuleMedia(groupId, media, userId) {
  await supabase.from("group_rules").upsert({
    chat_id: String(groupId),
    media_type: media.type,
    media_file_id: media.file_id,
    media_caption: media.caption || null,
    updated_by: String(userId),
    updated_at: new Date().toISOString()
  });
}

export async function saveRuleButtons(groupId, buttons, userId) {
  await supabase.from("group_rules").upsert({
    chat_id: String(groupId),
    buttons_json: buttons,
    updated_by: String(userId),
    updated_at: new Date().toISOString()
  });
}

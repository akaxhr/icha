import { supabase } from "./supabase.js";
import { DEFAULT_SETTINGS, deepMerge } from "./defaultSettings.js";

const memorySettings = new Map();
const warnMemory = new Map();
const noteMemory = new Map();
const filterMemory = new Map();

function safeChatId(chatId) {
  return String(chatId);
}

export async function getFullGroupSettings(chatId) {
  const id = safeChatId(chatId);
  const fallback = memorySettings.get(id) || {};
  try {
    const { data, error } = await supabase
      .from("group_settings")
      .select("*")
      .eq("chat_id", id)
      .maybeSingle();

    if (error) throw error;

    const dbSettings = data?.settings && typeof data.settings === "object" ? data.settings : {};
    const legacy = {
      vault_enabled: data?.vault_enabled,
      ai_enabled: data?.ai_enabled
    };

    return deepMerge(DEFAULT_SETTINGS, deepMerge(fallback, deepMerge(dbSettings, legacy)));
  } catch (err) {
    console.error("getFullGroupSettings fallback:", err.message);
    return deepMerge(DEFAULT_SETTINGS, fallback);
  }
}

export async function saveFullGroupSettings(chatId, patch) {
  const id = safeChatId(chatId);
  const current = await getFullGroupSettings(id);
  const next = deepMerge(current, patch || {});
  memorySettings.set(id, next);

  try {
    const { error } = await supabase.from("group_settings").upsert({
      chat_id: id,
      vault_enabled: next.vault_enabled,
      ai_enabled: next.ai_enabled,
      settings: next,
      updated_at: new Date().toISOString()
    });
    if (error) throw error;
  } catch (err) {
    console.error("saveFullGroupSettings fallback:", err.message);
  }
  return next;
}

export async function toggleSetting(chatId, path) {
  const settings = await getFullGroupSettings(chatId);
  let ref = settings;
  for (let i = 0; i < path.length - 1; i++) ref = ref[path[i]];
  const key = path[path.length - 1];
  ref[key] = !ref[key];
  await saveFullGroupSettings(chatId, settings);
  return ref[key];
}

export async function addWarning(chatId, userId, reason, actorId = null) {
  const key = `${chatId}:${userId}`;
  const arr = warnMemory.get(key) || [];
  arr.push({ reason: reason || "No reason", actorId, at: new Date().toISOString() });
  warnMemory.set(key, arr);
  try {
    await supabase.from("warning_events").insert({
      chat_id: String(chatId),
      user_id: String(userId),
      actor_id: actorId ? String(actorId) : null,
      reason: reason || "No reason"
    });
  } catch (err) {
    console.error("warning_events insert fallback:", err.message);
  }
  return arr.length;
}

export async function getWarnings(chatId, userId) {
  const key = `${chatId}:${userId}`;
  let list = warnMemory.get(key) || [];
  try {
    const { data, error } = await supabase
      .from("warning_events")
      .select("reason, actor_id, created_at")
      .eq("chat_id", String(chatId))
      .eq("user_id", String(userId))
      .order("created_at", { ascending: true });
    if (!error && data?.length) list = data.map(x => ({ reason: x.reason, actorId: x.actor_id, at: x.created_at }));
  } catch {}
  return list;
}

export async function clearWarnings(chatId, userId) {
  warnMemory.delete(`${chatId}:${userId}`);
  try {
    await supabase.from("warning_events").delete().eq("chat_id", String(chatId)).eq("user_id", String(userId));
  } catch (err) {
    console.error("warning_events delete fallback:", err.message);
  }
}

export async function setNote(chatId, name, body) {
  const key = String(chatId);
  const notes = noteMemory.get(key) || {};
  notes[String(name).toLowerCase()] = body;
  noteMemory.set(key, notes);
  const s = await getFullGroupSettings(chatId);
  s.notes = { ...(s.notes || {}), [String(name).toLowerCase()]: body };
  await saveFullGroupSettings(chatId, s);
}

export async function getNote(chatId, name) {
  const s = await getFullGroupSettings(chatId);
  return s.notes?.[String(name).toLowerCase()] || noteMemory.get(String(chatId))?.[String(name).toLowerCase()] || null;
}

export async function listNotes(chatId) {
  const s = await getFullGroupSettings(chatId);
  return Object.keys(s.notes || noteMemory.get(String(chatId)) || {});
}

export async function setFilter(chatId, trigger, reply) {
  const s = await getFullGroupSettings(chatId);
  s.filters = { ...(s.filters || {}), [String(trigger).toLowerCase()]: reply };
  filterMemory.set(String(chatId), s.filters);
  await saveFullGroupSettings(chatId, s);
}

export async function matchFilter(chatId, text) {
  const s = await getFullGroupSettings(chatId);
  const filters = s.filters || filterMemory.get(String(chatId)) || {};
  const lower = String(text || "").toLowerCase();
  for (const [trigger, reply] of Object.entries(filters)) {
    if (trigger && lower.includes(trigger.toLowerCase())) return reply;
  }
  return null;
}

export async function listFilters(chatId) {
  const s = await getFullGroupSettings(chatId);
  return Object.keys(s.filters || filterMemory.get(String(chatId)) || {});
}

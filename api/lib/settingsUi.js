import { answerCallbackQuery, editTelegram, escapeHtml, isAdmin, sendTelegram } from "./telegram.js";
import { getFullGroupSettings, saveFullGroupSettings, toggleSetting } from "./groupStore.js";

const callbackMap = {
  ai_master: ["ai", "enabled"],
  ai_phishing: ["ai", "phishing", "enabled"],
  ai_scam: ["ai", "scam", "enabled"],
  ai_toxic: ["ai", "toxicity", "enabled"],
  ai_impersonation: ["ai", "impersonation", "enabled"],
  ai_nsfw: ["ai", "nsfw", "enabled"],
  ai_summary: ["ai", "summary", "enabled"],
  ai_auto_phishing: ["ai", "phishing", "auto_action"],
  ai_auto_scam: ["ai", "scam", "auto_action"],
  ai_auto_toxic: ["ai", "toxicity", "auto_action"],
  spam_enabled: ["spam", "enabled"],
  welcome_enabled: ["welcome", "enabled"],
  captcha_enabled: ["captcha", "enabled"],
  psst_enabled: ["psst", "enabled"]
};

function mark(v) { return v ? "✅" : "❌"; }
function getAt(obj, path) { return path.reduce((a,k) => a?.[k], obj); }

export function mainSettingsKeyboard(chatId, s) {
  return { inline_keyboard: [
    [{ text: `🌹 Welcome ${mark(s.welcome?.enabled)}`, callback_data: `set:${chatId}:welcome` }, { text: `🚨 Spam ${mark(s.spam?.enabled)}`, callback_data: `toggle:${chatId}:spam_enabled` }],
    [{ text: `🤖 AI ${mark(s.ai?.enabled)}`, callback_data: `set:${chatId}:ai` }, { text: `🔐 Captcha ${mark(s.captcha?.enabled)}`, callback_data: `toggle:${chatId}:captcha_enabled` }],
    [{ text: "🔒 Locks", callback_data: `set:${chatId}:locks` }, { text: "⚠️ Warns", callback_data: `set:${chatId}:warns` }],
    [{ text: "📜 Rules", callback_data: `set:${chatId}:rules` }, { text: `🤫 PSST ${mark(s.psst?.enabled)}`, callback_data: `toggle:${chatId}:psst_enabled` }]
  ]};
}

function aiKeyboard(chatId, s) {
  const ai = s.ai || {};
  return { inline_keyboard: [
    [{ text: `Master AI ${mark(ai.enabled)}`, callback_data: `toggle:${chatId}:ai_master` }],
    [{ text: `Phishing ${mark(ai.phishing?.enabled)}`, callback_data: `toggle:${chatId}:ai_phishing` }, { text: `Auto ${mark(ai.phishing?.auto_action)}`, callback_data: `toggle:${chatId}:ai_auto_phishing` }],
    [{ text: `Scam ${mark(ai.scam?.enabled)}`, callback_data: `toggle:${chatId}:ai_scam` }, { text: `Auto ${mark(ai.scam?.auto_action)}`, callback_data: `toggle:${chatId}:ai_auto_scam` }],
    [{ text: `Toxicity ${mark(ai.toxicity?.enabled)}`, callback_data: `toggle:${chatId}:ai_toxic` }, { text: `Auto ${mark(ai.toxicity?.auto_action)}`, callback_data: `toggle:${chatId}:ai_auto_toxic` }],
    [{ text: `Impersonation ${mark(ai.impersonation?.enabled)}`, callback_data: `toggle:${chatId}:ai_impersonation` }, { text: `NSFW ${mark(ai.nsfw?.enabled)}`, callback_data: `toggle:${chatId}:ai_nsfw` }],
    [{ text: `AI Summary ${mark(ai.summary?.enabled)}`, callback_data: `toggle:${chatId}:ai_summary` }],
    [{ text: "⬅ Back", callback_data: `set:${chatId}:main` }]
  ]};
}

function locksKeyboard(chatId, s) {
  const names = Object.keys(s.locks || {});
  const rows = [];
  for (let i = 0; i < names.length; i += 2) {
    rows.push(names.slice(i, i+2).map(name => ({ text: `${name} ${mark(s.locks[name])}`, callback_data: `lock:${chatId}:${name}` })));
  }
  rows.push([{ text: "⬅ Back", callback_data: `set:${chatId}:main` }]);
  return { inline_keyboard: rows };
}

function pageText(page, chatId, s) {
  if (page === "ai") return `🤖 <b>AI Settings</b>\nGroup: <code>${escapeHtml(chatId)}</code>\n\nEvery AI feature is OFF/ON separately. Auto means delete+warn; without auto, Icha only alerts/reviews.`;
  if (page === "locks") return `🔒 <b>Locks</b>\nTap a type to toggle. Locked content is deleted/warned for normal members.`;
  if (page === "warns") return `⚠️ <b>Warn Settings</b>\nLimit: ${s.warns?.limit}\nAction: ${escapeHtml(s.warns?.action)}\n\nCommands: /setwarnlimit 3, /setwarnaction mute|kick|ban`;
  if (page === "rules") return `📜 <b>Rules</b>\n\n${escapeHtml(s.rules?.text)}\n\nUse /setrules your rules text`;
  if (page === "welcome") return `🌹 <b>Welcome</b> ${mark(s.welcome?.enabled)}\n\n${escapeHtml(s.welcome?.message)}\n\nUse /setwelcome your welcome text`;
  return `⚙️ <b>Icha Group Settings</b>\nGroup: <code>${escapeHtml(chatId)}</code>\n\nChoose a section.`;
}

function keyboardFor(page, chatId, s) {
  if (page === "ai") return aiKeyboard(chatId, s);
  if (page === "locks") return locksKeyboard(chatId, s);
  if (["warns", "rules", "welcome"].includes(page)) return { inline_keyboard: [[{ text: "⬅ Back", callback_data: `set:${chatId}:main` }]] };
  return mainSettingsKeyboard(chatId, s);
}

export async function sendSettings(message) {
  const chatId = message.chat.id;
  if (!(await isAdmin(chatId, message.from.id))) {
    await sendTelegram(chatId, "Only admins can open settings.", message.message_id);
    return;
  }
  const s = await getFullGroupSettings(chatId);
  const pm = await sendTelegram(message.from.id, pageText("main", chatId, s), null, "Icha Settings", mainSettingsKeyboard(chatId, s));
  if (!pm.ok) {
    await sendTelegram(chatId, "⚙️ Please open my private chat and press Start first, then use /settings again.", message.message_id);
  } else {
    await sendTelegram(chatId, "⚙️ I sent the settings panel in your private chat.", message.message_id);
  }
}

export async function handleCallback(callback) {
  const data = String(callback.data || "");
  const parts = data.split(":");
  if (parts.length < 3) return false;
  const [kind, chatId, key] = parts;
  if (!["set", "toggle", "lock"].includes(kind)) return false;

  if (!(await isAdmin(chatId, callback.from.id))) {
    await answerCallbackQuery(callback.id, "Only group admins can change this.");
    return true;
  }

  let s = await getFullGroupSettings(chatId);
  let page = "main";
  if (kind === "toggle") {
    const path = callbackMap[key];
    if (path) await toggleSetting(chatId, path);
    s = await getFullGroupSettings(chatId);
    page = key.startsWith("ai_") ? "ai" : "main";
    await answerCallbackQuery(callback.id, `Changed: ${key}`);
  } else if (kind === "lock") {
    s.locks[key] = !s.locks[key];
    await saveFullGroupSettings(chatId, s);
    await answerCallbackQuery(callback.id, `${key} ${s.locks[key] ? "locked" : "unlocked"}`);
    page = "locks";
  } else {
    page = key;
    await answerCallbackQuery(callback.id, "Opened");
  }

  await editTelegram(callback.message.chat.id, callback.message.message_id, pageText(page, chatId, s), keyboardFor(page, chatId, s));
  return true;
}

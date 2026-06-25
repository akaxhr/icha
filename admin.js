import { applyTemplate } from "./defaultSettings.js";
import { getFullGroupSettings, getNote, listFilters, listNotes, matchFilter, saveFullGroupSettings, setFilter, setNote } from "./groupStore.js";
import { escapeHtml, isAdmin, kickUser, restrictUser, sendTelegram, userMention } from "./telegram.js";

const captchaChallenges = new Map();

export async function handleJoinLeave(message) {
  const chatId = message.chat.id;
  const s = await getFullGroupSettings(chatId);

  if (message.new_chat_members?.length) {
    for (const member of message.new_chat_members) {
      if (member.is_bot) continue;
      if (s.captcha?.enabled) {
        const a = Math.floor(Math.random() * 8) + 2;
        const b = Math.floor(Math.random() * 8) + 2;
        captchaChallenges.set(`${chatId}:${member.id}`, { answer: String(a + b), until: Date.now() + (s.captcha.timeout_minutes || 3) * 60000 });
        await restrictUser(chatId, member.id, (s.captcha.timeout_minutes || 3) * 60);
        await sendTelegram(chatId, `🔐 ${userMention(member)}, solve this to speak: <b>${a} + ${b} = ?</b>\nReply with /verify answer`);
      } else if (s.welcome?.enabled) {
        await sendTelegram(chatId, applyTemplate(s.welcome.message, { ...member, chat_title: message.chat.title }));
      }
    }
    return true;
  }

  if (message.left_chat_member && s.welcome?.goodbye_enabled) {
    await sendTelegram(chatId, applyTemplate(s.welcome.goodbye_message, { ...message.left_chat_member, chat_title: message.chat.title }));
    return true;
  }
  return false;
}

export async function handleVerify(message) {
  const text = String(message.text || "").trim();
  if (!text.startsWith("/verify")) return false;
  const chatId = message.chat.id;
  const key = `${chatId}:${message.from.id}`;
  const ch = captchaChallenges.get(key);
  if (!ch) {
    await sendTelegram(chatId, "No pending captcha for you.", message.message_id);
    return true;
  }
  const answer = text.split(/\s+/)[1];
  if (Date.now() > ch.until || answer !== ch.answer) {
    await sendTelegram(chatId, "Wrong or expired captcha.", message.message_id);
    return true;
  }
  captchaChallenges.delete(key);
  const { unrestrictUser } = await import("./telegram.js");
  await unrestrictUser(chatId, message.from.id);
  await sendTelegram(chatId, `✅ Verified ${userMention(message.from)}.`, message.message_id);
  return true;
}

export async function handleGroupCommand(message) {
  const chatId = message.chat.id;
  const text = String(message.text || "").trim();
  const [cmdRaw, ...args] = text.split(/\s+/);
  const cmd = cmdRaw.split("@")[0].toLowerCase();

  if (cmd === "/ichahelp" || cmd === "/help") {
    await sendTelegram(chatId, `🌹 <b>Icha Help</b>\n\n<b>Admin</b>\n/settings - private settings panel\n/welcome on|off\n/setwelcome text\n/setrules text\n/lock type, /unlock type, /locks\n/warn, /unwarn, /warnings\n/mute, /unmute, /ban, /unban, /kick\n/setwarnlimit 3\n/setwarnaction mute|kick|ban\n/filter trigger | reply\n/note name | text\n\n<b>Members</b>\n/rules\n/get note\n/notes\n/psst message\n/rose`, message.message_id);
    return true;
  }

  if (cmd === "/rules") {
    const s = await getFullGroupSettings(chatId);
    await sendTelegram(chatId, s.rules?.text || "No rules set.", message.message_id);
    return true;
  }

  if (cmd === "/rose") {
    await sendTelegram(chatId, "🌹 Icha has Rose-style moderation: warns, locks, filters, notes, rules, captcha, antispam, and private admin settings.", message.message_id);
    return true;
  }

  if (cmd === "/psst") {
    const s = await getFullGroupSettings(chatId);
    if (!s.psst?.enabled) return sendTelegram(chatId, "PSST is disabled here.", message.message_id), true;
    const body = args.join(" ").slice(0, s.psst.max_length || 500);
    if (!body) return sendTelegram(chatId, "Usage: /psst your secret message", message.message_id), true;
    await sendTelegram(chatId, `🤫 <b>Psst...</b>\n\n${escapeHtml(body)}`);
    return true;
  }

  if (cmd === "/get") {
    const name = args[0];
    if (!name) return sendTelegram(chatId, "Usage: /get note_name", message.message_id), true;
    const note = await getNote(chatId, name);
    await sendTelegram(chatId, note || "Note not found.", message.message_id);
    return true;
  }

  if (cmd === "/notes") {
    const notes = await listNotes(chatId);
    await sendTelegram(chatId, notes.length ? `📝 Notes:\n${notes.map(n => `• ${escapeHtml(n)}`).join("\n")}` : "No notes saved.", message.message_id);
    return true;
  }

  if (cmd === "/filters") {
    const filters = await listFilters(chatId);
    await sendTelegram(chatId, filters.length ? `🔎 Filters:\n${filters.map(n => `• ${escapeHtml(n)}`).join("\n")}` : "No filters saved.", message.message_id);
    return true;
  }

  const adminCommands = ["/welcome","/setwelcome","/setrules","/note","/filter","/captcha","/spam","/ai","/aisettings"];
  if (!adminCommands.includes(cmd)) return false;
  if (!(await isAdmin(chatId, message.from.id))) {
    await sendTelegram(chatId, "Only admins can use this.", message.message_id);
    return true;
  }

  const s = await getFullGroupSettings(chatId);
  if (cmd === "/welcome") {
    const value = args[0]?.toLowerCase();
    if (!["on","off"].includes(value)) return sendTelegram(chatId, "Usage: /welcome on|off", message.message_id), true;
    s.welcome.enabled = value === "on";
    await saveFullGroupSettings(chatId, s);
    await sendTelegram(chatId, `Welcome ${s.welcome.enabled ? "enabled" : "disabled"}.`, message.message_id);
    return true;
  }
  if (cmd === "/setwelcome") {
    const body = text.replace(/^\/setwelcome(@\w+)?\s*/i, "").trim();
    if (!body) return sendTelegram(chatId, "Usage: /setwelcome Welcome {first_name} to {chat_title}", message.message_id), true;
    s.welcome.message = body;
    await saveFullGroupSettings(chatId, s);
    await sendTelegram(chatId, "Welcome message saved.", message.message_id);
    return true;
  }
  if (cmd === "/setrules") {
    const body = text.replace(/^\/setrules(@\w+)?\s*/i, "").trim();
    if (!body) return sendTelegram(chatId, "Usage: /setrules rules text", message.message_id), true;
    s.rules.text = body;
    await saveFullGroupSettings(chatId, s);
    await sendTelegram(chatId, "Rules saved.", message.message_id);
    return true;
  }
  if (cmd === "/note") {
    const body = text.replace(/^\/note(@\w+)?\s*/i, "");
    const [name, ...rest] = body.split("|").map(x => x.trim());
    if (!name || !rest.join("|").trim()) return sendTelegram(chatId, "Usage: /note name | note text", message.message_id), true;
    await setNote(chatId, name, rest.join("|").trim());
    await sendTelegram(chatId, `Note saved: ${escapeHtml(name)}`, message.message_id);
    return true;
  }
  if (cmd === "/filter") {
    const body = text.replace(/^\/filter(@\w+)?\s*/i, "");
    const [trigger, ...rest] = body.split("|").map(x => x.trim());
    if (!trigger || !rest.join("|").trim()) return sendTelegram(chatId, "Usage: /filter trigger | reply text", message.message_id), true;
    await setFilter(chatId, trigger, rest.join("|").trim());
    await sendTelegram(chatId, `Filter saved: ${escapeHtml(trigger)}`, message.message_id);
    return true;
  }
  if (cmd === "/captcha") {
    const value = args[0]?.toLowerCase();
    if (!["on","off"].includes(value)) return sendTelegram(chatId, "Usage: /captcha on|off", message.message_id), true;
    s.captcha.enabled = value === "on";
    await saveFullGroupSettings(chatId, s);
    await sendTelegram(chatId, `Captcha ${s.captcha.enabled ? "enabled" : "disabled"}.`, message.message_id);
    return true;
  }
  if (cmd === "/spam") {
    const value = args[0]?.toLowerCase();
    if (!["on","off"].includes(value)) return sendTelegram(chatId, "Usage: /spam on|off", message.message_id), true;
    s.spam.enabled = value === "on";
    await saveFullGroupSettings(chatId, s);
    await sendTelegram(chatId, `Spam control ${s.spam.enabled ? "enabled" : "disabled"}.`, message.message_id);
    return true;
  }
  if (cmd === "/ai" || cmd === "/aisettings") {
    const value = args[0]?.toLowerCase();
    if (["on","off"].includes(value)) {
      s.ai.enabled = value === "on";
      await saveFullGroupSettings(chatId, s);
      await sendTelegram(chatId, `AI moderation ${s.ai.enabled ? "enabled" : "disabled"}.`, message.message_id);
    } else {
      await sendTelegram(chatId, "Use /settings for full private AI toggles, or /ai on/off.", message.message_id);
    }
    return true;
  }
  return false;
}

export async function handleAutoFilter(message) {
  const reply = await matchFilter(message.chat.id, message.text || message.caption || "");
  if (reply) {
    await sendTelegram(message.chat.id, reply, message.message_id);
    return true;
  }
  return false;
}

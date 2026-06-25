import { addWarning, clearWarnings, getFullGroupSettings, getWarnings, saveFullGroupSettings } from "./groupStore.js";
import { banUser, deleteTelegramMessage, escapeHtml, isAdmin, kickUser, restrictUser, sendTelegram, unbanUser, unrestrictUser, userMention } from "./telegram.js";

const spamCache = new Map();

function targetFromMessage(message) {
  const parts = String(message.text || "").trim().split(/\s+/);
  const replyUser = message.reply_to_message?.from;
  if (replyUser) return { userId: replyUser.id, label: userMention(replyUser), reason: parts.slice(1).join(" ") };
  const raw = parts[1];
  if (!raw) return null;
  const id = raw.replace(/^@/, "");
  if (/^-?\d+$/.test(id)) return { userId: Number(id), label: escapeHtml(raw), reason: parts.slice(2).join(" ") };
  return { username: id, label: escapeHtml(raw), reason: parts.slice(2).join(" ") };
}

function parseDuration(raw, fallbackSeconds = 3600) {
  if (!raw) return fallbackSeconds;
  const m = String(raw).match(/^(\d+)(s|m|h|d)?$/i);
  if (!m) return fallbackSeconds;
  const n = Number(m[1]);
  const unit = (m[2] || "m").toLowerCase();
  if (unit === "s") return n;
  if (unit === "h") return n * 3600;
  if (unit === "d") return n * 86400;
  return n * 60;
}

export async function checkLocksAndSpam(message, settings) {
  const text = message.text || message.caption || "";
  const chatId = message.chat.id;
  const userId = message.from?.id;
  if (!userId || await isAdmin(chatId, userId)) return null;

  const locks = settings.locks || {};
  const hasLink = /(https?:\/\/|www\.|t\.me\/|telegram\.me\/)/i.test(text);
  const hasEmail = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text);
  const hasPhone = /(?:\+?\d[\d\s().-]{7,}\d)/.test(text);
  const mentionCount = (text.match(/@\w+/g) || []).length;

  if (locks.links && hasLink) return { reason: "Links are locked", delete: true, warn: true };
  if (locks.emails && hasEmail) return { reason: "Emails are locked", delete: true, warn: true };
  if (locks.phones && hasPhone) return { reason: "Phone numbers are locked", delete: true, warn: true };
  if (locks.mentions && mentionCount > 0) return { reason: "Mentions are locked", delete: true, warn: true };
  if (locks.forwards && message.forward_origin) return { reason: "Forwarded messages are locked", delete: true, warn: true };
  if (locks.stickers && message.sticker) return { reason: "Stickers are locked", delete: true, warn: true };
  if (locks.gifs && message.animation) return { reason: "GIFs are locked", delete: true, warn: true };
  if (locks.photos && message.photo) return { reason: "Photos are locked", delete: true, warn: true };
  if (locks.videos && message.video) return { reason: "Videos are locked", delete: true, warn: true };
  if (locks.voice && (message.voice || message.video_note)) return { reason: "Voice/video notes are locked", delete: true, warn: true };
  if (locks.documents && message.document) return { reason: "Files are locked", delete: true, warn: true };
  if (locks.contacts && message.contact) return { reason: "Contacts are locked", delete: true, warn: true };
  if (locks.locations && (message.location || message.venue)) return { reason: "Locations are locked", delete: true, warn: true };
  if (locks.polls && message.poll) return { reason: "Polls are locked", delete: true, warn: true };
  if (locks.bots && message.new_chat_members?.some(u => u.is_bot)) return { reason: "Adding bots is locked", delete: false, warn: false };
  if (locks.commands && text.startsWith("/")) return { reason: "Commands are locked", delete: true, warn: false };

  const spam = settings.spam || {};
  if (!spam.enabled || !text) return null;

  const now = Date.now();
  const key = `${chatId}:${userId}`;
  const list = (spamCache.get(key) || []).filter(x => now - x.time < 10000);
  list.push({ text, time: now });
  spamCache.set(key, list);

  const linkCount = (text.match(/https?:\/\/|www\.|t\.me\//gi) || []).length;
  const sameCount = list.filter(x => x.text === text).length;
  const letters = text.replace(/[^A-Za-z]/g, "");
  const caps = letters ? (letters.replace(/[^A-Z]/g, "").length / letters.length) * 100 : 0;

  if (linkCount >= (spam.link_limit ?? 2)) return { reason: "Too many links", delete: true, warn: true };
  if (mentionCount >= (spam.mention_limit ?? 8)) return { reason: "Mention spam", delete: true, warn: true };
  if (list.length >= (spam.max_messages_10s ?? 6)) return { reason: "Flooding messages", delete: true, warn: true };
  if (sameCount >= (spam.repeated_text_limit ?? 3)) return { reason: "Repeated message spam", delete: true, warn: true };
  if (letters.length > 20 && caps >= (spam.uppercase_limit ?? 85)) return { reason: "Uppercase spam", delete: true, warn: true };

  return null;
}

export async function applyViolation(message, violation) {
  const chatId = message.chat.id;
  const userId = message.from?.id;
  if (violation.delete) await deleteTelegramMessage(chatId, message.message_id);
  if (violation.warn && userId) {
    const settings = await getFullGroupSettings(chatId);
    const count = await addWarning(chatId, userId, violation.reason, "auto");
    const limit = settings.warns?.limit ?? 3;
    if (count >= limit) {
      if (settings.warns?.action === "ban") await banUser(chatId, userId);
      else if (settings.warns?.action === "kick") await kickUser(chatId, userId);
      else await restrictUser(chatId, userId, (settings.warns?.mute_minutes ?? 60) * 60);
      await clearWarnings(chatId, userId);
      await sendTelegram(chatId, `🛡 ${userMention(message.from)} reached ${limit}/${limit} warns. Action applied: ${escapeHtml(settings.warns?.action || "mute")}.`);
    } else {
      await sendTelegram(chatId, `⚠️ ${userMention(message.from)} warned.\nReason: ${escapeHtml(violation.reason)}\nWarnings: ${count}/${limit}`);
    }
  }
}

export async function handleModerationCommand(message) {
  const chatId = message.chat.id;
  const text = String(message.text || "").trim();
  const [cmdRaw, ...args] = text.split(/\s+/);
  const cmd = cmdRaw.split("@")[0].toLowerCase();
  const adminNeeded = ["/warn","/unwarn","/warnings","/mute","/unmute","/ban","/unban","/kick","/lock","/unlock","/locks","/setwarnlimit","/setwarnaction","/purge"];
  if (!adminNeeded.includes(cmd)) return false;
  if (!(await isAdmin(chatId, message.from.id))) {
    await sendTelegram(chatId, "Only admins can use this.", message.message_id);
    return true;
  }

  if (cmd === "/locks") {
    const s = await getFullGroupSettings(chatId);
    const lines = Object.entries(s.locks || {}).map(([k,v]) => `${v ? "✅" : "❌"} ${k}`);
    await sendTelegram(chatId, `🔒 Locks\n\n${lines.join("\n")}`, message.message_id);
    return true;
  }

  if (cmd === "/lock" || cmd === "/unlock") {
    const type = args[0]?.toLowerCase();
    const s = await getFullGroupSettings(chatId);
    if (!type || !(type in (s.locks || {}))) {
      await sendTelegram(chatId, `Usage: ${cmd} links|forwards|stickers|gifs|photos|videos|voice|documents|contacts|locations|polls|bots|commands|mentions|emails|phones`, message.message_id);
      return true;
    }
    s.locks[type] = cmd === "/lock";
    await saveFullGroupSettings(chatId, s);
    await sendTelegram(chatId, `${s.locks[type] ? "🔒 Locked" : "🔓 Unlocked"}: ${escapeHtml(type)}`, message.message_id);
    return true;
  }

  if (cmd === "/setwarnlimit") {
    const n = Math.max(1, Math.min(20, Number(args[0]) || 3));
    const s = await getFullGroupSettings(chatId);
    s.warns.limit = n;
    await saveFullGroupSettings(chatId, s);
    await sendTelegram(chatId, `Warn limit set to ${n}.`, message.message_id);
    return true;
  }

  if (cmd === "/setwarnaction") {
    const action = args[0]?.toLowerCase();
    if (!["mute","kick","ban"].includes(action)) {
      await sendTelegram(chatId, "Usage: /setwarnaction mute|kick|ban", message.message_id);
      return true;
    }
    const s = await getFullGroupSettings(chatId);
    s.warns.action = action;
    await saveFullGroupSettings(chatId, s);
    await sendTelegram(chatId, `Warn action set to ${action}.`, message.message_id);
    return true;
  }

  const target = targetFromMessage(message);
  if (!target?.userId && !["/warnings"].includes(cmd)) {
    await sendTelegram(chatId, `Reply to a user or give numeric user id.`, message.message_id);
    return true;
  }

  if (cmd === "/warn") {
    const reason = target.reason || "No reason";
    const count = await addWarning(chatId, target.userId, reason, message.from.id);
    const s = await getFullGroupSettings(chatId);
    await sendTelegram(chatId, `⚠️ ${target.label} warned.\nReason: ${escapeHtml(reason)}\nWarnings: ${count}/${s.warns.limit}`, message.message_id);
    return true;
  }

  if (cmd === "/unwarn") {
    await clearWarnings(chatId, target.userId);
    await sendTelegram(chatId, `Warnings cleared for ${target.label}.`, message.message_id);
    return true;
  }

  if (cmd === "/warnings") {
    const t = target || { userId: message.from.id, label: userMention(message.from) };
    const list = await getWarnings(chatId, t.userId);
    await sendTelegram(chatId, `${t.label} has ${list.length} warning(s).\n${list.map((w,i)=>`${i+1}. ${escapeHtml(w.reason)}`).join("\n") || "No warnings."}`, message.message_id);
    return true;
  }

  if (cmd === "/mute") {
    const seconds = parseDuration(args[1], 3600);
    await restrictUser(chatId, target.userId, seconds);
    await sendTelegram(chatId, `🔇 Muted ${target.label}.`, message.message_id);
    return true;
  }
  if (cmd === "/unmute") {
    await unrestrictUser(chatId, target.userId);
    await sendTelegram(chatId, `🔊 Unmuted ${target.label}.`, message.message_id);
    return true;
  }
  if (cmd === "/ban") {
    await banUser(chatId, target.userId);
    await sendTelegram(chatId, `⛔ Banned ${target.label}.`, message.message_id);
    return true;
  }
  if (cmd === "/unban") {
    await unbanUser(chatId, target.userId);
    await sendTelegram(chatId, `✅ Unbanned ${target.label}.`, message.message_id);
    return true;
  }
  if (cmd === "/kick") {
    await kickUser(chatId, target.userId);
    await sendTelegram(chatId, `👢 Kicked ${target.label}.`, message.message_id);
    return true;
  }
  if (cmd === "/purge") {
    const fromId = message.reply_to_message?.message_id;
    if (!fromId) {
      await sendTelegram(chatId, "Reply to the first message to purge from, then send /purge.", message.message_id);
      return true;
    }
    let deleted = 0;
    for (let id = fromId; id <= message.message_id; id++) {
      const r = await deleteTelegramMessage(chatId, id);
      if (r.ok) deleted++;
    }
    await sendTelegram(chatId, `🧹 Purged ${deleted} messages.`);
    return true;
  }
  return false;
}

import { sendTelegram } from "../telegram.js";
import { getGroupRules } from "../modules/groupRules.js";
import { getAdminGroups } from "../modules/adminGroups.js";
import { canUseCommand } from "../commandPermissions/check.js";

function groupSelectorKeyboard(groups) {
  return {
    inline_keyboard: groups.map((g) => [
      {
        text: g.chat_title || String(g.chat_id),
        callback_data: `rulespreview:${g.chat_id}`
      }
    ])
  };
}

async function sendRulesPreview(chatId, replyToMessageId, rules, groupTitle = null) {
  if (!rules?.text && !rules?.media_file_id) {
    await sendTelegram(
      chatId,
      groupTitle
        ? `👀 <b>Full preview</b>\n\nGroup: <b>${groupTitle}</b>\n\nNo regulation set.`
        : "No regulation set.",
      replyToMessageId
    );
    return true;
  }

  const header = groupTitle
    ? `👀 <b>Full preview</b>\n\nGroup: <b>${groupTitle}</b>\n\n`
    : "";

  await sendTelegram(
    chatId,
    `${header}${rules.text || rules.media_caption || "📜 Group rules"}`,
    replyToMessageId,
    null,
    rules.buttons_json?.length ? { inline_keyboard: rules.buttons_json } : null
  );

  return true;
}

export async function handleRulesCommand(message) {
  if (message.chat.type === "private") {
    const groups = await getAdminGroups(message.from?.id);

    if (!groups.length) {
      await sendTelegram(
        message.chat.id,
        "No group connected yet. Send /settings inside your group first.",
        message.message_id
      );
      return true;
    }

    if (groups.length === 1) {
      const rules = await getGroupRules(groups[0].chat_id);
      return sendRulesPreview(
        message.chat.id,
        message.message_id,
        rules,
        groups[0].chat_title || groups[0].chat_id
      );
    }

    await sendTelegram(
      message.chat.id,
      "👀 <b>Select group to preview regulations</b>",
      message.message_id,
      null,
      groupSelectorKeyboard(groups)
    );

    return true;
  }

  if (!(await canUseCommand(message, "rules"))) {
    return true;
  }

  const rules = await getGroupRules(message.chat.id);
  return sendRulesPreview(message.chat.id, message.message_id, rules);
}
export async function handleRulesPreviewCallback(callbackQuery) {
  const groupId = callbackQuery.data.replace("rulespreview:", "");
  const rules = await getGroupRules(groupId);

  await sendRulesPreview(
    callbackQuery.message.chat.id,
    callbackQuery.message.message_id,
    rules,
    groupId
  );

  return true;
}

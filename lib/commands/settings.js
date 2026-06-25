import { sendTelegram } from "../telegram.js";
import { sendSettings } from "../settingsUi.js";
import { saveAdminGroup, getAdminGroups } from "../modules/adminGroups.js";

function groupListKeyboard(groups) {
  return {
    inline_keyboard: [
      ...groups.map((g) => [
        {
          text: g.chat_title || String(g.chat_id),
          callback_data: `settings:group:${g.chat_id}`
        }
      ]),
      [
        {
          text: "🔄 Refresh",
          callback_data: "settings:refresh"
        },
        {
          text: "❌ Close",
          callback_data: "settings:close"
        }
      ]
    ]
  };
}

export async function handleSettings(message) {
  const chat = message.chat;
  const userId = message.from?.id;

  if (chat.type === "private") {
    const groups = await getAdminGroups(userId);

    if (!groups.length) {
      await sendTelegram(
        chat.id,
        `⚙️ <b>Manage group Settings</b>

👉 Select the group whose settings you want to change.

If a group in which you are an administrator doesn't appear here:
• Send /settings in the group and try again
• Then come back here and press /settings`,
        message.message_id
      );
      return true;
    }

    await sendTelegram(
      chat.id,
      `⚙️ <b>Manage group Settings</b>

👉 Select the group whose settings you want to change.`,
      message.message_id,
      null,
      groupListKeyboard(groups)
    );

    return true;
  }

  if (chat.type === "group" || chat.type === "supergroup") {
    await saveAdminGroup(userId, chat);

    await sendTelegram(
      chat.id,
      `⚙️ Settings ready.

Open Icha in private chat and send /settings to manage this group.`,
      message.message_id
    );

    return true;
  }

  await sendSettings(message);
  return true;
}

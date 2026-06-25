import { handleCallback } from "../settingsUi.js";
import { sendTelegram } from "../telegram.js";
import { getAdminGroups } from "./adminGroups.js";

async function answerCallback(callbackQuery, text = "") {
  const token = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN;
  if (!token) return;

  await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      callback_query_id: callbackQuery.id,
      text,
      show_alert: false
    })
  });
}

async function editMessage(chatId, messageId, text, replyMarkup) {
  const token = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN;
  if (!token) return;

  await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: "HTML",
      reply_markup: replyMarkup
    })
  });
}

function settingsHomeKeyboard(groupId) {
  return {
    inline_keyboard: [
      [
        { text: "📜 Regulation", callback_data: `settings:page:${groupId}:rules` },
        { text: "🚫 Anti-Spam", callback_data: `settings:page:${groupId}:spam` }
      ],
      [
        { text: "💬 Welcome", callback_data: `settings:page:${groupId}:welcome` },
        { text: "🌊 Anti-Flood", callback_data: `settings:page:${groupId}:flood` }
      ],
      [
        { text: "🧠 Captcha", callback_data: `settings:page:${groupId}:captcha` },
        { text: "🤖 AI", callback_data: `settings:page:${groupId}:ai` }
      ],
      [
        { text: "❗ Warns", callback_data: `settings:page:${groupId}:warns` },
        { text: "🔗 Link", callback_data: `settings:page:${groupId}:links` }
      ],
      [
        { text: "🗑 Deleting Messages", callback_data: `settings:page:${groupId}:delete` }
      ],
      [
        { text: "⬅️ Back", callback_data: "settings:refresh" },
        { text: "✅ Close", callback_data: "settings:close" }
      ]
    ]
  };
}

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
        { text: "🔄 Refresh", callback_data: "settings:refresh" },
        { text: "❌ Close", callback_data: "settings:close" }
      ]
    ]
  };
}

async function handleSettingsCallback(callbackQuery) {
  const data = callbackQuery.data || "";
  const privateChatId = callbackQuery.message.chat.id;
  const messageId = callbackQuery.message.message_id;
  const userId = callbackQuery.from?.id;

  if (data === "settings:close") {
    await answerCallback(callbackQuery, "Closed");
    await editMessage(privateChatId, messageId, "✅ Closed.", { inline_keyboard: [] });
    return true;
  }

  if (data === "settings:refresh") {
    const groups = await getAdminGroups(userId);

    await answerCallback(callbackQuery, "Refreshed");

    await editMessage(
      privateChatId,
      messageId,
      `⚙️ <b>Manage group Settings</b>

👉 Select the group whose settings you want to change.`,
      groupListKeyboard(groups)
    );

    return true;
  }

  if (data.startsWith("settings:group:")) {
    const groupId = data.replace("settings:group:", "");

    await answerCallback(callbackQuery, "Opening settings");

    await editMessage(
      privateChatId,
      messageId,
      `⚙️ <b>SETTINGS</b>

Group: <code>${groupId}</code>

<i>Select one of the settings that you want to change.</i>`,
      settingsHomeKeyboard(groupId)
    );

    return true;
  }

  if (data.startsWith("settings:page:")) {
    const [, , groupId, page] = data.split(":");

    await answerCallback(callbackQuery, page);

    await editMessage(
      privateChatId,
      messageId,
      `⚙️ <b>${page.toUpperCase()} SETTINGS</b>

Group: <code>${groupId}</code>

This page is connected. Next we add toggles here.`,
      {
        inline_keyboard: [
          [
            { text: "✅ Turn on", callback_data: `settings:toggle:${groupId}:${page}:on` },
            { text: "❌ Turn off", callback_data: `settings:toggle:${groupId}:${page}:off` }
          ],
          [
            { text: "⬅️ Back", callback_data: `settings:group:${groupId}` }
          ]
        ]
      }
    );

    return true;
  }

  if (data.startsWith("settings:toggle:")) {
    await answerCallback(callbackQuery, "Toggle coming next");
    return true;
  }

  return false;
}

export async function runCallbackPipeline(update) {
  const callbackQuery = update.callback_query;
  if (!callbackQuery) return false;

  if ((callbackQuery.data || "").startsWith("settings:")) {
    return await handleSettingsCallback(callbackQuery);
  }

  await handleCallback(callbackQuery);
  return true;
}

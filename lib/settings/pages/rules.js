import { answerCallback, editMessage } from "../telegramUi.js";

function cancelKeyboard(groupId) {
  return {
    inline_keyboard: [
      [{ text: "🚫 Remove message", callback_data: `settings:rules:${groupId}:remove_message` }],
      [{ text: "❌ Cancel", callback_data: `settings:rules:${groupId}:customize` }]
    ]
  };
}

function buttonsKeyboard(groupId) {
  return {
    inline_keyboard: [
      [{
  text: "⚡ Create buttons easily",
  web_app: {
    url: `https://iecha.acarthub.com/button-builder.html?group_id=${groupId}&type=rules`
  }
}],
      [{ text: "🚫 Remove Keyboard", callback_data: `settings:rules:${groupId}:remove_keyboard` }],
      [{ text: "❌ Cancel", callback_data: `settings:rules:${groupId}:customize` }]
    ]
  };
}

export async function handleRulesPage(callbackQuery, groupId) {
  const data = callbackQuery.data || "";
  const action = data.split(":")[3];

  if (action === "customize") return handleRulesCustomize(callbackQuery, groupId);
  if (action === "text") return handleRulesText(callbackQuery, groupId);
  if (action === "media") return handleRulesMedia(callbackQuery, groupId);
  if (action === "buttons") return handleRulesButtons(callbackQuery, groupId);

  await answerCallback(callbackQuery, "Regulation");

  await editMessage(
    callbackQuery.message.chat.id,
    callbackQuery.message.message_id,
    `📜 <b>Group's regulations</b>
From this menu you can manage the group's regulations, that will be shown with the command /rules.

<i>To edit who can use the /rules command, go to the "Commands permissions" section.</i>`,
    {
      inline_keyboard: [
        [{ text: "✍🏻 Customize message", callback_data: `settings:rules:${groupId}:customize` }],
        [{ text: "🕹 Commands Permissions", callback_data: `settings:rules:${groupId}:permissions` }],
        [{ text: "Back", callback_data: `settings:group:${groupId}` }]
      ]
    }
  );

  return true;
}

async function handleRulesCustomize(callbackQuery, groupId) {
  await answerCallback(callbackQuery, "Customize message");

  await editMessage(
    callbackQuery.message.chat.id,
    callbackQuery.message.message_id,
    `📜 <b>Regulation</b>

📄 Text ❌
🌉 Media ❌
🔠 Url Buttons ❌

👉 Use the buttons below to choose what you want to set`,
    {
      inline_keyboard: [
        [
          { text: "📄 Text", callback_data: `settings:rules:${groupId}:text` },
          { text: "👀 See", callback_data: `settings:rules:${groupId}:see_text` }
        ],
        [
          { text: "🌉 Media", callback_data: `settings:rules:${groupId}:media` },
          { text: "👀 See", callback_data: `settings:rules:${groupId}:see_media` }
        ],
        [
          { text: "🔠 Url Buttons", callback_data: `settings:rules:${groupId}:buttons` },
          { text: "👀 See", callback_data: `settings:rules:${groupId}:see_buttons` }
        ],
        [{ text: "👀 Full preview", callback_data: `settings:rules:${groupId}:preview` }],
        [{ text: "Back", callback_data: `settings:page:${groupId}:rules` }]
      ]
    }
  );

  return true;
}

async function handleRulesText(callbackQuery, groupId) {
  await answerCallback(callbackQuery, "Set text");

  await editMessage(
    callbackQuery.message.chat.id,
    callbackQuery.message.message_id,
    `👉 <b>Send now the message you want to set.</b>
<i>You can send it already formatted or use HTML.</i>`,
    cancelKeyboard(groupId)
  );

  return true;
}

async function handleRulesMedia(callbackQuery, groupId) {
  await answerCallback(callbackQuery, "Set media");

  await editMessage(
    callbackQuery.message.chat.id,
    callbackQuery.message.message_id,
    `👉 <b>Send now the media</b> (photos, videos, stickers...) you want to set.
<i>You can also enter a caption.</i>`,
    cancelKeyboard(groupId)
  );

  return true;
}

async function handleRulesButtons(callbackQuery, groupId) {
  await answerCallback(callbackQuery, "Set URL buttons");

  await editMessage(
    callbackQuery.message.chat.id,
    callbackQuery.message.message_id,
    `👉 <b>Set the buttons to be placed under the message</b>

Send a message structured as follows:

• <b>Add a single button:</b>
<code>Button title - t.me/LinkExample</code>

• <b>Add multiple buttons on a single line:</b>
<code>Button title - t.me/LinkExample && Button text - t.me/LinkExample</code>

• <b>Add multiple rows of buttons:</b>
<code>Button title - t.me/LinkExample
Button title - t.me/LinkExample</code>

<b>Special buttons</b>
• Add a button that shows a popup:
<code>Button title - popup: Popup text</code>

or

<code>Button title - alert: Popup text</code>`,
    buttonsKeyboard(groupId)
  );

  return true;
}

import { answerCallback, editMessage } from "../telegramUi.js";
import { getGroupRules } from "../../modules/groupRules.js";
import { setPendingAction } from "../../modules/pendingActions.js";

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
      [
        {
          text: "⚡ Create buttons easily",
          web_app: {
            url: `https://iecha.acarthub.com/button-builder.html?group_id=${groupId}&type=rules`
          }
        }
      ],
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

  if (action === "see_text") return handleSeeText(callbackQuery, groupId);
if (action === "see_media") return handleSeeMedia(callbackQuery, groupId);
if (action === "see_buttons") return handleSeeButtons(callbackQuery, groupId);
if (action === "preview") return handleFullPreview(callbackQuery, groupId);

  if (action === "remove_message") return handleRemoveMessage(callbackQuery, groupId);
  if (action === "remove_keyboard") return handleRemoveKeyboard(callbackQuery, groupId);

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

  const rules = await getGroupRules(groupId);

const textStatus = rules.text ? "✅" : "❌";
const mediaStatus = rules.media_file_id ? "✅" : "❌";
const buttonStatus = rules.buttons_json?.length ? "✅" : "❌";

  await editMessage(
    callbackQuery.message.chat.id,
    callbackQuery.message.message_id,
    `📜 <b>Regulation</b>
    
📄 Text ${textStatus}
🖼 Media ${mediaStatus}
🔠 Url Buttons ${buttonStatus}

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
  await setPendingAction(callbackQuery.from.id, groupId, "rules_text");

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
  await setPendingAction(callbackQuery.from.id, groupId, "rules_media");

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
  await setPendingAction(callbackQuery.from.id, groupId, "rules_buttons");

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

<code>Button title - alert: Popup text</code>

• Add a button with a link to the group rules:
<code>Button title - rules</code>

• Add a share button:
<code>Button title - share: Text to be shared</code>

• Add a button with copyable text:
<code>Button title - copy: Text copied on click</code>`,
    buttonsKeyboard(groupId)
  );

  return true;
}

async function showMissing(callbackQuery, groupId, msg) {
  await answerCallback(callbackQuery, msg);

  await editMessage(
    callbackQuery.message.chat.id,
    callbackQuery.message.message_id,
    `⚠️ ${msg}`,
    {
      inline_keyboard: [
        [{ text: "Back", callback_data: `settings:rules:${groupId}:customize` }]
      ]
    }
  );

  return true;
}

async function handleRemoveMessage(callbackQuery, groupId) {
  await answerCallback(callbackQuery, "Message removed");
  return handleRulesCustomize(callbackQuery, groupId);
}

async function handleRemoveKeyboard(callbackQuery, groupId) {
  await answerCallback(callbackQuery, "Keyboard removed");
  return handleRulesCustomize(callbackQuery, groupId);
}

async function handleSeeText(callbackQuery, groupId) {
  const rules = await getGroupRules(groupId);

  if (!rules.text) {
    return showMissing(callbackQuery, groupId, "No regulation text set.");
  }

  await answerCallback(callbackQuery, "Text preview");

  await editMessage(
    callbackQuery.message.chat.id,
    callbackQuery.message.message_id,
    `📄 <b>Regulation text</b>

${rules.text}`,
    {
      inline_keyboard: [
        [{ text: "Back", callback_data: `settings:rules:${groupId}:customize` }]
      ]
    }
  );

  return true;
}

async function handleSeeMedia(callbackQuery, groupId) {
  const rules = await getGroupRules(groupId);

  if (!rules.media_file_id) {
    return showMissing(callbackQuery, groupId, "No regulation media set.");
  }

  await answerCallback(callbackQuery, "Media is set");

  await editMessage(
    callbackQuery.message.chat.id,
    callbackQuery.message.message_id,
    `🌉 <b>Regulation media</b>

Type: <code>${rules.media_type || "unknown"}</code>
File ID: <code>${rules.media_file_id}</code>

Caption:
${rules.media_caption || "No caption"}`,
    {
      inline_keyboard: [
        [{ text: "Back", callback_data: `settings:rules:${groupId}:customize` }]
      ]
    }
  );

  return true;
}

async function handleSeeButtons(callbackQuery, groupId) {
  const rules = await getGroupRules(groupId);

  if (!rules.buttons_json?.length) {
    return showMissing(callbackQuery, groupId, "No URL buttons set.");
  }

  await answerCallback(callbackQuery, "Buttons preview");

  const pretty = JSON.stringify(rules.buttons_json, null, 2);

  await editMessage(
    callbackQuery.message.chat.id,
    callbackQuery.message.message_id,
    `🔠 <b>URL buttons</b>

<pre>${pretty}</pre>`,
    {
      inline_keyboard: [
        [{ text: "Back", callback_data: `settings:rules:${groupId}:customize` }]
      ]
    }
  );

  return true;
}

async function handleFullPreview(callbackQuery, groupId) {
  const rules = await getGroupRules(groupId);

  if (!rules.text && !rules.media_file_id) {
    return showMissing(callbackQuery, groupId, "No regulation preview available yet.");
  }

  await answerCallback(callbackQuery, "Full preview");

  const previewText = rules.text || rules.media_caption || "📜 Group rules";

  await editMessage(
    callbackQuery.message.chat.id,
    callbackQuery.message.message_id,
    `👀 <b>Full preview</b>

${previewText}`,
    {
      inline_keyboard: [
        ...(rules.buttons_json || []),
        [{ text: "Back", callback_data: `settings:rules:${groupId}:customize` }]
      ]
    }
  );

  return true;
}

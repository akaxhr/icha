import { answerCallback, editMessage } from "../telegramUi.js";

export async function handleRulesPage(callbackQuery, groupId) {
  await answerCallback(callbackQuery, "Regulation");

  await editMessage(
    callbackQuery.message.chat.id,
    callbackQuery.message.message_id,
    `📜 <b>Group's regulations</b>
From this menu you can manage the group's regulations, that will be shown with the command /rules.

<i>To edit who can use the /rules command, go to the "Commands permissions" section.</i>`,
    {
      inline_keyboard: [
        [
          {
            text: "✍🏻 Customize message",
            callback_data: `settings:rules:${groupId}:customize`
          }
        ],
        [
          {
            text: "🕹 Commands Permissions",
            callback_data: `settings:rules:${groupId}:permissions`
          }
        ],
        [
          {
            text: "Back",
            callback_data: `settings:group:${groupId}`
          }
        ]
      ]
    }
  );

  return true;
}

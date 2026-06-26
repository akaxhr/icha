import { sendTelegram } from "../telegram.js";
import { getPendingAction, clearPendingAction } from "./pendingActions.js";
import {
  saveRuleText,
  saveRuleMedia,
  saveRuleButtons
} from "./groupRules.js";

function backKeyboard(groupId) {
  return {
    inline_keyboard: [
      [
        {
          text: "⬅️ Back",
          callback_data: `settings:rules:${groupId}:customize`
        }
      ]
    ]
  };
}

function parseButtons(text) {
  return text
    .split("\n")
    .map(row =>
      row
        .split("&&")
        .map(part => {
          const [title, value] = part.split(" - ").map(x => x?.trim());

          if (!title || !value) return null;

          if (
            value.startsWith("popup:") ||
            value.startsWith("alert:")
          ) {
            return {
              text: title,
              callback_data: value
            };
          }

          return {
            text: title,
            url: value.startsWith("http")
              ? value
              : `https://${value}`
          };
        })
        .filter(Boolean)
    )
    .filter(r => r.length);
}

function extractMedia(message) {
  if (message.photo?.length) {
    return {
      type: "photo",
      file_id: message.photo.at(-1).file_id,
      caption: message.caption || ""
    };
  }

  if (message.video) {
    return {
      type: "video",
      file_id: message.video.file_id,
      caption: message.caption || ""
    };
  }

  if (message.animation) {
    return {
      type: "animation",
      file_id: message.animation.file_id,
      caption: message.caption || ""
    };
  }

  if (message.document) {
    return {
      type: "document",
      file_id: message.document.file_id,
      caption: message.caption || ""
    };
  }

  if (message.sticker) {
    return {
      type: "sticker",
      file_id: message.sticker.file_id,
      caption: ""
    };
  }

  return null;
}

export async function handleSettingsInput(message, userId) {
  if (message.chat.type !== "private") return false;

  const pending = await getPendingAction(userId);

  if (!pending) return false;

  if (pending.action === "rules_text") {
    const text = message.text || message.caption || "";

    if (!text) {
      await sendTelegram(
        message.chat.id,
        "❌ Send the regulation text.",
        message.message_id
      );
      return true;
    }

    await saveRuleText(
      pending.group_id,
      text,
      userId
    );

    await clearPendingAction(userId);

    await sendTelegram(
      message.chat.id,
      "✅ Regulation text updated.",
      message.message_id,
      null,
      backKeyboard(pending.group_id)
    );

    return true;
  }

  if (pending.action === "rules_media") {
    const media = extractMedia(message);

    if (!media) {
      await sendTelegram(
        message.chat.id,
        "❌ Send a photo, video, sticker, GIF or document.",
        message.message_id
      );
      return true;
    }

    await saveRuleMedia(
      pending.group_id,
      media,
      userId
    );

    await clearPendingAction(userId);

    await sendTelegram(
      message.chat.id,
      "✅ Regulation media updated.",
      message.message_id,
      null,
      backKeyboard(pending.group_id)
    );

    return true;
  }

  if (pending.action === "rules_buttons") {
    const text = message.text || "";

    if (!text) {
      await sendTelegram(
        message.chat.id,
        "❌ Send button syntax.",
        message.message_id
      );
      return true;
    }

    const buttons = parseButtons(text);

    if (!buttons.length) {
      await sendTelegram(
        message.chat.id,
        "❌ Invalid button format.",
        message.message_id
      );
      return true;
    }

    await saveRuleButtons(
      pending.group_id,
      buttons,
      userId
    );

    await clearPendingAction(userId);

    await sendTelegram(
      message.chat.id,
      "✅ Regulation URL buttons updated.",
      message.message_id,
      null,
      backKeyboard(pending.group_id)
    );

    return true;
  }

  return false;
}

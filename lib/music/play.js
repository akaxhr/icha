import { playMusic } from "../musicWorker.js";
import {
  sendTelegram,
  deleteTelegramMessage,
} from "../telegram.js";

export async function playCommand(
  chatId,
  messageId,
  text,
  sendTelegramFn = sendTelegram
) {
  const query = text
    .replace(/^\/play\s*/i, "")
    .trim();

  if (!query) {
    await sendTelegramFn(
      chatId,
      "🎵 What should I play?",
      messageId
    );

    return;
  }

  // ─────────────────────────────────────
  // Loading message
  // ─────────────────────────────────────

  const loading = await sendTelegramFn(
    chatId,
    `🔎 <b>SEARCHING</b>\n\n` +
    `🎵 <b>${escapeHtml(query)}</b>\n\n` +
    `⏳ Finding the best audio stream...`
  );

  const loadingMessageId =
    loading?.result?.message_id;

  try {
    // ─────────────────────────────────────
    // Ask music worker to prepare/play
    // ─────────────────────────────────────

    const result = await playMusic(
      chatId,
      query
    );

    // ─────────────────────────────────────
    // Delete loading message
    // ─────────────────────────────────────

    if (loadingMessageId) {
      await deleteTelegramMessage(
        chatId,
        loadingMessageId
      );
    }

    // ─────────────────────────────────────
    // NOW PLAYING
    // ─────────────────────────────────────

    if (result.status === "playing") {
      const song = result.song;

      await sendTelegramFn(
        chatId,
        buildNowPlaying(song),
        null,
        "Music"
      );

      return;
    }

    // ─────────────────────────────────────
    // QUEUED
    // ─────────────────────────────────────

    if (result.status === "queued") {
      const song = result.song;

      await sendTelegramFn(
        chatId,
        `📥 <b>ADDED TO QUEUE</b>\n\n` +
        `🎵 <b>${escapeHtml(song.title)}</b>\n` +
        `> ⏳ Waiting for the current song to finish.`,
        null,
        "Music"
      );

      return;
    }

    // ─────────────────────────────────────
    // UNKNOWN RESPONSE
    // ─────────────────────────────────────

    await sendTelegramFn(
      chatId,
      `❌ ${
        escapeHtml(
          result.message ||
          "Couldn't play that."
        )
      }`,
      null,
      "Music"
    );

  } catch (error) {
    console.error(
      "❌ /play command failed:",
      error
    );

    // Always remove loading message
    if (loadingMessageId) {
      try {
        await deleteTelegramMessage(
          chatId,
          loadingMessageId
        );
      } catch (deleteError) {
        console.error(
          "❌ Failed to delete loading message:",
          deleteError
        );
      }
    }

    await sendTelegramFn(
      chatId,
      `❌ <b>Couldn't play that</b>\n\n` +
      `Try another song or search phrase.`,
      null,
      "Music"
    );
  }
}


// ═══════════════════════════════════════════════
// NOW PLAYING CARD
// ═══════════════════════════════════════════════

function buildNowPlaying(song) {
  const duration =
    formatDuration(song.duration);

  return (
    `🎧 <b>NOW PLAYING</b>\n\n` +
    `🎵 <b>${escapeHtml(song.title)}</b>\n` +
    `👤 <i>${escapeHtml(song.artist)}</i>\n\n` +
    `━━━━━━━━━━━━━━\n` +
    `▶️ 00:00 ━━━━━━━━━ ${duration}\n\n` +
    `> 🎶 Music is playing...`
  );
}


// ═══════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════

function formatDuration(seconds) {
  seconds = Number(seconds) || 0;

  const minutes =
    Math.floor(seconds / 60);

  const remaining =
    seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(
    remaining
  ).padStart(2, "0")}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

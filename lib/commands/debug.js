import { sendTelegram } from "../telegram.js";

export async function handleDebug(message, userId, ownerId) {
  if (userId !== ownerId) return true;

  const msg = `🔧 Env

Token: ${
    process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN ? "✅" : "❌"
  }

Supabase URL: ${
    process.env.SUPABASE_URL ? "✅" : "❌"
  }

Supabase Key: ${
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY
      ? "✅"
      : "❌"
  }

Gemini: ${
    process.env.GEMINI_API_KEY ? "✅" : "❌"
  }`;

  await sendTelegram(message.chat.id, msg, message.message_id);

  return true;
}

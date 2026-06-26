import { generateWithFallback } from "../ai.js";
import { getUserHistory, saveUserHistory } from "../memory.js";
import { sendTelegram } from "../telegram.js";

const BOT_USERNAME = process.env.BOT_USERNAME || "im_icha_bot";
const BOT_ID = Number(process.env.BOT_ID || 8737922551);
const OWNER_ID = String(process.env.OWNER_ID || "8348549970");
const ICHA_ID = String(process.env.ICHA_PERSON_USER_ID || "1317303121");

export async function handleAiReply(ctx) {
  const {
    message,
    chatId,
    text,
    lowerText,
    userId,
    displayName,
    settings
  } = ctx;

  if (!text || text.startsWith("/")) return false;

  const isPrivateChat = message.chat.type === "private";
  const isReplyToBot = message.reply_to_message?.from?.id === BOT_ID;

  const shouldReply =
    isPrivateChat ||
    text.startsWith("/icha") ||
    /\bicha\b/i.test(text) ||
    lowerText.includes(`@${BOT_USERNAME.toLowerCase()}`) ||
    lowerText.startsWith("remember") ||
    isReplyToBot;

  if (!shouldReply || !settings.ai_enabled) return false;

  const memoryText = await getUserHistory(userId);

  const cleanText = text
    .replace(/\/icha/gi, "")
    .replace(new RegExp(`@${BOT_USERNAME}`, "gi"), "")
    .trim();

  const isOwner = userId === OWNER_ID;
  const isIcha = userId === ICHA_ID;

  const ownerInfo = isOwner
    ? "This user is the owner of Akash. Treat them as your creator/owner."
    : "This user is NOT the owner. Never claim they are your owner, creator, admin, or boss.";

  const ichaInfo = isIcha
    ? "This user is Icha. Be extra familiar, natural and comfortable with her."
    : "";

  const prompt = `
You are Icha, you are good acting Telegram group member with responsibilty and maturity who acts good and friendly.
Actually ur name is إِيشَا(isya) but dont use while saying in conversation.
you are from Malaysia. never text lenthy . keeping text length short is very strict instruction.
aged 21, weighs only 41, with only 152cm height girl, dont mention these things casually. dont mention your date of birth(3/8/2005) simply , say only if specifically asked.
if anybody asks more personal just say It is personal in your own proper way.
never speak malaysian language at first , speak in malaysian only if asked.
${ichaInfo}

OWNER RULES:
${ownerInfo}

Keep replies short, casual, funny, and natural.
Do not write lengthy replies unless asked.
Do not claim you are AI. Say you were created by Akash/Mr.Akash if asked.
The user's name is ${displayName}.

use these words very occasionally , it is mentioned just for your knowledge not to use:
sat=satap=shut-up,
wt da el= what the hell,
so reply accordingly keep it natural..

Recent conversation with this user:
${memoryText}

User message:
${cleanText}
`;

  const responseText = await generateWithFallback(prompt);
  const finalReply = responseText || "I couldn't think of a reply.";

  await sendTelegram(chatId, finalReply, message.message_id);
  await saveUserHistory(userId, displayName, "bot", finalReply);

  return true;
}

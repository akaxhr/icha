# Icha Telegram Bot - GroupHelp/Rose Style JS Build

This ZIP is a Vercel-safe JavaScript bot build based on your current `icha-main` project.

## Added

- GroupHelp-style welcome/rules/settings
- Rose-style moderation: warns, mute, ban, kick, locks, filters, notes
- PSST command
- Spam/flood/link/mention/uppercase detection
- Basic math captcha for new members
- Private admin settings panel with inline buttons
- Web admin panel settings toggles
- AI moderation settings: master, phishing, scam, toxicity, impersonation, NSFW, summary
- AI moderation is OFF by default and each AI category is independently toggleable per group
- Vercel-safe API layout with fewer than 12 serverless endpoints

## Main commands

### Admin

```text
/settings
/welcome on|off
/setwelcome Welcome {first_name} to {chat_title}
/setrules your rules
/captcha on|off
/spam on|off
/ai on|off
/lock links
/unlock links
/locks
/warn
/unwarn
/warnings
/mute
/unmute
/ban
/unban
/kick
/setwarnlimit 3
/setwarnaction mute|kick|ban
/note name | note text
/filter trigger | reply text
```

### Members

```text
/rules
/notes
/get note_name
/filters
/psst secret message
/rose
/ichahelp
```

## Vercel environment variables

```text
TELEGRAM_BOT_TOKEN=your_bot_token
BOT_USERNAME=im_icha_bot
BOT_ID=8737922551
OWNER_ID=8348549970
ICHA_PERSON_USER_ID=1317303121
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=optional_for_ai_replies
TELEGRAM_WEBHOOK_SECRET=optional_but_recommended
ADMIN_PASSWORD=optional_for_web_panel
```

## Webhook setup

```text
https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook?url=https://YOUR_DOMAIN.vercel.app/api/webhook
```

If using `TELEGRAM_WEBHOOK_SECRET`, set webhook using POST with `secret_token`.

## Supabase migration

Run `supabase_schema.sql` in Supabase SQL Editor. The bot still has safe fallbacks, but settings persistence works best after running the schema.

## Notes

- Telegram must make the bot admin for delete/mute/ban/captcha/locks to work.
- Admin private settings require the admin to open/start the bot in private chat first.
- AI moderation does not auto-delete unless each category's Auto toggle is enabled in the private settings panel.
- Group chat AI replies still use `ai_enabled`; AI moderation uses the separate `ai.*` settings tree.

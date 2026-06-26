export function groupListKeyboard(groups) {
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

export function settingsHomeKeyboard(groupId) {
  return {
    inline_keyboard: [
      [
        { text: "📜 Regulation", callback_data: `settings:page:${groupId}:rules` },
        { text: "🗳 Anti-Spam", callback_data: `settings:page:${groupId}:spam` }
      ],
      [
        { text: "💬 Welcome", callback_data: `settings:page:${groupId}:welcome` },
        { text: "🌊 Anti-Flood", callback_data: `settings:page:${groupId}:flood` }
      ],
      [
        { text: "👋 Goodbye", callback_data: `settings:page:${groupId}:goodbye` },
        { text: "🕉 Alphabets", callback_data: `settings:page:${groupId}:alphabets` }
      ],
      [
        { text: "🧠 Captcha", callback_data: `settings:page:${groupId}:captcha` },
        { text: "🖊 Checks", callback_data: `settings:page:${groupId}:checks` }
      ],
      [
        { text: "🆘 @Admin", callback_data: `settings:page:${groupId}:admin` },
        { text: "🔐 Blocks", callback_data: `settings:page:${groupId}:blocks` }
      ],
      [
        { text: "📸 Media", callback_data: `settings:page:${groupId}:media` },
        { text: "🔞 Porn", callback_data: `settings:page:${groupId}:porn` }
      ],
      [
        { text: "❗ Warns", callback_data: `settings:page:${groupId}:warns` },
        { text: "🌘 Night", callback_data: `settings:page:${groupId}:night` }
      ],
      [
        { text: "🔔 Tag", callback_data: `settings:page:${groupId}:tag` },
        { text: "🔗 Link", callback_data: `settings:page:${groupId}:links` }
      ],
      [
        { text: "🧑‍✈️ Guardian Bot 🆕", callback_data: `settings:page:${groupId}:guardian` }
      ],
      [
        { text: "📬 Approval mode", callback_data: `settings:page:${groupId}:approval` }
      ],
      [
        { text: "🗑 Deleting Messages", callback_data: `settings:page:${groupId}:delete` }
      ],
      [
        { text: "🇬🇧 Lang", callback_data: `settings:page:${groupId}:lang` },
        { text: "✅ Close", callback_data: "settings:close" },
        { text: "▶️ Other", callback_data: `settings:page:${groupId}:other` }
      ]
    ]
  };
}
export function settingPageKeyboard(groupId, page) {
  return {
    inline_keyboard: [
      [
        { text: "✅ Turn on", callback_data: `settings:toggle:${groupId}:${page}:on` },
        { text: "❌ Turn off", callback_data: `settings:toggle:${groupId}:${page}:off` }
      ],
      [
        { text: "⬅️ Back", callback_data: `settings:group:${groupId}` }
      ]
    ]
  };
}

export function otherSettingsKeyboard(groupId) {
  return {
    inline_keyboard: [
      [{ text: "🧵 Topic", callback_data: `settings:page:${groupId}:topic` }],
      [{ text: "🔤 Banned Words", callback_data: `settings:page:${groupId}:bannedwords` }],
      [{ text: "🕘 Recurring messages", callback_data: `settings:page:${groupId}:recurring` }],
      [{ text: "👥 Members Management", callback_data: `settings:page:${groupId}:members` }],
      [{ text: "🐥 Masked users", callback_data: `settings:page:${groupId}:masked` }],
      [{ text: "📣 Discussion group 🆕", callback_data: `settings:page:${groupId}:discussion` }],
      [{ text: "📱 Personal Commands", callback_data: `settings:page:${groupId}:personal` }],
      [{ text: "🎭 Magic Stickers&GIFs", callback_data: `settings:page:${groupId}:magic` }],
      [{ text: "📏 Message length", callback_data: `settings:page:${groupId}:length` }],
      [{ text: "📢 Channels management 🆕", callback_data: `settings:page:${groupId}:channels` }],
      [
        { text: "🖊 Permissions", callback_data: `settings:page:${groupId}:permissions` },
        { text: "🔍 Log Channel", callback_data: `settings:page:${groupId}:logs` }
      ],
      [
        { text: "◀️ Back", callback_data: `settings:group:${groupId}` },
        { text: "✅ Close", callback_data: "settings:close" },
        { text: "🇬🇧 Lang", callback_data: `settings:page:${groupId}:lang` }
      ]
    ]
  };
}

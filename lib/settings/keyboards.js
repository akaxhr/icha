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
        { text: "🚫 Anti-Spam", callback_data: `settings:page:${groupId}:spam` }
      ],
      [
        { text: "💬 Welcome", callback_data: `settings:page:${groupId}:welcome` },
        { text: "👋 Goodbye", callback_data: `settings:page:${groupId}:goodbye` }
      ],
      [
        { text: "🌊 Anti-Flood", callback_data: `settings:page:${groupId}:flood` },
        { text: "🧠 Captcha", callback_data: `settings:page:${groupId}:captcha` }
      ],
      [
        { text: "✅ Checks", callback_data: `settings:page:${groupId}:checks` },
        { text: "👮 Admin", callback_data: `settings:page:${groupId}:admin` }
      ],
      [
        { text: "🚷 Blocks", callback_data: `settings:page:${groupId}:blocks` },
        { text: "🖼 Media", callback_data: `settings:page:${groupId}:media` }
      ],
      [
        { text: "🔞 Porn", callback_data: `settings:page:${groupId}:porn` },
        { text: "❗ Warns", callback_data: `settings:page:${groupId}:warns` }
      ],
      [
        { text: "🌙 Night Mode", callback_data: `settings:page:${groupId}:night` },
        { text: "🏷 Tag", callback_data: `settings:page:${groupId}:tag` }
      ],
      [
        { text: "🛡 Guardian", callback_data: `settings:page:${groupId}:guardian` },
        { text: "✅ Approval Mode", callback_data: `settings:page:${groupId}:approval` }
      ],
      [
        { text: "🗑 Delete Messages", callback_data: `settings:page:${groupId}:delete` },
        { text: "🧵 Topic", callback_data: `settings:page:${groupId}:topic` }
      ],
      [
        { text: "🚫 Banned Words", callback_data: `settings:page:${groupId}:bannedwords` },
        { text: "🔁 Recurring", callback_data: `settings:page:${groupId}:recurring` }
      ],
      [
        { text: "👥 Members", callback_data: `settings:page:${groupId}:members` },
        { text: "👤 Personal Cmds", callback_data: `settings:page:${groupId}:personal` }
      ],
      [
        { text: "🔐 Permissions", callback_data: `settings:page:${groupId}:permissions` },
        { text: "📢 Log Channel", callback_data: `settings:page:${groupId}:logs` }
      ],
      [
        { text: "🤖 AI", callback_data: `settings:page:${groupId}:ai` },
        { text: "🔗 Links", callback_data: `settings:page:${groupId}:links` }
      ],
      [
        { text: "⬅️ Back", callback_data: "settings:back" },
        { text: "✅ Close", callback_data: "settings:close" }
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

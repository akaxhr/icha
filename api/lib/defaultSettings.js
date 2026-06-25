export const DEFAULT_SETTINGS = Object.freeze({
  vault_enabled: true,
  ai_enabled: true,
  welcome: {
    enabled: true,
    goodbye_enabled: false,
    message: "🌹 Welcome {first_name} to {chat_title}!\n\nUse /rules to know the group rules.",
    goodbye_message: "Goodbye {first_name}."
  },
  rules: {
    text: "📜 Group Rules:\n\n1. No spam\n2. No abuse\n3. Respect everyone\n4. No unwanted links"
  },
  spam: {
    enabled: true,
    max_messages_10s: 6,
    repeated_text_limit: 3,
    link_limit: 2,
    mention_limit: 8,
    uppercase_limit: 85,
    action: "delete_warn"
  },
  locks: {
    links: false,
    forwards: false,
    stickers: false,
    gifs: false,
    photos: false,
    videos: false,
    voice: false,
    documents: false,
    contacts: false,
    locations: false,
    polls: false,
    bots: false,
    commands: false,
    mentions: false,
    emails: false,
    phones: false
  },
  warns: {
    limit: 3,
    action: "mute",
    mute_minutes: 60
  },
  captcha: {
    enabled: false,
    mode: "math",
    timeout_minutes: 3,
    action: "kick"
  },
  notes: {},
  filters: {},
  psst: {
    enabled: true,
    admin_trace: true,
    max_length: 500
  },
  ai: {
    enabled: false,
    phishing: { enabled: false, threshold: 0.9, auto_action: false },
    scam: { enabled: false, threshold: 0.88, auto_action: false },
    toxicity: { enabled: false, threshold: 0.85, auto_action: false },
    impersonation: { enabled: false, threshold: 0.92, auto_action: false },
    nsfw: { enabled: false, text_enabled: true, image_enabled: false, threshold: 0.9, auto_action: false },
    summary: { enabled: false, schedule: "daily", send_to: "private_admins" },
    default_action: "log_only",
    review_mode: true
  }
});

export function deepMerge(base, extra) {
  if (!extra || typeof extra !== "object") return structuredClone(base);
  const out = Array.isArray(base) ? [...base] : { ...base };
  for (const [key, value] of Object.entries(extra)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      out[key] = deepMerge(base?.[key] && typeof base[key] === "object" ? base[key] : {}, value);
    } else if (value !== undefined) {
      out[key] = value;
    }
  }
  return out;
}

export function applyTemplate(template, data = {}) {
  return String(template || "")
    .replaceAll("{first_name}", data.first_name || "User")
    .replaceAll("{username}", data.username ? `@${data.username}` : data.first_name || "User")
    .replaceAll("{chat_title}", data.chat_title || "this group")
    .replaceAll("{id}", String(data.id || ""));
}

let selectedChatId = null;
let selectedChatTitle = null;
let replyToMessageId = null;
let replyToName = null;

async function api(path, options = {}) {
  options.headers = {
    ...(options.headers || {}),
    "Content-Type": "application/json"
  };

  const res = await fetch(path, options);
  return res.json();
}

function formatTime(value) {
  if (!value) return "";
  return new Date(value).toLocaleString();
}

function escapeHtml(text) {
  return String(text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function setChecked(id, value) {
  const el = document.getElementById(id);
  if (el) el.checked = !!value;
}
function setValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value || "";
}
function toggleSettingsPanel() {
  document.getElementById("settingsPanel")?.classList.toggle("hidden");
}
async function loadGroupSettings() {
  if (!selectedChatId) return;

  const data = await api(
    "/api/webhook?admin=group-settings&chat_id=" + encodeURIComponent(selectedChatId)
  );

  setChecked("ai_enabled", data.ai_enabled);
  setChecked("welcome_enabled", data.welcome?.enabled);
  setChecked("spam_enabled", data.spam?.enabled);
  setChecked("captcha_enabled", data.captcha?.enabled);
  setChecked("ai_master", data.ai?.enabled);
  setChecked("ai_phishing", data.ai?.phishing?.enabled);
  setChecked("ai_scam", data.ai?.scam?.enabled);
  setChecked("ai_toxicity", data.ai?.toxicity?.enabled);
  setChecked("ai_impersonation", data.ai?.impersonation?.enabled);
  setChecked("ai_nsfw", data.ai?.nsfw?.enabled);
  setChecked("ai_summary", data.ai?.summary?.enabled);
  setValue("rulesText", data.rules?.text);
  setValue("welcomeText", data.welcome?.message);
}
async function trackPanelVisit() {
  let visitorId = localStorage.getItem("panel_visitor_id");

  if (!visitorId) {
    visitorId = crypto.randomUUID();
    localStorage.setItem("panel_visitor_id", visitorId);
  }

  await api("/api/webhook?admin=panel-visit", {
    method: "POST",
    body: JSON.stringify({
      visitor_id: visitorId,
      page: location.pathname,
      hostname: location.hostname,
      language: navigator.language,
      platform: navigator.platform,
      user_agent: navigator.userAgent,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screen_width: screen.width,
      screen_height: screen.height,
      window_width: window.innerWidth,
      window_height: window.innerHeight,
      device_pixel_ratio: window.devicePixelRatio,
      dark_mode: window.matchMedia("(prefers-color-scheme: dark)").matches,
      touch_support: navigator.maxTouchPoints > 0
    })
  });
}

function checked(id) { return !!document.getElementById(id)?.checked; }
async function saveGroupSettings() {
  if (!selectedChatId) {
    alert("Select a chat first");
    return;
  }

  await api("/api/webhook?admin=group-settings", {
    method: "POST",
    body: JSON.stringify({
      chat_id: selectedChatId,
      ai_enabled: checked("ai_enabled"),
      welcome: { enabled: checked("welcome_enabled"), message: document.getElementById("welcomeText")?.value || undefined },
      rules: { text: document.getElementById("rulesText")?.value || undefined },
      spam: { enabled: checked("spam_enabled") },
      captcha: { enabled: checked("captcha_enabled") },
      ai: {
        enabled: checked("ai_master"),
        phishing: { enabled: checked("ai_phishing") },
        scam: { enabled: checked("ai_scam") },
        toxicity: { enabled: checked("ai_toxicity") },
        impersonation: { enabled: checked("ai_impersonation") },
        nsfw: { enabled: checked("ai_nsfw") },
        summary: { enabled: checked("ai_summary") }
      }
    })
  });

  await loadGroupSettings();
}

async function loadChats() {
  const data = await api("/api/webhook?admin=chat");
  const box = document.getElementById("chats");
  box.innerHTML = "";

  if (!data.chats?.length) {
    box.innerHTML = `<div class="empty">No chats yet</div>`;
    return;
  }

  const search = document.getElementById("chatSearch")?.value.toLowerCase() || "";

  const chats = data.chats.filter(chat =>
    String(chat.chat_title || "").toLowerCase().includes(search) ||
    String(chat.chat_id || "").toLowerCase().includes(search) ||
    String(chat.chat_type || "").toLowerCase().includes(search)
  );

  chats.forEach(chat => {
    const div = document.createElement("div");
    div.className = "chat-item";

    if (String(chat.chat_id) === String(selectedChatId)) {
      div.classList.add("active");
    }

    div.innerHTML = `
      <div class="chat-title">${escapeHtml(chat.chat_title || chat.chat_id)}</div>
      <div class="chat-type">${escapeHtml(chat.chat_type || "chat")}</div>
      <div class="chat-time">${formatTime(chat.created_at)}</div>
    `;

    div.onclick = async () => {
      selectedChatId = chat.chat_id;
      selectedChatTitle = chat.chat_title || chat.chat_id;
      document.getElementById("chatTitle").innerText = selectedChatTitle;

      clearReply();

      await loadMessages();
      await loadGroupSettings();
      await loadChats();
    };

    box.appendChild(div);
  });
}

async function loadMessages() {
  if (!selectedChatId) return;

  const box = document.getElementById("messages");
  const nearBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 80;
  const search = document.getElementById("messageSearch")?.value || "";

  const data = await api(
    "/api/webhook?admin=messages&chat_id=" +
      encodeURIComponent(selectedChatId) +
      "&search=" +
      encodeURIComponent(search)
  );

  box.innerHTML = "";

  if (!data.messages?.length) {
    box.innerHTML = `<div class="empty">No messages yet</div>`;
    return;
  }

  data.messages.forEach(m => {
    const row = document.createElement("div");
    row.className = "message-row " + (m.is_bot ? "bot" : "");

    const username = m.username || (m.is_bot ? "Bot" : "User");
    const messageText = m.message_text || "";
    const safeUsername = escapeHtml(username);
    const safeMessage = escapeHtml(messageText).replaceAll("'", "\\'");

    row.innerHTML = `
      <div class="message-wrap">
        <div class="sender">${safeUsername}</div>

        <div class="bubble">
          <div class="message-text">${escapeHtml(messageText)}</div>
        </div>

        <div class="message-meta">
          <span class="time">${formatTime(m.created_at)}</span>
          ${
            m.telegram_message_id
              ? `<button class="reply-button" onclick="selectReply(${m.telegram_message_id}, '${safeUsername}', '${safeMessage}')">Reply</button>`
              : ""
          }
        </div>
      </div>
    `;

    box.appendChild(row);
  });

  if (nearBottom) {
    box.scrollTop = box.scrollHeight;
  }
}

function selectReply(messageId, username, text) {
  replyToMessageId = messageId;
  replyToName = username;

  document.getElementById("replyText").innerText = "Replying to " + username;
  document.getElementById("replyBox").classList.remove("hidden");
}

function clearReply() {
  replyToMessageId = null;
  replyToName = null;

  document.getElementById("replyText").innerText = "";
  document.getElementById("replyBox").classList.add("hidden");
}

async function sendMessage() {
  const input = document.getElementById("text");
  const text = input.value.trim();

  if (!selectedChatId) {
    alert("Select a chat first");
    return;
  }

  if (!text) return;

  await api("/api/webhook?admin=messages", {
    method: "POST",
    body: JSON.stringify({
      chat_id: selectedChatId,
      text,
      reply_to_message_id: replyToMessageId
    })
  });

  input.value = "";
  clearReply();

  await loadMessages();
  await loadChats();
}

async function deleteChat() {
  if (!selectedChatId) {
    alert("Select a chat first");
    return;
  }

  if (!confirm("Delete this chat history from panel?")) return;

  await api(
    "/api/webhook?admin=chat&chat_id=" + encodeURIComponent(selectedChatId),
    { method: "DELETE" }
  );

  selectedChatId = null;
  selectedChatTitle = null;
  clearReply();

  document.getElementById("chatTitle").innerText = "Select a chat";
  document.getElementById("messages").innerHTML =
    `<div class="empty">No chat selected</div>`;

  await loadChats();
}

function handleEnter(event) {
  if (event.key === "Enter") {
    sendMessage();
  }
}

loadChats();
trackPanelVisit();
 setInterval(() => {
  if (selectedChatId) loadMessages();
}, 5000);

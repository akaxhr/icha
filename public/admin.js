let selectedChatId = null;
let selectedChatTitle = null;
let replyToMessageId = null;
let replyToName = null;
let replyToText = null;

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

async function loadGroupSettings() {
  if (!selectedChatId) return;

  const data = await api(
    "/api/admin/group-settings?chat_id=" + encodeURIComponent(selectedChatId)
  );

  if (document.getElementById("aiToggle")) {
    document.getElementById("aiToggle").checked = !!data.ai_enabled;
  }
}

async function saveGroupSettings() {
  if (!selectedChatId) {
    alert("Select a chat first");
    return;
  }

  await api("/api/admin/group-settings", {
    method: "POST",
    body: JSON.stringify({
      chat_id: selectedChatId,
      ai_enabled: document.getElementById("aiToggle").checked
    })
  });

  await loadGroupSettings();
}

async function loadChats() {
  const data = await api("/api/admin/chat");
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
    "/api/admin/messages?chat_id=" +
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
          ${
            m.reply_to_message_id
              ? `<div class="reply-preview">
                  <div class="reply-name">${escapeHtml(m.reply_to_username || "Replied message")}</div>
                  <div class="reply-text">${escapeHtml(m.reply_to_text || "")}</div>
                </div>`
              : ""
          }

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
  replyToText = text;

  document.getElementById("replyText").innerText = "Replying to " + username;
  document.getElementById("replyBox").classList.remove("hidden");
}

function clearReply() {
  replyToMessageId = null;
  replyToName = null;
  replyToText = null;

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

  await api("/api/admin/messages", {
    method: "POST",
    body: JSON.stringify({
      chat_id: selectedChatId,
      text,
      reply_to_message_id: replyToMessageId,
      reply_to_username: replyToName,
      reply_to_text: replyToText
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
    "/api/admin/chats?chat_id=" + encodeURIComponent(selectedChatId),
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

setInterval(() => {
  loadChats();
  if (selectedChatId) loadMessages();
}, 3000);

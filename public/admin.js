const chatListEl = document.getElementById("chatList");
const messagesEl = document.getElementById("messages");
const groupTitleEl = document.getElementById("groupTitle");
const groupMetaEl = document.getElementById("groupMeta");
const infoTitleEl = document.getElementById("infoTitle");
const infoMetaEl = document.getElementById("infoMeta");
const chatAvatarEl = document.getElementById("chatAvatar");
const infoAvatarEl = document.getElementById("infoAvatar");
const replyInput = document.getElementById("replyInput");
const sendBtn = document.getElementById("sendBtn");
const searchInput = document.getElementById("searchInput");

let selectedChatId = null;
let allChats = [];

async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options
  });

  const text = await res.text();

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(text || "Invalid JSON response");
  }
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function avatarText(title = "?") {
  return String(title).trim().charAt(0).toUpperCase() || "?";
}

function time(value) {
  return new Date(value || Date.now()).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function renderChats(chats) {
  if (!chats.length) {
    chatListEl.innerHTML = `<div class="loading">No chats found</div>`;
    return;
  }

  chatListEl.innerHTML = chats.map(chat => {
    const title = chat.chat_title || chat.chat_id;
    const active = String(chat.chat_id) === String(selectedChatId);

    return `
      <div class="chat-item ${active ? "active" : ""}" data-chat-id="${chat.chat_id}">
        <div class="avatar">${avatarText(title)}</div>
        <div class="chat-body">
          <div class="chat-title">${escapeHtml(title)}</div>
          <div class="chat-preview">${escapeHtml(chat.last_message || chat.chat_type || "chat")}</div>
        </div>
        <div class="chat-time">${time(chat.created_at)}</div>
      </div>
    `;
  }).join("");

  document.querySelectorAll(".chat-item").forEach(item => {
    item.onclick = () => selectChat(item.dataset.chatId);
  });
}

async function loadChats() {
  chatListEl.innerHTML = `<div class="loading">Loading chats...</div>`;
  const data = await api("/api/webhook?admin=chat");
  allChats = data.chats || [];
  renderChats(allChats);

  if (allChats.length && !selectedChatId) {
    selectChat(allChats[0].chat_id);
  }
}

async function selectChat(chatId) {
  selectedChatId = chatId;

  const chat = allChats.find(c => String(c.chat_id) === String(chatId));
  const title = chat?.chat_title || chatId;
  const avatar = avatarText(title);

  groupTitleEl.textContent = title;
  groupMetaEl.textContent = chat?.chat_type || "Group";
  infoTitleEl.textContent = title;
  infoMetaEl.textContent = `${chat?.chat_type || "Group"} • ${chatId}`;
  chatAvatarEl.textContent = avatar;
  infoAvatarEl.textContent = avatar;

  renderChats(allChats);
  await loadMessages(chatId);
}

function renderMessages(messages) {
  if (!messages.length) {
    messagesEl.innerHTML = `<div class="empty">No messages yet</div>`;
    return;
  }

  messagesEl.innerHTML = messages.map(msg => {
    const isBot = msg.is_bot;

    return `
      <div class="message ${isBot ? "me" : ""}">
        ${!isBot ? `<b>${escapeHtml(msg.username || "User")}</b>` : ""}
        <div>${escapeHtml(msg.message_text || "")}</div>
        <small>${time(msg.created_at)}</small>
      </div>
    `;
  }).join("");

  messagesEl.scrollTop = messagesEl.scrollHeight;
}

async function loadMessages(chatId) {
  messagesEl.innerHTML = `<div class="empty">Loading messages...</div>`;
  const data = await api(`/api/webhook?admin=messages&chat_id=${encodeURIComponent(chatId)}`);
  renderMessages(data.messages || []);
}

async function sendPanelReply() {
  const text = replyInput.value.trim();
  if (!selectedChatId || !text) return;

  replyInput.value = "";

  await api("/api/webhook?admin=messages", {
    method: "POST",
    body: JSON.stringify({
      chat_id: selectedChatId,
      text
    })
  });

  await loadMessages(selectedChatId);
}

sendBtn.onclick = sendPanelReply;

replyInput.addEventListener("keydown", e => {
  if (e.key === "Enter") sendPanelReply();
});

searchInput.addEventListener("input", () => {
  const q = searchInput.value.toLowerCase().trim();
  const filtered = allChats.filter(chat =>
    String(chat.chat_title || chat.chat_id).toLowerCase().includes(q)
  );
  renderChats(filtered);
});

loadChats().catch(err => {
  console.error(err);
  chatListEl.innerHTML = `<div class="loading">Failed to load chats</div>`;
});

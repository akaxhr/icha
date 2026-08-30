const WORKER_URL = process.env.MUSIC_WORKER_URL;
const WORKER_SECRET = process.env.WORKER_SECRET;

async function workerRequest(endpoint, body) {
  const response = await fetch(`${WORKER_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${WORKER_SECRET}`,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.detail || `Music worker error: ${response.status}`
    );
  }

  return data;
}

export async function playMusic(chatId, query, quality = "high") {
  return workerRequest("/play", {
    chat_id: Number(chatId),
    query,
    quality,
  });
}

export async function skipMusic(chatId) {
  return workerRequest("/skip", {
    chat_id: Number(chatId),
  });
}

export async function stopMusic(chatId) {
  return workerRequest("/stop", {
    chat_id: Number(chatId),
  });
}

export async function getQueue(chatId) {
  const response = await fetch(
    `${WORKER_URL}/queue/${chatId}`,
    {
      headers: {
        Authorization: `Bearer ${WORKER_SECRET}`,
      },
    }
  );

  return response.json();
}

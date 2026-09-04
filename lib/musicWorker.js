
const WORKER_URL = process.env.MUSIC_WORKER_URL;
const WORKER_SECRET = process.env.WORKER_SECRET;

async function workerRequest(endpoint, body) {
  if (!WORKER_URL) {
    throw new Error("MUSIC_WORKER_URL is not configured");
  }

  if (!WORKER_SECRET) {
    throw new Error("WORKER_SECRET is not configured");
  }

  const response = await fetch(`${WORKER_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${WORKER_SECRET}`,
    },
    body: JSON.stringify(body),
  });

  const raw = await response.text();

  console.log("🎵 Music worker response:", {
    status: response.status,
    body: raw,
  });

  let data = {};

  if (raw.trim()) {
    try {
      data = JSON.parse(raw);
    } catch {
      throw new Error(
        `Music worker returned invalid JSON (${response.status}): ${raw.slice(0, 500)}`
      );
    }
  }

  if (!response.ok) {
    throw new Error(
      data?.detail ||
        `Music worker error: ${response.status} ${response.statusText}`
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
  if (!WORKER_URL) {
    throw new Error("MUSIC_WORKER_URL is not configured");
  }

  if (!WORKER_SECRET) {
    throw new Error("WORKER_SECRET is not configured");
  }

  const response = await fetch(
    `${WORKER_URL}/queue/${chatId}`,
    {
      headers: {
        Authorization: `Bearer ${WORKER_SECRET}`,
      },
    }
  );

  const raw = await response.text();

  console.log("🎵 Queue worker response:", {
    status: response.status,
    body: raw,
  });

  if (!response.ok) {
    throw new Error(
      `Music worker error: ${response.status} ${response.statusText}`
    );
  }

  if (!raw.trim()) {
    throw new Error(
      `Music worker returned an empty response (${response.status})`
    );
  }

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(
      `Music worker returned invalid JSON: ${raw.slice(0, 500)}`
    );
  }
}

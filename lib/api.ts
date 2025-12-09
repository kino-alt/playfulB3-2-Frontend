// lib/api.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080";

export const api = {
  /** -------------------------------
   *  1. Create Room
   *  POST /api/rooms
   *  ------------------------------- */
  createRoom: async () => {
    const response = await fetch(`${API_BASE_URL}/api/rooms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    if (!response.ok) throw new Error("Failed to create room");
    return response.json();
  },

  /** -------------------------------
   *  2. Join Room
   *  POST /api/user
   *  ------------------------------- */
  joinRoom: async (roomCode: string, userName: string) => {
    const response = await fetch(`${API_BASE_URL}/api/user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        room_code: roomCode,
        user_name: userName,
      }),
    });

    if (!response.ok) throw new Error("Failed to join room");
    return response.json();
  },

  /** -------------------------------
   *  3. Submit Topic
   *  POST /api/rooms/{room_id}/topic
   *  ------------------------------- */
  submitTopic: async (roomId: string, topic: string, emoji: string[]) => {
    const response = await fetch(`${API_BASE_URL}/api/rooms/${roomId}/topic`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic,
        emoji,
      }),
    });

    if (!response.ok) throw new Error("Failed to submit topic");
    return response.json();
  },

  /** -------------------------------
   *  4. Submit Answer
   *  POST /api/rooms/{room_id}/answer
   *  ------------------------------- */
  submitAnswer: async (roomId: string, userId: string, answer: string) => {
    const response = await fetch(`${API_BASE_URL}/api/rooms/${roomId}/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        topic: answer, // 後端字段名是 topic（答案的内容）
      }),
    });

    if (!response.ok) throw new Error("Failed to submit answer");
    return response.json();
  },

  /** -------------------------------
   *  5. Start Game
   *  POST /api/rooms/{room_id}/start
   *  ------------------------------- */
  startGame: async (roomId: string) => {
    const response = await fetch(`${API_BASE_URL}/api/rooms/${roomId}/start`, {
      method: "POST",
    });

    if (!response.ok) throw new Error("Failed to start game");
    return response.json();
  },

  /** -------------------------------
   *  6. WebSocket connect
   *  ------------------------------- */
  connectWebSocket: (roomCode: string, onMessage: (data: any) => void) => {
    const ws = new WebSocket(`${WS_BASE_URL}/api/rooms/${roomCode}/ws`)

    ws.onopen = () => {
      console.log("[v0] WebSocket connected to room:", roomCode)
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        onMessage(data)
      } catch (error) {
        console.error("[v0] Failed to parse WebSocket message:", error)
      }
    }

    ws.onerror = (error) => {
      console.error("[v0] WebSocket error:", error)
    }

    ws.onclose = () => {
      console.log("[v0] WebSocket disconnected")
    }

    return ws
  },
};

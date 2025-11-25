// GoバックエンドのベースURL (環境変数で設定可能)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080"

export const api = {
  // Create room API(HTTP)
  createRoom: async () => {
    const response = await fetch(`${API_BASE_URL}/api/rooms/create`, {
      method: "POST",
    })
    return response.json()
  },

  // Join room API(HTTP)
  joinRoom: async (roomCode: string, userName: string) => {
    const response = await fetch(`${API_BASE_URL}/api/rooms/join`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ roomCode, userName }),
    })
    return response.json()
  },

  createTheme: async (roomCode:string) => {
    const response = await fetch(`${API_BASE_URL}/api/rooms/${roomCode}/theme`, {
      method: "POST",
    })
    return response.json()
  },

  // Get participants list API(ws)
  getParticipants: async (roomCode: string) => {
    const response = await fetch(`${API_BASE_URL}/api/rooms/${roomCode}/participants`)
    return response.json()
  },

  startGame: async (roomCode: string) => {
    const response = await fetch(`${API_BASE_URL}/api/rooms/${roomCode}/start`, {
      method: "POST",
    })
    return response.json()
  },
  
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
}

// lib/api.ts

import { AppError, ErrorCode, classifyError } from './error-handler'
import Logger from './logger'

const TAG = '[API]'

// HTTP base endpoint. Override via NEXT_PUBLIC_API_BASE_URL.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ""

// WebSocket base endpoint. Override via NEXT_PUBLIC_WS_BASE_URL when backend runs elsewhere.
const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_BASE_URL
  || (typeof window !== 'undefined'
    ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`
    : "")

const REQUEST_TIMEOUT = 10000 // 10秒

/**
 * API リクエストのフェッチラッパー
 * タイムアウトとエラー分類を自動処理
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

  try {
    Logger.debug(TAG, `Fetching ${options.method || 'GET'} ${url}`)
    
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })

    if (!response.ok) {
      // レスポンスボディを読み取ってエラーメッセージを取得
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorBody = await response.json();
        if (errorBody.message || errorBody.error) {
          errorMessage += ` - ${errorBody.message || errorBody.error}`;
        }
        Logger.error(TAG, `Error response body from ${url}:`, errorBody);
      } catch (e) {
        // JSONパースに失敗した場合はテキストとして読み取り
        try {
          const errorText = await response.text();
          if (errorText) {
            errorMessage += ` - ${errorText}`;
          }
        } catch (textError) {
          // テキストも読めない場合は無視
        }
      }
      
      const error = new AppError(
        ErrorCode.NETWORK_ERROR,
        errorMessage,
        response.status
      )
      Logger.error(TAG, `Failed to fetch ${url}`, error)
      throw error
    }

    Logger.debug(TAG, `Response ${response.status} from ${url}`)
    return response
  } catch (error) {
    const appError = classifyError(error)
    Logger.error(TAG, `Fetch error from ${url}`, appError)
    throw appError
  } finally {
    clearTimeout(timeoutId)
  }
}

//FIX: API設計に合わせて、StartGame削除
export const api = {
  /** -------------------------------
   * 1.1 Roomの作成
   * POST /api/rooms
   * ------------------------------- */
  createRoom: async () => {
    // POST /api/rooms -> creates a room and returns ids / theme / hint
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/api/rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })

      Logger.info(TAG, 'Room created successfully')
      return response.json()
    } catch (error) {
      Logger.error(TAG, 'Failed to create room', error as Error)
      throw error
    }
  },

  /** -------------------------------
   * 1.4 ルーム参加
   * POST /api/user
   * ------------------------------- */
  joinRoom: async (roomCode: string, userName: string) => {
    // POST /api/user -> joins by room code and username
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/api/user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room_code: roomCode,
          user_name: userName,
        }),
      })

      Logger.info(TAG, 'Joined room', { roomCode })
      return response.json()
    } catch (error) {
      Logger.error(TAG, 'Failed to join room', error as Error)
      throw error
    }
  },

  /** -------------------------------
   * 1.2 テーマ、絵文字の設定
   * POST /api/rooms/{room_id}/topic
   * ------------------------------- */
  submitTopic: async (
    roomId: string,
    topic: string,
    originalEmojis: string[]
  ) => {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/api/rooms/${roomId}/topic`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Backend spec: only topic + emojis
        body: JSON.stringify({ topic, emojis: originalEmojis }),
      })

      Logger.info(TAG, 'Topic submitted', { roomId })
      return response.json()
    } catch (error) {
      Logger.error(TAG, 'Failed to submit topic', error as Error)
      throw error
    }
  },

  /** -------------------------------
   * 1.3 回答の提出
   * POST /api/rooms/{room_id}/answer
   * ------------------------------- */
  submitAnswer: async (roomId: string, userId: string, answer: string) => {
    try {
      const requestBody = { user_id: userId, answer };
      console.log('[API] submitAnswer request:', {
        url: `${API_BASE_URL}/api/rooms/${roomId}/answer`,
        method: 'POST',
        roomId: roomId,
        userId: userId,
        answer: answer,
        body: requestBody
      });
      
      const response = await fetchWithTimeout(`${API_BASE_URL}/api/rooms/${roomId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      })

      Logger.info(TAG, 'Answer submitted', { roomId })
      const result = await response.json();
      console.log('[API] submitAnswer response:', result);
      return result;
    } catch (error) {
      Logger.error(TAG, 'Failed to submit answer', error as Error)
      throw error
    }
  },

  /** -------------------------------
   * ゲーム開始アクション
   * POST /api/rooms/{room_id}/start
   * ------------------------------- */
  startGame: async (roomId: string, userId: string) => {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/api/rooms/${roomId}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      })

      Logger.info(TAG, 'Game started', { roomId })
      return response.json()
    } catch (error) {
      Logger.error(TAG, 'Failed to start game', error as Error)
      throw error
    }
  },

  /** -------------------------------
   * ゲーム終了アクション
   * POST /api/rooms/{room_id}/finish
   * ------------------------------- */
  finishRoom: async (roomId: string, userId: string) => {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/api/rooms/${roomId}/finish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      })

      Logger.info(TAG, 'Game finished', { roomId })
      return response.json()
    } catch (error) {
      Logger.error(TAG, 'Failed to finish game', error as Error)
      throw error
    }
  },

  /** -------------------------------
   * 議論をスキップして回答フェーズへ遷移
   * POST /api/rooms/{room_id}/skip-discussion
   * ------------------------------- */
  skipDiscussion: async (roomId: string, userId: string) => {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/api/rooms/${roomId}/skip-discussion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      })

      Logger.info(TAG, 'Discussion skipped', { roomId })
      return response.json()
    } catch (error) {
      Logger.error(TAG, 'Failed to skip discussion', error as Error)
      throw error
    }
  },

  /** -------------------------------
   * WebSocket 接続
   * ws://.../ws?room_id={room_id}
   * ------------------------------- */
  connectWebSocket: (roomId: string, onMessage: (data: any) => void, userId?: string, userName?: string) => {
    if (!roomId) {
      Logger.warn(TAG, 'WebSocket: No roomId provided')
      return { close: () => {} } as any
    }

    const url = `${WS_BASE_URL}/ws?room_id=${roomId}`
    const ws = new WebSocket(url)

    ws.onmessage = (event: MessageEvent) => {
      const raw = event.data

      const dispatch = (data: any) => {
        try {
          Logger.debug(TAG, 'WS message', { type: data?.type })
          onMessage(data)
        } catch (e) {
          Logger.error(TAG, 'WS message handler error', e as Error)
        }
      }

      if (typeof raw === 'string') {
        try {
          dispatch(JSON.parse(raw))
        } catch (e) {
          Logger.error(TAG, 'WS JSON parse failed', e as Error)
        }
        return
      }

      if (typeof Blob !== 'undefined' && raw instanceof Blob) {
        raw
          .text()
          .then((text: string) => {
            try {
              dispatch(JSON.parse(text))
            } catch (e) {
              Logger.error(TAG, 'WS Blob parse failed', e as Error)
            }
          })
          .catch((e: any) => Logger.error(TAG, 'WS Blob read failed', e))
        return
      }

      if (raw && typeof raw === 'object') {
        dispatch(raw)
        return
      }

      Logger.warn(TAG, 'WS unknown data type', { type: typeof raw })
      dispatch({ type: 'UNKNOWN', payload: raw })
    }

    ws.onopen = () => {
      Logger.info(TAG, 'WebSocket connected')
      ws.send(JSON.stringify({ type: 'FETCH_PARTICIPANTS' }))

      if (userId && userName) {
        Logger.debug(TAG, 'Registering user', { userId, userName })
        ws.send(
          JSON.stringify({
            type: 'CLIENT_CONNECTED',
            payload: { user_id: userId, user_name: userName },
          })
        )
      }
    }

    ws.onerror = (err: Event) => {
      const errorInfo = err instanceof Event ? {
        type: err.type,
        message: `WebSocket connection error (${err.type})`
      } : { message: String(err) }
      Logger.error(TAG, 'WebSocket error', new Error(errorInfo.message || 'Unknown error'))
    }
    ws.onclose = () => Logger.info(TAG, 'WebSocket closed')

    if (typeof window !== 'undefined') {
      (window as any).gameWs = ws
    }

    return ws
  },

  /** -------------------------------
   * ルーム情報の取得（オプション）
   * GET /api/rooms/:roomCode
   * ------------------------------- */
  getRoomInfo: async (roomCode: string) => {
    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/api/rooms/${roomCode}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      })

      Logger.debug(TAG, 'Room info retrieved')
      return response.json()
    } catch (error) {
      Logger.warn(TAG, 'Failed to get room info', error as Error)
      throw error
    }
  },
}

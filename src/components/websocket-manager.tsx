'use client'

/**
 * WebSocket 接続管理コンポーネント
 * - 自動再接続
 * - 接続状態の監視
 * - ページ離脱時のクリーンアップ
 */

import { useEffect, useRef } from 'react'
import { useRoomData } from '@/contexts/room-context'

const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080'
const RECONNECT_DELAY = 3000 // 3秒
const MAX_RECONNECT_ATTEMPTS = 5
const HEARTBEAT_INTERVAL = 30000 // 30秒

export function WebSocketManager() {
  const { roomId, myUserId, roomState, userName, isHost, isLeader } = useRoomData()
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isConnectingRef = useRef(false)

  // メイン接続エフェクト：roomId / myUserId / userName が揃ったときだけ接続。
  // roomState 変化では再接続しない（切断→参加者0の連鎖を防ぐ）。
  useEffect(() => {
    console.log('[WebSocketManager] useEffect triggered:', { roomId, myUserId, userName, isHost, isLeader });

    // roomId と myUserId がない場合は接続しない
    if (!roomId || !myUserId) {
      console.log('[WebSocketManager] Missing roomId or myUserId, not connecting');
      // 既存の接続をクローズ
      if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
        wsRef.current.close(1000, 'No roomId or myUserId')
      }
      wsRef.current = null
      isConnectingRef.current = false
      reconnectAttemptsRef.current = 0
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
      return
    }

    console.log('[WebSocketManager] roomId and myUserId present, proceeding with connection');

    // 既に接続中または接続済みの場合はスキップ
    if (isConnectingRef.current || (wsRef.current && wsRef.current.readyState === WebSocket.OPEN)) {
      return
    }

    const connectWebSocket = () => {
      try {
        // 重複接続を防止
        if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
          return
        }

        isConnectingRef.current = true
        const wsUrl = `${WS_BASE_URL}/ws?room_id=${roomId}&user_id=${myUserId}`
        console.log('[WebSocketManager] Connecting to:', wsUrl)
        
        const ws = new WebSocket(wsUrl)
        wsRef.current = ws
        
        // グローバルに保存（既存コードとの互換性）
        ;(window as any).gameWs = ws

        ws.onopen = () => {
          console.log('[WebSocketManager] Connected successfully')
          isConnectingRef.current = false
          reconnectAttemptsRef.current = 0
          
          // CLIENT_CONNECTED メッセージを送信
          const payload = {
            user_id: myUserId,
            user_name: userName || 'Player',
            role: isHost ? 'host' : 'player',
            is_leader: !!isLeader,
          };
          console.log('[WebSocketManager] Sending CLIENT_CONNECTED:', payload);
          ws.send(JSON.stringify({
            type: 'CLIENT_CONNECTED',
            payload
          }))

          // ハートビート開始
          startHeartbeat()
        }

        ws.onmessage = (event: MessageEvent) => {
          try {
            const data = JSON.parse(event.data)
            
            // グローバルの gameWs 経由で RoomContext のハンドラーに渡す
            if ((window as any).gameWsHandler) {
              (window as any).gameWsHandler(data)
            }
          } catch (error) {
            // parse error は無視
          }
        }

        ws.onclose = (event) => {
          console.log('[WebSocketManager] Connection closed:', event.code, event.reason)
          isConnectingRef.current = false
          stopHeartbeat()
          
          // 意図的な切断でない場合は再接続
          if (event.code !== 1000 && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
            scheduleReconnect()
          }
        }

        ws.onerror = (error) => {
          isConnectingRef.current = false
          // WebSocket接続エラーは発生時のみログ（接続前のエラーは無視）
          if (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN) {
            console.error('[WebSocketManager] WebSocket error')
          }
        }

      } catch (error) {
        isConnectingRef.current = false
        // WebSocket作成エラー（通常は無視）
        // console.error('[WebSocketManager] Failed to create WebSocket:', error)
        scheduleReconnect()
      }
    }

    const scheduleReconnect = () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }

      reconnectAttemptsRef.current++
      console.log(`[WebSocketManager] Scheduling reconnect attempt ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS}`)

      reconnectTimeoutRef.current = setTimeout(() => {
        connectWebSocket()
      }, RECONNECT_DELAY)
    }

    const startHeartbeat = () => {
      heartbeatIntervalRef.current = setInterval(() => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'PING' }))
        }
      }, HEARTBEAT_INTERVAL)
    }

    const stopHeartbeat = () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current)
        heartbeatIntervalRef.current = null
      }
    }

    // 初回接続
    connectWebSocket()

    // クリーンアップ
    return () => {
      console.log('[WebSocketManager] Cleaning up WebSocket connection')
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      
      stopHeartbeat()
      
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounted')
        wsRef.current = null
      }
      
      ;(window as any).gameWs = null
    }
  }, [roomId, myUserId, userName])

  // 終了状態では明示的にクローズ（こちらは依存に roomState を含めてOK）
  useEffect(() => {
    if (roomState === 'finished') {
      if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
        wsRef.current.close(1000, 'Room finished')
      }
      wsRef.current = null
      isConnectingRef.current = false
    }
  }, [roomState])

  return null // このコンポーネントは何も表示しない
}

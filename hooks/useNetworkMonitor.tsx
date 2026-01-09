/**
 * ネットワーク状態管理フック
 * オフライン状態の検出と自動再接続
 */

'use client'

import { useEffect, useState, useCallback, useRef, ReactNode } from 'react'
import Logger from '@/lib/logger'

const TAG = '[NetworkMonitor]'
const RECONNECT_DELAY = 3000 // 3秒
const MAX_RECONNECT_ATTEMPTS = 5

export interface NetworkState {
  isOnline: boolean
  isReconnecting: boolean
  reconnectAttempts: number
  lastOfflineTime: Date | null
}

/**
 * ネットワーク状態を監視するフック
 */
export function useNetworkMonitor() {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isOnline: typeof window !== 'undefined' && navigator.onLine,
    isReconnecting: false,
    reconnectAttempts: 0,
    lastOfflineTime: null,
  })

  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)

  /**
   * オンライン復帰時の処理
   */
  const handleOnline = useCallback(() => {
    Logger.info(TAG, 'Network connection restored')
    setNetworkState(prev => ({
      ...prev,
      isOnline: true,
      isReconnecting: false,
      reconnectAttempts: 0,
    }))
    reconnectAttemptsRef.current = 0
  }, [])

  /**
   * オフライン検出時の処理
   */
  const handleOffline = useCallback(() => {
    Logger.warn(TAG, 'Network connection lost')
    setNetworkState(prev => ({
      ...prev,
      isOnline: false,
      lastOfflineTime: new Date(),
    }))
  }, [])

  /**
   * オンライン状態変化のリスナー登録
   */
  useEffect(() => {
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [handleOnline, handleOffline])

  /**
   * オフライン状態の自動復旧ロジック
   */
  useEffect(() => {
    if (networkState.isOnline) return

    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      Logger.error(TAG, `Max reconnection attempts (${MAX_RECONNECT_ATTEMPTS}) exceeded`, new Error('Max retries'))
      return
    }

    setNetworkState(prev => ({
      ...prev,
      isReconnecting: true,
      reconnectAttempts: reconnectAttemptsRef.current + 1,
    }))

    Logger.info(
      TAG,
      `Attempting to reconnect (${reconnectAttemptsRef.current + 1}/${MAX_RECONNECT_ATTEMPTS})`
    )

    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectAttemptsRef.current++
    }, RECONNECT_DELAY)

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [networkState.isOnline, networkState.reconnectAttempts])

  return networkState
}

/**
 * ネットワーク状態インジケーターコンポーネント
 */
export function NetworkStatusIndicator(): ReactNode {
  const [mounted, setMounted] = useState(false)
  const { isOnline, isReconnecting, reconnectAttempts } = useNetworkMonitor()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Avoid SSR/CSR mismatch by not rendering anything until mounted
  if (!mounted) return null

  if (isOnline && !isReconnecting) {
    return null
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-500 text-white text-center py-2 text-sm font-semibold">
      {isReconnecting ? (
        <span>
          ⚠️ Reconnecting... ({reconnectAttempts}/{MAX_RECONNECT_ATTEMPTS})
        </span>
      ) : (
        <span>❌ You are offline</span>
      )}
    </div>
  )
}

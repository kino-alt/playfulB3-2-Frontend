# 改善実装ガイド

このドキュメントは、プロジェクト評価に基づいて実装された改善機能の使用方法を説明します。

---

## 🔧 実装済み改善機能

### 1. ロギングシステム (`lib/logger.ts`)

**目的:** 本番環境でのバグ調査を容易にする統一ログシステム

**使用方法:**

```typescript
import Logger, { LogLevel } from '@/lib/logger'

// 環境に応じてログレベルを設定
if (process.env.NODE_ENV === 'production') {
  Logger.setLevel(LogLevel.WARN) // 本番環境では WARN 以上のみ
} else {
  Logger.setLevel(LogLevel.DEBUG)
}

// 各レベルのログを出力
Logger.debug('[DiscussionTime]', 'State changed', { roomState: 'DISCUSSING' })
Logger.info('[API]', 'Room created successfully', { roomId: 'abc123' })
Logger.warn('[WebSocket]', 'Connection slow', { latency: 500 })
Logger.error('[Network]', 'Request failed', error)

// ログをエクスポート（本番環境のバグ調査用）
const logs = Logger.export()
// ファイルやサーバーに送信可能
```

**メリット:**
- 📊 タイムスタンプ付きで時系列追跡可能
- 🎯 ログレベルで開発環境と本番環境を自動切り替え
- 💾 ログ履歴を最大100件保持
- 🔍 本番環境のバグを事後調査可能

**使用例:**

```typescript
// useWSHandler.ts で活用
export const useWsHandler = (setState: React.Dispatch<React.SetStateAction<RoomState>>) => {
  const handleWebSocketMessage = useCallback((eventData: any) => {
    const { type, payload } = eventData
    
    Logger.debug('[WS]', 'Message received', { type })
    
    switch (type) {
      case 'STATE_UPDATE':
        Logger.info('[WS]', `State transition: ${payload.nextState}`)
        // 処理...
        break
      case 'ERROR':
        Logger.error('[WS]', 'Server error', new Error(payload.message))
        break
    }
  }, [])
}
```

---

### 2. ネットワーク監視フック (`hooks/useNetworkMonitor.ts`)

**目的:** オフライン状態の検出とユーザーへの通知

**使用方法:**

```typescript
import { useNetworkMonitor, NetworkStatusIndicator } from '@/hooks/useNetworkMonitor'

// コンポーネント内で使用
export function MyComponent() {
  const { isOnline, isReconnecting, reconnectAttempts } = useNetworkMonitor()

  if (!isOnline) {
    return <div>You are offline. Please check your connection.</div>
  }

  if (isReconnecting) {
    return <div>Reconnecting... ({reconnectAttempts}/5)</div>
  }

  return <div>Connected</div>
}

// UIインジケーターを追加（app/layout.tsx に既に追加済み）
<NetworkStatusIndicator />
```

**機能:**
- 🔴 オフライン状態の自動検出
- 🔄 最大5回の自動再接続試行（3秒間隔）
- 📢 ユーザーへの視覚的通知
- 📊 再接続状態の追跡

**UIの見た目:**
```
❌ You are offline
⚠️ Reconnecting... (1/5)
⚠️ Reconnecting... (2/5)
```

---

### 3. エラーハンドリング (`lib/error-handler.ts`)

**目的:** エラーの統一的な分類とユーザーフレンドリーなメッセージ

**使用方法:**

```typescript
import { AppError, ErrorCode, useErrorHandler } from '@/lib/error-handler'

// コンポーネント内で使用
export function DiscussionTime() {
  const { handleError } = useErrorHandler()

  const handleSkip = async () => {
    try {
      await skipDiscussion()
    } catch (error) {
      const appError = handleError(error, '[DiscussionTime] Skip failed')

      // ユーザーフレンドリーなメッセージを表示
      setGlobalError(appError.getUserMessage())

      // 再試行可能なエラーなら自動リトライ
      if (appError.isRetryable()) {
        setTimeout(() => handleSkip(), 3000)
      }

      // 重大なエラーの場合はページをリロード
      if (appError.isCritical()) {
        window.location.reload()
      }
    }
  }
}
```

**エラー分類:**

```typescript
ErrorCode.NETWORK_ERROR          // → "Network connection error..."
ErrorCode.CONNECTION_TIMEOUT     // → "Connection timed out..."
ErrorCode.PERMISSION_DENIED      // → "Only the host can perform this action."
ErrorCode.INVALID_STATE          // → "Invalid game state..."
ErrorCode.ROOM_NOT_FOUND         // → "Room not found..."
ErrorCode.INTERNAL_SERVER_ERROR  // → "Server error occurred..."
```

**エラーの性質を判定:**

```typescript
// 再試行可能か？
if (error.isRetryable()) {
  // NETWORK_ERROR, CONNECTION_TIMEOUT, SERVICE_UNAVAILABLE は再試行可
}

// 深刻な問題か？
if (error.isCritical()) {
  // INTERNAL_SERVER_ERROR, INVALID_STATE は重大
}
```

---

## 🚀 実装のベストプラクティス

### 1. API呼び出しに改善を適用

```typescript
// BEFORE: エラーハンドリングが不十分
const skipDiscussion = async (roomId: string) => {
  const response = await fetch(`/api/rooms/${roomId}/skip-discussion`, {
    method: 'POST',
  })
  if (!response.ok) throw new Error('Failed')
  return response.json()
}

// AFTER: 統一的なエラーハンドリング
const skipDiscussion = async (roomId: string) => {
  try {
    const response = await fetchWithTimeout(`/api/rooms/${roomId}/skip-discussion`, {
      method: 'POST',
    })
    Logger.info('[API]', 'Discussion skipped')
    return response.json()
  } catch (error) {
    Logger.error('[API]', 'Failed to skip discussion', error as Error)
    throw error
  }
}
```

### 2. ネットワーク状態に応じた処理

```typescript
export function ReviewAnswer() {
  const { isOnline } = useNetworkMonitor()
  const { finishRoom } = useRoomData()

  const handleSubmit = async () => {
    if (!isOnline) {
      alert('You are offline. Changes may not be saved.')
      return
    }

    try {
      await finishRoom()
      Logger.info('[ReviewAnswer]', 'Game finished')
    } catch (error) {
      Logger.error('[ReviewAnswer]', 'Failed to finish', error as Error)
    }
  }

  return (
    <button onClick={handleSubmit} disabled={!isOnline}>
      {isOnline ? 'Finish Game' : 'Offline - Cannot Save'}
    </button>
  )
}
```

### 3. 全体的なエラーハンドリング戦略

```typescript
// contexts/room-context.tsx で実装
const skipDiscussion = useCallback(async () => {
  if (!state.roomId) {
    Logger.warn('[RoomContext]', 'No roomId to skip discussion')
    return
  }

  try {
    await api.skipDiscussion(state.roomId, state.myUserId)
    Logger.info('[RoomContext]', 'Discussion skipped successfully')
  } catch (error) {
    const appError = classifyError(error)
    Logger.error('[RoomContext]', 'Failed to skip discussion', appError)
    
    setState(prev => ({
      ...prev,
      globalError: appError.getUserMessage()
    }))
    
    // 再試行可能なエラーは自動リトライ
    if (appError.isRetryable()) {
      Logger.info('[RoomContext]', 'Scheduling retry...')
      setTimeout(() => skipDiscussion(), 3000)
    }
  }
}, [state.roomId, state.myUserId])
```

---

## 📋 チェックリスト

API呼び出しをリファクタリングする際の確認事項：

- [ ] `fetchWithTimeout` を使用している
- [ ] `Logger.debug()` でリクエストを記録
- [ ] `Logger.error()` でエラーを記録
- [ ] `classifyError()` でエラーを分類
- [ ] エラーメッセージはユーザーフレンドリー
- [ ] 再試行可能なエラーを識別
- [ ] `globalError` state を更新

---

## 🔄 段階的実装のステップ

### Phase 1: ロギング導入（30分）
1. `Logger` を既存の API 呼び出しに統合
2. WebSocket メッセージハンドラーに記録
3. 本番環境でのログレベルを設定

### Phase 2: ネットワーク監視（30分）
1. `useNetworkMonitor` を layout に追加（✅ 完了）
2. コンポーネント内で `isOnline` を確認
3. ユーザーに通知を表示

### Phase 3: エラーハンドリング統一（1-2時間）
1. API 呼び出しを `fetchWithTimeout` でラップ
2. 既存の `try-catch` を `useErrorHandler` に統合
3. `globalError` を表示する UI を更新

---

## 📊 改善効果の測定

改善後の効果を測定するポイント：

- ✅ **ログ記録率:** 本番環境でエラー発生時に 100% ログが記録される
- ✅ **エラー分類精度:** エラーが正しく分類される
- ✅ **ユーザー体験:** エラーメッセージが分かりやすい
- ✅ **デバッグ時間:** バグ原因を30分以内に特定できる
- ✅ **自動復旧率:** ネットワークエラーの 80% が自動復旧される

---

**次のステップ:** 上記のベストプラクティスに従って、既存のコンポーネントをリファクタリングしてください。

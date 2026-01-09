# データ管理設計ドキュメント

## 概要

このドキュメントは、複数ルームの同時進行、参加者の途中離脱、およびデータの一貫性を保証するための設計指針を説明します。

---

## 設計原則

### 1. **ルームID ベースのデータ分離**

各ルームのデータは独立して管理され、localStorage キーに `roomId` を含めることで分離されます。

```typescript
// ルームごとに異なる localStorage キー
roomState_8ef3f406-b653-48f3-a68d-abc77efc23d7
roomState_a1b2c3d4-e5f6-7890-1234-567890abcdef

// ドラフトデータも roomId ベース
createTopic_draft_8ef3f406-b653-48f3-a68d-abc77efc23d7
```

**メリット：**
- 複数タブで異なるルームに参加可能
- ルーム間でのデータ混在を防止
- ルーム削除時に該当データのみクリーンアップ

---

### 2. **Protected Data Pattern（保護データパターン）**

サーバーから取得した重要データ（theme/hint）は `protectedDataRef` で保護され、以降の state 更新で上書きされません。

```typescript
const protectedDataRef = React.useRef<{ theme: string | null; hint: string | null }>({
  theme: null,
  hint: null,
});

// createRoom 時に保護データを設定
if (data.theme) protectedDataRef.current.theme = data.theme;
if (data.hint) protectedDataRef.current.hint = data.hint;

// localStorage 保存時に優先
const dataToSave = {
  ...state,
  theme: protectedDataRef.current.theme || state.theme,
  hint: protectedDataRef.current.hint || state.hint,
};
```

**メリット：**
- リロード後も theme/hint が消えない
- WebSocket 更新で上書きされない
- データの一貫性を保証

---

### 3. **集中型永続化（Centralized Persistence）**

localStorage への保存は **useEffect 1箇所のみ** で管理し、500ms デバウンスで頻繁な保存を防止します。

```typescript
useEffect(() => {
  if (!state.roomId) return;
  
  const timeoutId = setTimeout(() => {
    saveRoomState(state, protectedDataRef.current);
  }, 500);
  
  return () => clearTimeout(timeoutId);
}, [state]);
```

**メリット：**
- 保存ロジックが明確（1箇所のみ）
- パフォーマンス向上（デバウンス）
- デバッグが容易

---

### 4. **WebSocket 自動再接続**

WebSocketManager コンポーネントが接続を監視し、切断時に自動再接続します。

```typescript
- 最大再接続試行回数: 5回
- 再接続間隔: 3秒
- ハートビート: 30秒ごとに PING送信
```

**メリット：**
- ネットワーク不安定時も自動復旧
- 参加者離脱の検出
- サーバー側でのタイムアウト防止

---

### 5. **title 画面での完全クリーンアップ**

title-screen に到達した時点で、すべてのルームデータを削除します。

```typescript
const clearAllRoomData = () => {
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith('roomState_') || DRAFT_STORAGE_KEYS.includes(key)) {
      localStorage.removeItem(key);
    }
  });
};
```

**メリット：**
- メモリリーク防止
- 古いデータの混在を防止
- クリーンな状態で新規ゲーム開始

---

## データフロー

### 1. **ルーム作成**

```
1. POST /api/rooms → theme/hint を取得
2. protectedDataRef に保存
3. setState でマージ
4. useEffect が 500ms 後に localStorage 保存（roomState_${roomId}）
```

### 2. **WebSocket 更新（STATE_UPDATE）**

```
1. WebSocket で STATE_UPDATE 受信
2. setState で merge ({ ...prev, ...newData })
3. theme/hint は prev から保持（protectedData 優先）
4. useEffect が 500ms 後に localStorage 保存
```

### 3. **リロード**

```
1. getInitialRoomState が最新の roomState_${roomId} から復元
2. protectedDataRef を初期化
3. WebSocketManager が自動接続
4. STATE_UPDATE で最新状態を同期
```

### 4. **参加者離脱**

```
1. WebSocket 切断検出
2. WebSocketManager が自動再接続（最大5回）
3. PARTICIPANT_UPDATE で参加者リスト更新
4. フロントエンドが離脱を反映
```

### 5. **title 画面に戻る**

```
1. resetRoom() 実行
2. clearAllRoomData() ですべての localStorage データ削除
3. protectedDataRef リセット
4. state を初期値に戻す
```

---

## バックエンドとの連携

### WebSocket メッセージ対応

| メッセージ | フロントエンド処理 |
|-----------|------------------|
| `STATE_UPDATE` | state を merge、omitempty に対応（欠損フィールドは保持） |
| `PARTICIPANT_UPDATE` | participantsList を完全置換 |
| `TIMER_TICK` | timer を更新（1秒ごと） |
| `ERROR` | globalError に設定、ユーザーに通知 |

### omitempty 対応

バックエンドは `omitempty` タグを使用しており、不要なフィールドは送信されません。

```go
// answering ステータス
{
  "nextState": "answering",
  "data": {}  // theme/hint/emojis は送信されない
}
```

フロントエンドは **merge ベース** で更新するため、欠損フィールドは既存値を保持します。

```typescript
setState(prev => {
  let newState = { ...prev, roomState: nextState };
  
  if (payloadData) {
    if (payloadData.topic !== undefined) newState.topic = payloadData.topic;
    if (payloadData.theme !== undefined) newState.theme = payloadData.theme;
    // ... 他のフィールド
  }
  
  return newState;
});
```

---

## ベストプラクティス

### ✅ DO

1. **roomId ベースで localStorage キーを作成**
   ```typescript
   const draftKey = `createTopic_draft_${roomId}`;
   localStorage.setItem(draftKey, JSON.stringify(data));
   ```

2. **title 画面到達時に完全クリーンアップ**
   ```typescript
   useEffect(() => {
     resetRoom(); // すべてのデータを削除
   }, []);
   ```

3. **merge ベースで state 更新**
   ```typescript
   setState(prev => ({ ...prev, ...newData }));
   ```

4. **保護データを優先**
   ```typescript
   const dataToSave = {
     ...state,
     theme: protectedDataRef.current.theme || state.theme,
   };
   ```

### ❌ DON'T

1. **複数箇所で localStorage に保存しない**
   ```typescript
   // ❌ 悪い例
   localStorage.setItem('roomState', ...);
   localStorage.setItem('theme', ...);
   ```

2. **state を完全置換しない**
   ```typescript
   // ❌ 悪い例
   setState({ ...newData }); // prev が消える
   
   // ✅ 良い例
   setState(prev => ({ ...prev, ...newData }));
   ```

3. **古いデータを残さない**
   ```typescript
   // ❌ 悪い例：title 画面でクリーンアップしない
   
   // ✅ 良い例：resetRoom() で完全削除
   clearAllRoomData();
   ```

---

## トラブルシューティング

### 問題: theme/hint が null になる

**原因:** protectedDataRef が初期化されていない、または上書きされている

**解決策:**
1. createRoom 時に protectedDataRef を設定しているか確認
2. localStorage 保存時に protectedData を優先しているか確認
3. useEffect の依存配列を確認

### 問題: 複数タブでデータが混在する

**原因:** localStorage キーに roomId が含まれていない

**解決策:**
1. すべての localStorage キーを `${prefix}_${roomId}` 形式に変更
2. getStorageKey() ユーティリティを使用

### 問題: WebSocket が切断され続ける

**原因:** サーバー側でタイムアウト、またはネットワーク不安定

**解決策:**
1. ハートビート（PING）が送信されているか確認
2. MAX_RECONNECT_ATTEMPTS を増やす
3. サーバーログで切断理由を確認

---

## まとめ

この設計により、以下が実現されました：

✅ **複数ルームの同時進行** - roomId ベースのデータ分離  
✅ **参加者の途中離脱対応** - WebSocket 自動再接続  
✅ **データの一貫性** - Protected Data Pattern  
✅ **パフォーマンス最適化** - デバウンス、集中型永続化  
✅ **保守性** - 明確なデータフロー、1箇所での管理  

これにより、堅牢でスケーラブルなマルチプレイヤーゲームを実現しています。

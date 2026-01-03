# Backend API Specification

このドキュメントは、現在のフロントエンド実装に基づくバックエンドAPIの仕様です。

## データ最適化戦略

### フロントエンド側のデータ管理

**既に実装済み:**
1. **localStorage で状態永続化** - ページリロード時も状態を復元
2. **前の値を自動保持** - バックエンドから送信されないフィールドは前の値を使用
3. **差分更新対応** - `undefined` のフィールドは更新しない

### バックエンドからの送信データ最適化

**推奨実装:**

#### 1. 状態遷移時（STATE_UPDATE）
**必須データのみ送信:**
```typescript
// ❌ 毎回全データ送信（現在）
{ topic, answer, theme, hint, emojis, originalEmojis, displayedEmojis, dummyIndex, dummyEmoji }

// ✅ 状態ごとに必要なデータのみ送信（推奨）
- discussing → { topic, displayedEmojis, originalEmojis, dummyIndex, dummyEmoji, assignments }
- answering → { } (データ追加なし、状態変更のみ)
- checking → { answer } (新規追加された答えのみ)
```

#### 2. PARTICIPANT_UPDATE
**差分更新を検討:**
```typescript

// ✅ 追加/削除のみ送信
{ action: "add", participant: {...} }
{ action: "remove", user_id: "..." }
```

#### 3. 初回接続時の同期
新規接続や再接続時のみ全データを送信:
```typescript
{
  type: "FULL_SYNC",
  payload: { ...全てのゲームデータ }
}
```

### 実装のメリット

1. **帯域幅削減**: 不要なデータ送信を削減
2. **パフォーマンス向上**: 小さいペイロードで処理が高速化
3. **状態管理の簡素化**: フロントエンドで既存データと自動マージ

### 既存コードの対応状況

フロントエンド側は既に対応済みのため、バックエンド実装時に以下のルールを守るだけで最適化可能:

```typescript
// バックエンドから送信するデータ例
STATE_UPDATE: {
  nextState: "discussing",
  data: {
    topic: "新しいトピック",
    displayedEmojis: [...],
    // 他のフィールドは省略 → フロントエンドが自動保持
  }
}
```

---

## HTTP Endpoints

### 1. POST /api/rooms
**ルーム作成**

**Request Body:** なし

**Response:**
```json
{
  "room_id": "string",
  "user_id": "string",
  "room_code": "string",
  "theme": "string",
  "hint": "string"
}
```

**処理:**
- 新しいルームとホストユーザーを作成
- 6文字のルームコードを生成
- テーマとヒントを生成（またはランダム選択）

---

### 2. POST /api/user
**ルーム参加**

**Request Body:**
```json
{
  "room_code": "string",
  "user_name": "string"
}
```

**Response:**
```json
{
  "room_id": "string",
  "user_id": "string",
  "is_leader": "string" | boolean
}
```

**処理:**
- room_codeでルームを検索
- 新しいユーザーを作成し、ルームに追加
- 最初に参加した人をリーダー（is_Leader=true）に設定
- WebSocket経由で全参加者に参加者リスト更新を通知

---

### 3. POST /api/rooms/:room_id/start
**ゲーム開始（ホストのみ）**

**Request Body:** なし

**Response:**
```json
{
  "status": "success"
}
```

**処理:**
- ゲーム状態を "waiting" → "setting_topic" に遷移
- WebSocket経由で全参加者に STATE_UPDATE を送信

---

### 4. POST /api/rooms/:room_id/topic
**お題と絵文字の送信（ホストのみ）**

**Request Body:**
```json
{
  "topic": "string",
  "emojis": ["emoji1", "emoji2", "emoji3"]
}
```

**Response:**
```json
{
  "status": "success"
}
```

**重要な処理:**
1. **クライアント側でダミー絵文字を注入済み**
   - フロントエンドが `injectDummyEmoji()` を実行
   - `originalEmojis`: ホストが選んだ元の絵文字
   - `displayedEmojis`: ダミーが1つ混入された絵文字配列
   - `dummyIndex`: ダミーの位置
   - `dummyEmoji`: 追加されたダミー絵文字

2. **バックエンドの処理:**
   - WebSocket経由で SUBMIT_TOPIC メッセージを受信（別途）
   - ゲーム状態を "discussing" に遷移
   - 全参加者に以下を送信:
     - displayedEmojis（ダミー混入版）
     - originalEmojis（元の絵文字）
     - dummyIndex、dummyEmoji
   - 5分のタイマーを開始（5秒遅延後）
   - 参加者ごとに絵文字を割り当て

---

### 5. POST /api/rooms/:room_id/answer
**答えの送信（リーダーのみ）**

**Request Body:**
```json
{
  "user_id": "string",
  "answer": "string"
}
```

**Response:**
```json
{
  "status": "success"
}
```

**処理:**
- 答えを保存
- WebSocket経由で ANSWERING メッセージを受信（別途）
- ゲーム状態を "checking" に遷移
- 全参加者に全データ（答え、絵文字、ダミー情報）を送信

---

### 6. POST /api/rooms/:room_id/skip-discussion
**議論をスキップ（ホストのみ）**

**Request Body:** なし

**Response:**
```json
{
  "status": "success"
}
```

**処理:**
- タイマーをクリア
- ゲーム状態を "answering" に遷移
- **重要:** displayedEmojis、originalEmojis、dummyIndex、dummyEmojiを保持して送信

---

### 7. POST /api/rooms/:room_id/finish
**ゲーム終了（ホストのみ）**

**Request Body:** なし

**Response:**
```json
{
  "status": "success"
}
```

**処理:**
- ゲーム状態を "finished" に遷移
- WebSocket経由で STATE_UPDATE を送信

---

## WebSocket Messages

### 接続
**URL:** `ws(s)://HOST/api/rooms/:room_id/ws`

### クライアント → サーバー

#### 1. CLIENT_CONNECTED
```json
{
  "type": "CLIENT_CONNECTED",
  "payload": {
    "user_id": "string",
    "user_name": "string"
  }
}
```
接続時に送信。全クライアントに参加者リストを再配信。

#### 2. FETCH_PARTICIPANTS
```json
{
  "type": "FETCH_PARTICIPANTS"
}
```
参加者リストの最新情報を要求。

**送信間隔:** 30秒ごと（WebSocketイベントで即座に更新されるため、ポーリングは低頻度）

#### 3. SUBMIT_TOPIC
```json
{
  "type": "SUBMIT_TOPIC",
  "payload": {
    "topic": "string",
    "emojis": ["emoji1", "emoji2", "emoji3"],
    "displayedEmojis": ["emoji1", "emoji2", "emoji3", "dummyEmoji"],
    "originalEmojis": ["emoji1", "emoji2", "emoji3"],
    "dummyIndex": 2,
    "dummyEmoji": "🎭"
  }
}
```
**重要:** HTTP /topic の後に送信され、ダミー情報を含む。

#### 4. ANSWERING
```json
{
  "type": "ANSWERING",
  "payload": {
    "answer": "string",
    "topic": "string",
    "selected_emojis": ["emoji1", "emoji2", "emoji3"],
    "displayedEmojis": ["emoji1", "emoji2", "emoji3", "dummyEmoji"],
    "originalEmojis": ["emoji1", "emoji2", "emoji3"],
    "dummyIndex": 2,
    "dummyEmoji": "🎭",
    "theme": "string",
    "hint": "string"
  }
}
```
リーダーが答えを送信した時、全データを含めて送信。

#### 5. WAITING
```json
{
  "type": "WAITING"
}
```
ゲーム開始時に送信。

#### 6. CHECKING
```json
{
  "type": "CHECKING"
}
```
ホストがゲーム終了時に送信。

---

### サーバー → クライアント

#### 1. STATE_UPDATE
```json
{
  "type": "STATE_UPDATE",
  "payload": {
    "nextState": "setting_topic" | "discussing" | "answering" | "checking" | "finished",
    "data": {
      "topic": "string",
      "theme": "string",
      "hint": "string",
      "answer": "string",
      "selected_emojis": ["emoji1", "emoji2", "emoji3"],
      "displayedEmojis": ["emoji1", "emoji2", "emoji3", "dummyEmoji"],
      "originalEmojis": ["emoji1", "emoji2", "emoji3"],
      "dummyIndex": 2,
      "dummyEmoji": "🎭",
      "assignments": [
        { "user_id": "string", "emoji": "emoji1" }
      ]
    }
  }
}
```

**状態遷移:**
- `setting_topic`: ホストがお題を設定
- `discussing`: 議論フェーズ（5分タイマー）
- `answering`: リーダーが答えを入力
- `checking`: 結果確認画面
- `finished`: ゲーム終了

**最適化のための送信例:**
```javascript
// discussing 遷移時 - 新しいトピックと絵文字のみ
{
  "nextState": "discussing",
  "data": {
    "topic": "スティーブジョブズ",
    "displayedEmojis": ["🍎", "📱", "👔", "🎭"],
    "originalEmojis": ["🍎", "📱", "👔"],
    "dummyIndex": 3,
    "dummyEmoji": "🎭",
    "assignments": [...]
    // theme, hint は省略 → フロントエンドが保持済み
  }
}

// answering 遷移時 - 状態変更のみ
{
  "nextState": "answering"
  // data は省略可能 → フロントエンドが全データを保持
}

// checking 遷移時 - 新しい答えのみ
{
  "nextState": "checking",
  "data": {
    "answer": "Apple創業者"
    // 他のデータは省略 → フロントエンドが保持済み
  }
}
```

#### 2. PARTICIPANT_UPDATE
```json
{
  "type": "PARTICIPANT_UPDATE",
  "payload": {
    "participants": [
      {
        "user_id": "string",
        "user_name": "string",
        "role": "host" | "player",
        "is_Leader": boolean
      }
    ]
  }
}
```

**フロントエンド側の最適化（実装済み）:**
- 変更検出により、実際に参加者が変更された場合のみ状態を更新
- 不要な再レンダリングを防止

**最適化案（将来実装可能）:**
```javascript
// 参加者追加時
{
  "type": "PARTICIPANT_ADD",
  "payload": {
    "user_id": "bb-xxxxx",
    "user_name": "たろう",
    "role": "player",
    "is_Leader": true
  }
}

// 参加者退出時
{
  "type": "PARTICIPANT_REMOVE",
  "payload": {
    "user_id": "bb-xxxxx"
  }
}

// 初回接続時のみ全リスト送信
{
  "type": "PARTICIPANT_UPDATE",
  "payload": { "participants": [...] }
}
```

#### 3. TIMER_TICK
```json
{
  "type": "TIMER_TICK",
  "payload": {
    "time": "04:59"
  }
}
```
1秒ごとに送信。フォーマット: "MM:SS"

**✅ 既に最適化済み** - 時間のみ送信（他のデータは含まない）

#### 4. ERROR
```json
{
  "type": "ERROR",
  "payload": {
    "code": "string",
    "message": "string"
  }
}
```

---

## 重要なデータフロー

### ダミー絵文字の処理
1. **ホストがお題と絵文字を選択**
2. **クライアント側で `injectDummyEmoji()` 実行**
   - 3つの絵文字 → 4つに拡張（1つダミー追加）
   - ダミーの位置をランダムに決定
3. **HTTP POST /topic には元の絵文字を送信**
4. **WebSocket SUBMIT_TOPIC にはダミー情報を含めて送信**
5. **サーバーは両方の情報を保持**
   - `originalEmojis`: ホストとリザルト画面で使用
   - `displayedEmojis`: プレイヤー（議論・答え入力）で使用
   - `dummyIndex`, `dummyEmoji`: リザルト画面で表示

### 参加者の役割
- **host (role="host")**: ルーム作成者。お題を設定し、ゲームを進行
- **player (role="player")**: 参加者
- **Leader (is_Leader=true)**: 最初に参加したプレイヤー。答えを入力する役割

### タイマー
- 議論フェーズ: **5分（300秒）**
- 5秒の遅延後にスタート（"Discussion starts in" モーダル表示中）
- 毎秒 TIMER_TICK を送信（時間のみ）
- タイマー終了時に自動的に "answering" 状態に遷移

---

## フロントエンド側のデータ管理

### localStorage による状態永続化

**保存内容:**
```typescript
{
  roomId, roomCode, myUserId, userName, isLeader,
  topic, theme, hint, answer,
  selectedEmojis, originalEmojis, displayedEmojis, dummyIndex, dummyEmoji,
  participantsList, roomState, AssignedEmoji, assignmentsMap, timer
}
```

**保存タイミング:** 状態変更時に自動保存（500msデバウンス処理により、連続した変更を最適化）

**復元タイミング:** ページリロード時、コンポーネントマウント時

### メリット

1. **ページリロードしても状態維持**
2. **バックエンドの負荷軽減** - 再接続時に全データを送信しなくても良い
3. **オフライン耐性** - 一時的な接続断でもデータが保持される

### データ同期戦略

1. **初回接続:** バックエンドから全データを受信
2. **状態遷移:** 新しいデータのみ受信、既存データと自動マージ
3. **再接続:** localStorageから復元、不足分のみバックエンドから取得

### パフォーマンス最適化（実装済み）

#### 1. レンダリング最適化
- **useMemo**: 計算値（`amIHost`, `maxEmoji`）のメモ化
- **useCallback**: イベントハンドラーのメモ化
- **変更検出**: PARTICIPANT_UPDATE時、実際に変更があった場合のみ状態更新

#### 2. ネットワーク最適化
- **FETCH_PARTICIPANTS**: 30秒間隔（WebSocketイベントで即座に更新されるため）
- **デバウンス**: localStorage書き込みを500msデバウンス
- **差分更新**: 必要なデータのみ送受信

#### 3. メモリ最適化
- **不要な状態更新をスキップ**: 同じデータの場合は更新しない
- **依存配列の最適化**: useCallback/useEffectの依存を最小限に

#### 効果
- 📉 レンダリング回数削減
- 📉 ネットワーク帯域削減
- 📉 ディスクI/O削減
- 📉 サーバー負荷削減
- ⚡ 全体的なパフォーマンス向上

---

## データの永続化が必要な情報

バックエンドで保持すべきゲームデータ:

```typescript
{
  room_id: string,
  room_code: string,
  theme: string,
  hint: string,
  topic: string | null,
  answer: string | null,
  
  // 絵文字データ（重要）
  originalEmojis: string[],      // ホストが選んだ元の絵文字
  displayedEmojis: string[],     // ダミー混入版
  dummyIndex: number | null,     // ダミーの位置
  dummyEmoji: string | null,     // 追加されたダミー絵文字
  
  // 参加者
  participants: [
    {
      user_id: string,
      user_name: string,
      role: "host" | "player",
      is_Leader: boolean
    }
  ],
  
  // 状態
  state: "waiting" | "setting_topic" | "discussing" | "answering" | "checking" | "finished"
}
```

---

## セキュリティとバリデーション

1. **認証:** 各リクエストに user_id を含めて、権限を確認
2. **ホスト権限:** start, topic, skip-discussion, finish はホストのみ
3. **リーダー権限:** answer はリーダーのみ
4. **room_code バリデーション:** 6文字の英数字
5. **タイマー検証:** サーバー側でタイマーを管理（クライアント側は表示のみ）
6. **絵文字数バリデーション:** originalEmojis は3つ固定、displayedEmojis は4つ固定
5. **絵文字の数:** 3つ固定（displayedEmojis は4つ）
6. **タイマー制御:** サーバー側でタイマーを管理し、クライアントは表示のみ

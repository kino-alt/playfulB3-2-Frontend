# Backend Implementation Guide

> このドキュメントはバックエンド実装者向けの完全な仕様書です。  
> すべての要件を満たすことで、フロントエンドと正常に連携できます。

---

## 📋 目次

1. [WebSocket接続](#websocket接続)
2. [必須データ構造](#必須データ構造)
3. [状態遷移フロー](#状態遷移フロー)
4. [HTTP API仕様](#http-api仕様)
5. [WebSocketメッセージ仕様](#websocketメッセージ仕様)
6. [実装の重要ポイント](#実装の重要ポイント)
7. [エラーハンドリング](#エラーハンドリング)
8. [テストシナリオ](#テストシナリオ)

---

## WebSocket接続

**エンドポイント:** `ws://localhost:8080/ws?room_id={room_id}`

**接続時の動作:**
1. クライアントは `?room_id=` パラメータでルームIDを指定
2. サーバーは接続を確立後、参加者リスト（PARTICIPANT_UPDATE）を**即座に**自動送信
3. クライアントから FETCH_PARTICIPANTS で手動取得も可能（冗長性確保）

**切断時の動作:**
1. WebSocket が close された場合、サーバーは onclose ハンドラーで検出
2. **その user_id を participants から削除**
3. 全員に PARTICIPANT_UPDATE を配信（更新された参加者リスト）
4. これにより、タイトル画面に戻ったユーザーは参加者リストから消える

**実装例:**
```go
ws.SetCloseHandler(func(code int, text string) error {
  // 参加者を削除
  participants = removeParticipant(participants, userId)
  
  // 全員に配信
  broadcast(room, map[string]interface{}{
    "type": "PARTICIPANT_UPDATE",
    "payload": map[string]interface{}{
      "participants": participants,
    },
  })
  
  return nil
})
```

**注意事項:**
- WebSocket接続は room_id ごとに管理
- 同じ user_id による複数接続は最新の接続のみ有効
- 切断時は参加者リストから削除して PARTICIPANT_UPDATE を再配信

---

## 必須データ構造

### ゲームデータ保持（ルームごと）
```javascript
// 各ルームは以下のデータを保持する必要があります
const roomData = {
  room_id: "abc123",
  room_code: "AAAAAA",       // 6桁の参加コード
  theme: "人物",              // テーマ
  hint: "hint text",          // ヒント
  currentState: "waiting",    // 現在の状態
  
  // ゲームデータ
  gameData: {
    topic: null,              // ホストが入力したお題
    originalEmojis: [],       // ホストが選んだ絵文字(3~5個)
    displayedEmojis: [],      // ダミー込み絵文字配列(4~6個)
    dummyIndex: null,         // ダミーの位置 0~(配列長-1)
    dummyEmoji: null,         // ダミー絵文字（例: "🎭"）
    answer: null,             // リーダーが入力した答え
    assignments: []           // 各プレイヤーの担当絵文字
    // 例: [{ user_id: "id1", emoji: "🍎" }, ...]
  },
  
  // 参加者データ
  participants: [],
  
  // タイマー管理
  timer: null,                // タイマーID
  remainingTime: 300          // 残り時間（秒）
};
```

### 参加者データ
```javascript
participants = [
  {
    user_id: "unique-id",     // ユーザーID（UUID推奨）
    user_name: "name",        // 表示名
    role: "host",             // "host" | "player"
    is_Leader: true           // true | false
  }
];
```

**重要な仕様:**
- **最初の参加者（ルーム作成者）:** `role: "host"`, `is_Leader: true`
- **2人目以降の参加者:** `role: "player"`, `is_Leader: false`
- `role` と `is_Leader` は**別の概念**
  - `role`: ゲーム進行の操作権限（start, skip, finish）
  - `is_Leader`: 答えを入力する権限

---

## 状態遷移フロー

### 状態一覧
```
WAITING           → ゲーム開始待ち
SETTING_TOPIC     → ホストがお題と絵文字を設定中
DISCUSSING        → プレイヤーが議論中（タイマー稼働）
ANSWERING         → リーダーが答えを入力中
CHECKING          → 答えの確認・結果表示
FINISHED          → ゲーム終了
```

### 完全な状態遷移シーケンス

#### 1️⃣ WAITING → SETTING_TOPIC
**トリガー:** POST `/api/rooms/:room_id/start`  
**条件:** `role === "host"`  
**処理:**
```javascript
currentState = "setting_topic";
broadcast({
  type: "STATE_UPDATE",
  payload: {
    nextState: "setting_topic",
    data: {}  // データ不要
  }
});
```

#### 2️⃣ SETTING_TOPIC → DISCUSSING
**トリガー:** HTTP POST `/api/rooms/:room_id/topic` + WebSocket `SUBMIT_TOPIC`  
**条件:** `role === "host"`  
**処理フロー:**
```javascript
// ① HTTP POST /topic を受信
POST /topic { topic: "スティーブ・ジョブズ", emojis: ["🍎", "📱", "👔"] }
→ gameData.topic = "スティーブ・ジョブズ"

// ② WebSocket SUBMIT_TOPIC を受信（直後にフロントから送信される）
WS SUBMIT_TOPIC {
  displayedEmojis: ["🍎", "📱", "👔", "🎭"],  // ダミー込み
  originalEmojis: ["🍎", "📱", "👔"],
  dummyIndex: 3,
  dummyEmoji: "🎭"
}
→ gameData.displayedEmojis = ["🍎", "📱", "👔", "🎭"]
→ gameData.originalEmojis = ["🍎", "📱", "👔"]
→ gameData.dummyIndex = 3
→ gameData.dummyEmoji = "🎭"

// ③ プレイヤーへ絵文字を割り振り
const players = participants.filter(p => p.role === "player");
gameData.assignments = players.map((p, idx) => ({
  user_id: p.user_id,
  emoji: gameData.originalEmojis[idx % gameData.originalEmojis.length]
}));

// ④ STATE_UPDATE を配信
currentState = "discussing";
broadcast({
  type: "STATE_UPDATE",
  payload: {
    nextState: "discussing",
    data: {
      topic: gameData.topic,
      displayedEmojis: gameData.displayedEmojis,  // プレイヤー用（ダミー込み）
      originalEmojis: gameData.originalEmojis,    // ホスト確認用
      dummyIndex: gameData.dummyIndex,
      dummyEmoji: gameData.dummyEmoji,
      assignments: gameData.assignments
    }
  }
});

// ⑤ 5秒後にタイマー開始
setTimeout(() => {
  startTimer(300);  // 300秒 = 5分
}, 5000);
```

#### 3️⃣ DISCUSSING → ANSWERING
**トリガー:** POST `/api/rooms/:room_id/skip-discussion` またはタイマー終了  
**条件:** `role === "host"` (skip時のみ)

**処理:**
```javascript
// タイマー停止
clearInterval(timer);

currentState = "answering";
broadcast({
  type: "STATE_UPDATE",
  payload: {
    nextState: "answering",
    data: {
      // ⚠️ ダミーデータは必ず含める（差分更新対応のため省略可能だが推奨）
      displayedEmojis: gameData.displayedEmojis,
      originalEmojis: gameData.originalEmojis,
      dummyIndex: gameData.dummyIndex,
      dummyEmoji: gameData.dummyEmoji
    }
  }
});
```

**skip-discussion のリクエスト形式:**
```json
Request: { "user_id": "host-user-id" }
```

#### 4️⃣ ANSWERING → CHECKING
**トリガー:** POST `/api/rooms/:room_id/answer`  
**条件:** `is_Leader === true`

**処理:**
```javascript
// HTTP POST /answer を受信
POST /answer { user_id: "leader-id", answer: "スティーブ・ジョブズ" }
→ gameData.answer = "スティーブ・ジョブズ"

currentState = "checking";
broadcast({
  type: "STATE_UPDATE",
  payload: {
    nextState: "checking",
    data: {
      answer: gameData.answer,
      // ダミーデータも送信（差分更新で省略可能）
      displayedEmojis: gameData.displayedEmojis,
      originalEmojis: gameData.originalEmojis,
      dummyIndex: gameData.dummyIndex,
      dummyEmoji: gameData.dummyEmoji
    }
  }
});
```

#### 5️⃣ CHECKING → FINISHED
**トリガー:** POST `/api/rooms/:room_id/finish`  
**条件:** `role === "host"`

**処理:**
```javascript
currentState = "finished";
broadcast({
  type: "STATE_UPDATE",
  payload: {
    nextState: "finished",
    data: {}
  }
});
```

---

## HTTP API仕様

### 1. POST /api/rooms
**説明:** 新しいルームを作成  
**認証:** 不要  
**リクエスト:** なし

**レスポンス:**
```json
{
  "room_id": "abc123",
  "user_id": "host-unique-id",
  "room_code": "AAAAAA",
  "theme": "人物",
  "hint": "この人物は..."
}
```

**処理内容:**
- ルームデータを初期化
- 6桁のランダムな参加コード（AAAAAA形式）を生成
- ホストユーザーを作成し participants に追加
  ```javascript
  participants.push({
    user_id: "host-unique-id",
    user_name: "Host",
    role: "host",
    is_Leader: true
  });
  ```

---

### 2. POST /api/user
**説明:** 既存ルームに参加  
**認証:** 不要

**リクエスト:**
```json
{
  "room_code": "AAAAAA",
  "user_name": "Player1"
}
```

**レスポンス:**
```json
{
  "room_id": "abc123",
  "user_id": "player-unique-id",
  "is_leader": false
}
```

**処理内容:**
- room_code からルームを検索
- 新しい user_id を生成
- participants に追加
  ```javascript
  participants.push({
    user_id: "player-unique-id",
    user_name: "Player1",
    role: "player",
    is_Leader: false
  });
  ```
- **WebSocketで全員に PARTICIPANT_UPDATE を配信**

---

### 3. POST /api/rooms/:room_id/start
**説明:** ゲームを開始（WAITING → SETTING_TOPIC）  
**権限:** `role === "host"`

**リクエスト:** なし  
**レスポンス:** `{ "success": true }`

**処理内容:**
- 権限チェック
- 状態を `setting_topic` に変更
- WebSocketで STATE_UPDATE を配信

---

### 4. POST /api/rooms/:room_id/topic
**説明:** お題と絵文字を保存（HTTP部分のみ）  
**権限:** `role === "host"`

**リクエスト:**
```json
{
  "topic": "スティーブ・ジョブズ",
  "emojis": ["🍎", "📱", "👔"]
}
```

**レスポンス:** `{ "success": true }`

**処理内容:**
- `gameData.topic` を保存
- **WebSocket SUBMIT_TOPIC の受信を待つ**（ダミーデータ取得のため）
- SUBMIT_TOPIC 受信後に DISCUSSING へ遷移

---

### 5. POST /api/rooms/:room_id/answer
**説明:** リーダーの答えを保存（ANSWERING → CHECKING）  
**権限:** `is_Leader === true`

**リクエスト:**
```json
{
  "user_id": "leader-id",
  "answer": "スティーブ・ジョブズ"
}
```

**レスポンス:** `{ "success": true }`

**処理内容:**
- user_id が is_Leader === true か確認
- `gameData.answer` を保存
- 状態を `checking` に変更
- WebSocketで STATE_UPDATE を配信

---

### 6. POST /api/rooms/:room_id/skip-discussion
**説明:** 議論をスキップ（DISCUSSING → ANSWERING）  
**権限:** `role === "host"`

**リクエスト:**
```json
{
  "user_id": "host-user-id"
}
```

**レスポンス:** `{ "success": true }`

**処理内容:**
- 権限チェック（role === "host"）
- タイマーを停止
- 状態を `answering` に変更
- WebSocketで STATE_UPDATE を配信（**ダミーデータ含む**）

---

### 7. POST /api/rooms/:room_id/finish
**説明:** ゲームを終了（CHECKING → FINISHED）  
**権限:** `role === "host"`

**リクエスト:** なし  
**レスポンス:** `{ "success": true }`

**処理内容:**
- 権限チェック
- 状態を `finished` に変更
- WebSocketで STATE_UPDATE を配信

---

## WebSocketメッセージ仕様

### クライアント → サーバー

#### 1. CLIENT_CONNECTED
**タイミング:** WebSocket接続直後  
**目的:** 参加者情報の登録

```json
{
  "type": "CLIENT_CONNECTED",
  "payload": {
    "user_id": "unique-id",
    "user_name": "Player1"
  }
}
```

**サーバー側処理:**
- 参加者リストに追加（まだない場合）
- 全員に PARTICIPANT_UPDATE を配信

---

#### 2. FETCH_PARTICIPANTS
**タイミング:** クライアントが参加者リストを取得したいとき  
**目的:** 手動で参加者リスト取得

```json
{
  "type": "FETCH_PARTICIPANTS"
}
```

**サーバー側処理:**
- リクエストしたクライアントに PARTICIPANT_UPDATE を返送

---

#### 3. SUBMIT_TOPIC
**タイミング:** HTTP POST /topic の直後  
**目的:** ダミー絵文字情報をサーバーに送信

```json
{
  "type": "SUBMIT_TOPIC",
  "payload": {
    "displayedEmojis": ["🍎", "📱", "👔", "🎭"],
    "originalEmojis": ["🍎", "📱", "👔"],
    "dummyIndex": 3,
    "dummyEmoji": "🎭"
  }
}
```

**重要:** `displayedEmojis` はダミーを含めた配列（4〜6個）

**サーバー側処理:**
```javascript
gameData.displayedEmojis = payload.displayedEmojis;
gameData.originalEmojis = payload.originalEmojis;
gameData.dummyIndex = payload.dummyIndex;
gameData.dummyEmoji = payload.dummyEmoji;

// プレイヤーへ絵文字割り当て
const players = participants.filter(p => p.role === "player");
gameData.assignments = players.map((p, idx) => ({
  user_id: p.user_id,
  emoji: gameData.originalEmojis[idx % gameData.originalEmojis.length]
}));

// DISCUSSING へ遷移
currentState = "discussing";
broadcast(STATE_UPDATE with all data);

// 5秒後にタイマー開始
setTimeout(() => startTimer(300), 5000);
```

---

#### 4. ANSWERING
**タイミング:** 現在未使用（将来の拡張用）  
**目的:** WebSocket経由での答え送信

```json
{
  "type": "ANSWERING",
  "payload": {
    "answer": "スティーブ・ジョブズ",
    "displayedEmojis": [...],
    "originalEmojis": [...],
    "dummyIndex": 3,
    "dummyEmoji": "🎭"
  }
}
```

#### 5. CLIENT_DISCONNECTED
**タイミング:** クライアントがタイトル画面に戻るとき  
**目的:** ユーザーがルームを退出（バックエンドから参加者リストから削除）

```json
{
  "type": "CLIENT_DISCONNECTED",
  "payload": {
    "reason": "returning_to_title"
  }
}
```

**サーバー側処理:**
```javascript
if (type === 'CLIENT_DISCONNECTED') {
  // 参加者リストから削除
  participants = participants.filter(p => p.user_id !== userId);
  
  // 全員に PARTICIPANT_UPDATE を配信
  broadcast({
    type: "PARTICIPANT_UPDATE",
    payload: { participants }
  });
}
```

---

### サーバー → クライアント

#### 1. STATE_UPDATE
**タイミング:** 状態遷移時  
**目的:** ゲーム状態とデータの同期

```json
{
  "type": "STATE_UPDATE",
  "payload": {
    "nextState": "discussing",
    "data": {
      "topic": "スティーブ・ジョブズ",
      "displayedEmojis": ["🍎", "📱", "👔", "🎭"],
      "originalEmojis": ["🍎", "📱", "👔"],
      "dummyIndex": 3,
      "dummyEmoji": "🎭",
      "assignments": [
        { "user_id": "player1-id", "emoji": "🍎" },
        { "user_id": "player2-id", "emoji": "📱" }
      ],
      "answer": "スティーブ・ジョブズ"
    }
  }
}
```

**nextState の値:**
- `"waiting"` - 待機中
- `"setting_topic"` - お題設定中
- `"discussing"` - 議論中
- `"answering"` - 答え入力中
- `"checking"` - 答え確認中
- `"finished"` - ゲーム終了

**data フィールド:**
- **フロントエンドは差分更新に対応** → `undefined` のフィールドは前の値を保持
- **推奨:** 初回の状態遷移では全データを送信、以降は変更があったフィールドのみ送信
- **最低限:** DISCUSSING 遷移時に全ダミーデータを含める

**状態別の必須データ:**
| 状態 | 必須フィールド |
|------|---------------|
| SETTING_TOPIC | なし |
| DISCUSSING | topic, displayedEmojis, originalEmojis, dummyIndex, dummyEmoji, assignments |
| ANSWERING | (ダミーデータは保持されているため省略可) |
| CHECKING | answer, (ダミーデータ) |
| FINISHED | なし |

---

#### 2. PARTICIPANT_UPDATE
**タイミング:** 参加者の増減時  
**目的:** 参加者リストの同期

```json
{
  "type": "PARTICIPANT_UPDATE",
  "payload": {
    "participants": [
      {
        "user_id": "host-id",
        "user_name": "Host",
        "role": "host",
        "is_Leader": true
      },
      {
        "user_id": "player1-id",
        "user_name": "Player1",
        "role": "player",
        "is_Leader": false
      }
    ]
  }
}
```

**送信タイミング:**
- WebSocket接続時（自動）
- 新しい参加者が join したとき
- 参加者が切断したとき
- FETCH_PARTICIPANTS を受信したとき

---

#### 3. TIMER_TICK
**タイミング:** 議論中、毎秒  
**目的:** 残り時間の表示

```json
{
  "type": "TIMER_TICK",
  "payload": {
    "time": "04:59"
  }
}
```

**フォーマット:** `"MM:SS"` （例: "05:00", "04:30", "00:01"）  
**送信頻度:** 毎秒（1000ms間隔）  
**タイマー長:** 300秒（5分）

**実装例:**
```javascript
let remainingTime = 300;
const timer = setInterval(() => {
  if (remainingTime <= 0) {
    clearInterval(timer);
    // 自動的に ANSWERING へ遷移
    transitionToAnswering();
    return;
  }
  
  const minutes = Math.floor(remainingTime / 60);
  const seconds = remainingTime % 60;
  const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  broadcast({
    type: "TIMER_TICK",
    payload: { time: timeStr }
  });
  
  remainingTime--;
}, 1000);
```

---

#### 4. ERROR
**タイミング:** エラー発生時  
**目的:** クライアントへのエラー通知

```json
{
  "type": "ERROR",
  "payload": {
    "code": "PERMISSION_DENIED",
    "message": "Only the host can start the game"
  }
}
```

**エラーコード例:**
- `PERMISSION_DENIED` - 権限不足
- `INVALID_STATE` - 不正な状態遷移
- `ROOM_NOT_FOUND` - ルームが存在しない
- `USER_NOT_FOUND` - ユーザーが存在しない
- `INVALID_DATA` - データが不正

---

## 実装の重要ポイント

### 🔴 1. ダミー絵文字データの管理

**必須:**
- `displayedEmojis`: ダミーを含めた絵文字配列（4〜6個）
- `originalEmojis`: ホストが選んだ元の絵文字（3〜5個）
- `dummyIndex`: ダミーの位置（0 〜 配列長-1）
- `dummyEmoji`: ダミー絵文字（例: "🎭"）

**データフロー:**
```
1. ホストが絵文字を選択（originalEmojis: ["🍎", "📱", "👔"]）
2. フロントでダミーを追加（displayedEmojis: ["🍎", "📱", "👔", "🎭"]）
3. HTTP POST /topic で topic だけ送信
4. WebSocket SUBMIT_TOPIC で全ダミーデータ送信
5. バックエンドで保存し、STATE_UPDATE で全員に配信
```

**すべての状態遷移で保持:**
- DISCUSSING → ANSWERING → CHECKING で常にダミーデータを含める
- skip-discussion 時も**必須**

---

### 🔴 2. HTTP + WebSocket 二重通信パターン

**POST /topic の処理:**
```javascript
// ① HTTP でお題を受信
app.post('/api/rooms/:room_id/topic', (req, res) => {
  const { topic, emojis } = req.body;
  
  // topic のみ保存（emojis はフロント側でダミー処理される）
  gameData.topic = topic;
  
  res.json({ success: true });
  
  // ② WebSocket SUBMIT_TOPIC を待つ（同期しない）
});

// ③ WebSocket でダミーデータを受信
ws.on('message', (msg) => {
  const { type, payload } = JSON.parse(msg);
  
  if (type === 'SUBMIT_TOPIC') {
    // ダミーデータを保存
    gameData.displayedEmojis = payload.displayedEmojis;
    gameData.originalEmojis = payload.originalEmojis;
    gameData.dummyIndex = payload.dummyIndex;
    gameData.dummyEmoji = payload.dummyEmoji;
    
    // プレイヤーへ絵文字割り当て
    assignEmojisToPlayers();
    
    // DISCUSSING へ遷移
    currentState = "discussing";
    broadcast({
      type: "STATE_UPDATE",
      payload: {
        nextState: "discussing",
        data: {
          topic: gameData.topic,
          displayedEmojis: gameData.displayedEmojis,
          originalEmojis: gameData.originalEmojis,
          dummyIndex: gameData.dummyIndex,
          dummyEmoji: gameData.dummyEmoji,
          assignments: gameData.assignments
        }
      }
    });
    
    // 5秒後にタイマー開始
    setTimeout(() => {
      startTimer(300);
    }, 5000);
  }
});
```

---

### 🔴 3. タイマー管理

**仕様:**
- 議論時間: **300秒（5分）**
- 開始遅延: **5秒**（DISCUSSING 遷移後）
- フォーマット: **"MM:SS"**
- 送信頻度: **毎秒**

**実装例:**
```javascript
function startTimer(duration) {
  let remainingTime = duration;
  
  const timer = setInterval(() => {
    if (remainingTime <= 0) {
      clearInterval(timer);
      // タイマー終了 → 自動的に ANSWERING へ
      transitionToAnswering();
      return;
    }
    
    // MM:SS 形式に変換
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;
    const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
    // 全員に配信
    broadcast({
      type: "TIMER_TICK",
      payload: { time: timeStr }
    });
    
    remainingTime--;
  }, 1000);
  
  // タイマーIDを保存（skip時に停止できるように）
  roomData.timer = timer;
}

// skip-discussion 時の処理
function skipDiscussion() {
  if (roomData.timer) {
    clearInterval(roomData.timer);
    roomData.timer = null;
  }
  transitionToAnswering();
}
```

---

### 🔴 4. 権限チェック

**2種類の権限:**

| 権限 | 条件 | 操作 |
|-----|------|------|
| ホスト権限 | `role === "host"` | start, skip-discussion, finish |
| リーダー権限 | `is_Leader === true` | answer 入力 |

**注意:** `role` と `is_Leader` は別の概念
- ホスト（最初の参加者）: `role: "host"`, `is_Leader: true`
- プレイヤー: `role: "player"`, `is_Leader: false`

**実装例:**
```javascript
// ホスト権限チェック
function requireHost(userId) {
  const user = participants.find(p => p.user_id === userId);
  if (!user || user.role !== "host") {
    throw new Error("PERMISSION_DENIED");
  }
}

// リーダー権限チェック
function requireLeader(userId) {
  const user = participants.find(p => p.user_id === userId);
  if (!user || !user.is_Leader) {
    throw new Error("PERMISSION_DENIED");
  }
}
```

---

### 🔴 5. プレイヤーへの絵文字割り当て

**重要:** プレイヤーに割り当てる絵文字は `displayEmojis`（ダミー込み）から選ぶ

**DISCUSSING 遷移時に実行:**
```javascript
function assignEmojisToPlayers() {
  const players = participants.filter(p => p.role === "player");
  
  // ✅ displayEmojis（ダミー込み）から選ぶ
  gameData.assignments = players.map((player, index) => ({
    user_id: player.user_id,
    emoji: gameData.displayEmojis[index % gameData.displayEmojis.length]
  }));
}
```

**理由:**
- プレイヤーはダミーを含む絵文字の説明をする
- `displayEmojis` にはダミーが混在している（プレイヤーはそれを知らない）
- `originalEmojis` は元の絵文字のみ（プレイヤーには見せない）

**例:**
- `displayEmojis: ["🍎", "📱", "👔", "🎭"]` (ダミー=🎭)
- プレイヤー3人 → player1="🍎", player2="📱", player3="👔"
- プレイヤー4人 → player1="🍎", player2="📱", player3="👔", player4="🎭" (ダミーを説明)

---

### 🔴 6. 差分更新の最適化（推奨）

フロントエンドは差分更新に対応しているため、効率化できます：

```javascript
// ✅ 初回（DISCUSSING）: 全データ送信
broadcast({
  type: "STATE_UPDATE",
  payload: {
    nextState: "discussing",
    data: {
      topic: "...",
      displayedEmojis: [...],
      originalEmojis: [...],
      dummyIndex: 3,
      dummyEmoji: "🎭",
      assignments: [...]
    }
  }
});

// ✅ 2回目（ANSWERING）: 状態のみ送信（データは保持される）
broadcast({
  type: "STATE_UPDATE",
  payload: {
    nextState: "answering",
    data: {}  // または省略
  }
});

// ✅ 3回目（CHECKING）: 答えだけ送信
broadcast({
  type: "STATE_UPDATE",
  payload: {
    nextState: "checking",
    data: {
      answer: "スティーブ・ジョブズ"
    }
  }
});
```

**メリット:**
- 帯域幅削減
- レスポンス速度向上
- データ転送量の最適化

---

## エラーハンドリング

### エラー時の基本対応

```javascript
function sendError(ws, code, message) {
  ws.send(JSON.stringify({
    type: "ERROR",
    payload: { code, message }
  }));
}
```

### 主要なエラーケース

#### 1. 権限エラー
```javascript
// ホスト以外が start を実行
if (user.role !== "host") {
  return sendError(ws, "PERMISSION_DENIED", "Only the host can start the game");
}

// リーダー以外が answer を送信
if (!user.is_Leader) {
  return sendError(ws, "PERMISSION_DENIED", "Only the leader can submit the answer");
}
```

#### 2. 状態エラー
```javascript
// 不正な状態遷移
if (currentState !== "waiting") {
  return sendError(ws, "INVALID_STATE", "Game has already started");
}
```

#### 3. データエラー
```javascript
// 必須フィールドの欠如
if (!payload.displayedEmojis || payload.displayedEmojis.length < 4) {
  return sendError(ws, "INVALID_DATA", "displayedEmojis must have at least 4 items");
}
```

#### 4. リソースエラー
```javascript
// ルームが存在しない
if (!roomData) {
  return sendError(ws, "ROOM_NOT_FOUND", "Room does not exist");
}
```

---

## テストシナリオ

### シナリオ1: 正常なゲームフロー

```
1. ホストがルーム作成
   → POST /api/rooms
   → レスポンス確認（room_id, room_code）

2. プレイヤー2人が参加
   → POST /api/user (player1)
   → POST /api/user (player2)
   → WebSocket接続
   → PARTICIPANT_UPDATE 受信（3人表示）

3. ホストがゲーム開始
   → POST /api/rooms/:id/start
   → STATE_UPDATE (setting_topic) 受信

4. ホストがお題を設定
   → POST /api/rooms/:id/topic
   → WebSocket SUBMIT_TOPIC 送信
   → STATE_UPDATE (discussing) 受信
   → 5秒待つ
   → TIMER_TICK 開始（"05:00" → "04:59" → ...）

5. 議論（300秒 or skip）
   → オプション: POST /api/rooms/:id/skip-discussion
   → STATE_UPDATE (answering) 受信

6. リーダーが答えを入力
   → POST /api/rooms/:id/answer
   → STATE_UPDATE (checking) 受信

7. ホストがゲーム終了
   → POST /api/rooms/:id/finish
   → STATE_UPDATE (finished) 受信
```

### シナリオ2: エラーケース

```
1. プレイヤーが start を実行
   → ERROR (PERMISSION_DENIED) 受信

2. ホスト以外が skip-discussion を実行
   → ERROR (PERMISSION_DENIED) 受信

3. リーダー以外が answer を送信
   → ERROR (PERMISSION_DENIED) 受信

4. 不正な room_code で参加
   → HTTP 404 or ERROR

5. WebSocket 切断後の再接続
   → PARTICIPANT_UPDATE で最新状態を受信
```

### 検証項目チェックリスト

- [ ] ルーム作成時に room_code が6桁英数字
- [ ] 最初の参加者が `role: "host"`, `is_Leader: true`
- [ ] 2人目以降が `role: "player"`, `is_Leader: false`
- [ ] WebSocket接続時に PARTICIPANT_UPDATE が自動送信される
- [ ] POST /topic 後に SUBMIT_TOPIC を受信して DISCUSSING へ遷移
- [ ] タイマーが5秒遅延後に開始され、毎秒 TIMER_TICK が送信される
- [ ] タイマーフォーマットが "MM:SS"
- [ ] skip-discussion でタイマーが停止する
- [ ] displayedEmojis にダミーが含まれている（4〜6個）
- [ ] originalEmojis にダミーが含まれていない（3〜5個）
- [ ] プレイヤーへの絵文字割り当てが正しい
- [ ] STATE_UPDATE の nextState が正しい
- [ ] 権限チェックが正しく機能する
- [ ] エラー時に ERROR メッセージが送信される

---

## まとめ

### 実装の優先順位

1. **必須（P0）:**
   - HTTP API 全7エンドポイント
   - WebSocket メッセージ送受信
   - 状態遷移ロジック
   - 権限チェック

2. **重要（P1）:**
   - タイマー機能
   - ダミーデータ管理
   - エラーハンドリング

3. **推奨（P2）:**
   - 差分更新の最適化
   - WebSocket切断時の再接続処理
   - ログ記録

### 実装時の注意点

✅ **必ず実装すべきこと:**
- HTTP POST /topic と WebSocket SUBMIT_TOPIC の連携
- ダミーデータの全状態での保持
- タイマーの5秒遅延開始
- 権限チェック（host, is_Leader）

❌ **やってはいけないこと:**
- HTTP POST /topic だけで DISCUSSING へ遷移（SUBMIT_TOPIC を待つ）
- ダミーデータを state 遷移時に省略
- タイマーを即座に開始（5秒待つ）
- 権限チェックの省略

---

**このドキュメントに従って実装すれば、フロントエンドと完全に連携できます。**
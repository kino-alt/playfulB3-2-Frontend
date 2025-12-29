# Backend API Specification

このドキュメントは、現在のフロントエンド実装に基づくバックエンドAPIの仕様です。

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
- `discussing`: 議論フェーズ（10分タイマー）
- `answering`: リーダーが答えを入力
- `checking`: 結果確認画面
- `finished`: ゲーム終了

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

#### 3. TIMER_TICK
```json
{
  "type": "TIMER_TICK",
  "payload": {
    "time": "09:59"
  }
}
```
1秒ごとに送信。フォーマット: "MM:SS"

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
- 議論フェーズ: **10分（600秒）**
- 5秒の遅延後にスタート（"Discussion starts in" モーダル表示中）
- 毎秒 TIMER_TICK を送信
- タイマー終了時に自動的に "answering" 状態に遷移

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
5. **絵文字の数:** 3つ固定（displayedEmojis は4つ）
6. **タイマー制御:** サーバー側でタイマーを管理し、クライアントは表示のみ

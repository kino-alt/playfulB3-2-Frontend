import { http, HttpResponse, delay } from 'msw'

export const handlers = [
  // ---------------------------------------------------------
  // 1. Room関連
  // ---------------------------------------------------------

  // 1.1 Roomの作成
  http.post('*/api/rooms', async () => {
    // ネットワーク遅延をシミュレート
    await delay(500);
    return HttpResponse.json({
      "room_id": "3f316353-f3ab-9bc1-9f68-3bc999ef7486",
      "user_id": "ff6a4c2c-b396-a84f-9c3c-6513baf12611",
      "room_code": "AAAAAA",
      "theme": "人物",
      "hint": "出身地、性別、やったこと",
    }, { status: 201 });
  }),

  // 1.2 テーマ、絵文字の設定
  http.post('*/api/rooms/:room_id/topic', async ({ params, request }) => {
    const { room_id } = params;
    const body = await request.json();
    console.log(`Room ID: ${room_id} にトピックを設定しました:`, body);
    
    await delay(500);
    return new HttpResponse(null, { status: 200 });
  }),

  // 1.3 回答の提出
  http.post('*/api/rooms/:room_id/answer', async ({ params, request }) => {
    const { room_id } = params;
    const body = await request.json();
    console.log(`Room ID: ${room_id} に回答を提出しました:`, body);

    await delay(500);
    return new HttpResponse(null, { status: 200 });
  }),

  // 1.4 ルーム参加
  http.post('*/api/user', async ({ request }) => {
    const body = await request.json() as any;
    await delay(500);

    // ルームコードが正しくない場合などのエラーシミュレーションも可能
    if (body.room_code === "ERROR") {
        return new HttpResponse(null, { status: 404 });
    }

    return HttpResponse.json({
      "room_id": "3f316353-f3ab-9bc1-9f68-3bc999ef7486",
      "user_id": "2bc78967-4244-dcf6-4929-bc5ed70e4d09",
      "is_leader": true, // 文字列ではなく真偽値として定義（リポジトリの型に合わせる）
    }, { status: 200 });
  }),
];
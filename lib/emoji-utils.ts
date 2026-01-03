// lib/emoji-utils.ts

/**
 * ダミー絵文字候補リスト
 * ゲームに使われにくい、全く関係のない絵文字を用意
 */
const DUMMY_EMOJI_POOL = [
  "🔧", "🔨", "🪛", "⚙️", "🔩",   // 工具系
  "🚗", "🚕", "🚙", "🚌", "🚎",   // 車両系
  "🌵", "🌴", "🌲", "🌳", "🌿",   // 植物系
  "🏔️", "⛰️", "🗻", "🏕️", "🏖️",   // 地形系
  "📱", "💻", "⌨️", "🖥️", "🖨️",   // 電子機器系
  "🎲", "🎯", "🎪", "🎭", "🎨",   // エンタメ系
  "🔔", "🔕", "📢", "📣", "📯",   // 音系
  "🧲", "🧪", "🧬", "🔬", "🔭",   // 科学系
];

/**
 * ダミー絵文字注入結果
 */
export interface DummyInjectionResult {
  originalEmojis: string[];      // ホストが選んだ元の配列
  displayedEmojis: string[];     // ダミーが混じった配列（プレイヤーに見せる）
  dummyIndex: number;            // 置換された位置 (0-based index)
  dummyEmoji: string;            // 実際に注入されたダミー絵文字
}

/**
 * 絵文字リストの中からランダムに1つをダミー絵文字に置き換える
 * 
 * @param emojis - ホストが選んだ絵文字の配列
 * @returns DummyInjectionResult - 元の配列、表示用配列、ダミーの位置とその絵文字
 */
export function injectDummyEmoji(emojis: string[]): DummyInjectionResult {
  if (emojis.length === 0) {
    throw new Error("Cannot inject dummy into empty emoji array");
  }

  // 元の配列を保存
  const originalEmojis = [...emojis];

  // 置き換える位置をランダムに選択
  const dummyIndex = Math.floor(Math.random() * emojis.length);

  // 元の絵文字リストに含まれていないダミーを選ぶ
  const availableDummies = DUMMY_EMOJI_POOL.filter(
    (dummy) => !emojis.includes(dummy)
  );

  if (availableDummies.length === 0) {
    console.warn("[DummyInjection] All dummy candidates are already in use, using fallback");
    // フォールバック: とりあえずプールから選ぶ
    availableDummies.push(...DUMMY_EMOJI_POOL);
  }

  // ランダムにダミーを選択
  const dummyEmoji = availableDummies[Math.floor(Math.random() * availableDummies.length)];

  // 表示用配列を作成し、指定位置をダミーに置換
  const displayedEmojis = [...emojis];
  displayedEmojis[dummyIndex] = dummyEmoji;

  console.log("[DummyInjection] Injected at index", dummyIndex, ":", emojis[dummyIndex], "→", dummyEmoji);

  return {
    originalEmojis,
    displayedEmojis,
    dummyIndex,
    dummyEmoji,
  };
}

"use client"

import { useEffect } from "react"
import { EmojiBackgroundLayout } from "./emoji-background-layout"
import { PageHeader } from "./page-header"
import { TextInput } from "./text-input"
import { TextDisplay } from "./text-display" 
import { GameButton } from "./game-button"
import { useRoomData } from '@/contexts/room-context';
import { GameState } from "@/contexts/types";

export function ReviewAnswer() {
    const { 
        roomId,
        theme, 
        topic,
        answer,
        selectedEmojis = [],
        originalEmojis = [],  // デフォルト値を設定してエラー防止
        displayedEmojis = [], // デフォルト値を設定
        dummyIndex,
        dummyEmoji,
        roomState,
        isHost,
        finishRoom
    } = useRoomData();

    // DEBUG: データ確認用ログ
    useEffect(() => {
        console.log("[ReviewAnswer] Current data:", {
            selectedEmojis,
            originalEmojis,
            displayedEmojis,
            dummyIndex,
            dummyEmoji,
            isHost,
        });
    }, [selectedEmojis, originalEmojis, displayedEmojis, dummyIndex, dummyEmoji, isHost]);

    useEffect(() => {
        if (roomState === GameState.FINISHED && roomId) {
            window.location.href = "/" 
        }
    }, [roomState, roomId])

    const handleSubmit = async () => {
        if (isHost) {
            try {
                await finishRoom();
            } catch (error) {
                console.error("Error finishing room:", error);
                alert("ゲームの終了処理に失敗しました。");
            }
        } else {
            window.location.href = "/" 
        }
    }

    return (
        <EmojiBackgroundLayout>
            <div className="w-full max-w-xs flex flex-col h-full relative">
                
                <PageHeader title="Result" subtitle="Reveal the Truth" marginBottom="mb-4" />

                {/* --- セクション1: お題と解答 --- */}
                <div className="flex flex-col gap-3 mb-0">
                    <TextDisplay value={theme || ""} inputtitle="" height="py-0.5" variant="primary" textSize="text-sm" marginBottom="mb-0" />
                    <div className="space-y-2">
                        <div className="relative">
                             <span className="absolute -top-2 left-3 bg-amber-400 text-white text-[9px] px-2 rounded-full font-black z-10">TOPIC</span>
                             <TextInput value={topic || "No Topic"} onChange={() => {}} variant="primary" mode="display" textSize="text-xl" height="py-3" />
                        </div>
                        <div className="relative">
                             <span className="absolute -top-2 left-3 bg-rose-500 text-white text-[9px] px-2 rounded-full font-black z-10">THEIR ANSWER</span>
                             <TextInput value={answer || "No Answer"} onChange={() => {}} variant="secondary" mode="display" textSize="text-xl" height="py-3" marginBottom="mb-0" />
                        </div>
                    </div>
                </div>

                {/* --- 2. 絵文字のネタバラシ：シンプル・コネクト・デザイン --- */}
                {(originalEmojis.length > 0 || displayedEmojis.length > 0) ? (
                  // ダミーデータがある場合
                  originalEmojis.length > 0 && dummyIndex !== null ? (
                <div className="my-6 w-full flex flex-col items-center gap-2">
                    
                    {/* 【上段】ホストの選択：DisplaySelectedEmojisと同じサイズ感 */}
                    <div className="flex flex-col items-center w-full">
                    <p className="text-amber-600/60 text-[10px] mb-1 font-bold">HOST ORIGINAL</p>
                    <div className="flex justify-center gap-2">
                        {originalEmojis.map((emoji, idx) => (
                        <div key={`orig-${idx}`} 
                            className={`w-14 h-14 bg-white border-2 rounded-lg flex items-center justify-center text-3xl ${
                            idx === dummyIndex ? 'border-amber-400' : 'border-gray-100'
                            }`}
                        >
                            {emoji}
                        </div>
                        ))}
                    </div>
                    </div>

                    {/* 【中段】シンプルな縦線（コネクター） */}
                    <div className="w-full h-5 relative flex justify-center">
                    <div className="flex justify-center gap-2 w-full">
                        {originalEmojis.map((_, idx) => (
                        <div key={`line-${idx}`} className="w-14 flex justify-center">
                            {idx === dummyIndex && (
                            <div className="w-0.5 h-full bg-amber-400/50"></div>
                            )}
                        </div>
                        ))}
                    </div>
                    </div>

                    {/* 【下段】実際に表示されたセット：少しだけ大きくして強調 */}
                    <div className="flex flex-col items-center w-full">
                    <div className="flex justify-center gap-2">
                        {displayedEmojis.map((emoji, idx) => (
                        <div key={`disp-${idx}`} className="relative">
                            <div className={`w-14 h-14 bg-white border-2 rounded-xl flex items-center justify-center text-3xl shadow-sm ${
                            idx === dummyIndex ? 'border-rose-500' : 'border-amber-300'
                            }`}>
                            {emoji}
                            </div>
                            
                            {/* シンプルなラベル */}
                            {idx === dummyIndex && (
                            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2">
                                <span className="bg-rose-500 text-white text-[8px] px-2 py-0.5 rounded font-black whitespace-nowrap">
                                DUMMY
                                </span>
                            </div>
                            )}
                        </div>
                        ))}
                    </div>
                    <p className="text-gray-400 text-[10px] mt-5 font-bold uppercase">Displayed Set</p>
                    </div>

                </div>
                  ) : (
                    // ダミーデータがない場合の代替表示（シンプル絵文字表示）
                    <div className="my-6 w-full flex flex-col items-center">
                      <p className="text-gray-500 text-sm mb-4 font-semibold">Selected Emojis:</p>
                      <div className="flex justify-center gap-3 flex-wrap">
                        {(displayedEmojis.length > 0 ? displayedEmojis : selectedEmojis).map((emoji, idx) => (
                          <div key={`emoji-${idx}`} className="w-12 h-12 bg-white border-2 border-amber-300 rounded-lg flex items-center justify-center text-2xl shadow-sm">
                            {emoji}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                ) : (
                  // どちらのデータもない場合
                  <div className="my-6 w-full text-center text-gray-400">
                    <p className="text-sm">No emojis available</p>
                  </div>
                )}

                <div className="mt-auto ">
                    <GameButton variant="primary" onClick={handleSubmit}>
                        {isHost ? "Finish Game" : "Exit to Lobby"}
                    </GameButton>
                </div> 
                
            </div>
        </EmojiBackgroundLayout>
    )
}
"use client"

import { useEffect, useCallback } from "react"
import { EmojiBackgroundLayout } from "./emoji-background-layout"
import { PageHeader } from "./page-header"
import { TextInput } from "./text-input"
import { TextDisplay } from "./text-display" 
import { GameButton } from "./game-button"
import { useRoomData } from '@/contexts/room-context';
import { GameState } from "@/contexts/types";
import { EmojiComparisonDisplay } from "./emoji-comparison-display"

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
        console.log("[ReviewAnswer] isDummyMode would be:", originalEmojis.length > 0 && dummyIndex !== null && dummyIndex !== undefined);
        console.log("[ReviewAnswer] Will show emojis:", displayedEmojis.length > 0 ? displayedEmojis : selectedEmojis);
    }, [selectedEmojis, originalEmojis, displayedEmojis, dummyIndex, dummyEmoji, isHost]);

    useEffect(() => {
        if (roomState === GameState.FINISHED && roomId) {
            window.location.href = "/" 
        }
    }, [roomState, roomId])

    const handleSubmit = useCallback(async () => {
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
    }, [isHost, finishRoom])

    return (
        <EmojiBackgroundLayout>
            <div className="w-full max-w-xs flex flex-col h-full relative">
                
                <PageHeader title="Result" subtitle="Reveal the Truth" marginBottom="mb-1"/>

                {/* --- セクション1: お題と解答 --- */}
                <div className="flex flex-col gap-3 mb-0">
                    <TextDisplay value={"テーマ: " + (theme || "N/A")} inputtitle="" height="py-0.5" variant="primary" textSize="text-sm" marginBottom="mb-2" />
                    <div className="space-y-2">
                        <TextInput value={topic || "No Topic"} onChange={() => {}} variant="primary" inputtitle="TOPIC" mode="display" textSize="text-xl" height="py-3" marginBottom="mb-6"/>
                        <TextInput value={answer || "No Answer"} onChange={() => {}} variant="secondary" inputtitle="THEIR ANSWER" mode="display" textSize="text-xl" height="py-3" marginBottom="mb-0" />
                    </div>
                </div>

                {/* --- 2. 絵文字のネタバラシ --- */}
                <EmojiComparisonDisplay 
                    originalEmojis={originalEmojis}
                    displayedEmojis={displayedEmojis}
                    dummyIndex={dummyIndex}
                    selectedEmojis={selectedEmojis}
                    className="my-4 p-3 flex-grow"
                />

                <div className="mt-auto ">
                    <GameButton variant={isHost ? "primary" : "secondary"} onClick={handleSubmit}>
                        {isHost ? "Finish Game" : "Exit to Lobby"}
                    </GameButton>
                </div> 
                
            </div>
        </EmojiBackgroundLayout>
    )
}
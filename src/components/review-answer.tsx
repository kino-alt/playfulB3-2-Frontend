"use client"

import { useState, useEffect } from "react"
import { EmojiBackgroundLayout } from "./emoji-background-layout"
import { PageHeader } from "./page-header"
import { TextInput } from "./text-input"
import { TextDisplay } from "./text-display" 
import { DisplaySelectedEmojis } from "./display-selected-emojis"
import { GameButton } from "./game-button"
//FIX: Add
import { useRoomData } from '@/contexts/room-context';
import { GameState } from "@/contexts/types";

export function ReviewAnswer() {
    const { 
        roomId,
        theme, 
        topic,
        answer,
        selectedEmojis,
        roomState,
        globalError,
        isHost,
        finishRoom
    } = useRoomData();

    // push next page
    useEffect(() => {
        if (roomState === GameState.FINISHED && roomId) {
            window.location.href = "/" 
        }
    }, [roomState, roomId])

    {/*submit handler*/}
    const handleSubmit = async () => {
        if (isHost) {
            try {
                console.log("[v0] Host finishing game for room:", roomId)
                await finishRoom();
            } catch (error) {
                console.error("Error finishing room:", error);
                alert("ゲームの終了処理に失敗しました。");
            }
        } else {
            console.log("[v0] Participant exitting for room:", roomId)
            window.location.href = "/" 
        }
    }

    return (
        <EmojiBackgroundLayout>
        <div className="w-full max-w-xs flex flex-col h-full">
            
            <PageHeader title="Review Answer" subtitle={`Grade Submissions`} />

            {/*display theme*/}
            <TextDisplay
                value={theme || ""}
                inputtitle="Theme"
                height="py-0.5"
                variant="primary"
                textSize="text-sm"
                marginBottom="mb-4"
            />

            {/*display topic*/}
            <TextInput
                value={topic || ""}
                onChange={() => {}}
                inputtitle="Topic"
                placeholder=""
                height="py-4"
                variant="primary"
                mode="display"
                textSize="text-lg"
            />

            {/*display answer*/}
            <TextInput
                value={answer ||""}
                onChange={() => {}}
                inputtitle="Answer"
                placeholder=""
                height="py-4"
                variant="secondary"
                mode="display"
                textSize="text-lg"
                marginBottom="mb-4"
            />
            
            {/*display selected emojis*/}
            <DisplaySelectedEmojis
                selectedEmojis={selectedEmojis}
                handleRemoveEmoji={() => {}}
                maxEmojis={selectedEmojis.length}
                roomState={roomState}
            /> 

            {/*submit button*/}
            <div className="mt-auto">
            <GameButton variant="primary" onClick={handleSubmit}>
                Exit 
            </GameButton>
            </div>  
            
        </div>
        </EmojiBackgroundLayout>
    )
}

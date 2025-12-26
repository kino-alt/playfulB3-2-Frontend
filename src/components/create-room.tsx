"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { GameButton } from "./game-button"
import { EmojiBackgroundLayout } from "./emoji-background-layout"
import { ParticipantList } from "./participant-list"
import {PageHeader} from "./page-header"
import { TextInput } from "./text-input"
//FIX: Add
import { useRoomData } from '@/contexts/room-context';
import { GameState } from "@/contexts/types";

export default function CreateRoom() {
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { 
    roomCode, 
    roomId,
    participantsList, 
    roomState,
    startGame,
    globalError,
  } = useRoomData();

  {/*get room code*/}
 useEffect(() => {
    if (roomCode) {
      setIsLoading(false)
    }
  }, [roomCode])

  {/* push next page*/}
  useEffect(() => {
    console.log("Current Room State:", roomState); // デバッグ用
    if (roomState === GameState.SETTING_TOPIC && roomCode) {
      console.log("Navigating to create-topic...");
      router.push(`/room/${roomId}/create-topic`);
    }
  }, [roomState, roomId, router]);

  {/*Handle start game action*/}
  const handleStartGame = async () => {
    const currentParticipantsCount = participantsList.length;

    //check a number of particpants
    if (!roomCode || currentParticipantsCount < 3 || currentParticipantsCount > 7) {
        if (currentParticipantsCount < 3 || currentParticipantsCount > 7) alert("参加人数は3人から7人まで必要です。");
        return;
    }

    try {
      console.log("[v0] Starting game for room:", roomCode)
      await startGame();      
    } catch (error) {
      console.error("Error starting game:", error)
      alert("Failed to start game")
    }
  }

  return (
    <EmojiBackgroundLayout>
      <div className="w-full max-w-xs flex flex-col h-full">
        {/* Header */}
        <PageHeader 
            title="Create Room" 
            subtitle="Set up your game" 
        />
        
        {/* Room Code Display */}
        <TextInput
            value={isLoading ? "Loading..." : roomCode || "N/A"}
            onChange={() => {}}
            inputtitle="Room Code"
            height = "py-3"
            variant="primary"
            mode="display"
            textSize="text-2xl"
        />

        {/* Participants List */}
        <ParticipantList participants={participantsList} />

        {/* Start Button */}
        <div className="mt-auto">
          {roomState === GameState.WAITING && (
              <GameButton variant="primary" onClick={handleStartGame} disabled={participantsList.length < 4 || participantsList.length > 6 || isLoading}>
                  Start Game 
              </GameButton>
          )}
        </div>
      </div>
    </EmojiBackgroundLayout>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { GameButton } from "./game-button"
import dynamic from 'next/dynamic'
import { ParticipantList } from "./participant-list"
import {PageHeader} from "./page-header"
import { TextInput } from "./text-input"
//FIX: Add
import { useRoomData } from '@/contexts/room-context';
import { GameState } from "@/contexts/types";

// EmojiBackgroundLayout を動的インポート（コンポーネント定義の外で）
const EmojiBackgroundLayoutNoSSR = dynamic(() => import('./emoji-background-layout').then(m => m.EmojiBackgroundLayout), { ssr: false })

// Format room code with hyphen (e.g., ABC-123)
const formatRoomCode = (code: string) => {
  if (!code || code.length <= 3) return code;
  return `${code.slice(0, 3)}-${code.slice(3)}`;
};

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

    // チェック：参加人数は 4人から 6人まで
    // (ホスト 1人 + プレイヤー 3-5人)
    if (currentParticipantsCount < 4 || currentParticipantsCount > 6) {
        alert(`参加人数は 4人から 6人までです（現在: ${currentParticipantsCount}人）`);
        return;
    }

    try {
      await startGame();      
    } catch (error) {
      alert("Failed to start game")
    }
  }

  return (
    <EmojiBackgroundLayoutNoSSR>
      <div className="w-full max-w-xs flex flex-col h-full">
        {/* Header */}
        <PageHeader 
            title="Create Room" 
            subtitle="Set up your game" 
        />
        
        {/* Room Code Display */}
        <TextInput
            value={isLoading ? "Loading..." : (roomCode ? formatRoomCode(roomCode) : "N/A")}
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
              <GameButton 
                variant="primary" 
                onClick={handleStartGame} 
                disabled={participantsList.length < 4 || participantsList.length > 6 || isLoading}
              >
                Start Game 
              </GameButton>
          )}
        </div>
      </div>
    </EmojiBackgroundLayoutNoSSR>
  )
}

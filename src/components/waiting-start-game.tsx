"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import dynamic from 'next/dynamic'
import { PageHeader } from "./page-header"
import { ParticipantList } from "./participant-list"
import { WaitingAnimation } from "./waiting-animation"
//FIX: Add
import { useRoomData } from '@/contexts/room-context';
import { GameState } from "@/contexts/types";

const EmojiBackgroundLayoutNoSSR = dynamic(() => import('./emoji-background-layout').then(m => m.EmojiBackgroundLayout), { ssr: false })

export default function WaitingStartGame() {
   const router = useRouter()
     const {
           roomId,
           roomState,
           participantsList,
           globalError,
           isHost,
           startGame,
       } = useRoomData();

   console.log("[WaitingStartGame] participantsList:", participantsList);

     // push next page
       useEffect(() => {
         if (roomState === GameState.SETTING_TOPIC && roomId) {
           router.push(`/room/${roomId}/waiting-create-topic`);
         }
       }, [roomState, roomId, router])

  const handleStartGame = async () => {
    console.log('[WaitingStartGame] Start Game button clicked!', {
      roomId,
      isHost,
      participantsCount: participantsList.length
    });
    try {
      await startGame();
      console.log('[WaitingStartGame] startGame() completed');
    } catch (error) {
      console.error('[WaitingStartGame] Failed to start game:', error);
    }
  };

  return (
    <EmojiBackgroundLayoutNoSSR>
      <div className="w-full max-w-xs flex flex-col h-full">
        <PageHeader title="Waiting for players" subtitle="Please wait..." />

        {/* Participants List */}
        <div className="w-full mb-8">
            <ParticipantList participants={participantsList} />
        </div>

        {/* Start Game Button (Host only) */}
        {isHost && (
          <button
            onClick={handleStartGame}
            className="w-full px-6 py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-colors shadow-lg"
          >
            Start Game
          </button>
        )}

      </div>
    </EmojiBackgroundLayoutNoSSR>
  )
}

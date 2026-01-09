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
       } = useRoomData();
   
     // push next page
       useEffect(() => { 
         if (roomState === GameState.SETTING_TOPIC && roomId) {
           router.push(`/room/${roomId}/waiting-create-topic`);
         }
       }, [roomState, roomId, router])

  return (
    <EmojiBackgroundLayoutNoSSR>
      <div className="w-full max-w-xs flex flex-col h-full">
        <PageHeader title="Waiting for players" subtitle="Please wait..." />

        {/* Participants List */}
        <div className="w-full mb-8">
            <ParticipantList participants={participantsList} />
        </div>

      </div>
    </EmojiBackgroundLayoutNoSSR>
  )
}

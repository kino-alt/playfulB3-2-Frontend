"use client"

import { useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/page-header'
import { WaitingAnimation } from '@/components/waiting-animation'
import { useRoomData } from '@/contexts/room-context'
import { GameState } from '@/contexts/types'

const EmojiBackgroundLayoutNoSSR = dynamic(() => import('@/components/emoji-background-layout').then(m => m.EmojiBackgroundLayout), { ssr: false })

export default function WaitingAnswer() {
  const router = useRouter()
  const {
    roomId,
    roomState,
  } = useRoomData()

  useEffect(() => {
    if (roomState === GameState.CHECKING && roomId) {
      router.push(`/room/${roomId}/review-answer`)
    }
  }, [roomState, roomId, router])

  return (
    <EmojiBackgroundLayoutNoSSR>
      <div className="w-full max-w-xs flex flex-col h-full">
        <PageHeader title="Waiting for Leader" subtitle="Please wait..." />

        <div className="flex flex-col items-center flex-1 justify-center">
          <WaitingAnimation variant="secondary" inputText="リーダーの回答" />
        </div>
      </div>
    </EmojiBackgroundLayoutNoSSR>
  )
}

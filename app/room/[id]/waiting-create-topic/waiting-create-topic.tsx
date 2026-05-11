"use client"

import { useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/page-header'
import { WaitingAnimation } from '@/components/waiting-animation'
import { useRoomData } from '@/contexts/room-context'
import { GameState } from '@/contexts/types'

const EmojiBackgroundLayoutNoSSR = dynamic(() => import('@/components/emoji-background-layout').then(m => m.EmojiBackgroundLayout), { ssr: false })

export default function WaitingCreateTopic() {
  const router = useRouter()
  const {
    roomId,
    roomState,
  } = useRoomData()

  useEffect(() => {
    if (roomState === GameState.DISCUSSING && roomId) {
      router.push(`/room/${roomId}/discussion-time`)
    }
  }, [roomState, roomId, router])

  return (
    <EmojiBackgroundLayoutNoSSR>
      <div className="w-full max-w-xs flex flex-col h-full">
        <PageHeader title="Waiting for Host" subtitle="Please wait..." />

        <div className="flex flex-col items-center flex-1 justify-center">
          <WaitingAnimation variant="secondary" inputText="ホストの操作" />
        </div>
      </div>
    </EmojiBackgroundLayoutNoSSR>
  )
}

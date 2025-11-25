"use client"

import { EmojiBackgroundLayout } from "./emoji-background-layout"
import { PageHeader } from "./page-header"
import { WaitingAnimation } from "./waiting-animation"

export default function WaitingCreateTopic({ roomCode }: { roomCode: string }) {
  return (
    <EmojiBackgroundLayout>
      <div className="w-full max-w-xs flex flex-col h-full">
        <PageHeader title="Waiting for Host" subtitle="Please wait..." />

        {/* Waiting animation */}
        <div className="flex flex-col items-center flex-1 justify-center">
          <WaitingAnimation variant="secondary" />
        </div>

      </div>
    </EmojiBackgroundLayout>
  )
}

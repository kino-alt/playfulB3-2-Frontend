import type { Metadata } from "next"
import CreateRoom from 
"@/src/components/create-room"

export const metadata: Metadata = {
  title: "Create Room - Emoji Discussion Game",
  description: "Create a new game room",
}

export default function CreateRoomPage() {
  return (
      <CreateRoom />
  )
}

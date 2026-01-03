import type { Metadata } from "next"
import JoinRoom from 
"@/src/components/join-room"
export const metadata: Metadata = {
  title: "Join Room - Emoji Discussion Game",
  description: "Join a game room",
}

export default function JoinRoomPage() {
  return <JoinRoom />
}

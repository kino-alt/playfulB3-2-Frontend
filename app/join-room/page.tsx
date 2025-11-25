import type { Metadata } from "next"
import JoinRoom from 
"@/components/join-room"
export const metadata: Metadata = {
  title: "Join Room - Emoji Discussion Game",
  description: "Join a game room",
}

export default function JoinRoomPage() {
  return <JoinRoom />
}

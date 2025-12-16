import type { Metadata } from "next"
import CreateRoom from 
"@/components/create-room"
import { RoomProvider } from '@/contexts/room-context';

export const metadata: Metadata = {
  title: "Create Room - Emoji Discussion Game",
  description: "Create a new game room",
}

export default function CreateRoomPage() {
  <RoomProvider>
    return <CreateRoom />
  </RoomProvider>
}

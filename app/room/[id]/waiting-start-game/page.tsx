import WaitingStartGame from "@/components/waiting-start-game"
import { RoomProvider } from '@/contexts/room-context';

export default async function WaitingStartGamePage({
  params,
}: {
  params: { id: string } 
}) {
  const { id } = params

return(
  <RoomProvider initialRoomId={id}>
     <WaitingStartGame/>
     </RoomProvider>
  )
}

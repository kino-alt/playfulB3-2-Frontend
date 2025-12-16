import {WaitingDiscussionTime} from "@/components/wating-discussion-time"
import { RoomProvider } from '@/contexts/room-context';

export default async function WaitingDiscussionTimePage({
 params,
}: {
  params: { id: string } 
}) {
  const { id } = params

return(
  <RoomProvider initialRoomId={id}>
    <WaitingDiscussionTime/>
  </RoomProvider>
)
}

import {DiscussionTime} from "@/components/discussion-time"
import { RoomProvider } from '@/contexts/room-context';

export default async function DiscussionTimePage({
 params,
}: {
  params: { id: string } 
}) {
  const { id } = params

  return(
    <RoomProvider initialRoomId={id}>
      <DiscussionTime />
    </RoomProvider>
  )
}

import {ReviewAnswer} from "@/components/review-answer"
import { RoomProvider } from '@/contexts/room-context';

export default async function ReviewAnswerPage({
params,
}: {
  params: { id: string } 
}) {
  const { id } = params

  return(
    <RoomProvider initialRoomId={id}>
      <ReviewAnswer/>
    </RoomProvider>
  )
}

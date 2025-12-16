import SubmitAnswer from "@/components/submit-answer"
import { RoomProvider } from '@/contexts/room-context';

export default async function SubmitAnswerPage({
 params,
}: {
  params: { id: string } 
}) {
  const { id } = params

return(
  <RoomProvider initialRoomId={id}>
     <SubmitAnswer />
  </RoomProvider>
)
}

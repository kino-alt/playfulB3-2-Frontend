import { CreateTopic } from "@/components/create-topic"
import { RoomProvider } from '@/contexts/room-context';

export default async function CreateTopicPage({
  params,
}: {
  params: { id: string } 
}) {
  const { id } = params

return(
  <RoomProvider initialRoomId={id}>
    <CreateTopic  />
  </RoomProvider>
)
}

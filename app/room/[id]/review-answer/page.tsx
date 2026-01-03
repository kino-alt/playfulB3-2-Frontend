import {ReviewAnswer} from "@/src/components/review-answer"
import { RoomProvider } from '@/contexts/room-context';

export default function ReviewAnswerPage({
  params,
}: {
  params: { id: string }
}) {
  // const { id } = params;
  return (
    <ReviewAnswer />
  )
}

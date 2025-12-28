import { CreateTopic } from "@/src/components/create-topic"

export default function CreateTopicPage({
  params,
}: {
  params: { id: string }
}) {
  // const { id } = params; // id is available if needed
  return (
    <CreateTopic />
  )
}

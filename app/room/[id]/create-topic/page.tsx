import { CreateTopic } from "@/src/components/create-topic"

export default async function CreateTopicPage({
  params,
}: {
  params: { id: string } 
}) {
  const { id } = params

return(
    <CreateTopic  />
)
}

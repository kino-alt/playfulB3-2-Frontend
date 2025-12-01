import { CreateTopic } from "@/components/create-topic"

export default async function CreateTopicPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params

  return <CreateTopic roomCode={code} />
}

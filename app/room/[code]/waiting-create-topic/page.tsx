import WaitingCreateTopic from "@/components/waiting-create-topic"

export default async function WaitingCreateTopicPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params
  return <WaitingCreateTopic roomCode={code} />
}

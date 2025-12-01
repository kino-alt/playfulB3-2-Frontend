import {WaitingDiscussionTime} from "@/components/wating-discussion-time"

export default async function WaitingDiscussionTimePage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params

  return <WaitingDiscussionTime roomCode={code} />
}

import {DiscussionTime} from "@/components/discussion-time"

export default async function DiscussionTimePage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params

  return <DiscussionTime roomCode={code} />
}

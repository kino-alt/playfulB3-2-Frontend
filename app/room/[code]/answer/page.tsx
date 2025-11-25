import SubmitAnswer from "@/components/submit-answer"

export default async function SubmitAnswerPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params

  return <SubmitAnswer roomCode={code} />
}

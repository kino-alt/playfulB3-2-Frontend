import WaitingStartGame from "@/components/waiting-start-game"

export default async function WaitingStartGamePage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params
  return <WaitingStartGame roomCode={code} />
}

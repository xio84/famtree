import { auth } from "@/lib/auth"
import { deleteTree } from "@/lib/db"

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 })

  const { id } = await params
  await deleteTree(id, session.user.id)
  return new Response(null, { status: 204 })
}

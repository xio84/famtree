import { auth } from "@/lib/auth"
import { getUserTrees, createTree } from "@/lib/db"
import { z } from "zod"

const createSchema = z.object({ name: z.string().min(1).max(100) })

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 })
  const trees = await getUserTrees(session.user.id)
  return Response.json(trees)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 })

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 })

  const tree = await createTree(parsed.data.name, session.user.id)
  return Response.json(tree, { status: 201 })
}

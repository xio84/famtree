import { auth } from "@/lib/auth"
import { getTreeWithMembers, getRelationships, createMember } from "@/lib/db"
import { z } from "zod"
import { Gender } from "@/app/generated/prisma/enums"

const createSchema = z.object({
  treeId: z.string().cuid(),
  name: z.string().min(1).max(200),
  gender: z.nativeEnum(Gender).default("UNKNOWN"),
  birthDate: z.string().optional(),
  deathDate: z.string().optional(),
  notes: z.string().optional(),
  photoUrl: z.string().url().optional(),
})

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 })

  const { searchParams } = new URL(req.url)
  const treeId = searchParams.get("treeId")
  if (!treeId) return Response.json({ error: "treeId required" }, { status: 400 })

  const tree = await getTreeWithMembers(treeId, session.user.id)
  if (!tree) return Response.json({ error: "Not found" }, { status: 404 })

  const relationships = await getRelationships(treeId)
  return Response.json({ members: tree.members, relationships })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 })

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 })

  const { treeId, ...data } = parsed.data
  const member = await createMember(treeId, data)
  return Response.json(member, { status: 201 })
}

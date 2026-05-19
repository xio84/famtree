import { auth } from "@/lib/auth"
import { createRelationship } from "@/lib/db"
import { z } from "zod"
import { RelationshipType } from "@/app/generated/prisma/enums"

const createSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal(RelationshipType.PARENT_CHILD),
    parentId: z.string().cuid(),
    childId: z.string().cuid(),
  }),
  z.object({
    type: z.literal(RelationshipType.SPOUSE),
    spouse1Id: z.string().cuid(),
    spouse2Id: z.string().cuid(),
  }),
])

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 })

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 })

  const rel = await createRelationship(parsed.data)
  return Response.json(rel, { status: 201 })
}

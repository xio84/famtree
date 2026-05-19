import { auth } from "@/lib/auth"
import { getMember, updateMember, archiveMember } from "@/lib/db"
import { z } from "zod"
import { Gender } from "@/app/generated/prisma/enums"

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  gender: z.nativeEnum(Gender).optional(),
  birthDate: z.string().optional(),
  deathDate: z.string().optional(),
  notes: z.string().optional(),
  photoUrl: z.string().url().optional().nullable(),
  x: z.number().optional(),
  y: z.number().optional(),
})

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 })

  const { id } = await params
  const member = await getMember(id, session.user.id)
  if (!member) return Response.json({ error: "Not found" }, { status: 404 })
  return Response.json(member)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 })

  const { id } = await params
  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 })

  const owned = await getMember(id, session.user.id)
  if (!owned) return Response.json({ error: "Not found" }, { status: 404 })

  const member = await updateMember(id, parsed.data)
  return Response.json(member)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 })

  const { id } = await params
  const owned = await getMember(id, session.user.id)
  if (!owned) return Response.json({ error: "Not found" }, { status: 404 })

  await archiveMember(id)
  return new Response(null, { status: 204 })
}

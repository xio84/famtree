import { auth } from "@/lib/auth"
import { listAllowedEmails, addAllowedEmail } from "@/lib/db"
import { isAdminEmail } from "@/lib/admin"
import { z } from "zod"

const addSchema = z.object({
  email: z.string().email(),
})

export async function GET() {
  const session = await auth()
  if (!isAdminEmail(session?.user?.email)) {
    return new Response("Forbidden", { status: 403 })
  }
  const emails = await listAllowedEmails()
  return Response.json(emails)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!isAdminEmail(session?.user?.email)) {
    return new Response("Forbidden", { status: 403 })
  }
  const body = await req.json()
  const parsed = addSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  try {
    const created = await addAllowedEmail(parsed.data.email)
    return Response.json(created, { status: 201 })
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code
    if (code === "P2002") {
      return Response.json({ error: "Email already allowed" }, { status: 409 })
    }
    throw e
  }
}

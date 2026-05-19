import { auth } from "@/lib/auth"
import { removeAllowedEmail } from "@/lib/db"
import { isAdminEmail } from "@/lib/admin"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!isAdminEmail(session?.user?.email)) {
    return new Response("Forbidden", { status: 403 })
  }
  const { id } = await params
  await removeAllowedEmail(id)
  return new Response(null, { status: 204 })
}

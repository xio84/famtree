import { auth } from "@/lib/auth"
import { uploadPhoto } from "@/lib/storage"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 })

  const formData = await req.formData()
  const file = formData.get("file") as File | null

  if (!file || file.size > 5 * 1024 * 1024) {
    return Response.json({ error: "Invalid file (max 5MB)" }, { status: 400 })
  }

  if (!file.type.startsWith("image/")) {
    return Response.json({ error: "Only image files allowed" }, { status: 400 })
  }

  const url = await uploadPhoto(file, session.user.id)
  return Response.json({ url })
}

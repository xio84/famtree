import { auth } from "@/lib/auth"
import { getMember } from "@/lib/db"
import { notFound } from "next/navigation"
import { MemberDetailClient } from "@/components/members/MemberDetailClient"

export default async function MemberPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) notFound()
  const { id } = await params
  const member = await getMember(id, session.user.id)
  if (!member) notFound()
  return <MemberDetailClient member={member} />
}

import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@/app/generated/prisma/client"
import type { MemberFormValues, RelationshipFormValues } from "@/types"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

// Tree helpers
export function getTreeWithMembers(treeId: string, userId: string) {
  return prisma.tree.findFirst({
    where: { id: treeId, ownerId: userId },
    include: { members: { where: { archived: false } } },
  })
}

export function getUserTrees(userId: string) {
  return prisma.tree.findMany({
    where: { ownerId: userId },
    orderBy: { updatedAt: "desc" },
  })
}

export function createTree(name: string, userId: string) {
  return prisma.tree.create({ data: { name, ownerId: userId } })
}

export function deleteTree(treeId: string, userId: string) {
  return prisma.tree.delete({ where: { id: treeId, ownerId: userId } })
}

// Member helpers
export function getMember(id: string, userId: string) {
  return prisma.member.findFirst({
    where: { id, archived: false, tree: { ownerId: userId } },
    include: {
      asParent: { include: { child: true } },
      asChild: { include: { parent: true } },
      asSpouse1: { include: { spouse2: true } },
      asSpouse2: { include: { spouse1: true } },
    },
  })
}

export function createMember(treeId: string, data: MemberFormValues) {
  return prisma.member.create({
    data: {
      treeId,
      name: data.name,
      gender: data.gender,
      birthDate: data.birthDate ? new Date(data.birthDate) : null,
      deathDate: data.deathDate ? new Date(data.deathDate) : null,
      notes: data.notes ?? null,
      photoUrl: data.photoUrl ?? null,
    },
  })
}

export function updateMember(
  id: string,
  data: Partial<MemberFormValues> & { x?: number; y?: number }
) {
  return prisma.member.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.gender !== undefined && { gender: data.gender }),
      ...(data.birthDate !== undefined && { birthDate: data.birthDate ? new Date(data.birthDate) : null }),
      ...(data.deathDate !== undefined && { deathDate: data.deathDate ? new Date(data.deathDate) : null }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.photoUrl !== undefined && { photoUrl: data.photoUrl }),
      ...(data.x !== undefined && { x: data.x }),
      ...(data.y !== undefined && { y: data.y }),
    },
  })
}

export function archiveMember(id: string) {
  return prisma.member.update({ where: { id }, data: { archived: true } })
}

// Relationship helpers
export function getRelationships(treeId: string) {
  return prisma.relationship.findMany({
    where: {
      OR: [
        { parent: { treeId } },
        { child: { treeId } },
        { spouse1: { treeId } },
        { spouse2: { treeId } },
      ],
    },
  })
}

export function createRelationship(data: RelationshipFormValues) {
  return prisma.relationship.create({ data })
}

export function deleteRelationship(id: string) {
  return prisma.relationship.delete({ where: { id } })
}

// Allowlist helpers
export function listAllowedEmails() {
  return prisma.allowedEmail.findMany({ orderBy: { addedAt: "asc" } })
}

export function addAllowedEmail(email: string) {
  return prisma.allowedEmail.create({ data: { email: email.toLowerCase() } })
}

export function removeAllowedEmail(id: string) {
  return prisma.allowedEmail.delete({ where: { id } })
}

export async function isEmailAllowed(email: string) {
  const found = await prisma.allowedEmail.findUnique({ where: { email: email.toLowerCase() } })
  return !!found
}

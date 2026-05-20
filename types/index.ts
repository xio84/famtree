import type { Gender, RelationshipType } from "@/app/generated/prisma/enums"

export type { Gender, RelationshipType }

export interface MemberData {
  id: string
  treeId: string
  name: string
  birthDate: Date | null
  deathDate: Date | null
  gender: Gender
  photoUrl: string | null
  notes: string | null
  x: number | null
  y: number | null
  archived: boolean
  updatedAt: Date
  createdAt: Date
}

export interface RelationshipData {
  id: string
  type: RelationshipType
  parentId: string | null
  childId: string | null
  spouse1Id: string | null
  spouse2Id: string | null
}

export interface TreeData {
  id: string
  name: string
  ownerId: string
  members: MemberData[]
  createdAt: Date
  updatedAt: Date
}

export interface MemberFormValues {
  name: string
  birthDate?: string
  deathDate?: string
  gender: Gender
  notes?: string
  photoUrl?: string | null
}

export interface RelationshipFormValues {
  type: RelationshipType
  parentId?: string
  childId?: string
  spouse1Id?: string
  spouse2Id?: string
}

/** Family links picked in the member form. Empty string means "none". */
export interface RelationSelection {
  fatherId: string
  motherId: string
  spouseId: string
}

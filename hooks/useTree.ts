"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { api } from "@/lib/api"
import { buildGraphData } from "@/lib/tree-utils"
import type {
  MemberData,
  RelationshipData,
  MemberFormValues,
  RelationshipFormValues,
} from "@/types"

export function useTree(treeId: string) {
  const [members, setMembers] = useState<MemberData[]>([])
  const [relationships, setRelationships] = useState<RelationshipData[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!treeId) return
    setIsLoading(true)
    api.members
      .list(treeId)
      .then(({ members, relationships }) => {
        setMembers(members as MemberData[])
        setRelationships(relationships as RelationshipData[])
      })
      .finally(() => setIsLoading(false))
  }, [treeId])

  const addMember = useCallback(
    async (values: MemberFormValues) => {
      const member = (await api.members.create(treeId, values)) as MemberData
      setMembers((prev) => [...prev, member])
    },
    [treeId]
  )

  const removeMember = useCallback(async (id: string) => {
    await api.members.delete(id)
    setMembers((prev) => prev.filter((m) => m.id !== id))
  }, [])

  const addRelationship = useCallback(async (data: RelationshipFormValues) => {
    const rel = (await api.relationships.create(data)) as RelationshipData
    setRelationships((prev) => [...prev, rel])
  }, [])

  const updateMemberPosition = useCallback(async (id: string, x: number, y: number) => {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, x, y } : m)))
    await api.members.updatePosition(id, x, y)
  }, [])

  const { nodes, edges } = useMemo(
    () => buildGraphData(members, relationships),
    [members, relationships]
  )

  return {
    nodes,
    edges,
    members,
    relationships,
    addMember,
    removeMember,
    addRelationship,
    updateMemberPosition,
    isLoading,
  }
}

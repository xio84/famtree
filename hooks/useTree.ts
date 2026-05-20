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

export function useTree(treeId: string, selfId?: string | null) {
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
      return member
    },
    [treeId]
  )

  const updateMember = useCallback(
    async (id: string, values: Partial<MemberFormValues>) => {
      const member = (await api.members.update(id, values)) as MemberData
      setMembers((prev) => prev.map((m) => (m.id === id ? member : m)))
      return member
    },
    []
  )

  const removeMember = useCallback(async (id: string) => {
    await api.members.delete(id)
    setMembers((prev) => prev.filter((m) => m.id !== id))
  }, [])

  const addRelationship = useCallback(async (data: RelationshipFormValues) => {
    const rel = (await api.relationships.create(data)) as RelationshipData
    setRelationships((prev) => [...prev, rel])
  }, [])

  const removeRelationship = useCallback(async (id: string) => {
    await api.relationships.delete(id)
    setRelationships((prev) => prev.filter((r) => r.id !== id))
  }, [])

  const { nodes, edges } = useMemo(
    () => buildGraphData(members, relationships, selfId),
    [members, relationships, selfId]
  )

  return {
    nodes,
    edges,
    members,
    relationships,
    addMember,
    updateMember,
    removeMember,
    addRelationship,
    removeRelationship,
    isLoading,
  }
}

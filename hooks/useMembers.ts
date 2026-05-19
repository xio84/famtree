"use client"

import { useEffect, useState, useCallback } from "react"
import { api } from "@/lib/api"
import type { MemberData, MemberFormValues } from "@/types"

export function useMembers(treeId: string) {
  const [members, setMembers] = useState<MemberData[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!treeId) return
    setIsLoading(true)
    api.members
      .list(treeId)
      .then(({ members }) => setMembers(members as MemberData[]))
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

  const updateMember = useCallback(async (id: string, values: Partial<MemberFormValues>) => {
    const updated = (await api.members.update(id, values)) as MemberData
    setMembers((prev) => prev.map((m) => (m.id === id ? updated : m)))
  }, [])

  return { members, addMember, removeMember, updateMember, isLoading }
}

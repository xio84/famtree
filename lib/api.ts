import type { MemberFormValues, RelationshipFormValues } from "@/types"

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...init,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const message =
      typeof body.error === "string"
        ? body.error
        : body.error
          ? JSON.stringify(body.error)
          : `Request failed: ${res.status}`
    throw new Error(message)
  }
  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return undefined as T
  }
  return res.json() as Promise<T>
}

// Trees
export const api = {
  trees: {
    list: () => request<{ id: string; name: string }[]>("/api/trees"),
    create: (name: string) =>
      request("/api/trees", { method: "POST", body: JSON.stringify({ name }) }),
    delete: (id: string) => request(`/api/trees/${id}`, { method: "DELETE" }),
  },
  members: {
    list: (treeId: string) =>
      request<{ members: unknown[]; relationships: unknown[] }>(`/api/members?treeId=${treeId}`),
    create: (treeId: string, data: MemberFormValues) =>
      request("/api/members", { method: "POST", body: JSON.stringify({ treeId, ...data }) }),
    update: (id: string, data: Partial<MemberFormValues>) =>
      request(`/api/members/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: string) => request(`/api/members/${id}`, { method: "DELETE" }),
    get: (id: string) => request(`/api/members/${id}`),
  },
  relationships: {
    create: (data: RelationshipFormValues) =>
      request("/api/relationships", { method: "POST", body: JSON.stringify(data) }),
    delete: (id: string) =>
      request(`/api/relationships/${id}`, { method: "DELETE" }),
  },
  upload: {
    photo: async (file: File): Promise<string> => {
      const form = new FormData()
      form.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: form })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(
          typeof body.error === "string" ? body.error : `Upload failed: ${res.status}`
        )
      }
      const { url } = await res.json()
      return url
    },
  },
}

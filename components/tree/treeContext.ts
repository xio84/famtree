import { createContext } from "react"

/**
 * Lets a PersonNode rendered deep inside React Flow ask the tree to switch
 * which spouse (and children) it displays. `dir` is +1 (next) or -1 (previous).
 */
export const CycleSpouseContext = createContext<(memberId: string, dir: number) => void>(
  () => {}
)

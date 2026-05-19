"use client"

import { useReactFlow } from "@xyflow/react"

export function TreeControls() {
  const { fitView, zoomIn, zoomOut } = useReactFlow()
  return (
    <div className="absolute bottom-6 right-6 flex flex-col gap-1 z-10">
      <button
        onClick={() => zoomIn()}
        className="w-8 h-8 rounded bg-white shadow border border-gray-200 text-gray-700 hover:bg-gray-50 text-lg font-bold"
        aria-label="Zoom in"
      >
        +
      </button>
      <button
        onClick={() => zoomOut()}
        className="w-8 h-8 rounded bg-white shadow border border-gray-200 text-gray-700 hover:bg-gray-50 text-lg font-bold"
        aria-label="Zoom out"
      >
        −
      </button>
      <button
        onClick={() => fitView()}
        className="w-8 h-8 rounded bg-white shadow border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-medium"
        aria-label="Fit view"
      >
        Fit
      </button>
    </div>
  )
}

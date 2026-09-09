'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Tracks whether form values have drifted from their initial values.
 * Returns isDirty=true once any watched value differs from its initial.
 * Also wires up a beforeunload warning when dirty.
 */
export const useUnsavedChanges = (values: Record<string, unknown>) => {
  const initialRef = useRef(JSON.stringify(values))
  const [isDirty, setIsDirty] = useState(false)

  useEffect(() => {
    const dirty = JSON.stringify(values) !== initialRef.current
    setIsDirty(dirty)
  }, [values])

  // Reset when saved successfully (caller should call this)
  const markClean = () => {
    initialRef.current = JSON.stringify(values)
    setIsDirty(false)
  }

  useEffect(() => {
    if (!isDirty) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  return { isDirty, markClean }
}

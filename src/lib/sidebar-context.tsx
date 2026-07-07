"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"

interface SidebarContextValue {
  isOpen: boolean
  open: () => void
  close: () => void
}

const SidebarContext = createContext<SidebarContextValue>({
  isOpen: false,
  open: () => {},
  close: () => {},
})

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
      document.body.style.touchAction = "none"
    } else {
      document.body.style.overflow = ""
      document.body.style.touchAction = ""
    }
    return () => {
      document.body.style.overflow = ""
      document.body.style.touchAction = ""
    }
  }, [isOpen])

  return (
    <SidebarContext.Provider value={{ isOpen, open, close }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  return useContext(SidebarContext)
}

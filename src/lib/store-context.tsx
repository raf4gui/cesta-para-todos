"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

export interface PublicSettings {
  show_prices: boolean
  show_stock: boolean
  show_availability: boolean
}

const defaultSettings: PublicSettings = {
  show_prices: true,
  show_stock: true,
  show_availability: true,
}

const StoreContext = createContext<PublicSettings>(defaultSettings)

export function StoreProvider({
  children,
  initialSettings,
}: {
  children: ReactNode
  initialSettings?: PublicSettings
}) {
  const [settings] = useState<PublicSettings>(initialSettings || defaultSettings)
  return <StoreContext.Provider value={settings}>{children}</StoreContext.Provider>
}

export function useStoreSettings() {
  return useContext(StoreContext)
}

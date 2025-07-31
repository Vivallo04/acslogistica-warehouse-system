"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface SandboxContextType {
  sandboxEnabled: boolean
  setSandboxEnabled: (enabled: boolean) => void
  sandboxStats: any | null
  refreshSandboxStats: () => Promise<void>
  isLoading: boolean
}

const SandboxContext = createContext<SandboxContextType | undefined>(undefined)

interface SandboxProviderProps {
  children: ReactNode
}

export function SandboxProvider({ children }: SandboxProviderProps) {
  const [sandboxEnabled, setSandboxEnabledState] = useState(false)
  const [sandboxStats, setSandboxStats] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Check if sandbox is available (development and preview environments)
  const isSandboxAvailable = process.env.VERCEL_ENV !== 'production'

  const setSandboxEnabled = (enabled: boolean) => {
    if (!isSandboxAvailable) return
    
    setSandboxEnabledState(enabled)
    localStorage.setItem('sandbox-enabled', enabled.toString())
    
    if (enabled) {
      refreshSandboxStats()
    }
  }

  const refreshSandboxStats = async () => {
    if (!isSandboxAvailable || !sandboxEnabled) return

    setIsLoading(true)
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'
      const response = await fetch(`${API_BASE_URL}/api/whatsapp/status`)
      if (response.ok) {
        const stats = await response.json()
        setSandboxStats(stats)
      }
    } catch (error) {
      console.error('Error refreshing sandbox stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Load sandbox state from localStorage on mount
  useEffect(() => {
    if (!isSandboxAvailable) return

    const saved = localStorage.getItem('sandbox-enabled')
    if (saved === 'true') {
      setSandboxEnabledState(true)
      refreshSandboxStats()
    }
  }, [isSandboxAvailable])

  // Refresh stats periodically when sandbox is enabled
  useEffect(() => {
    if (!sandboxEnabled) return

    const interval = setInterval(refreshSandboxStats, 30000) // Every 30 seconds
    return () => clearInterval(interval)
  }, [sandboxEnabled])

  const contextValue: SandboxContextType = {
    sandboxEnabled: isSandboxAvailable && sandboxEnabled,
    setSandboxEnabled,
    sandboxStats,
    refreshSandboxStats,
    isLoading
  }

  return (
    <SandboxContext.Provider value={contextValue}>
      {children}
    </SandboxContext.Provider>
  )
}

export function useSandbox() {
  const context = useContext(SandboxContext)
  if (context === undefined) {
    throw new Error('useSandbox must be used within a SandboxProvider')
  }
  return context
}
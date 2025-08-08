"use client"

import { useState, useEffect, useCallback } from 'react'
import { PrintSettings, DEFAULT_PRINT_SETTINGS } from '@/lib/print-types'
import { printService } from '@/lib/print-service'

export function usePrintSettings() {
  const [settings, setSettings] = useState<PrintSettings>(DEFAULT_PRINT_SETTINGS)
  const [isLoading, setIsLoading] = useState(true)

  // Load settings on mount
  useEffect(() => {
    const loadSettings = () => {
      const stored = printService.getStoredSettings()
      if (stored) {
        setSettings(stored)
      }
      setIsLoading(false)
    }

    loadSettings()
  }, [])

  // Update settings and save to storage
  const updateSettings = useCallback((updates: Partial<PrintSettings>) => {
    setSettings(prev => {
      const newSettings = { ...prev, ...updates }
      printService.saveSettings(newSettings)
      return newSettings
    })
  }, [])

  // Reset settings to defaults
  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_PRINT_SETTINGS)
    printService.saveSettings(DEFAULT_PRINT_SETTINGS)
  }, [])

  // Toggle auto-print
  const toggleAutoPrint = useCallback(() => {
    updateSettings({ autoPrintEnabled: !settings.autoPrintEnabled })
  }, [settings.autoPrintEnabled, updateSettings])

  return {
    settings,
    updateSettings,
    resetSettings,
    toggleAutoPrint,
    isLoading
  }
}
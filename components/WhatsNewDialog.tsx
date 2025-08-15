"use client"

import { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { HelpCircle, Plus, Bug, Shield, Sparkles, ArrowUpCircle, Settings } from "lucide-react"
import { ModernLoader } from "@/components/ui/loading"

interface ChangelogEntry {
  version: string
  date: string
  changes: {
    type: 'Agregado' | 'Cambiado' | 'Corregido' | 'Removido' | 'Seguridad' | 'Mejorado'
    items: string[]
  }[]
}

interface WhatsNewDialogProps {
  children: React.ReactNode
  onNotificationUpdate?: (hasNewUpdates: boolean) => void
}

export function WhatsNewDialog({ children, onNotificationUpdate }: WhatsNewDialogProps) {
  const [changelog, setChangelog] = useState<ChangelogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [hasNewUpdates, setHasNewUpdates] = useState(false)

  // localStorage functions for version tracking
  const getLastSeenVersion = useCallback(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('lastSeenChangelogVersion') || '0.0.0'
    }
    return '0.0.0'
  }, [])

  const setLastSeenVersion = useCallback((version: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lastSeenChangelogVersion', version)
    }
  }, [])

  const compareVersions = useCallback((version1: string, version2: string) => {
    const v1parts = version1.split('.').map(n => parseInt(n, 10))
    const v2parts = version2.split('.').map(n => parseInt(n, 10))
    
    for (let i = 0; i < Math.max(v1parts.length, v2parts.length); i++) {
      const v1part = v1parts[i] || 0
      const v2part = v2parts[i] || 0
      
      if (v1part > v2part) return 1
      if (v1part < v2part) return -1
    }
    return 0
  }, [])

  // Check for new updates on component mount
  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        const response = await fetch('/CHANGELOG.md')
        if (response.ok) {
          const text = await response.text()
          const parsed = parseChangelog(text)
          
          if (parsed.length > 0) {
            const latestVersion = parsed[0].version
            const lastSeenVersion = getLastSeenVersion()
            const hasUpdates = compareVersions(latestVersion, lastSeenVersion) > 0
            
            setHasNewUpdates(hasUpdates)
            onNotificationUpdate?.(hasUpdates)
          }
        }
      } catch (error) {
        console.error('Error checking for updates:', error)
      }
    }

    checkForUpdates()
  }, [getLastSeenVersion, compareVersions, onNotificationUpdate])

  useEffect(() => {
    const loadChangelog = async () => {
      try {
        const response = await fetch('/CHANGELOG.md')
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const text = await response.text()
        console.log('Changelog text loaded:', text.substring(0, 200) + '...')
        const parsed = parseChangelog(text)
        console.log('Parsed changelog entries:', parsed.length)
        setChangelog(parsed)
        
        // Mark latest version as seen when dialog is opened
        if (parsed.length > 0) {
          const latestVersion = parsed[0].version
          setLastSeenVersion(latestVersion)
          setHasNewUpdates(false)
          onNotificationUpdate?.(false)
        }
      } catch (error) {
        console.error('Error loading changelog:', error)
      } finally {
        setLoading(false)
      }
    }

    if (open) {
      loadChangelog()
    }
  }, [open, setLastSeenVersion, onNotificationUpdate])

  const parseChangelog = (text: string): ChangelogEntry[] => {
    const entries: ChangelogEntry[] = []
    const lines = text.split('\n')
    let currentEntry: ChangelogEntry | null = null
    let currentChangeType: string | null = null

    console.log('Parsing changelog with', lines.length, 'lines')

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      // Match version headers like ## [0.3.2] - 11 de agosto de 2025
      const versionMatch = line.match(/^## \[(\d+\.\d+\.\d+)\] - (.+)/)
      if (versionMatch) {
        if (currentEntry) {
          entries.push(currentEntry)
        }
        currentEntry = {
          version: versionMatch[1],
          date: versionMatch[2],
          changes: []
        }
        currentChangeType = null
        console.log('Found version:', versionMatch[1], 'date:', versionMatch[2])
        continue
      }

      // Match change type headers with emojis like ### 🆕 Nuevas funciones
      const changeTypeMatch = line.match(/^### [🆕✨🔧❌] (.+)/)
      if (changeTypeMatch && currentEntry) {
        const typeText = changeTypeMatch[1]
        // Map Spanish types to the expected English types for consistency
        let mappedType = 'Agregado'
        if (typeText.includes('Nuevas funciones') || typeText.includes('Sistema inicial')) {
          mappedType = 'Agregado'
        } else if (typeText.includes('Mejoras') || typeText.includes('Características principales')) {
          mappedType = 'Mejorado'
        } else if (typeText.includes('Correcciones')) {
          mappedType = 'Corregido'
        }
        
        currentChangeType = mappedType
        currentEntry.changes.push({
          type: mappedType as any,
          items: []
        })
        console.log('Found change type:', mappedType)
        continue
      }

      // Match bullet points like - **Feature**: description
      const bulletMatch = line.match(/^- \*\*(.*?)\*\*: (.*)/)
      if (bulletMatch && currentEntry && currentChangeType) {
        const currentChange = currentEntry.changes[currentEntry.changes.length - 1]
        if (currentChange) {
          const item = `${bulletMatch[1]}: ${bulletMatch[2]}`
          currentChange.items.push(item)
          console.log('Added bullet item:', item)
        }
        continue
      }

      // Match simple bullet points like - **Simple description**
      const simpleBulletMatch = line.match(/^- \*\*(.*?)\*\*(.*)/)
      if (simpleBulletMatch && currentEntry && currentChangeType) {
        const currentChange = currentEntry.changes[currentEntry.changes.length - 1]
        if (currentChange) {
          const item = simpleBulletMatch[1] + (simpleBulletMatch[2] || '')
          currentChange.items.push(item)
          console.log('Added simple bullet item:', item)
        }
      }
    }

    if (currentEntry) {
      entries.push(currentEntry)
    }

    console.log('Final parsed entries:', entries.length)
    return entries
  }

  const getChangeTypeIcon = (type: string) => {
    switch (type) {
      case 'Agregado':
        return <Plus className="w-4 h-4 text-muted-foreground" />
      case 'Mejorado':
        return <ArrowUpCircle className="w-4 h-4 text-muted-foreground" />
      case 'Cambiado':
        return <Settings className="w-4 h-4 text-muted-foreground" />
      case 'Corregido':
        return <Bug className="w-4 h-4 text-muted-foreground" />
      case 'Seguridad':
        return <Shield className="w-4 h-4 text-muted-foreground" />
      default:
        return <Sparkles className="w-4 h-4 text-muted-foreground" />
    }
  }


  const formatDate = (dateString: string) => {
    // Handle both ISO format (2025-08-11) and Spanish format (11 de agosto de 2025)
    if (dateString.includes('de ')) {
      // Already in Spanish format
      return dateString
    }
    
    // Convert ISO date to Spanish format
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 border-b">
          <DialogHeader className="pb-4">
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-accent-blue" />
              ¿Qué hay de nuevo?
              {hasNewUpdates && (
                <Badge variant="destructive" className="text-xs animate-pulse">
                  Nuevo
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
        </div>
        
        <ScrollArea className="flex-1 overflow-hidden">
          <div className="p-6 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <ModernLoader />
            </div>
          ) : changelog.length === 0 ? (
            <div className="space-y-6">
              {/* Simple fallback content */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">v0.3.2</Badge>
                    <Badge variant="secondary" className="text-xs">Reciente</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">11 de agosto de 2025</div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">🆕 Nuevas funciones</span>
                    </div>
                    <ul className="ml-6 space-y-1 text-sm text-muted-foreground">
                      <li>• <strong>Confirmaciones más claras</strong>: Ventanas de confirmación más fáciles de usar</li>
                      <li>• <strong>Mejor experiencia en móviles</strong>: Todo se ve perfecto en cualquier dispositivo</li>
                      <li>• <strong>Colores más consistentes</strong>: Experiencia visual unificada</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="text-center text-sm text-muted-foreground">
                ¡Gracias por usar el sistema! ✨
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {changelog.slice(0, 3).map((entry, index) => (
                <div key={entry.version} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">v{entry.version}</Badge>
                      {index === 0 && (
                        <Badge variant="secondary" className="text-xs">Reciente</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">{formatDate(entry.date)}</div>
                  </div>

                  <div className="space-y-4">
                    {entry.changes.map((change, changeIndex) => (
                      <div key={changeIndex}>
                        <div className="flex items-center gap-2 mb-2">
                          {getChangeTypeIcon(change.type)}
                          <span className="text-sm font-medium">{change.type}</span>
                        </div>
                        <ul className="ml-6 space-y-1 text-sm text-muted-foreground">
                          {change.items.map((item, itemIndex) => (
                            <li key={itemIndex}>• {item}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
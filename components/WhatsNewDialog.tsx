"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { HelpCircle, Calendar, Plus, Wrench, Bug, Shield, Sparkles, ArrowUpCircle, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

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
}

export function WhatsNewDialog({ children }: WhatsNewDialogProps) {
  const [changelog, setChangelog] = useState<ChangelogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)

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
      } catch (error) {
        console.error('Error loading changelog:', error)
      } finally {
        setLoading(false)
      }
    }

    if (open) {
      loadChangelog()
    }
  }, [open])

  const parseChangelog = (text: string): ChangelogEntry[] => {
    const entries: ChangelogEntry[] = []
    const lines = text.split('\n')
    let currentEntry: ChangelogEntry | null = null
    let currentChangeType: string | null = null

    console.log('Parsing changelog with', lines.length, 'lines')

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      // Match version headers like ## [1.2.0] - 2025-01-08
      const versionMatch = line.match(/^## \[(\d+\.\d+\.\d+)\] - (\d{4}-\d{2}-\d{2})/)
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

      // Match change type headers like ### Agregado
      const changeTypeMatch = line.match(/^### (Agregado|Cambiado|Corregido|Removido|Seguridad|Mejorado)/)
      if (changeTypeMatch && currentEntry) {
        currentChangeType = changeTypeMatch[1]
        currentEntry.changes.push({
          type: currentChangeType as any,
          items: []
        })
        console.log('Found change type:', currentChangeType)
        continue
      }

      // Match bullet points like - **Feature** description
      const bulletMatch = line.match(/^- \*\*(.*?)\*\* (.*)/)
      if (bulletMatch && currentEntry && currentChangeType) {
        const currentChange = currentEntry.changes[currentEntry.changes.length - 1]
        if (currentChange) {
          const item = `${bulletMatch[1]}: ${bulletMatch[2]}`
          currentChange.items.push(item)
          console.log('Added bullet item:', item)
        }
        continue
      }

      // Match simple bullet points like - Simple description
      const simpleBulletMatch = line.match(/^- (.+)/)
      if (simpleBulletMatch && currentEntry && currentChangeType) {
        const currentChange = currentEntry.changes[currentEntry.changes.length - 1]
        if (currentChange) {
          const item = simpleBulletMatch[1]
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
            </DialogTitle>
          </DialogHeader>
        </div>
        
        <ScrollArea className="flex-1 overflow-hidden">
          <div className="p-6 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin w-6 h-6 border-2 border-accent-blue border-t-transparent rounded-full mb-4"></div>
              <div className="text-sm text-muted-foreground">Cargando actualizaciones...</div>
            </div>
          ) : changelog.length === 0 ? (
            <div className="space-y-6">
              {/* Simple fallback content */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">v1.2.0</Badge>
                    <Badge variant="secondary" className="text-xs">Reciente</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">8 de enero de 2025</div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Plus className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Agregado</span>
                    </div>
                    <ul className="ml-6 space-y-1 text-sm text-muted-foreground">
                      <li>• Botón "What's New" para mostrar actualizaciones</li>
                      <li>• Campo Peso obligatorio en pre-registro</li>
                      <li>• Nuevo orden de campos mejorado</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="text-center text-sm text-muted-foreground">
                Sistema inicializado correctamente
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
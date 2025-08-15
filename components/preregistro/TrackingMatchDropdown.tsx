"use client"

import { useState } from 'react'
import { PreregistroPackage } from "@/lib/preregistro-api"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Package, User, Calendar, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface TrackingMatchDropdownProps {
  matches: PreregistroPackage[]
  onSelectMatch: (match: PreregistroPackage) => void
  onDismiss: () => void
  className?: string
}

export function TrackingMatchDropdown({
  matches,
  onSelectMatch,
  onDismiss,
  className
}: TrackingMatchDropdownProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  const getStatusColor = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'prealertado':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'vuelo asignado':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'en tránsito':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  return (
    <Card className={cn("absolute top-full left-0 right-0 z-50 mt-2 shadow-lg border-2", className)}>
      <CardContent className="p-0">
        <div className="flex items-center justify-between p-3 border-b bg-muted/50">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              Coincidencias encontradas ({matches.length})
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="max-h-64 overflow-y-auto">
          {matches.map((match, index) => (
            <div
              key={match.id || match.nid}
              className={cn(
                "p-3 border-b last:border-b-0 cursor-pointer transition-colors hover:bg-muted/30",
                selectedIndex === index && "bg-accent/20"
              )}
              onClick={() => {
                setSelectedIndex(index)
                onSelectMatch(match)
              }}
              onMouseEnter={() => setSelectedIndex(index)}
              onMouseLeave={() => setSelectedIndex(null)}
            >
              <div className="space-y-2">
                {/* Header with tracking and status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium">
                      {match.numeroTracking}
                    </span>
                    {match.ci_paquete && (
                      <span className="text-xs text-muted-foreground">
                        CI: {match.ci_paquete}
                      </span>
                    )}
                  </div>
                  <Badge 
                    variant="outline" 
                    className={cn("text-xs", getStatusColor(match.estado || ''))}
                  >
                    {match.estado || 'Sin estado'}
                  </Badge>
                </div>

                {/* Package details */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Cliente:</span>
                      <span className="font-medium">
                        {match.numeroCasillero || 'No asignado'}
                      </span>
                    </div>
                    {match.peso && (
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">Peso:</span>
                        <span className="font-medium">{match.peso} kg</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    {match.numeroTarima && (
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">Tarima:</span>
                        <span className="font-medium">{match.numeroTarima}</span>
                      </div>
                    )}
                    {match.fecha_creacion && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        <span className="text-muted-foreground">Fecha:</span>
                        <span className="font-medium">
                          {formatDate(match.fecha_creacion)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Content preview */}
                {match.contenido && (
                  <div className="text-xs">
                    <span className="text-muted-foreground">Contenido:</span>
                    <p className="mt-1 text-foreground line-clamp-2">
                      {match.contenido}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer with option to create new */}
        <div className="p-3 border-t bg-muted/50">
          <Button
            variant="outline"
            size="sm"
            onClick={onDismiss}
            className="w-full text-sm"
          >
            Ninguna de estas coincidencias - Crear nuevo paquete
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
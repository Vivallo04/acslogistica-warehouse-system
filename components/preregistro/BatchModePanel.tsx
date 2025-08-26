"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { 
  Package2, 
  Play, 
  Pause, 
  Square, 
  Timer, 
  Settings2,
  ChevronDown,
  ChevronUp,
  Target
} from "lucide-react"
import { cn } from "@/lib/utils"

interface BatchSession {
  id: string
  isActive: boolean
  startedAt: Date
  packagesScanned: number
  defaultValues: {
    contenido: string
    peso: string
    numeroTarima: string
    numeroCasillero: string
  }
  status: 'active' | 'paused' | 'completed'
}

interface BatchModePanelProps {
  session: BatchSession | null
  onStartSession: (defaultValues: BatchSession['defaultValues']) => void
  onPauseSession: () => void
  onResumeSession: () => void
  onCompleteSession: () => void
  onUpdateDefaults: (defaults: BatchSession['defaultValues']) => void
  palletOptions: { value: string; label: string }[]
  isVisible: boolean
  onToggleVisibility: () => void
}

export function BatchModePanel({
  session,
  onStartSession,
  onPauseSession,
  onResumeSession,
  onCompleteSession,
  onUpdateDefaults,
  palletOptions,
  isVisible,
  onToggleVisibility
}: BatchModePanelProps) {
  const [isConfigExpanded, setIsConfigExpanded] = useState(false)
  const [tempDefaults, setTempDefaults] = useState<BatchSession['defaultValues']>({
    contenido: session?.defaultValues.contenido || "",
    peso: session?.defaultValues.peso || "",
    numeroTarima: session?.defaultValues.numeroTarima || palletOptions[0]?.value || "",
    numeroCasillero: session?.defaultValues.numeroCasillero || ""
  })

  const handleStartSession = () => {
    onStartSession(tempDefaults)
  }

  const handleUpdateDefaults = () => {
    if (session) {
      onUpdateDefaults(tempDefaults)
    }
  }

  const formatDuration = (startTime: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - startTime.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMins % 60}m`
    }
    return `${diffMins}m`
  }

  if (!isVisible && !session?.isActive) {
    return null
  }

  return (
    <Card className={cn(
      "transition-all duration-300",
      session?.isActive ? "border-accent-blue/50 bg-accent-blue/5" : "border-border"
    )}>
      <CardHeader className="pb-3 px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Package2 className={cn(
              "w-5 h-5",
              session?.status === 'active' && "text-green-600 animate-pulse",
              session?.status === 'paused' && "text-orange-500"
            )} />
            <span className="leading-tight">
              {session?.isActive ? "Modo Lote Activo" : "Configurar Modo Lote"}
            </span>
          </CardTitle>
          
          <div className="flex items-center justify-between sm:justify-end gap-2">
            {session?.isActive && (
              <Badge 
                variant={session.status === 'active' ? 'default' : 'secondary'}
                className={cn(
                  "text-xs",
                  session.status === 'active' && "bg-green-600",
                  session.status === 'paused' && "bg-orange-500"
                )}
              >
                {session.status === 'active' ? 'Activo' : 'Pausado'}
              </Badge>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleVisibility}
              className="h-8 w-8 p-0"
            >
              {isVisible ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isVisible && (
        <CardContent className="space-y-4 px-4 sm:px-6">
          {/* Session Info */}
          {session?.isActive && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 p-3 bg-muted/50 rounded-lg">
              <div className="text-center sm:text-center">
                <div className="text-xl sm:text-2xl font-bold text-accent-blue">{session.packagesScanned}</div>
                <div className="text-xs text-muted-foreground">Paquetes procesados</div>
              </div>
              <div className="text-center sm:text-center">
                <div className="text-sm font-medium flex items-center justify-center gap-1">
                  <Timer className="w-4 h-4" />
                  {formatDuration(session.startedAt)}
                </div>
                <div className="text-xs text-muted-foreground">Duración total</div>
              </div>
              <div className="text-center sm:text-center">
                <div className="text-xs text-muted-foreground">ID de Sesión</div>
                <div className="text-sm font-mono">{session.id.split('_')[1]}</div>
              </div>
            </div>
          )}

          {/* Session Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {!session?.isActive ? (
              <Button
                onClick={handleStartSession}
                className="bg-accent-blue hover:bg-accent-blue/90 text-white h-12 sm:h-10 sm:flex-1"
              >
                <Play className="w-4 h-4 mr-2" />
                <span className="text-base sm:text-sm">Iniciar Sesión de Lote</span>
              </Button>
            ) : (
              <>
                {session.status === 'active' ? (
                  <Button onClick={onPauseSession} variant="outline" className="h-12 sm:h-10 sm:flex-1">
                    <Pause className="w-4 h-4 mr-2" />
                    <span className="text-base sm:text-sm">Pausar Sesión</span>
                  </Button>
                ) : (
                  <Button onClick={onResumeSession} className="bg-green-600 hover:bg-green-700 text-white h-12 sm:h-10 sm:flex-1">
                    <Play className="w-4 h-4 mr-2" />
                    <span className="text-base sm:text-sm">Reanudar Sesión</span>
                  </Button>
                )}
                
                <Button onClick={onCompleteSession} variant="destructive" className="h-12 sm:h-10">
                  <Square className="w-4 h-4 mr-2" />
                  <span className="text-base sm:text-sm">Completar</span>
                </Button>
              </>
            )}
          </div>

          {/* Configuration Section - Only show when batch session is NOT active */}
          {!session?.isActive && (
            <div className="space-y-3">
              <Button
                variant="ghost"
                onClick={() => setIsConfigExpanded(!isConfigExpanded)}
                className="w-full justify-between p-2 h-auto"
              >
                <div className="flex items-center gap-2">
                  <Settings2 className="w-4 h-4" />
                  <span className="text-sm">Valores Predeterminados</span>
                </div>
                {isConfigExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 w-4" />}
              </Button>

              {isConfigExpanded && (
                <div className="space-y-4 p-3 bg-muted/30 rounded-lg border">
                  {/* Default Contenido */}
                  <div className="space-y-2">
                    <Label htmlFor="batch-contenido" className="text-sm flex items-center gap-2">
                      <Target className="w-3 h-3" />
                      <span>Contenido Predeterminado</span>
                    </Label>
                    <Textarea
                      id="batch-contenido"
                      value={tempDefaults.contenido}
                      onChange={(e) => setTempDefaults(prev => ({ ...prev, contenido: e.target.value }))}
                      placeholder="Ej: Documentos personales"
                      className="min-h-[80px] sm:min-h-[60px] text-base sm:text-sm resize-none"
                    />
                  </div>

                  {/* Default Peso */}
                  <div className="space-y-2">
                    <Label htmlFor="batch-peso" className="text-sm flex items-center gap-2">
                      <Target className="w-3 h-3" />
                      <span>Peso Predeterminado</span>
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="batch-peso"
                        type="number"
                        inputMode="decimal"
                        step="0.1"
                        min="0"
                        value={tempDefaults.peso}
                        onChange={(e) => setTempDefaults(prev => ({ ...prev, peso: e.target.value }))}
                        placeholder="2.5"
                        className="text-base sm:text-sm h-12 sm:h-10"
                      />
                      <span className="text-sm text-muted-foreground whitespace-nowrap">kg</span>
                    </div>
                  </div>

                  {/* Default Tarima */}
                  <div className="space-y-2">
                    <Label htmlFor="batch-tarima" className="text-sm flex items-center gap-2">
                      <Target className="w-3 h-3" />
                      <span>Tarima Predeterminada</span>
                    </Label>
                    <Select
                      value={tempDefaults.numeroTarima}
                      onValueChange={(value) => setTempDefaults(prev => ({ ...prev, numeroTarima: value }))}
                    >
                      <SelectTrigger className="text-base sm:text-sm h-12 sm:h-10">
                        <SelectValue placeholder="- Seleccione una tarima -" />
                      </SelectTrigger>
                      <SelectContent>
                        {palletOptions.map(option => (
                          <SelectItem key={option.value} value={option.value} className="text-sm py-3 sm:py-2">
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Update Defaults Button */}
                  <Button
                    onClick={session?.isActive ? handleUpdateDefaults : () => {}}
                    variant="outline"
                    size="sm"
                    className="w-full text-base sm:text-sm h-12 sm:h-10"
                    disabled={!session?.isActive}
                  >
                    <Settings2 className="w-4 h-4 sm:w-3 sm:h-3 mr-2" />
                    <span>
                      {session?.isActive ? "Actualizar Valores" : "Se aplicarán al iniciar"}
                    </span>
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
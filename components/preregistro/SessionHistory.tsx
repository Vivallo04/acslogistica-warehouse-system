"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { 
  ChevronDown, 
  ChevronUp, 
  Download, 
  Trash2, 
  Clock, 
  Package,
  CheckCircle2,
  AlertCircle
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"

export interface ProcessedPackage {
  id: string
  numeroTracking: string
  numeroCasillero: string
  contenido: string
  peso: string
  numeroTarima: string
  timestamp: Date
  estado: 'procesado' | 'pendiente'
  ci?: string
  pdfUrl?: string
}

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

interface SessionHistoryProps {
  packages: ProcessedPackage[]
  batchSession?: BatchSession | null
  onClearSession: () => void
  onExportSession: () => void
}

export function SessionHistory({ 
  packages, 
  batchSession,
  onClearSession, 
  onExportSession 
}: SessionHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const processedCount = packages.filter(pkg => pkg.estado === 'procesado').length
  const pendingCount = packages.filter(pkg => pkg.estado === 'pendiente').length

  const exportToCSV = () => {
    if (packages.length === 0) return

    try {
      const headers = ['Tracking', 'CI', 'Cliente', 'Contenido', 'Peso', 'Tarima', 'Estado', 'Hora']
      const csvContent = [
        headers.join(','),
        ...packages.map(pkg => [
          `"${pkg.numeroTracking.replace(/"/g, '""')}"`,
          `"${pkg.ci || '-'}"`,
          `"${pkg.numeroCasillero.replace(/"/g, '""')}"`,
          `"${pkg.contenido.replace(/"/g, '""')}"`,
          `"${pkg.peso.replace(/"/g, '""')}"`,
          `"${pkg.numeroTarima.replace(/"/g, '""')}"`,
          `"${pkg.estado.replace(/"/g, '""')}"`,
          `"${format(pkg.timestamp, 'HH:mm:ss', { locale: es })}"`
        ].join(','))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `preregistro-session-${format(new Date(), 'yyyyMMdd-HHmmss')}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      onExportSession()
    } catch (error) {
      console.error('Error exporting CSV:', error)
      // Could add toast notification here for error feedback
    }
  }

  if (packages.length === 0) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Package className="w-5 h-5" />
            Historial de Sesión
            <Badge variant="secondary" className="ml-2">0 paquetes</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No hay paquetes procesados en esta sesión</p>
            <p className="text-xs mt-1">Los paquetes aparecerán aquí cuando los proceses</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mt-6">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors pb-4 sm:pb-6">
            <div className="space-y-3 sm:space-y-0">
              {/* Mobile: Stacked layout, Desktop: Horizontal */}
              <div className="flex items-center justify-between">
                <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2 text-lg">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    {batchSession?.isActive ? 'Sesión de Lote' : 'Historial de Sesión'}
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <Badge variant="secondary" className="text-xs">
                      {packages.length} paquete{packages.length !== 1 ? 's' : ''}
                    </Badge>
                    {batchSession?.isActive && (
                      <Badge 
                        variant={batchSession.status === 'active' ? 'default' : 'secondary'}
                        className={cn(
                          "text-xs",
                          batchSession.status === 'active' 
                            ? 'bg-green-600 animate-pulse' 
                            : 'bg-orange-500'
                        )}
                      >
                        {batchSession.status === 'active' ? '⚡ Activo' : '⏸️ Pausado'}
                      </Badge>
                    )}
                  </div>
                </CardTitle>
                
                {/* Expand/Collapse Icon */}
                <div className="sm:hidden">
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </div>
              </div>

              {/* Stats Row - Mobile: separate row, Desktop: inline */}
              <div className="flex items-center justify-between sm:hidden">
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span>{processedCount} procesados</span>
                  </div>
                  {pendingCount > 0 && (
                    <div className="flex items-center gap-1">
                      <AlertCircle className="w-4 h-4 text-orange-500" />
                      <span>{pendingCount} pendientes</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Desktop Stats */}
              <div className="hidden sm:flex items-center gap-3">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span>{processedCount} procesados</span>
                  </div>
                  {pendingCount > 0 && (
                    <div className="flex items-center gap-1">
                      <AlertCircle className="w-4 h-4 text-orange-500" />
                      <span>{pendingCount} pendientes</span>
                    </div>
                  )}
                </div>
                
                {/* Expand/Collapse Icon */}
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            {/* Action Buttons */}
            <div className="space-y-3 sm:space-y-0 mb-4 pb-4 border-b">
              {/* Session Info */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="space-y-2 sm:space-y-0 sm:flex sm:items-center sm:gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs sm:text-sm">
                      {batchSession?.isActive 
                        ? `Lote iniciado: ${format(batchSession.startedAt, 'dd/MM/yyyy HH:mm', { locale: es })}`
                        : `Sesión iniciada: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}`
                      }
                    </span>
                  </div>
                  {batchSession?.isActive && (
                    <div className="flex items-center gap-2 text-accent-blue">
                      <span className="font-medium text-xs sm:text-sm">ID: {batchSession.id.split('_')[1]}</span>
                    </div>
                  )}
                </div>
                
                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportToCSV}
                    className="flex items-center justify-center gap-2 h-10 sm:h-8 text-sm sm:text-xs"
                  >
                    <Download className="w-4 h-4" />
                    <span className="sm:hidden">Exportar CSV</span>
                    <span className="hidden sm:inline">Exportar</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onClearSession}
                    className="flex items-center justify-center gap-2 text-destructive hover:text-destructive h-10 sm:h-8 text-sm sm:text-xs"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="sm:hidden">Limpiar Sesión</span>
                    <span className="hidden sm:inline">Limpiar</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Packages Table - Desktop / Cards - Mobile */}
            <div className="rounded-lg border">
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[140px]">Tracking</TableHead>
                      <TableHead className="w-[100px]">CI</TableHead>
                      <TableHead className="w-[120px]">Cliente</TableHead>
                      <TableHead>Contenido</TableHead>
                      <TableHead className="w-[80px]">Peso</TableHead>
                      <TableHead className="w-[100px]">Tarima</TableHead>
                      <TableHead className="w-[80px]">Estado</TableHead>
                      <TableHead className="w-[80px]">Hora</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {packages.map((pkg) => (
                      <TableRow key={pkg.id}>
                        <TableCell className="font-mono text-sm">
                          {pkg.numeroTracking}
                        </TableCell>
                        <TableCell className="font-mono text-sm text-accent-blue font-medium">
                          {pkg.ci || '-'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {pkg.numeroCasillero}
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="max-w-[200px] truncate" title={pkg.contenido}>
                            {pkg.contenido || '-'}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {pkg.peso ? `${pkg.peso} kg` : '-'}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {pkg.numeroTarima}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={pkg.estado === 'procesado' ? 'default' : 'secondary'}
                            className={
                              pkg.estado === 'procesado' 
                                ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                : 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                            }
                          >
                            {pkg.estado === 'procesado' ? (
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                            ) : (
                              <AlertCircle className="w-3 h-3 mr-1" />
                            )}
                            {pkg.estado}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm font-mono">
                          {format(pkg.timestamp, 'HH:mm:ss', { locale: es })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3 p-4">
                {packages.map((pkg) => (
                  <div key={pkg.id} className="bg-muted/30 rounded-lg p-4 space-y-3">
                    {/* Header Row */}
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-1 flex-1 mr-2">
                        <div className="font-mono text-sm font-medium truncate">
                          {pkg.numeroTracking}
                        </div>
                        {pkg.ci && (
                          <div className="font-mono text-xs text-accent-blue font-medium">
                            CI: {pkg.ci}
                          </div>
                        )}
                      </div>
                      <Badge 
                        variant={pkg.estado === 'procesado' ? 'default' : 'secondary'}
                        className={cn(
                          "text-xs",
                          pkg.estado === 'procesado' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-orange-100 text-orange-800'
                        )}
                      >
                        {pkg.estado === 'procesado' ? (
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                        ) : (
                          <AlertCircle className="w-3 h-3 mr-1" />
                        )}
                        {pkg.estado}
                      </Badge>
                    </div>

                    {/* Content Grid */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-muted-foreground text-xs font-medium mb-1">Cliente</div>
                        <div className="truncate">{pkg.numeroCasillero || '-'}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs font-medium mb-1">Peso</div>
                        <div>{pkg.peso ? `${pkg.peso} kg` : '-'}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs font-medium mb-1">Tarima</div>
                        <div className="font-mono">{pkg.numeroTarima}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs font-medium mb-1">Hora</div>
                        <div className="font-mono">{format(pkg.timestamp, 'HH:mm:ss', { locale: es })}</div>
                      </div>
                    </div>

                    {/* Content Row - Full width */}
                    {pkg.contenido && (
                      <div>
                        <div className="text-muted-foreground text-xs font-medium mb-1">Contenido</div>
                        <div className="text-sm break-words">{pkg.contenido}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Summary Footer */}
            <div className="mt-4 pt-4 border-t bg-muted/30 -mx-6 px-6 py-3 rounded-b-lg">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span>Total de paquetes: <strong className="text-foreground">{packages.length}</strong></span>
                  <span>Procesados: <strong className="text-green-600">{processedCount}</strong></span>
                  {pendingCount > 0 && (
                    <span>Pendientes: <strong className="text-orange-600">{pendingCount}</strong></span>
                  )}
                  {batchSession?.isActive && (
                    <span>Contador lote: <strong className="text-accent-blue">{batchSession.packagesScanned}</strong></span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  {batchSession?.isActive && (
                    <div className="text-accent-blue">
                      Tarima: <strong>{batchSession.defaultValues.numeroTarima}</strong>
                    </div>
                  )}
                  <div>
                    Última actualización: {format(new Date(), 'HH:mm:ss', { locale: es })}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
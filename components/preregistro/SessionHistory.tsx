"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Download, 
  Clock, 
  Package,
  CheckCircle2,
  AlertCircle
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

export interface ProcessedPackage {
  id: string
  numeroTracking: string
  numeroCasillero: string
  clientDisplayName?: string // Full client name for display
  contenido: string
  peso: string
  numeroTarima: string
  timestamp: Date
  estado: 'Prealertado' | 'Vuelo Asignado' | 'En Aduana' | 'error' | 'pendiente'
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
  const { toast } = useToast()
  const processedCount = packages.filter(pkg => pkg.estado === 'Vuelo Asignado' || pkg.estado === 'En Aduana').length
  const prealertadoCount = packages.filter(pkg => pkg.estado === 'Prealertado').length
  const errorCount = packages.filter(pkg => pkg.estado === 'error').length
  const pendingCount = packages.filter(pkg => pkg.estado === 'pendiente').length

  // Helper function to get status display info
  const getStatusInfo = (estado: ProcessedPackage['estado']) => {
    switch (estado) {
      case 'Prealertado':
        return {
          label: 'Prealertado',
          variant: 'secondary' as const,
          className: 'bg-orange-100 text-orange-800 hover:bg-orange-200',
          icon: AlertCircle
        }
      case 'Vuelo Asignado':
        return {
          label: 'Vuelo Asignado',
          variant: 'default' as const,
          className: 'bg-green-100 text-green-800 hover:bg-green-200',
          icon: CheckCircle2
        }
      case 'En Aduana':
        return {
          label: 'En Aduana',
          variant: 'default' as const,
          className: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
          icon: CheckCircle2
        }
      case 'error':
        return {
          label: 'error',
          variant: 'destructive' as const,
          className: 'bg-red-100 text-red-800 hover:bg-red-200',
          icon: AlertCircle
        }
      case 'pendiente':
        return {
          label: 'pendiente',
          variant: 'secondary' as const,
          className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
          icon: AlertCircle
        }
    }
  }

  const exportToExcel = async () => {
    if (packages.length === 0) {
      toast({
        title: "No hay datos para exportar",
        description: "No hay paquetes en el historial de sesión para exportar a Excel.",
        variant: "destructive"
      })
      return
    }

    try {
      // Show loading toast
      toast({
        title: "Exportando Excel...",
        description: "Generando archivo de historial de sesión.",
      })

      // Dynamic import to avoid loading xlsx on page load
      const XLSX = await import('xlsx')
      
      const headers = ['Tracking', 'CI', 'Cliente', 'Contenido', 'Peso', 'Tarima', 'Estado', 'Hora']
      
      // Create worksheet data with headers
      const wsData = [
        headers,
        ...packages.map(pkg => [
          pkg.numeroTracking,
          pkg.ci || '-',
          pkg.clientDisplayName || pkg.numeroCasillero, // Use full client name if available
          pkg.contenido,
          `${pkg.peso} kg`,
          pkg.numeroTarima,
          pkg.estado,
          format(pkg.timestamp, 'HH:mm:ss', { locale: es })
        ])
      ]

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.aoa_to_sheet(wsData)
      
      // Set column widths for better readability
      ws['!cols'] = [
        { width: 20 }, // Tracking
        { width: 12 }, // CI
        { width: 25 }, // Cliente
        { width: 30 }, // Contenido
        { width: 10 }, // Peso
        { width: 15 }, // Tarima
        { width: 15 }, // Estado
        { width: 10 }  // Hora
      ]
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Sesión de Preregistro')
      
      // Generate filename with timestamp
      const filename = `preregistro-session-${format(new Date(), 'yyyyMMdd-HHmmss')}.xlsx`
      
      // Save the file with additional error handling
      try {
        XLSX.writeFile(wb, filename)
      } catch (writeError) {
        // Handle specific write errors
        throw new Error(`write: No se pudo guardar el archivo. ${writeError instanceof Error ? writeError.message : 'Error desconocido'}`)
      }
      
      // Show success toast
      toast({
        title: "✅ Excel exportado exitosamente",
        description: `Archivo guardado como: ${filename}`,
        variant: "default"
      })
      
      onExportSession()
    } catch (error) {
      console.error('Error exporting Excel:', error)
      
      // Show detailed error message based on error type
      let errorMessage = "Error desconocido al generar el archivo Excel."
      let errorTitle = "❌ Error al exportar Excel"
      
      if (error instanceof Error) {
        if (error.message.includes('xlsx')) {
          errorMessage = "Error al cargar la biblioteca de Excel. Verifica tu conexión a internet."
        } else if (error.message.includes('write')) {
          errorMessage = "No se pudo guardar el archivo. Verifica que tienes permisos de escritura y espacio suficiente en disco."
        } else if (error.message.includes('memory') || error.message.includes('Memory')) {
          errorMessage = "No hay suficiente memoria para generar el archivo Excel. Intenta con menos paquetes."
        } else if (error.message.includes('Network')) {
          errorMessage = "Error de conexión al cargar las librerías necesarias. Verifica tu conexión a internet."
        } else if (error.message.includes('blocked') || error.message.includes('security')) {
          errorMessage = "El navegador bloqueó la descarga del archivo. Verifica la configuración de descargas."
        } else if (error.message.includes('quota') || error.message.includes('storage')) {
          errorMessage = "No hay suficiente espacio de almacenamiento disponible."
        } else {
          errorMessage = `Error al generar Excel: ${error.message}`
        }
      } else if (typeof error === 'string') {
        errorMessage = `Error: ${error}`
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive"
      })
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
      <CardHeader className="pb-4 sm:pb-6">
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
          </div>

          {/* Stats Row - Mobile: separate row, Desktop: inline */}
          <div className="flex items-center justify-between sm:hidden">
            <div className="flex items-center gap-3 text-sm">
              {prealertadoCount > 0 && (
                <div className="flex items-center gap-1">
                  <AlertCircle className="w-4 h-4 text-orange-500" />
                  <span>{prealertadoCount} prealertados</span>
                </div>
              )}
              {errorCount > 0 && (
                <div className="flex items-center gap-1">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span>{errorCount} errores</span>
                </div>
              )}
              {pendingCount > 0 && (
                <div className="flex items-center gap-1">
                  <AlertCircle className="w-4 h-4 text-yellow-500" />
                  <span>{pendingCount} pendientes</span>
                </div>
              )}
            </div>
          </div>

          {/* Desktop Stats */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="flex items-center gap-4 text-sm">
              {prealertadoCount > 0 && (
                <div className="flex items-center gap-1">
                  <AlertCircle className="w-4 h-4 text-orange-500" />
                  <span>{prealertadoCount} prealertados</span>
                </div>
              )}
              {errorCount > 0 && (
                <div className="flex items-center gap-1">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span>{errorCount} errores</span>
                </div>
              )}
              {pendingCount > 0 && (
                <div className="flex items-center gap-1">
                  <AlertCircle className="w-4 h-4 text-yellow-500" />
                  <span>{pendingCount} pendientes</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      
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
                onClick={exportToExcel}
                className="flex items-center justify-center gap-2 h-10 sm:h-8 text-sm sm:text-xs"
              >
                <Download className="w-4 h-4" />
                <span className="sm:hidden">Exportar Excel</span>
                <span className="hidden sm:inline">Exportar</span>
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
                          {pkg.clientDisplayName || pkg.numeroCasillero}
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
                        <TableCell className="text-sm">
                          {pkg.estado}
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
                      <span className="text-xs text-muted-foreground">{pkg.estado}</span>
                    </div>

                    {/* Content Grid */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-muted-foreground text-xs font-medium mb-1">Cliente</div>
                        <div className="truncate">{pkg.clientDisplayName || pkg.numeroCasillero || '-'}</div>
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
                  {prealertadoCount > 0 && (
                    <span>Prealertados: <strong className="text-orange-600">{prealertadoCount}</strong></span>
                  )}
                  {errorCount > 0 && (
                    <span>Errores: <strong className="text-red-600">{errorCount}</strong></span>
                  )}
                  {pendingCount > 0 && (
                    <span>Pendientes: <strong className="text-yellow-600">{pendingCount}</strong></span>
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
    </Card>
  )
}
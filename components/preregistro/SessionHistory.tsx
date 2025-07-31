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

export interface ProcessedPackage {
  id: string
  numeroTracking: string
  numeroCasillero: string
  contenido: string
  peso: string
  numeroTarima: string
  timestamp: Date
  estado: 'procesado' | 'pendiente'
}

interface SessionHistoryProps {
  packages: ProcessedPackage[]
  onClearSession: () => void
  onExportSession: () => void
}

export function SessionHistory({ 
  packages, 
  onClearSession, 
  onExportSession 
}: SessionHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const processedCount = packages.filter(pkg => pkg.estado === 'procesado').length
  const pendingCount = packages.filter(pkg => pkg.estado === 'pendiente').length

  const exportToCSV = () => {
    if (packages.length === 0) return

    const headers = ['Tracking', 'Cliente', 'Contenido', 'Peso', 'Tarima', 'Estado', 'Hora']
    const csvContent = [
      headers.join(','),
      ...packages.map(pkg => [
        `"${pkg.numeroTracking}"`,
        `"${pkg.numeroCasillero}"`,
        `"${pkg.contenido}"`,
        `"${pkg.peso}"`,
        `"${pkg.numeroTarima}"`,
        `"${pkg.estado}"`,
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
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="w-5 h-5" />
                Historial de Sesión
                <Badge variant="secondary" className="ml-2">
                  {packages.length} paquete{packages.length !== 1 ? 's' : ''}
                </Badge>
              </CardTitle>
              
              <div className="flex items-center gap-3">
                {/* Session Stats */}
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
            <div className="flex items-center justify-between mb-4 pb-4 border-b">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Sesión iniciada: {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportToCSV}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Exportar CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClearSession}
                  className="flex items-center gap-2 text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                  Limpiar Sesión
                </Button>
              </div>
            </div>

            {/* Packages Table */}
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[140px]">Tracking</TableHead>
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

            {/* Summary Footer */}
            <div className="mt-4 pt-4 border-t bg-muted/30 -mx-6 px-6 py-3 rounded-b-lg">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span>Total de paquetes: <strong className="text-foreground">{packages.length}</strong></span>
                  <span>Procesados: <strong className="text-green-600">{processedCount}</strong></span>
                  {pendingCount > 0 && (
                    <span>Pendientes: <strong className="text-orange-600">{pendingCount}</strong></span>
                  )}
                </div>
                <div>
                  Última actualización: {format(new Date(), 'HH:mm:ss', { locale: es })}
                </div>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
"use client"

import { useState, useEffect, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Printer, 
  Settings, 
  Trash2, 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  ListOrdered
} from "lucide-react"
import { PrintJob, PrintSettings, DEFAULT_PRINT_SETTINGS } from "@/lib/print-types"
import { printService } from "@/lib/print-service"
import { useToast } from "@/hooks/use-toast"

interface PrintQueueDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  queue: PrintJob[]
  onAddJob: (job: PrintJob) => void
  onRemoveJob: (jobId: string) => void
  onClearQueue: () => void
  onUpdateJob: (jobId: string, updates: Partial<PrintJob>) => void
  isProcessing: boolean
  onProcessingChange: (processing: boolean) => void
  onSettingsChange?: (settings: PrintSettings) => void
}

export function PrintQueueDialog({
  open,
  onOpenChange,
  queue,
  onAddJob,
  onRemoveJob,
  onClearQueue,
  onUpdateJob,
  isProcessing,
  onProcessingChange,
  onSettingsChange
}: PrintQueueDialogProps) {
  const [settings, setSettings] = useState<PrintSettings>(DEFAULT_PRINT_SETTINGS)
  const [showSettings, setShowSettings] = useState(false)
  const { toast } = useToast()

  // Load settings on mount
  useEffect(() => {
    const stored = printService.getStoredSettings()
    if (stored) {
      setSettings(stored)
    }
  }, [])

  // Save settings when changed
  useEffect(() => {
    printService.saveSettings(settings)
  }, [settings])

  const updateSettings = useCallback((updates: Partial<PrintSettings>) => {
    const newSettings = { ...settings, ...updates }
    setSettings(newSettings)
    onSettingsChange?.(newSettings)
  }, [settings, onSettingsChange])

  const processPrintQueue = useCallback(async () => {
    if (queue.length === 0) {
      toast({
        title: "Cola de Impresión Vacía",
        description: "No hay documentos para imprimir",
        variant: "default"
      })
      return
    }

    const pendingJobs = queue.filter(job => job.status === 'pending')
    if (pendingJobs.length === 0) {
      toast({
        title: "No hay trabajos pendientes",
        description: "Todos los trabajos ya han sido procesados",
        variant: "default"
      })
      return
    }

    onProcessingChange(true)

    try {
      for (const job of pendingJobs) {
        // Update job status to printing
        onUpdateJob(job.id, { status: 'printing' })
        
        // Attempt to print
        const result = await printService.printPDF(job, settings)
        
        if (result.success) {
          onUpdateJob(job.id, { status: 'completed' })
          toast({
            title: "Documento Impreso",
            description: `CI ${job.ciNumber || job.trackingNumber} enviado a impresora`,
            variant: "default"
          })
        } else {
          onUpdateJob(job.id, { 
            status: 'failed', 
            errorMessage: result.error,
            retryCount: job.retryCount + 1
          })
          toast({
            title: "Error de Impresión",
            description: result.error || "Error desconocido al imprimir",
            variant: "destructive"
          })
        }

        // Add delay between prints
        if (job !== pendingJobs[pendingJobs.length - 1] && settings.printDelay > 0) {
          await new Promise(resolve => setTimeout(resolve, settings.printDelay))
        }
      }
    } catch (error) {
      toast({
        title: "Error en Cola de Impresión",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive"
      })
    } finally {
      onProcessingChange(false)
    }
  }, [queue, settings, onProcessingChange, onUpdateJob, toast])

  const retryJob = useCallback(async (job: PrintJob) => {
    onUpdateJob(job.id, { status: 'printing' })
    
    try {
      const result = await printService.printPDF(job, settings)
      
      if (result.success) {
        onUpdateJob(job.id, { status: 'completed' })
        toast({
          title: "Reimpresión Exitosa",
          description: `CI ${job.ciNumber || job.trackingNumber} enviado a impresora`,
          variant: "default"
        })
      } else {
        onUpdateJob(job.id, { 
          status: 'failed', 
          errorMessage: result.error,
          retryCount: job.retryCount + 1
        })
        toast({
          title: "Error de Reimpresión",
          description: result.error || "Error desconocido al reimprimir",
          variant: "destructive"
        })
      }
    } catch (error) {
      onUpdateJob(job.id, { 
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : "Error desconocido"
      })
    }
  }, [settings, onUpdateJob, toast])

  const getStatusIcon = (status: PrintJob['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-muted-foreground" />
      case 'printing':
        return <Printer className="w-4 h-4 text-blue-500 animate-pulse" />
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />
    }
  }

  const getStatusBadge = (status: PrintJob['status']) => {
    const variants = {
      pending: "secondary",
      printing: "default",
      completed: "default",
      failed: "destructive"
    } as const

    const labels = {
      pending: "Pendiente",
      printing: "Imprimiendo",
      completed: "Completado",
      failed: "Fallido"
    }

    return (
      <Badge variant={variants[status]} className="text-xs">
        {labels[status]}
      </Badge>
    )
  }

  const pendingCount = queue.filter(job => job.status === 'pending').length
  const completedCount = queue.filter(job => job.status === 'completed').length
  const failedCount = queue.filter(job => job.status === 'failed').length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <ListOrdered className="w-5 h-5" />
            Cola de Impresión
          </DialogTitle>
          <DialogDescription>
            Gestione y procese la cola de documentos CI para impresión
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 flex flex-col gap-6">
          {/* Print Queue Controls */}
          <div className="flex-shrink-0 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Button
                onClick={processPrintQueue}
                disabled={isProcessing || pendingCount === 0}
                size="sm"
                className="gap-2 rounded-full"
              >
                {isProcessing ? (
                  <>
                    <Printer className="w-4 h-4 animate-pulse" />
                    Imprimiendo...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Imprimir Cola
                  </>
                )}
              </Button>
              
              {pendingCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Dialog open={showSettings} onOpenChange={setShowSettings}>
                <Button variant="outline" size="sm" className="gap-2 rounded-full" onClick={() => setShowSettings(true)}>
                  <Settings className="w-4 h-4" />
                  Configuración de Impresión
                </Button>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Configuración de Impresión</DialogTitle>
                    <DialogDescription>
                      Ajusta las preferencias de la cola de impresión
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-6 py-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Calidad de Impresión</Label>
                      <Select 
                        value={settings.printQuality} 
                        onValueChange={(value: 'draft' | 'normal' | 'high') => 
                          updateSettings({ printQuality: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Borrador</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="high">Alta Calidad</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="batch-print" className="text-sm font-medium">
                        Impresión por Lotes
                      </Label>
                      <Switch
                        id="batch-print"
                        checked={settings.enableBatchPrint}
                        onCheckedChange={(checked) => updateSettings({ enableBatchPrint: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="auto-queue" className="text-sm font-medium">
                        Auto-agregar a Cola
                      </Label>
                      <Switch
                        id="auto-queue"
                        checked={settings.autoQueueEnabled}
                        onCheckedChange={(checked) => updateSettings({ autoQueueEnabled: checked })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        Retraso entre Impresiones (segundos)
                      </Label>
                      <Select 
                        value={String(settings.printDelay / 1000)} 
                        onValueChange={(value) => 
                          updateSettings({ printDelay: parseInt(value) * 1000 })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Sin retraso</SelectItem>
                          <SelectItem value="1">1 segundo</SelectItem>
                          <SelectItem value="2">2 segundos</SelectItem>
                          <SelectItem value="3">3 segundos</SelectItem>
                          <SelectItem value="5">5 segundos</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Button
                onClick={onClearQueue}
                variant="outline"
                size="sm"
                disabled={queue.length === 0}
                className="gap-2 rounded-full"
              >
                <Trash2 className="w-4 h-4" />
                Limpiar
              </Button>
            </div>
          </div>

          {/* Queue Statistics */}
          {queue.length > 0 && (
            <div className="flex-shrink-0 flex gap-4 text-sm text-muted-foreground">
              <span>Total: {queue.length}</span>
              {pendingCount > 0 && <span>Pendientes: {pendingCount}</span>}
              {completedCount > 0 && <span>Completados: {completedCount}</span>}
              {failedCount > 0 && <span>Fallidos: {failedCount}</span>}
            </div>
          )}

          {/* Queue List */}
          {queue.length > 0 ? (
            <Card className="flex-1 min-h-0 flex flex-col">
              <CardHeader className="pb-3 flex-shrink-0">
                <CardTitle className="text-sm">Documentos en Cola</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 min-h-0">
                <ScrollArea className="h-full">
                  <div className="space-y-2 pr-4">
                    {queue.map((job) => (
                      <div
                        key={job.id}
                        className="flex items-center justify-between p-3 border rounded-md bg-muted/20"
                      >
                        <div className="flex items-center gap-3">
                          {getStatusIcon(job.status)}
                          <div className="space-y-1">
                            <div className="text-sm font-medium">
                              CI: {job.ciNumber || 'N/A'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {job.trackingNumber}
                            </div>
                            {job.errorMessage && (
                              <div className="text-xs text-red-600">
                                {job.errorMessage}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {getStatusBadge(job.status)}
                          
                          {job.status === 'failed' && (
                            <Button
                              onClick={() => retryJob(job)}
                              variant="outline"
                              size="sm"
                              className="h-6 px-2 rounded-full"
                            >
                              <RotateCcw className="w-3 h-3" />
                            </Button>
                          )}
                          
                          <Button
                            onClick={() => onRemoveJob(job.id)}
                            variant="outline"
                            size="sm"
                            className="h-6 px-2 rounded-full"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          ) : (
            <Card className="flex-1 flex items-center justify-center">
              <CardContent className="text-center space-y-4">
                <ListOrdered className="w-12 h-12 text-muted-foreground mx-auto" />
                <div className="space-y-2">
                  <h3 className="font-medium text-muted-foreground">Cola de Impresión Vacía</h3>
                  <p className="text-sm text-muted-foreground">
                    Los documentos CI se agregarán automáticamente cuando se procesen paquetes
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
"use client"

import { useState, useEffect, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
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
  Wifi, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  Plus,
  ExternalLink,
  Monitor,
  Network,
  XCircle,
  Download
} from "lucide-react"
import { 
  Printer as PrinterType, 
  NetworkPrinter, 
  PrinterDiscoveryResult,
  printerDiscovery 
} from "@/lib/printer-discovery"
import { useToast } from "@/hooks/use-toast"

interface PrinterManagementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPrinterSelected?: (printer: PrinterType) => void
}

export function PrinterManagementDialog({
  open,
  onOpenChange,
  onPrinterSelected
}: PrinterManagementDialogProps) {
  const [discoveryResult, setDiscoveryResult] = useState<PrinterDiscoveryResult | null>(null)
  const [isDiscovering, setIsDiscovering] = useState(false)
  const [selectedPrinter, setSelectedPrinter] = useState<PrinterType | null>(null)
  const [networkIP, setNetworkIP] = useState('')
  const [networkPort, setNetworkPort] = useState('9100')
  const [isAddingNetwork, setIsAddingNetwork] = useState(false)
  const { toast } = useToast()

  const discoverPrinters = useCallback(async () => {
    setIsDiscovering(true)
    
    try {
      const result = await printerDiscovery.discoverPrinters()
      setDiscoveryResult(result)
      
      if (!result.jsprintManagerAvailable) {
        toast({
          title: "JSPrintManager No Detectado",
          description: "Instale JSPrintManager para funciones avanzadas de impresión",
          variant: "default"
        })
      } else if (result.localPrinters.length === 0 && result.networkPrinters.length === 0) {
        toast({
          title: "No se encontraron impresoras",
          description: "Verifique que las impresoras estén conectadas y encendidas",
          variant: "default"
        })
      } else {
        toast({
          title: "Búsqueda Completada",
          description: `${result.localPrinters.length + result.networkPrinters.length} impresora(s) encontrada(s)`,
          variant: "default"
        })
      }
    } catch (error) {
      toast({
        title: "Error en Búsqueda",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive"
      })
    } finally {
      setIsDiscovering(false)
    }
  }, [toast])

  // Discover printers when dialog opens
  useEffect(() => {
    if (open) {
      discoverPrinters()
    }
  }, [open, discoverPrinters])

  const addNetworkPrinter = useCallback(async () => {
    if (!networkIP.trim()) {
      toast({
        title: "IP Requerida",
        description: "Ingrese la dirección IP de la impresora",
        variant: "destructive"
      })
      return
    }

    setIsAddingNetwork(true)
    
    try {
      const networkPrinter = await printerDiscovery.addNetworkPrinter(
        networkIP.trim(), 
        parseInt(networkPort) || 9100,
        `Impresora Red (${networkIP})`
      )

      // Refresh discovery results
      await discoverPrinters()
      
      toast({
        title: "Impresora de Red Agregada",
        description: `${networkPrinter.name} - Estado: ${networkPrinter.status}`,
        variant: networkPrinter.status === 'verified' ? "default" : "destructive"
      })
      
      // Reset form
      setNetworkIP('')
      setNetworkPort('9100')
    } catch (error) {
      toast({
        title: "Error Agregando Impresora",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive"
      })
    } finally {
      setIsAddingNetwork(false)
    }
  }, [networkIP, networkPort, discoverPrinters, toast])

  const testPrinter = useCallback(async (printer: PrinterType) => {
    try {
      const isWorking = await printerDiscovery.testPrinter(printer)
      toast({
        title: isWorking ? "Impresora Funcionando" : "Error en Impresora",
        description: `${printer.name} - ${isWorking ? 'Conectada correctamente' : 'No responde'}`,
        variant: isWorking ? "default" : "destructive"
      })
    } catch (error) {
      toast({
        title: "Error en Prueba",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive"
      })
    }
  }, [toast])

  const selectPrinter = useCallback((printer: PrinterType) => {
    setSelectedPrinter(printer)
    if (onPrinterSelected) {
      onPrinterSelected(printer)
    }
    toast({
      title: "Impresora Seleccionada",
      description: `${printer.name} configurada como predeterminada`,
      variant: "default"
    })
  }, [onPrinterSelected, toast])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
      case 'verified':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />
      case 'offline':
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />
      default:
        return <AlertCircle className="w-4 h-4 text-muted-foreground" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      online: "default",
      verified: "default", 
      offline: "destructive",
      failed: "destructive",
      error: "secondary",
      unknown: "secondary",
      detected: "secondary"
    } as const

    const labels = {
      online: "En línea",
      verified: "Verificada",
      offline: "Desconectada", 
      failed: "Falló",
      error: "Error",
      unknown: "Desconocido",
      detected: "Detectada"
    }

    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"} className="text-xs">
        {labels[status as keyof typeof labels] || status}
      </Badge>
    )
  }

  const installationInfo = printerDiscovery.getInstallationInstructions()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Printer className="w-5 h-5" />
            Gestión de Impresoras
          </DialogTitle>
          <DialogDescription>
            Configure y gestione impresoras locales y de red para el sistema de etiquetas
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 flex flex-col gap-6">
          {/* Discovery Controls */}
          <div className="flex-shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                onClick={discoverPrinters}
                disabled={isDiscovering}
                size="sm"
                className="gap-2"
              >
                {isDiscovering ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Buscando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Buscar Impresoras
                  </>
                )}
              </Button>
              
              {discoveryResult && (
                <div className="text-sm text-muted-foreground">
                  {discoveryResult.localPrinters.length + discoveryResult.networkPrinters.length} encontrada(s)
                </div>
              )}
            </div>

            {selectedPrinter && (
              <Badge variant="outline" className="gap-2">
                <CheckCircle2 className="w-3 h-3" />
                {selectedPrinter.name}
              </Badge>
            )}
          </div>

          <ScrollArea className="flex-1 min-h-0">
            <div className="space-y-6 pr-4">
              {/* JSPrintManager Status */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Estado de JSPrintManager
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {discoveryResult?.jsprintManagerAvailable ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-sm">JSPrintManager instalado y funcionando</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-red-600">
                        <XCircle className="w-4 h-4" />
                        <span className="text-sm">JSPrintManager no detectado</span>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-2">
                        <p>Para funciones avanzadas de impresión, instale JSPrintManager:</p>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                          {installationInfo.instructions.map((instruction, index) => (
                            <li key={index}>{instruction}</li>
                          ))}
                        </ul>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => {
                              // Direct download for Windows installer
                              const link = document.createElement('a')
                              link.href = installationInfo.downloadUrl
                              link.download = 'jspm8-8.0.25.719-win.exe'
                              document.body.appendChild(link)
                              link.click()
                              document.body.removeChild(link)
                              
                              toast({
                                title: "Descarga Iniciada",
                                description: "JSPrintManager Windows Installer descargándose",
                                variant: "default"
                              })
                            }}
                          >
                            <Download className="w-3 h-3" />
                            Descargar JSPrintManager (Windows)
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-2 text-xs"
                            onClick={() => window.open('https://www.neodynamic.com/downloads/jspm/', '_blank')}
                          >
                            <ExternalLink className="w-3 h-3" />
                            Otras plataformas
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Local Printers */}
              {discoveryResult && discoveryResult.localPrinters.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Monitor className="w-4 h-4" />
                      Impresoras Locales ({discoveryResult.localPrinters.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {discoveryResult.localPrinters.map((printer) => (
                        <div
                          key={printer.id}
                          className="flex items-center justify-between p-3 border rounded-md bg-muted/20"
                        >
                          <div className="flex items-center gap-3">
                            {getStatusIcon(printer.status)}
                            <div className="space-y-1">
                              <div className="font-medium text-sm flex items-center gap-2">
                                {printer.name}
                                {printer.isDefault && (
                                  <Badge variant="secondary" className="text-xs">
                                    Predeterminada
                                  </Badge>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Tipo: {printer.type} • Estado: {printer.status}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {getStatusBadge(printer.status)}
                            <Button
                              onClick={() => testPrinter(printer)}
                              variant="outline"
                              size="sm"
                              className="h-8 px-3"
                            >
                              Probar
                            </Button>
                            <Button
                              onClick={() => selectPrinter(printer)}
                              variant={selectedPrinter?.id === printer.id ? "default" : "outline"}
                              size="sm"
                              className="h-8 px-3"
                            >
                              {selectedPrinter?.id === printer.id ? "Seleccionada" : "Usar"}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Network Printers */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Network className="w-4 h-4" />
                    Impresoras de Red ({discoveryResult?.networkPrinters.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Add Network Printer Form */}
                    <div className="grid grid-cols-4 gap-2">
                      <Input
                        placeholder="IP (ej: 192.168.1.100)"
                        value={networkIP}
                        onChange={(e) => setNetworkIP(e.target.value)}
                        className="col-span-2"
                      />
                      <Input
                        placeholder="Puerto"
                        value={networkPort}
                        onChange={(e) => setNetworkPort(e.target.value)}
                      />
                      <Button
                        onClick={addNetworkPrinter}
                        disabled={isAddingNetwork}
                        size="sm"
                        className="gap-2"
                      >
                        {isAddingNetwork ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <Plus className="w-3 h-3" />
                        )}
                        Agregar
                      </Button>
                    </div>

                    {/* Network Printers List */}
                    {discoveryResult && discoveryResult.networkPrinters.length > 0 && (
                      <div className="space-y-3">
                        <Separator />
                        {discoveryResult.networkPrinters.map((printer, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 border rounded-md bg-muted/20"
                          >
                            <div className="flex items-center gap-3">
                              {getStatusIcon(printer.status)}
                              <div className="space-y-1">
                                <div className="font-medium text-sm">
                                  {printer.name || `Impresora Red ${printer.ipAddress}`}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {printer.ipAddress}:{printer.port} • {printer.model || 'Modelo desconocido'}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {getStatusBadge(printer.status)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* No Printers Found */}
              {discoveryResult && 
               discoveryResult.localPrinters.length === 0 && 
               discoveryResult.networkPrinters.length === 0 && 
               !isDiscovering && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center space-y-4">
                      <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto" />
                      <div className="space-y-2">
                        <h3 className="font-medium text-muted-foreground">
                          No se encontraron impresoras
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Verifique que las impresoras estén:
                        </p>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          <li>• Conectadas y encendidas</li>
                          <li>• Instaladas en el sistema</li>
                          <li>• Accesibles en la red</li>
                          <li>• JSPrintManager instalado y ejecutándose</li>
                        </ul>
                      </div>
                      <Button
                        onClick={discoverPrinters}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Buscar Nuevamente
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}
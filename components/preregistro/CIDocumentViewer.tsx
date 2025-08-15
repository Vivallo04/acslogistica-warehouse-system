"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { 
  FileText, 
  AlertCircle,
  CheckCircle2,
  Printer,
  Download
} from "lucide-react"
import { PrintJob, PrintSettings, DEFAULT_PRINT_SETTINGS } from "@/lib/print-types"
import { printService } from "@/lib/print-service"
import { useToast } from "@/hooks/use-toast"

interface CIDocumentViewerProps {
  ciNumber?: string
  pdfUrl?: string
  isLoading?: boolean
  trackingNumber?: string
  onAddToPrintQueue?: (job: PrintJob) => void
  printSettings?: PrintSettings
}

export function CIDocumentViewer({ 
  ciNumber, 
  pdfUrl, 
  isLoading = false,
  trackingNumber,
  onAddToPrintQueue,
  printSettings: externalPrintSettings
}: CIDocumentViewerProps) {
  const [fileSize, setFileSize] = useState<string>('')
  const [printSettings, setPrintSettings] = useState<PrintSettings>(DEFAULT_PRINT_SETTINGS)
  const [isAutoProcessed, setIsAutoProcessed] = useState(false)
  const { toast } = useToast()

  // Load print settings (use external settings if provided, otherwise load from storage)
  useEffect(() => {
    if (externalPrintSettings) {
      setPrintSettings(externalPrintSettings)
    } else {
      const stored = printService.getStoredSettings()
      if (stored) {
        setPrintSettings(stored)
      }
    }
  }, [externalPrintSettings])

  // Calculate file size dynamically
  useEffect(() => {
    if (pdfUrl) {
      fetch(pdfUrl, { method: 'HEAD' })
        .then(response => {
          const size = response.headers.get('content-length')
          if (size) {
            const sizeInKB = Math.round(parseInt(size) / 1024)
            setFileSize(`${sizeInKB} KB`)
          }
        })
        .catch(() => setFileSize('Unknown'))
    }
  }, [pdfUrl])

  // Auto-add to queue functionality (based on settings)
  useEffect(() => {
    if (pdfUrl && trackingNumber && !isAutoProcessed && printSettings.autoQueueEnabled) {
      
      setIsAutoProcessed(true)
      
      // Add to queue with 1 second delay if auto-queue is enabled
      const timeoutId = setTimeout(() => {
        const printJob: PrintJob = {
          id: `auto-${Date.now()}`,
          pdfUrl,
          ciNumber,
          trackingNumber,
          timestamp: new Date(),
          status: 'pending',
          retryCount: 0
        }

        if (onAddToPrintQueue) {
          onAddToPrintQueue(printJob)
          toast({
            title: "Documento Agregado a Cola",
            description: `CI ${ciNumber || trackingNumber} agregado automáticamente para impresión`,
            variant: "default"
          })
        }
      }, 1000) // Fixed 1 second delay

      return () => clearTimeout(timeoutId)
    }
  }, [pdfUrl, trackingNumber, ciNumber, isAutoProcessed, printSettings.autoQueueEnabled, onAddToPrintQueue, toast])

  // Reset auto-processed flag when PDF changes
  useEffect(() => {
    setIsAutoProcessed(false)
  }, [pdfUrl])

  const handleManualPrint = useCallback(async () => {
    if (!pdfUrl || !trackingNumber) return

    const printJob: PrintJob = {
      id: `manual-${Date.now()}`,
      pdfUrl,
      ciNumber,
      trackingNumber,
      timestamp: new Date(),
      status: 'pending',
      retryCount: 0
    }

    if (onAddToPrintQueue) {
      onAddToPrintQueue(printJob)
      toast({
        title: "Agregado a Cola de Impresión",
        description: `CI ${ciNumber || trackingNumber} agregado para impresión`,
        variant: "default"
      })
    } else {
      // Fallback: print directly
      try {
        const result = await printService.printPDF(printJob, printSettings)
        if (result.success) {
          toast({
            title: "Impresión Iniciada",
            description: "El documento ha sido enviado a la impresora",
            variant: "default"
          })
        } else {
          toast({
            title: "Error de Impresión",
            description: result.error || "Error desconocido al imprimir",
            variant: "destructive"
          })
        }
      } catch (error) {
        toast({
          title: "Error de Impresión",
          description: error instanceof Error ? error.message : "Error desconocido",
          variant: "destructive"
        })
      }
    }
  }, [pdfUrl, trackingNumber, ciNumber, onAddToPrintQueue, printSettings, toast])

  const handleDownload = useCallback(() => {
    if (!pdfUrl) return

    const link = document.createElement('a')
    link.href = pdfUrl
    link.download = `CI-${ciNumber || trackingNumber || 'document'}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Descarga Iniciada",
      description: `CI ${ciNumber || trackingNumber} descargándose`,
      variant: "default"
    })
  }, [pdfUrl, ciNumber, trackingNumber, toast])


  return (
    <Card className="h-full flex flex-col xl:h-full">
      <CardHeader className="pb-3 px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5" />
            <span className="text-base sm:text-lg">Código de CI</span>
          </CardTitle>
          {ciNumber && (
            <Badge variant="outline" className="font-mono text-xs self-start sm:self-auto">
              CI: {ciNumber}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col space-y-3 sm:space-y-4 px-4 sm:px-6">

        {/* PDF Viewer Area */}
        <div className="flex-1 border rounded-lg overflow-hidden bg-muted/20 min-h-[400px] xl:min-h-0">
          {isLoading ? (
            // Loading skeleton
            <div className="h-full p-4 space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          ) : pdfUrl ? (
            // PDF iframe or custom PDF viewer
            <div className="h-full w-full flex items-center justify-center relative">
              <iframe
                src={pdfUrl}
                className="w-full h-full border-0"
                title={`CI Document ${ciNumber || ''}`}
              />
            </div>
          ) : (
            // No document state
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
              <AlertCircle className="w-12 h-12 text-muted-foreground" />
              <div className="space-y-2">
                <h3 className="font-medium text-muted-foreground">No hay documento CI</h3>
                <p className="text-sm text-muted-foreground">
                  El documento CI se cargará automáticamente cuando esté disponible
                </p>
              </div>
            </div>
          )}
        </div>


        {/* Status Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-muted-foreground pt-2 border-t">
          <div className="flex items-center gap-2 order-1 sm:order-none">
            {pdfUrl ? (
              <>
                {printSettings.autoQueueEnabled ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-xs sm:text-sm">Agregado a cola de impresión</span>
                    <Badge variant="secondary" className="text-xs ml-2">
                      Auto-cola activada
                    </Badge>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs sm:text-sm">Auto-cola desactivada</span>
                    <Badge variant="outline" className="text-xs ml-2">
                      Manual
                    </Badge>
                  </>
                )}
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-orange-500" />
                <span className="text-xs sm:text-sm">Esperando documento</span>
              </>
            )}
          </div>
          
          {pdfUrl && (
            <div className="text-xs order-first sm:order-none">
              Tamaño: {fileSize || 'Calculando...'}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
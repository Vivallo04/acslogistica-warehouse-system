"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { 
  FileText, 
  AlertCircle,
  CheckCircle2
} from "lucide-react"

interface CIDocumentViewerProps {
  ciNumber?: string
  pdfUrl?: string
  isLoading?: boolean
}

export function CIDocumentViewer({ 
  ciNumber, 
  pdfUrl, 
  isLoading = false 
}: CIDocumentViewerProps) {
  const [fileSize, setFileSize] = useState<string>('')

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
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-xs sm:text-sm">Documento cargado</span>
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
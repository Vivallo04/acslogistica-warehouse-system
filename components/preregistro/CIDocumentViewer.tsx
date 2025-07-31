"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { 
  ZoomIn, 
  ZoomOut, 
  FileText, 
  Download, 
  RefreshCw, 
  RotateCcw, 
  RotateCw,
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
  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)
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

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 200))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50))
  }

  const handleRotateLeft = () => {
    setRotation(prev => prev - 90)
  }

  const handleRotateRight = () => {
    setRotation(prev => prev + 90)
  }

  const handleRefresh = () => {
    // Refresh PDF content
    console.log('Refreshing PDF content')
  }

  const handleDownload = () => {
    // Download PDF
    console.log('Downloading PDF')
  }


  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Código de CI
          </CardTitle>
          {ciNumber && (
            <Badge variant="outline" className="font-mono">
              CI: {ciNumber}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col space-y-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
          {/* Left side - Tools */}
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleZoomOut}
              disabled={zoom <= 50}
              className="h-8 w-8 p-0"
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            
            <div className="px-2 py-1 text-xs font-medium bg-background rounded border min-w-[60px] text-center">
              {zoom}%
            </div>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={handleZoomIn}
              disabled={zoom >= 200}
              className="h-8 w-8 p-0"
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            
            <div className="w-px h-6 bg-border mx-1" />
            
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDownload}
              className="h-8 w-8 p-0"
              title="Download"
            >
              <Download className="h-4 w-4" />
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={handleRefresh}
              className="h-8 w-8 p-0"
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={handleRotateLeft}
              className="h-8 w-8 p-0"
              title="Rotate Left"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={handleRotateRight}
              className="h-8 w-8 p-0"
              title="Rotate Right"
            >
              <RotateCw className="h-4 w-4" />
            </Button>
          </div>

        </div>

        {/* PDF Viewer Area */}
        <div className="flex-1 border rounded-lg overflow-hidden bg-muted/20">
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
            <div 
              className="h-full w-full flex items-center justify-center relative"
              style={{ transform: `rotate(${rotation}deg)` }}
            >
              <iframe
                src={pdfUrl}
                className="w-full h-full border-0"
                style={{ zoom: `${zoom}%` }}
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
        <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t">
          <div className="flex items-center gap-2">
            {pdfUrl ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>Documento cargado</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-orange-500" />
                <span>Esperando documento</span>
              </>
            )}
          </div>
          
          {pdfUrl && (
            <div className="text-xs">
              Tamaño: {fileSize || 'Calculating...'}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
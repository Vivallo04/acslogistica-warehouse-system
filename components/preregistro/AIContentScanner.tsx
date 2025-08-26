"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { 
  Camera, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Upload,
  X,
  Zap
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AIContentScannerProps {
  onContentGenerated: (content: string) => void
  disabled?: boolean
}

export function AIContentScanner({ onContentGenerated, disabled = false }: AIContentScannerProps) {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<string | null>(null)
  const [hasCamera, setHasCamera] = useState(true)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const startCamera = async () => {
    try {
      setIsCapturing(true)
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Use back camera on mobile
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      setHasCamera(false)
      toast({
        variant: "destructive",
        title: "Error de cámara",
        description: "No se pudo acceder a la cámara. Intenta subir una imagen.",
      })
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    setIsCapturing(false)
  }

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const video = videoRef.current
    const context = canvas.getContext('2d')

    if (!context) return

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw the current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    
    // Convert canvas to image data URL
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8)
    setCapturedImage(imageDataUrl)
    stopCamera()

    toast({
      title: "Imagen capturada",
      description: "Imagen lista para análisis de contenido",
    })
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      setCapturedImage(result)
    }
    reader.readAsDataURL(file)

    toast({
      title: "Imagen cargada",
      description: "Imagen lista para análisis de contenido",
    })
  }

  const analyzeImage = async () => {
    if (!capturedImage) return

    setIsAnalyzing(true)
    
    try {
      // Simulate AI analysis - replace with actual AI service call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Mock AI responses based on common package contents
      const mockResponses = [
        "Ropa casual: camisetas, pantalones y accesorios de vestir",
        "Productos electrónicos: dispositivos móviles y cables",
        "Libros y material educativo",
        "Cosméticos y productos de cuidado personal",
        "Artículos deportivos y de fitness",
        "Juguetes y artículos para niños",
        "Artículos de hogar y decoración",
        "Suplementos nutricionales y vitaminas"
      ]
      
      const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)]
      setAnalysisResult(randomResponse)
      
      toast({
        title: "Análisis completado",
        description: "IA ha identificado el contenido del paquete",
        duration: 3000,
      })
    } catch (error) {
      console.error('Error analyzing image:', error)
      toast({
        variant: "destructive",
        title: "Error de análisis",
        description: "No se pudo analizar la imagen. Intenta de nuevo.",
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const applyResult = () => {
    if (analysisResult) {
      onContentGenerated(analysisResult)
      setIsOpen(false)
      resetScanner()
      
      toast({
        title: "Contenido aplicado",
        description: "La descripción se ha agregado al formulario",
      })
    }
  }

  const resetScanner = () => {
    setCapturedImage(null)
    setAnalysisResult(null)
    setIsAnalyzing(false)
    stopCamera()
  }

  const handleClose = () => {
    setIsOpen(false)
    resetScanner()
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-300 hover:border-purple-400 text-purple-700 dark:text-purple-300"
        >
          <Camera className="w-4 h-4" />
          <Zap className="w-3 h-3" />
          <span className="hidden sm:inline">AI Scan</span>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Escaneo de Contenido con IA
            <Badge variant="secondary" className="ml-2">
              <Zap className="w-3 h-3 mr-1" />
              Beta
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Camera/Upload Section */}
          {!capturedImage && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground text-center">
                Captura una imagen del contenido del paquete para generar una descripción automática
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Camera Option */}
                <Card className="p-4 text-center space-y-3">
                  <Camera className="w-8 h-8 mx-auto text-blue-600" />
                  <div className="space-y-2">
                    <h3 className="font-medium">Usar Cámara</h3>
                    <p className="text-xs text-muted-foreground">
                      Captura directamente con la cámara
                    </p>
                    <Button 
                      onClick={startCamera}
                      disabled={!hasCamera}
                      className="w-full"
                    >
                      {isCapturing ? 'Iniciando...' : 'Abrir Cámara'}
                    </Button>
                  </div>
                </Card>

                {/* File Upload Option */}
                <Card className="p-4 text-center space-y-3">
                  <Upload className="w-8 h-8 mx-auto text-green-600" />
                  <div className="space-y-2">
                    <h3 className="font-medium">Subir Imagen</h3>
                    <p className="text-xs text-muted-foreground">
                      Selecciona una imagen existente
                    </p>
                    <Button 
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                      className="w-full"
                    >
                      Seleccionar Archivo
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* Camera View */}
          {isCapturing && !capturedImage && (
            <div className="space-y-4">
              <div className="relative bg-muted rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full max-h-64 object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="border-2 border-white border-dashed rounded-lg w-48 h-32 opacity-50" />
                </div>
              </div>
              <div className="flex gap-2 justify-center">
                <Button onClick={captureImage} className="bg-blue-600 hover:bg-blue-700">
                  <Camera className="w-4 h-4 mr-2" />
                  Capturar Imagen
                </Button>
                <Button onClick={stopCamera} variant="outline">
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {/* Captured Image Preview */}
          {capturedImage && !analysisResult && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="font-medium mb-2">Imagen Capturada</h3>
                <div className="relative inline-block">
                  <Image 
                    src={capturedImage} 
                    alt="Captured content" 
                    width={500}
                    height={300}
                    className="max-w-full max-h-64 object-contain rounded-lg border"
                    unoptimized
                  />
                </div>
              </div>
              
              <div className="flex gap-2 justify-center">
                <Button 
                  onClick={analyzeImage} 
                  disabled={isAnalyzing}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Analizando...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Analizar con IA
                    </>
                  )}
                </Button>
                <Button onClick={resetScanner} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Nueva Imagen
                </Button>
              </div>
            </div>
          )}

          {/* Analysis Loading */}
          {isAnalyzing && (
            <div className="space-y-4 text-center">
              <div className="flex items-center justify-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-purple-600" />
                <span>IA analizando contenido...</span>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4 mx-auto" />
                <Skeleton className="h-4 w-1/2 mx-auto" />
                <Skeleton className="h-4 w-2/3 mx-auto" />
              </div>
            </div>
          )}

          {/* Analysis Result */}
          {analysisResult && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="w-5 h-5" />
                <h3 className="font-medium">Análisis Completado</h3>
              </div>
              
              <Card className="p-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Descripción generada por IA:</div>
                  <div className="text-sm bg-muted p-3 rounded border-l-4 border-purple-500">
                    {analysisResult}
                  </div>
                </div>
              </Card>

              <div className="flex gap-2 justify-center">
                <Button onClick={applyResult} className="bg-green-600 hover:bg-green-700">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Aplicar Descripción
                </Button>
                <Button onClick={analyzeImage} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Re-analizar
                </Button>
                <Button onClick={resetScanner} variant="outline">
                  <Camera className="w-4 h-4 mr-2" />
                  Nueva Imagen
                </Button>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="text-xs text-muted-foreground space-y-1 bg-muted/50 p-3 rounded">
            <div className="font-medium flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Consejos para mejores resultados:
            </div>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Asegúrate de que la imagen tenga buena iluminación</li>
              <li>Enfoca los productos directamente</li>
              <li>Evita reflejos y sombras excesivas</li>
              <li>Puedes revisar y editar la descripción generada</li>
            </ul>
          </div>
        </div>

        {/* Hidden canvas for image capture */}
        <canvas ref={canvasRef} className="hidden" />
      </DialogContent>
    </Dialog>
  )
}
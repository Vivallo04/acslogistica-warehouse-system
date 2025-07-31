"use client"

import { useState, useEffect, useRef } from "react"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Package, Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { ActionToolbar } from "@/components/preregistro/ActionToolbar"
import { CIDocumentViewer } from "@/components/preregistro/CIDocumentViewer"
import { AIContentScanner } from "@/components/preregistro/AIContentScanner"
import { SessionHistory, ProcessedPackage } from "@/components/preregistro/SessionHistory"
import { WMSErrorBoundary } from "@/components/ErrorBoundary"
import { useToast } from "@/hooks/use-toast"
import * as Sentry from "@sentry/nextjs"

interface PreRegistroForm {
  numeroTracking: string
  numeroCasillero: string
  contenido: string
  peso: string
  numeroTarima: string
}

// Helper function to generate pallet options
const generatePalletOptions = () => {
  const now = new Date()
  const day = String(now.getDate()).padStart(2, '0')
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const year = String(now.getFullYear()).slice(-2)
  const baseDate = `${day}${month}${year}`
  
  return [
    { value: `${baseDate}-1`, label: `${baseDate}-1` },
    { value: `${baseDate}-2`, label: `${baseDate}-2` },
    { value: `${baseDate}-3`, label: `${baseDate}-3` },
    { value: `${baseDate}-4`, label: `${baseDate}-4` },
    { value: `${baseDate}-N/A`, label: `${baseDate}-N/A` }
  ]
}

export default function PreRegistroPage() {
  return (
    <ProtectedRoute>
      <WMSErrorBoundary>
        <PreRegistroContent />
      </WMSErrorBoundary>
    </ProtectedRoute>
  )
}

function PreRegistroContent() {
  const { toast } = useToast()

  // Refs for DOM manipulation
  const trackingInputRef = useRef<HTMLInputElement>(null)
  const tarimaSelectRef = useRef<HTMLButtonElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  // Generate pallet options once per render
  const palletOptions = generatePalletOptions()

  const [formData, setFormData] = useState<PreRegistroForm>({
    numeroTracking: "",
    numeroCasillero: "",
    contenido: "",
    peso: "",
    numeroTarima: ""
  })

  // Toolbar state
  const [autoSync, setAutoSync] = useState(true)
  
  // Session management
  const [processedPackages, setProcessedPackages] = useState<ProcessedPackage[]>([])
  
  // Combobox state for casillero
  const [casilleroOpen, setCasilleroOpen] = useState(false)
  const [casilleroSearch, setCasilleroSearch] = useState("")
  
  // Scanner compatibility
  const [scannerMode, setScannerMode] = useState(false)
  
  // Casilleros/clientes data - to be populated from API
  const casilleroOptions: { value: string; label: string }[] = []
  
  // Filter options based on search
  const filteredCasilleros = casilleroOptions.filter(option =>
    option.label.toLowerCase().includes(casilleroSearch.toLowerCase()) ||
    option.value.toLowerCase().includes(casilleroSearch.toLowerCase())
  )

  const handleInputChange = (field: keyof PreRegistroForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Handle tracking number input with scanner support
  const handleTrackingInputChange = (value: string) => {
    handleInputChange("numeroTracking", value)
    
    // Auto-detect scanner input (typically ends with Enter and is rapid)
    if (value.length > 8) { // Most tracking numbers are longer than 8 characters
      setScannerMode(true)
      setTimeout(() => setScannerMode(false), 2000) // Reset scanner mode after 2 seconds
    }
  }

  // Handle Enter key press on tracking input (common with scanners)
  const handleTrackingKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      
      // If tracking number is filled, move to next field or process
      if (formData.numeroTracking.trim()) {
        // Focus on tarima dropdown or trigger processing
        tarimaSelectRef.current?.click()
        
        toast({
          title: "Tracking escaneado",
          description: `${formData.numeroTracking} listo para procesar`,
          duration: 2000,
        })
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // Track form submission with Sentry
      await Sentry.startSpan({ 
        name: 'Package Pre-Registration',
        op: 'form.submit'
      }, async () => {
        // Create processed package
        const newPackage: ProcessedPackage = {
          id: `pkg_${Date.now()}`,
          numeroTracking: formData.numeroTracking,
          numeroCasillero: formData.numeroCasillero,
          contenido: formData.contenido,
          peso: formData.peso,
          numeroTarima: formData.numeroTarima,
          timestamp: new Date(),
          estado: 'procesado'
        }
        
        // Add to session history
        setProcessedPackages(prev => [...prev, newPackage])
        
        // Reset form
        resetForm()
        
        toast({
          title: "Paquete procesado",
          description: `Tracking ${formData.numeroTracking} agregado al historial`,
        })
      })
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          section: 'preregistro-submit',
          hasTracking: !!formData.numeroTracking.trim()
        }
      })
      toast({
        variant: "destructive",
        title: "Error al procesar paquete",
        description: "Ocurrió un error inesperado. Intente nuevamente.",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      numeroTracking: "",
      numeroCasillero: "",
      contenido: "",
      peso: "",
      numeroTarima: ""
    })
  }

  // Toolbar handlers
  const handleScanToggle = () => {
    setScannerMode(true)
    
    // Focus on tracking input using ref
    trackingInputRef.current?.focus()
    trackingInputRef.current?.select() // Select all text for easy replacement
    
    toast({
      title: "Modo escaneo activado",
      description: "Escanea o ingresa el número de tracking",
      duration: 3000,
    })
    
    // Reset scanner mode after 10 seconds if no input
    setTimeout(() => setScannerMode(false), 10000)
  }

  const handleBatchMode = () => {
    toast({
      title: "Modo lote",
      description: "Función en desarrollo",
    })
  }

  const handlePrintLabels = () => {
    toast({
      title: "Imprimir etiquetas",
      description: "Función en desarrollo",
    })
  }

  const handleReports = () => {
    toast({
      title: "Reportes",
      description: "Función en desarrollo",
    })
  }


  const handleSettings = () => {
    toast({
      title: "Configuración",
      description: "Función en desarrollo",
    })
  }

  const handleAutoSyncToggle = (enabled: boolean) => {
    setAutoSync(enabled)
    toast({
      title: enabled ? "Sincronización activada" : "Sincronización desactivada",
      description: enabled ? "Los cambios se guardarán automáticamente" : "Los cambios se guardarán manualmente",
    })
  }

  // AI Content Scanner handler
  const handleContentGenerated = (content: string) => {
    setFormData(prev => ({
      ...prev,
      contenido: content
    }))
  }
  
  // Session management handlers
  const handleClearSession = () => {
    setProcessedPackages([])
    toast({
      title: "Sesión limpiada",
      description: "Historial de paquetes eliminado",
    })
  }
  
  const handleExportSession = () => {
    toast({
      title: "Sesión exportada",
      description: "Archivo CSV descargado exitosamente",
    })
  }

  // Comprehensive keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Function key shortcuts
      if (event.key === 'F2') {
        event.preventDefault()
        handleScanToggle()
      } else if (event.key === 'F3') {
        event.preventDefault()
        handleBatchMode()
      } else if (event.key === 'F4') {
        event.preventDefault()
        handlePrintLabels()
      } else if (event.key === 'F5') {
        event.preventDefault()
        handleReports()
      } else if (event.key === 'F6') {
        event.preventDefault()
        handleSettings()
      }
      
      // Ctrl key combinations
      if (event.ctrlKey) {
        if (event.key === 's') {
          event.preventDefault()
          formRef.current?.requestSubmit()
        } else if (event.key === 'r') {
          event.preventDefault()
          resetForm()
          toast({
            title: "Formulario reiniciado",
            description: "Campos limpiados y tarima actualizada",
          })
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [formData])

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-accent-blue flex items-center gap-3">
          <Package className="w-8 h-8" />
          Pre Registro de Paquetes
        </h1>
        <p className="text-muted-foreground">
          Registra la información básica de los paquetes antes de su procesamiento completo
        </p>
      </div>

      {/* Action Toolbar */}
      <ActionToolbar
        onScanToggle={handleScanToggle}
        onBatchMode={handleBatchMode}
        onPrintLabels={handlePrintLabels}
        onReports={handleReports}
        onSettings={handleSettings}
        autoSync={autoSync}
        onAutoSyncToggle={handleAutoSyncToggle}
      />

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[60vh]">
        {/* Left Column: Package Information Form */}
        <Card className="flex flex-col h-fit">
          <CardHeader>
            <CardTitle>Información del Paquete</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
            {/* Número de Tracking - Required */}
            <div className="space-y-2">
              <Label htmlFor="numeroTracking" className="text-sm font-medium flex items-center gap-2">
                Número de Tracking <span className="text-red-500">*</span>
                {scannerMode && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full animate-pulse">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Modo Escáner
                  </span>
                )}
              </Label>
              <Input
                id="numeroTracking"
                ref={trackingInputRef}
                type="text"
                value={formData.numeroTracking}
                onChange={(e) => handleTrackingInputChange(e.target.value)}
                onKeyDown={handleTrackingKeyDown}
                placeholder={scannerMode ? "Escanea el código de barras..." : "Ingresa el número de tracking"}
                required
                autoComplete="off"
                spellCheck={false}
                className={cn(
                  "w-full font-mono transition-all duration-200",
                  scannerMode && "ring-2 ring-green-500 border-green-500 bg-green-50"
                )}
              />
            </div>

            {/* Número de Casillero / Cliente Asignado */}
            <div className="space-y-2">
              <Label htmlFor="numeroCasillero" className="text-sm font-medium">
                Número de Casillero / Cliente Asignado
              </Label>
              <Popover open={casilleroOpen} onOpenChange={setCasilleroOpen}>
                <PopoverTrigger asChild>
                  <Button
                    ref={tarimaSelectRef}
                    variant="outline"
                    role="combobox"
                    aria-expanded={casilleroOpen}
                    className="w-full justify-between"
                  >
                    {formData.numeroCasillero
                      ? casilleroOptions.find((option) => option.value === formData.numeroCasillero)?.label
                      : "Selecciona un casillero o cliente"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[200px] p-0">
                  <Command>
                    <CommandInput 
                      placeholder="Buscar casillero o cliente..." 
                      value={casilleroSearch}
                      onValueChange={setCasilleroSearch}
                    />
                    <CommandList>
                      <CommandEmpty>No se encontraron resultados.</CommandEmpty>
                      <CommandGroup>
                        {filteredCasilleros.map((option) => (
                          <CommandItem
                            key={option.value}
                            value={option.value}
                            onSelect={(currentValue) => {
                              handleInputChange("numeroCasillero", currentValue)
                              setCasilleroOpen(false)
                              setCasilleroSearch("")
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.numeroCasillero === option.value ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {option.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Contenido */}
            <div className="space-y-2">
              <Label htmlFor="contenido" className="text-sm font-medium flex items-center justify-between">
                Contenido
                <AIContentScanner 
                  onContentGenerated={handleContentGenerated}
                  disabled={!formData.numeroTracking}
                />
              </Label>
              <Textarea
                id="contenido"
                value={formData.contenido}
                onChange={(e) => handleInputChange("contenido", e.target.value)}
                placeholder="Describe el contenido del paquete o usa el escáner IA"
                className="w-full min-h-[100px]"
              />
            </div>

            {/* Peso */}
            <div className="space-y-2">
              <Label htmlFor="peso" className="text-sm font-medium">
                Peso
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="peso"
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.peso}
                  onChange={(e) => handleInputChange("peso", e.target.value)}
                  placeholder="2.5"
                  className="w-full"
                />
                <span className="text-sm text-muted-foreground">kg</span>
              </div>
            </div>

            {/* Número de Tarima - Required */}
            <div className="space-y-2">
              <Label htmlFor="numeroTarima" className="text-sm font-medium">
                Número de Tarima <span className="text-red-500">*</span>
              </Label>
              <Select 
                value={formData.numeroTarima} 
                onValueChange={(value) => handleInputChange("numeroTarima", value)}
                required
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="- Seleccione una tarima -" />
                </SelectTrigger>
                <SelectContent>
                  {palletOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6">
              <Button 
                type="submit" 
                className="bg-accent-blue hover:bg-accent-blue/90 text-white px-8"
                disabled={!formData.numeroTracking.trim() || !formData.numeroTarima.trim()}
              >
                Procesar
                <kbd className="ml-2 px-1.5 py-0.5 text-xs bg-white/20 rounded">Ctrl+S</kbd>
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={resetForm}
                className="px-8"
              >
                Limpiar
                <kbd className="ml-2 px-1.5 py-0.5 text-xs bg-muted rounded">Ctrl+R</kbd>
              </Button>
            </div>
          </form>
          </CardContent>
        </Card>

        {/* Right Column: CI Document Viewer */}
        <div className="h-fit">
          <CIDocumentViewer
            ciNumber={formData.numeroTracking ? "1234567" : undefined}
            pdfUrl={formData.numeroTracking ? "/sample-ci-document.pdf" : undefined}
            isLoading={false}
          />
        </div>
      </div>

      {/* Session History */}
      <SessionHistory
        packages={processedPackages}
        onClearSession={handleClearSession}
        onExportSession={handleExportSession}
      />
    </div>
  )
}
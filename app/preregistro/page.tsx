"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Package, Check, ChevronsUpDown, Shuffle } from "lucide-react"
import { cn } from "@/lib/utils"
import { ActionToolbar } from "@/components/preregistro/ActionToolbar"
import { CIDocumentViewer } from "@/components/preregistro/CIDocumentViewer"
import { AIContentScanner } from "@/components/preregistro/AIContentScanner"
import { SessionHistory, ProcessedPackage } from "@/components/preregistro/SessionHistory"
import { 
  searchPackagesByTracking,
  processPackage,
  getCasilleros,
  searchClientsByName,
  validateTrackingNumber,
  validatePeso,
  PreregistroPackage,
  TrackingSearchResult,
  CasilleroOption,
  ClientSearchResult
} from "@/lib/preregistro-api"
import { BatchModePanel } from "@/components/preregistro/BatchModePanel"
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

interface TrackingSearchState {
  isSearching: boolean
  searchResults: TrackingSearchResult | null
  showSuggestions: boolean
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

  // Toolbar state - Auto-sync disabled
  const autoSync = false
  
  // Session management
  const [processedPackages, setProcessedPackages] = useState<ProcessedPackage[]>([])
  
  // Batch mode state
  const [batchSession, setBatchSession] = useState<BatchSession | null>(null)
  const [showBatchPanel, setShowBatchPanel] = useState(false)
  
  // Combobox state for client search
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false)
  const [clientSearchTerm, setClientSearchTerm] = useState("")
  const [clientSearchResults, setClientSearchResults] = useState<ClientSearchResult[]>([])
  const [clientSearchLoading, setClientSearchLoading] = useState(false)
  const [selectedClient, setSelectedClient] = useState<ClientSearchResult | null>(null)
  
  // Scanner compatibility
  const [scannerMode, setScannerMode] = useState(false)
  
  // Fallback: Casilleros/clientes data - loaded from API for backward compatibility
  const [casilleroOptions, setCasilleroOptions] = useState<CasilleroOption[]>([])
  const [casilleroLoading, setCasilleroLoading] = useState(true)
  
  // Tracking search state
  const [trackingSearch, setTrackingSearch] = useState<TrackingSearchState>({
    isSearching: false,
    searchResults: null,
    showSuggestions: false
  })
  
  // Processing state
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Load casilleros on component mount (fallback)
  useEffect(() => {
    const loadCasilleros = async () => {
      try {
        setCasilleroLoading(true)
        const casilleros = await getCasilleros()
        setCasilleroOptions(casilleros)
      } catch (error) {
        console.error('Error loading casilleros:', error)
        toast({
          variant: "destructive",
          title: "Error al cargar casilleros",
          description: "No se pudieron cargar los casilleros disponibles"
        })
      } finally {
        setCasilleroLoading(false)
      }
    }
    
    loadCasilleros()
  }, [toast])

  // Debounced client search
  useEffect(() => {
    const searchClients = async () => {
      if (!clientSearchTerm || clientSearchTerm.length < 2) {
        setClientSearchResults([])
        return
      }

      try {
        setClientSearchLoading(true)
        const results = await searchClientsByName(clientSearchTerm)
        setClientSearchResults(results)
      } catch (error) {
        console.error('Error searching clients:', error)
        setClientSearchResults([])
      } finally {
        setClientSearchLoading(false)
      }
    }

    const debounceTimer = setTimeout(searchClients, 300)
    return () => clearTimeout(debounceTimer)
  }, [clientSearchTerm])

  const handleInputChange = (field: keyof PreRegistroForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Handle client selection
  const handleClientSelect = (client: ClientSearchResult) => {
    setSelectedClient(client)
    setFormData(prev => ({
      ...prev,
      numeroCasillero: client.uid.toString() // Store UID as value
    }))
    setClientDropdownOpen(false)
    setClientSearchTerm("")
  }

  // Handle tracking number input with scanner support and search
  const handleTrackingInputChange = async (value: string) => {
    handleInputChange("numeroTracking", value)
    
    // Auto-detect scanner input (typically ends with Enter and is rapid)
    if (value.length > 8) { // Most tracking numbers are longer than 8 characters
      setScannerMode(true)
      setTimeout(() => setScannerMode(false), 2000) // Reset scanner mode after 2 seconds
    }
    
    // Search for existing packages when tracking number is long enough
    if (value.length >= 3 && validateTrackingNumber(value)) {
      try {
        setTrackingSearch(prev => ({ ...prev, isSearching: true }))
        
        const searchResults = await searchPackagesByTracking(value)
        
        setTrackingSearch({
          isSearching: false,
          searchResults,
          showSuggestions: searchResults.matchType !== 'none'
        })
        
        // If exact match found, populate form with existing data
        if (searchResults.matchType === 'exact' && searchResults.existingPackage) {
          const existing = searchResults.existingPackage
          setFormData(prev => ({
            ...prev,
            numeroCasillero: existing.numeroCasillero || prev.numeroCasillero,
            contenido: existing.contenido || prev.contenido,
            peso: existing.peso || prev.peso,
            numeroTarima: existing.numeroTarima || prev.numeroTarima
          }))
          
          // TODO: Set selected client based on existing package's numeroCasillero (UID)
          // For now, we'll need to fetch client details if needed
          
          toast({
            title: "Paquete encontrado",
            description: `Información cargada para tracking ${value}`,
            duration: 3000
          })
        } else if (searchResults.matchType === 'partial' && searchResults.packages.length > 0) {
          toast({
            title: "Coincidencias parciales",
            description: `Se encontraron ${searchResults.packages.length} paquetes similares`,
            duration: 4000
          })
        }
      } catch (error) {
        console.error('Error searching tracking:', error)
        setTrackingSearch({
          isSearching: false,
          searchResults: null,
          showSuggestions: false
        })
      }
    } else {
      // Clear search results if tracking number is too short
      setTrackingSearch({
        isSearching: false,
        searchResults: null,
        showSuggestions: false
      })
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
    
    // Validate required fields
    if (!validateTrackingNumber(formData.numeroTracking)) {
      toast({
        variant: "destructive",
        title: "Número de tracking inválido",
        description: "Ingrese un número de tracking válido (mínimo 3 caracteres)"
      })
      return
    }
    
    if (!validatePeso(formData.peso)) {
      toast({
        variant: "destructive",
        title: "Peso inválido",
        description: "Ingrese un peso válido mayor a 0"
      })
      return
    }
    
    try {
      setIsProcessing(true)
      
      // Track form submission with Sentry
      await Sentry.startSpan({ 
        name: 'Package Pre-Registration',
        op: 'form.submit'
      }, async () => {
        // Process package through API
        const packageData: PreregistroPackage = {
          numeroTracking: formData.numeroTracking.trim(),
          numeroCasillero: formData.numeroCasillero,
          contenido: formData.contenido.trim(),
          peso: formData.peso,
          numeroTarima: formData.numeroTarima
        }
        
        // Pass existing package if found for status transition
        const existingPackage = trackingSearch.searchResults?.existingPackage
        const response = await processPackage(packageData, existingPackage)
        
        if (response.success && response.data) {
          // Create processed package with real CI and data
          const newPackage: ProcessedPackage = {
            id: response.data.nid.toString(),
            numeroTracking: formData.numeroTracking,
            numeroCasillero: formData.numeroCasillero,
            contenido: formData.contenido,
            peso: formData.peso,
            numeroTarima: formData.numeroTarima,
            timestamp: new Date(),
            estado: 'procesado',
            ci: response.data.ci_paquete,
            pdfUrl: response.data.pdfUrl
          }
          
          // Add to session history
          setProcessedPackages(prev => [...prev, newPackage])
          
          // Update batch session if active
          if (batchSession?.isActive && batchSession.status === 'active') {
            setBatchSession(prev => prev ? { 
              ...prev, 
              packagesScanned: prev.packagesScanned + 1 
            } : null)
          }
          
          // Reset form - maintain batch defaults if in batch mode
          if (batchSession?.isActive && batchSession.status === 'active') {
            resetFormForBatch()
          } else {
            resetForm()
          }
          
          // Clear tracking search state
          setTrackingSearch({
            isSearching: false,
            searchResults: null,
            showSuggestions: false
          })
          
          const isUpdate = !!existingPackage
          const actionText = isUpdate ? "actualizado a Vuelo Asignado" : "creado"
          
          toast({
            title: `Paquete ${actionText} exitosamente`,
            description: batchSession?.isActive 
              ? `CI: ${response.data.ci_paquete} - Lote: ${(batchSession.packagesScanned || 0) + 1} paquetes`
              : `CI: ${response.data.ci_paquete} ${isUpdate ? 'mantenido' : 'generado'} para tracking ${formData.numeroTracking}`,
            duration: 5000
          })
          
          // Auto-focus tracking input for rapid scanning in batch mode
          if (batchSession?.isActive && batchSession.status === 'active') {
            setTimeout(() => {
              trackingInputRef.current?.focus()
              trackingInputRef.current?.select()
            }, 100)
          }
        } else {
          throw new Error(response.message || response.error || 'Error desconocido')
        }
      })
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          section: 'preregistro-submit',
          hasTracking: !!formData.numeroTracking.trim()
        }
      })
      
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      toast({
        variant: "destructive",
        title: "Error al procesar paquete",
        description: errorMessage,
        duration: 6000
      })
    } finally {
      setIsProcessing(false)
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
    setSelectedClient(null)
    setClientSearchTerm("")
  }

  const resetFormForBatch = () => {
    if (batchSession?.defaultValues) {
      setFormData({
        numeroTracking: "", // Always clear tracking number
        numeroCasillero: batchSession.defaultValues.numeroCasillero,
        contenido: batchSession.defaultValues.contenido,
        peso: batchSession.defaultValues.peso,
        numeroTarima: batchSession.defaultValues.numeroTarima
      })
      // TODO: Handle batch client selection - for now keep the selected client
    } else {
      resetForm()
    }
  }

  // Toolbar handlers
  const handleScanToggle = useCallback(() => {
    // Quick scan mode is temporarily disabled
    toast({
      title: "Escaneo Rápido Deshabilitado",
      description: "La función de escaneo rápido está temporalmente deshabilitada",
      variant: "destructive"
    })
  }, [toast])

  const handleBatchMode = useCallback(() => {
    // Batch mode is temporarily disabled
    toast({
      title: "Modo Lote Deshabilitado",
      description: "El modo lote está temporalmente deshabilitado",
      variant: "destructive"
    })
  }, [toast])

  const applyBatchDefaults = (defaults: BatchSession['defaultValues']) => {
    setFormData(prev => ({
      numeroTracking: prev.numeroTracking, // Keep current tracking number
      numeroCasillero: defaults.numeroCasillero || prev.numeroCasillero,
      contenido: defaults.contenido || prev.contenido,
      peso: defaults.peso || prev.peso,
      numeroTarima: defaults.numeroTarima || prev.numeroTarima
    }))
  }

  const completeBatchSession = () => {
    if (batchSession) {
      setBatchSession(prev => prev ? { ...prev, status: 'completed', isActive: false } : null)
      setShowBatchPanel(false)
      
      toast({
        title: "Sesión de lote completada",
        description: `${batchSession.packagesScanned} paquetes procesados en total.`,
      })
    }
  }

  const pauseBatchSession = () => {
    if (batchSession) {
      setBatchSession(prev => prev ? { ...prev, status: 'paused' } : null)
      
      toast({
        title: "Sesión de lote pausada",
        description: "La sesión se ha pausado temporalmente.",
      })
    }
  }

  const resumeBatchSession = () => {
    if (batchSession) {
      setBatchSession(prev => prev ? { ...prev, status: 'active' } : null)
      
      toast({
        title: "Sesión de lote reanudada",
        description: "La sesión continúa activa.",
      })
    }
  }

  const handleStartBatchSession = (defaultValues: BatchSession['defaultValues']) => {
    const newSession: BatchSession = {
      id: `batch_${Date.now()}`,
      isActive: true,
      startedAt: new Date(),
      packagesScanned: 0,
      defaultValues,
      status: 'active'
    }
    
    setBatchSession(newSession)
    applyBatchDefaults(defaultValues)
    
    toast({
      title: "Modo lote iniciado",
      description: `Sesión ${newSession.id.split('_')[1]} creada con valores predeterminados.`,
      duration: 4000,
    })
  }

  const handleUpdateBatchDefaults = (defaults: BatchSession['defaultValues']) => {
    if (batchSession) {
      setBatchSession(prev => prev ? { ...prev, defaultValues: defaults } : null)
      applyBatchDefaults(defaults)
      
      toast({
        title: "Valores actualizados",
        description: "Los valores predeterminados del lote han sido actualizados.",
      })
    }
  }

  const handlePrintLabels = useCallback(() => {
    toast({
      title: "Imprimir Etiquetas Deshabilitado",
      description: "La función de imprimir etiquetas está temporalmente deshabilitada",
      variant: "destructive"
    })
  }, [toast])

  const handleReports = useCallback(() => {
    toast({
      title: "Reportes Deshabilitado",
      description: "La función de reportes está temporalmente deshabilitada",
      variant: "destructive"
    })
  }, [toast])

  const handleSettings = useCallback(() => {
    toast({
      title: "Configuración Deshabilitada",
      description: "La función de configuración está temporalmente deshabilitada",
      variant: "destructive"
    })
  }, [toast])

  const handleAutoSyncToggle = () => {
    // Auto-sync is temporarily disabled
    toast({
      title: "Sincronización Automática Deshabilitada",
      description: "La función de sincronización automática está temporalmente deshabilitada",
      variant: "destructive"
    })
  }

  // AI Content Scanner handler
  const handleContentGenerated = (content: string) => {
    setFormData(prev => ({
      ...prev,
      contenido: content
    }))
  }

  // Generate random tracking number
  const generateRandomTrackingNumber = useCallback(() => {
    // Generate a realistic-looking tracking number with common carrier patterns
    const patterns = [
      // UPS format: 1Z + 6 alphanumeric + 10 digits
      () => `1Z${Math.random().toString(36).substring(2, 8).toUpperCase()}${Math.floor(Math.random() * 10000000000).toString().padStart(10, '0')}`,
      // FedEx format: 4 digits + 4 digits + 4 digits
      () => `${Math.floor(Math.random() * 9000 + 1000)}${Math.floor(Math.random() * 9000 + 1000)}${Math.floor(Math.random() * 9000 + 1000)}`,
      // DHL format: 10 digits
      () => Math.floor(Math.random() * 9000000000 + 1000000000).toString(),
      // USPS format: 4 letters + 4 digits + 4 letters + 2 digits
      () => `${Math.random().toString(36).substring(2, 6).toUpperCase()}${Math.floor(Math.random() * 9000 + 1000)}${Math.random().toString(36).substring(2, 6).toUpperCase()}${Math.floor(Math.random() * 90 + 10)}`,
      // Amazon format: TBA + 15 digits
      () => `TBA${Math.floor(Math.random() * 900000000000000 + 100000000000000).toString()}`
    ]
    
    const randomPattern = patterns[Math.floor(Math.random() * patterns.length)]
    const trackingNumber = randomPattern()
    
    setFormData(prev => ({
      ...prev,
      numeroTracking: trackingNumber
    }))

    toast({
      title: "Número de Tracking Generado",
      description: `Se ha generado el tracking: ${trackingNumber}`,
      duration: 3000
    })
  }, [toast])
  
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
      // All function key shortcuts are temporarily disabled
      if (['F2', 'F3', 'F4', 'F5', 'F6'].includes(event.key)) {
        event.preventDefault()
        toast({
          title: `${event.key} Deshabilitado`,
          description: "Las teclas de función están temporalmente deshabilitadas",
          variant: "destructive"
        })
        return
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
  }, [formData, toast])

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-accent-blue flex items-center gap-2 sm:gap-3">
          <Package className="w-6 h-6 sm:w-8 sm:h-8" />
          <span className="leading-tight">Pre Registro de Paquetes</span>
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
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

      {/* Responsive Layout - Mobile First */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 min-h-[60vh]">
        {/* Package Information Form */}
        <Card className={cn(
          "flex flex-col h-fit transition-all duration-200",
          batchSession?.isActive && batchSession.status === 'active' && "border-accent-blue/50 bg-accent-blue/5"
        )}>
          <CardHeader className="pb-4 sm:pb-6">
            <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <span className="text-lg sm:text-xl">Información del Paquete</span>
              {batchSession?.isActive && (
                <Badge 
                  variant={batchSession.status === 'active' ? 'default' : 'secondary'}
                  className={cn(
                    "text-xs self-start sm:self-auto",
                    batchSession.status === 'active' && "bg-green-600 animate-pulse"
                  )}
                >
                  {batchSession.status === 'active' ? '⚡ Modo Lote' : '⏸️ Pausado'}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 px-4 sm:px-6">
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Peso */}
            <div className="space-y-2">
              <Label htmlFor="peso" className="text-sm font-medium flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <span className="flex items-center gap-2">
                  Peso <span className="text-red-500">*</span>
                </span>
                {batchSession?.isActive && batchSession.defaultValues.peso && (
                  <Badge variant="outline" className="text-xs bg-accent-blue/10 text-accent-blue border-accent-blue/30 self-start sm:self-auto">
                    Auto-llenado
                  </Badge>
                )}
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="peso"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  min="0"
                  value={formData.peso}
                  onChange={(e) => handleInputChange("peso", e.target.value)}
                  placeholder={
                    batchSession?.isActive && batchSession.defaultValues.peso
                      ? "Valor predeterminado del lote"
                      : "2.5"
                  }
                  required
                  className={cn(
                    "w-full transition-all duration-200 h-12 text-base sm:h-10 sm:text-sm",
                    batchSession?.isActive && batchSession.defaultValues.peso && "bg-accent-blue/5 border-accent-blue/30"
                  )}
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">kg</span>
              </div>
            </div>

            {/* Número de Casillero / Cliente Asignado */}
            <div className="space-y-2">
              <Label htmlFor="numeroCasillero" className="text-sm font-medium">
                Número de Casillero / Cliente Asignado
              </Label>
              <Popover open={clientDropdownOpen} onOpenChange={setClientDropdownOpen}>
                <PopoverTrigger asChild>
                  <Button
                    ref={tarimaSelectRef}
                    variant="outline"
                    role="combobox"
                    aria-expanded={clientDropdownOpen}
                    className="w-full justify-between h-12 text-base sm:h-10 sm:text-sm text-left"
                  >
                    <span className="truncate">
                      {selectedClient 
                        ? selectedClient.displayName
                        : "Buscar cliente..."}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[250px] sm:max-h-[200px] p-0">
                  <Command>
                    <CommandInput 
                      placeholder="Buscar por nombre de cliente..." 
                      value={clientSearchTerm}
                      onValueChange={setClientSearchTerm}
                      className="h-12 sm:h-10"
                    />
                    <CommandList>
                      <CommandEmpty>
                        {clientSearchLoading ? "Buscando..." : 
                         clientSearchTerm.length < 2 ? "Ingresa al menos 2 caracteres para buscar" :
                         "No se encontraron clientes."}
                      </CommandEmpty>
                      <CommandGroup>
                        {clientSearchResults.map((client) => (
                          <CommandItem
                            key={client.uid}
                            value={client.displayName}
                            onSelect={() => handleClientSelect(client)}
                            className="py-3 sm:py-2"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedClient?.uid === client.uid ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <span className="truncate">{client.displayName}</span>
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
              <Label htmlFor="contenido" className="text-sm font-medium">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <span>Contenido</span>
                    {batchSession?.isActive && batchSession.defaultValues.contenido && (
                      <Badge variant="outline" className="text-xs bg-accent-blue/10 text-accent-blue border-accent-blue/30 self-start sm:self-auto">
                        Auto-llenado
                      </Badge>
                    )}
                  </div>
                  <AIContentScanner 
                    onContentGenerated={handleContentGenerated}
                    disabled={!formData.numeroTracking}
                  />
                </div>
              </Label>
              <Textarea
                id="contenido"
                value={formData.contenido}
                onChange={(e) => handleInputChange("contenido", e.target.value)}
                placeholder={
                  batchSession?.isActive && batchSession.defaultValues.contenido 
                    ? "Valor predeterminado del lote aplicado" 
                    : "Describe el contenido del paquete o usa el escáner IA"
                }
                className={cn(
                  "w-full min-h-[120px] sm:min-h-[100px] transition-all duration-200 text-base sm:text-sm resize-none",
                  batchSession?.isActive && batchSession.defaultValues.contenido && "bg-accent-blue/5 border-accent-blue/30"
                )}
              />
            </div>

            {/* Número de Tracking - Required */}
            <div className="space-y-2">
              <Label htmlFor="numeroTracking" className="text-sm font-medium">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <span className="flex items-center gap-2">
                      Número de Tracking <span className="text-red-500">*</span>
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generateRandomTrackingNumber}
                    className="h-8 px-3 self-start sm:self-auto"
                  >
                    <Shuffle className="h-4 w-4 mr-2" />
                    <span className="text-xs">Paquete sin número de tracking</span>
                  </Button>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-1">
                  <div className="flex items-center gap-2">
                    {scannerMode && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full animate-pulse self-start sm:self-auto">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Modo Escáner
                      </span>
                    )}
                    {trackingSearch.isSearching && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full self-start sm:self-auto">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-spin"></div>
                        Buscando...
                      </span>
                    )}
                    {trackingSearch.searchResults?.matchType === 'exact' && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full self-start sm:self-auto">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Encontrado
                      </span>
                    )}
                    {trackingSearch.searchResults?.matchType === 'partial' && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full self-start sm:self-auto">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        Similares: {trackingSearch.searchResults.packages.length}
                      </span>
                    )}
                  </div>
                </div>
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
                  "w-full font-mono transition-all duration-200 h-12 text-base sm:h-10 sm:text-sm",
                  scannerMode && "ring-2 ring-green-500 border-green-500 bg-green-50"
                )}
              />
            </div>

            {/* Número de Tarima - Required */}
            <div className="space-y-2">
              <Label htmlFor="numeroTarima" className="text-sm font-medium">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <span className="flex items-center gap-2">
                    Número de Tarima <span className="text-red-500">*</span>
                  </span>
                  {batchSession?.isActive && batchSession.defaultValues.numeroTarima && (
                    <Badge variant="outline" className="text-xs bg-accent-blue/10 text-accent-blue border-accent-blue/30 self-start sm:self-auto">
                      Auto-llenado
                    </Badge>
                  )}
                </div>
              </Label>
              <Select 
                value={formData.numeroTarima} 
                onValueChange={(value) => handleInputChange("numeroTarima", value)}
                required
              >
                <SelectTrigger className={cn(
                  "w-full transition-all duration-200 h-12 text-base sm:h-10 sm:text-sm",
                  batchSession?.isActive && batchSession.defaultValues.numeroTarima && "bg-accent-blue/5 border-accent-blue/30"
                )}>
                  <SelectValue placeholder="- Seleccione una tarima -" />
                </SelectTrigger>
                <SelectContent>
                  {palletOptions.map(option => (
                    <SelectItem key={option.value} value={option.value} className="py-3 sm:py-2">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6">
              <Button 
                type="submit" 
                className={cn(
                  "w-full sm:flex-1 h-12 sm:h-10 text-base sm:text-sm transition-all duration-200",
                  batchSession?.isActive && batchSession.status === 'active'
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-accent-blue hover:bg-accent-blue/90 text-white"
                )}
                disabled={
                  isProcessing ||
                  !formData.numeroTracking.trim() || 
                  !formData.numeroTarima.trim() ||
                  !formData.peso.trim() ||
                  !formData.numeroCasillero.trim() ||
                  (batchSession?.isActive && batchSession.status === 'paused') ||
                  trackingSearch.isSearching
                }
              >
                <span className="flex items-center justify-center gap-2">
                  <span className="truncate">
                    {isProcessing
                      ? 'Procesando...'
                      : batchSession?.isActive && batchSession.status === 'active' 
                        ? `Escanear Lote (${(batchSession.packagesScanned || 0) + 1})`
                        : 'Procesar'
                    }
                  </span>
                  <kbd className="hidden sm:inline px-1.5 py-0.5 text-xs bg-white/20 rounded">Ctrl+S</kbd>
                </span>
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={batchSession?.isActive ? resetFormForBatch : resetForm}
                className="w-full sm:w-auto h-12 sm:h-10 text-base sm:text-sm px-6 sm:px-8"
              >
                <span className="flex items-center justify-center gap-2">
                  <span>{batchSession?.isActive ? 'Siguiente' : 'Limpiar'}</span>
                  <kbd className="hidden sm:inline px-1.5 py-0.5 text-xs bg-muted rounded">Ctrl+R</kbd>
                </span>
              </Button>
            </div>
          </form>
          </CardContent>
        </Card>

        {/* Right Column: CI Document Viewer and Batch Panel */}
        <div className="h-fit space-y-4 sm:space-y-6">
          <CIDocumentViewer
            ciNumber={processedPackages.length > 0 ? processedPackages[processedPackages.length - 1]?.ci : undefined}
            pdfUrl={processedPackages.length > 0 ? processedPackages[processedPackages.length - 1]?.pdfUrl : undefined}
            isLoading={isProcessing}
          />
          
          {/* Batch Mode Panel */}
          <BatchModePanel
            session={batchSession}
            onStartSession={handleStartBatchSession}
            onPauseSession={pauseBatchSession}
            onResumeSession={resumeBatchSession}
            onCompleteSession={completeBatchSession}
            onUpdateDefaults={handleUpdateBatchDefaults}
            palletOptions={palletOptions}
            isVisible={showBatchPanel}
            onToggleVisibility={() => setShowBatchPanel(!showBatchPanel)}
          />
        </div>
      </div>

      {/* Session History */}
      <SessionHistory
        packages={processedPackages}
        batchSession={batchSession}
        onClearSession={handleClearSession}
        onExportSession={handleExportSession}
      />
    </div>
  )
}
"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Checkbox } from "@/components/ui/checkbox"
import { Plane, Edit, Eye } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { SearchHero } from "@/components/recibidor-miami/SearchHero"
import { SmartFilterBar } from "@/components/recibidor-miami/SmartFilterBar"
import { AdvancedFilters } from "@/components/recibidor-miami/AdvancedFilters"
import { WMSErrorBoundary } from "@/components/ErrorBoundary"
import { format } from "date-fns"
import { type PackageSearchResult, type SearchResult, useFastSearch, detectSearchType } from "@/hooks/useFastSearch"
import * as Sentry from "@sentry/nextjs"

// Constants
const DEFAULT_PAGE_SIZE = 25

// Types
type FilterValue = string | number | Date | undefined
interface PackageData {
  nid: number
  fecha: string
  creadoPor: string
  tracking: string
  pais: string
  numeroTarima: string
  guiaAerea: string
  ciPaquete: string
  contenido: string
  totalAPagar: string
  peso: string
  estado: string
  estadoId?: number
  uid: number
}

interface PaginatedResponse {
  data: PackageData[]
  totalCount: number
  currentPage: number
  pageSize: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
  success: boolean
  message?: string
}

interface PackageFilters {
  estado: string
  pais: string
  numeroTarima: string
  guiaAerea: string
  buscarPorTracking: string
  buscarPorCliente: string
  ciPaquete: string
  desde: Date | undefined
  hasta: Date | undefined
  elementosPorPagina: number
  pagina: number
}

export default function RecibidorMiamiPage() {
  return (
    <ProtectedRoute>
      <WMSErrorBoundary>
        <RecibidorMiamiContent />
      </WMSErrorBoundary>
    </ProtectedRoute>
  )
}

function RecibidorMiamiContent() {
  // Toast hook
  const { toast } = useToast()
  
  // State management
  const [packages, setPackages] = useState<PackageData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [selectedPackages, setSelectedPackages] = useState<Set<number>>(new Set())
  
  // UI state
  const [searchValue, setSearchValue] = useState("")
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)
  const [fastSearchResults, setFastSearchResults] = useState<PackageSearchResult[] | null>(null)
  const [fastSearchMeta, setFastSearchMeta] = useState<SearchResult | null>(null)
  const [isPaginationLoading, setIsPaginationLoading] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  
  // Filter state
  const [filters, setFilters] = useState<PackageFilters>({
    estado: "all",
    pais: "all",
    numeroTarima: "all",
    guiaAerea: "",
    buscarPorTracking: "",
    buscarPorCliente: "",
    ciPaquete: "",
    desde: undefined,
    hasta: undefined,
    elementosPorPagina: DEFAULT_PAGE_SIZE,
    pagina: 1
  })

  // Metadata state
  const [availableStates, setAvailableStates] = useState<string[]>([])
  const [availableCountries, setAvailableCountries] = useState<string[]>([])
  const [availableTarimas, setAvailableTarimas] = useState<string[]>([])

  // Fast search hook
  const { smartSearch } = useFastSearch()

  // Fetch packages function
  const fetchPackages = useCallback(async (options?: { skipToast?: boolean }) => {
    return await Sentry.startSpan({
      name: 'Package Search',
      op: 'data.fetch'
    }, async () => {
      // Declare abortController at the top level
      let abortController: AbortController | null = null
      
      try {
        // Cancel previous request
        if (fetchAbortControllerRef.current) {
          fetchAbortControllerRef.current.abort()
        }
        
        // Create new abort controller
        abortController = new AbortController()
        fetchAbortControllerRef.current = abortController
        
        setLoading(true)
        setError(null)

      // Build query parameters
      const params = new URLSearchParams()
      
      if (filters.estado && filters.estado !== 'all') params.append('Estado', filters.estado)
      if (filters.pais && filters.pais !== 'all') params.append('Pais', filters.pais)
      if (filters.numeroTarima && filters.numeroTarima !== 'all') params.append('NumeroTarima', filters.numeroTarima)
      if (filters.guiaAerea) params.append('GuiaAerea', filters.guiaAerea)
      if (filters.buscarPorTracking) params.append('BuscarPorTracking', filters.buscarPorTracking)
      if (filters.buscarPorCliente) params.append('BuscarPorCliente', filters.buscarPorCliente)
      if (filters.ciPaquete) {
        console.log('Sending CI Paquete search:', filters.ciPaquete)
        params.append('ClPaquete', filters.ciPaquete)
      }
      if (filters.desde) params.append('Desde', format(filters.desde, 'dd/MM/yyyy'))
      if (filters.hasta) params.append('Hasta', format(filters.hasta, 'dd/MM/yyyy'))
      
      params.append('ElementosPorPagina', filters.elementosPorPagina.toString())
      params.append('Pagina', filters.pagina.toString())
      
      // Add sorting for most recent packages first
      params.append('OrderBy', 'fecha')
      params.append('SortDirection', 'desc')

      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5001'
      const response = await fetch(`${apiBaseUrl}/api/Packages?${params.toString()}`, {
        signal: abortController.signal
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data: PaginatedResponse = await response.json()
      
      if (data.success) {
        setPackages(data.data)
        setTotalCount(data.totalCount)
        
        // Update CI Paquete search state if it was a CI Paquete search
        if (filters.ciPaquete && filters.ciPaquete.length >= 3) {
          console.log('CI Paquete search results:', {
            searchTerm: filters.ciPaquete,
            totalCount: data.totalCount,
            sampleResults: data.data.slice(0, 3).map(p => ({ 
              nid: p.nid, 
              ciPaquete: p.ciPaquete,
              tracking: p.tracking 
            }))
          })
          setCiPaqueteSearchState({
            isSearching: false,
            resultCount: data.totalCount,
            hasError: false
          })
        }

        // Update Client search state if it was a client search
        if (filters.buscarPorCliente && filters.buscarPorCliente.length >= 2) {
          console.log('Client search results:', {
            searchTerm: filters.buscarPorCliente,
            totalCount: data.totalCount,
            sampleResults: data.data.slice(0, 3).map(p => ({ 
              nid: p.nid, 
              creadoPor: p.creadoPor,
              tracking: p.tracking 
            }))
          })
          setClientSearchState({
            isSearching: false,
            resultCount: data.totalCount,
            hasError: false
          })
        }

        // Update Advanced Tracking search state if it was a tracking search
        if (filters.buscarPorTracking && filters.buscarPorTracking.length >= 3) {
          const searchType = detectSearchType(filters.buscarPorTracking)
          console.log('Advanced tracking search results:', {
            searchTerm: filters.buscarPorTracking,
            searchType: searchType,
            totalCount: data.totalCount,
            sampleResults: data.data.slice(0, 3).map(p => ({ 
              nid: p.nid, 
              tracking: p.tracking,
              creadoPor: p.creadoPor
            }))
          })
          setAdvancedTrackingSearchState({
            isSearching: false,
            resultCount: data.totalCount,
            hasError: false,
            searchType: searchType
          })
        }
        
        // Show success toast only on filter changes (not on initial load or page changes)
        const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
          if (key === 'pagina' || key === 'elementosPorPagina') return false
          return value !== "" && value !== "all" && value !== undefined && value !== DEFAULT_PAGE_SIZE && value !== 1
        })
        
        // Show toast only when filters are applied and not on initial load
        if (!isInitialLoad && (hasActiveFilters || filters.pagina === 1)) {
          toast({
            title: "Paquetes cargados",
            description: `Se encontraron ${data.totalCount.toLocaleString()} paquetes`,
          })
        }
        
        // Mark initial load as complete
        if (isInitialLoad) {
          setIsInitialLoad(false)
        }
      } else {
        throw new Error(data.message || 'Failed to fetch packages')
      }
    } catch (err) {
      // Handle aborted requests gracefully - don't show errors or update state
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('Request was aborted, ignoring...')
        return
      }
      
      console.error('Error fetching packages:', err)
      Sentry.captureException(err, {
        tags: {
          section: 'package-fetch',
          filters: JSON.stringify(filters)
        }
      })
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      setPackages([])
      setTotalCount(0)
      
      // Update CI Paquete search state on error
      if (filters.ciPaquete && filters.ciPaquete.length >= 3) {
        setCiPaqueteSearchState({
          isSearching: false,
          hasError: true
        })
      }

      // Update Client search state on error
      if (filters.buscarPorCliente && filters.buscarPorCliente.length >= 2) {
        setClientSearchState({
          isSearching: false,
          hasError: true
        })
      }

      // Update Advanced Tracking search state on error
      if (filters.buscarPorTracking && filters.buscarPorTracking.length >= 3) {
        setAdvancedTrackingSearchState({
          isSearching: false,
          hasError: true
        })
      }
      
      // If it's a connection error, provide helpful feedback
      if (errorMessage.includes('fetch') || errorMessage.includes('NetworkError')) {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5001'
        setError(`No se pudo conectar al servidor. Verifique que el backend esté ejecutándose en ${apiBaseUrl}`)
        
        // Show error toast
        toast({
          variant: "destructive",
          title: "Error de conexión",
          description: "No se pudo conectar al servidor. Verifique su conexión.",
        })
      } else {
        // Show generic error toast
        toast({
          variant: "destructive",
          title: "Error al cargar paquetes",
          description: errorMessage,
        })
      }
      } finally {
        setLoading(false)
        // Clean up the AbortController reference
        if (abortController && fetchAbortControllerRef.current === abortController) {
          fetchAbortControllerRef.current = null
        }
      }
    })
  }, [filters, isInitialLoad, toast])

  // Fetch metadata
  const fetchMetadata = useCallback(async () => {
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5001'
      const [statesRes, countriesRes, tarimasRes] = await Promise.all([
        fetch(`${apiBaseUrl}/api/Packages/metadata/states`),
        fetch(`${apiBaseUrl}/api/Packages/metadata/countries`),
        fetch(`${apiBaseUrl}/api/Packages/metadata/tarimas`)
      ])

      if (statesRes.ok) {
        const states = await statesRes.json()
        setAvailableStates(states)
      }

      if (countriesRes.ok) {
        const countries = await countriesRes.json()
        setAvailableCountries(countries)
      }

      if (tarimasRes.ok) {
        const tarimas = await tarimasRes.json()
        setAvailableTarimas(tarimas)
      }
    } catch (err) {
      console.error('Error fetching metadata:', err)
      Sentry.captureException(err, {
        tags: {
          section: 'metadata-fetch'
        }
      })
    }
  }, [])

  // Effects
  useEffect(() => {
    fetchMetadata()
  }, [fetchMetadata])

  useEffect(() => {
    fetchPackages()
  }, [filters, fetchPackages])

  // Filter handlers
  const handleFilterChange = useCallback((key: keyof PackageFilters, value: FilterValue) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      pagina: 1 // Reset to first page when filter changes
    }))
  }, [])

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, pagina: newPage }))
  }


  const clearFilters = () => {
    setFilters({
      estado: "all",
      pais: "all",
      numeroTarima: "all",
      guiaAerea: "",
      buscarPorTracking: "",
      buscarPorCliente: "",
      ciPaquete: "",
      desde: undefined,
      hasta: undefined,
      elementosPorPagina: DEFAULT_PAGE_SIZE,
      pagina: 1
    })
    setSearchValue("")
    
    // Show clear filters toast
    toast({
      title: "Filtros limpiados",
      description: "Se han eliminado todos los filtros aplicados",
    })
  }
  
  const clearFilter = (key: string) => {
    if (key === 'desde' || key === 'hasta') {
      handleFilterChange(key as keyof PackageFilters, undefined)
    } else if (key === 'estado' || key === 'pais' || key === 'numeroTarima') {
      handleFilterChange(key as keyof PackageFilters, 'all')
      
      // Special case: If clearing tarima and current page size is 1000, reset it to default
      // This prevents 400 error since 1000 items per page is only allowed when a tarima is selected
      if (key === 'numeroTarima' && filters.elementosPorPagina === 1000) {
        handleFilterChange('elementosPorPagina', DEFAULT_PAGE_SIZE)
      }
    } else if (key === 'elementosPorPagina') {
      handleFilterChange(key as keyof PackageFilters, DEFAULT_PAGE_SIZE)
    } else {
      handleFilterChange(key as keyof PackageFilters, '')
    }
  }
  
  // Fast search handler - receives results from SearchHero component
  const handleFastSearchResult = useCallback((results: PackageSearchResult[], searchMeta?: SearchResult) => {
    setFastSearchResults(results)
    setFastSearchMeta(searchMeta || null)
    // Clear regular search filters when using fast search
    setFilters(prev => ({
      ...prev,
      buscarPorTracking: "",
      buscarPorCliente: "",
      pagina: 1
    }))
  }, [])

  // Handle pagination for fast search results
  const handleFastSearchPageChange = useCallback(async (newPage: number) => {
    if (!fastSearchMeta) {
      console.error('No fastSearchMeta available for pagination')
      return
    }
    
    // Don't reload the same page
    if (newPage === fastSearchMeta.currentPage) return
    
    console.log(`Paginating to page ${newPage} for query: ${fastSearchMeta.query}`)
    
    setIsPaginationLoading(true)
    
    try {
      // Use smartSearch directly with the current query and new page
      await Sentry.startSpan({
        name: 'Fast Search Pagination',
        op: 'search.paginate'
      }, async () => {
        const results = await smartSearch(fastSearchMeta.query, newPage, fastSearchMeta.pageSize)
        if (results) {
          console.log(`Got ${results.results.length} results for page ${newPage}`)
          setFastSearchResults(results.results)
          setFastSearchMeta(results)
        } else {
          console.error('No results returned from smartSearch')
        }
      })
    } catch (error) {
      console.error('Fast search pagination error:', error)
      Sentry.captureException(error, {
        tags: {
          section: 'fast-search-pagination',
          page: newPage.toString(),
          query: fastSearchMeta.query
        }
      })
      // Show error toast
      toast({
        variant: "destructive",
        title: "Error al cambiar página",
        description: "No se pudo cargar la página solicitada",
      })
    } finally {
      setIsPaginationLoading(false)
    }
  }, [fastSearchMeta, smartSearch, toast])

  // Search handlers
  const handleSearchChange = (value: string) => {
    setSearchValue(value)
    // Clear fast search results when search is empty
    if (!value.trim()) {
      setFastSearchResults(null)
      setFastSearchMeta(null)
      setIsPaginationLoading(false)
    }
    // Debounced search - update filters after user stops typing (only if no fast search results)
    if (!fastSearchResults) {
      if (searchTimeout) clearTimeout(searchTimeout)
      const timeout = setTimeout(() => {
        handleFilterChange('buscarPorTracking', value)
      }, 500)
      setSearchTimeout(timeout)
    }
  }
  
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)
  const [ciPaqueteTimeout, setCiPaqueteTimeout] = useState<NodeJS.Timeout | null>(null)
  const [clientTimeout, setClientTimeout] = useState<NodeJS.Timeout | null>(null)
  const [advancedTrackingTimeout, setAdvancedTrackingTimeout] = useState<NodeJS.Timeout | null>(null)
  
  // AbortController refs for canceling previous requests
  const fetchAbortControllerRef = useRef<AbortController | null>(null)
  const clientSearchAbortControllerRef = useRef<AbortController | null>(null)
  const ciPaqueteSearchAbortControllerRef = useRef<AbortController | null>(null)
  
  // CI Paquete search state
  const [ciPaqueteSearchState, setCiPaqueteSearchState] = useState<{
    isSearching: boolean
    resultCount?: number
    hasError?: boolean
  }>({
    isSearching: false
  })

  // Client search state
  const [clientSearchState, setClientSearchState] = useState<{
    isSearching: boolean
    resultCount?: number
    hasError?: boolean
  }>({
    isSearching: false
  })

  // Advanced tracking search state
  const [advancedTrackingSearchState, setAdvancedTrackingSearchState] = useState<{
    isSearching: boolean
    resultCount?: number
    hasError?: boolean
    searchType?: 'tracking' | 'client' | 'mixed'
  }>({
    isSearching: false
  })
  
  // CI Paquete search handler with debouncing
  const handleCiPaqueteChange = useCallback((value: string) => {    
    // Update the input value immediately (synchronously)
    handleFilterChange('ciPaquete', value)
    
    // Clear previous timeout
    if (ciPaqueteTimeout) {
      clearTimeout(ciPaqueteTimeout)
    }
    
    // Reset search state if less than 3 digits
    if (value.length < 3) {
      setCiPaqueteSearchState({ isSearching: false })
      return
    }
    
    // Set searching state
    setCiPaqueteSearchState({ isSearching: true })
    
    // Debounced search after 800ms - this will trigger fetchPackages
    const timeout = setTimeout(() => {
      // The search will happen automatically because we already updated the filter
      // and fetchPackages is watching the filters with useEffect
      console.log('Debounced CI Paquete search triggered for:', value)
    }, 800)
    
    setCiPaqueteTimeout(timeout)
  }, [handleFilterChange, ciPaqueteTimeout])

  // Client search handler with debouncing
  const handleClientChange = useCallback((value: string) => {
    // Update the input value immediately (synchronously)
    handleFilterChange('buscarPorCliente', value)
    
    // Clear previous timeout
    if (clientTimeout) {
      clearTimeout(clientTimeout)
    }
    
    // Reset search state if less than 2 characters
    if (value.length < 2) {
      setClientSearchState({ isSearching: false })
      return
    }
    
    // Set searching state
    setClientSearchState({ isSearching: true })
    
    // Debounced search after 400ms - faster for text search
    const timeout = setTimeout(() => {
      console.log('Debounced client search triggered for:', value)
    }, 400)
    
    setClientTimeout(timeout)
  }, [handleFilterChange, clientTimeout])

  // Advanced tracking search handler with smart detection (same as SearchHero)
  const handleAdvancedTrackingChange = useCallback((value: string) => {
    // Update the input value immediately (synchronously)
    handleFilterChange('buscarPorTracking', value)
    
    // Clear previous timeout
    if (advancedTrackingTimeout) {
      clearTimeout(advancedTrackingTimeout)
    }
    
    // Reset search state if less than 3 characters
    if (value.length < 3) {
      setAdvancedTrackingSearchState({ isSearching: false })
      return
    }
    
    // Detect search type using the same logic as SearchHero
    const searchType = detectSearchType(value)
    
    // Set searching state
    setAdvancedTrackingSearchState({ 
      isSearching: true, 
      searchType 
    })
    
    // Debounced search after 300ms (same as SearchHero for consistency)
    const timeout = setTimeout(() => {
      console.log(`Advanced tracking search triggered for: ${value} (type: ${searchType})`)
    }, 300)
    
    setAdvancedTrackingTimeout(timeout)
  }, [handleFilterChange, advancedTrackingTimeout])

  // Cleanup timeouts and abort controllers on unmount to prevent memory leaks
  useEffect(() => {
    // Capture ref values at effect creation time
    const fetchController = fetchAbortControllerRef.current
    const clientController = clientSearchAbortControllerRef.current
    const ciPaqueteController = ciPaqueteSearchAbortControllerRef.current
    
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout)
      }
      if (ciPaqueteTimeout) {
        clearTimeout(ciPaqueteTimeout)
      }
      if (clientTimeout) {
        clearTimeout(clientTimeout)
      }
      if (advancedTrackingTimeout) {
        clearTimeout(advancedTrackingTimeout)
      }
      // Cancel any ongoing requests using captured values
      if (fetchController) {
        fetchController.abort()
      }
      if (clientController) {
        clientController.abort()
      }
      if (ciPaqueteController) {
        ciPaqueteController.abort()
      }
    }
  }, [searchTimeout, ciPaqueteTimeout, clientTimeout, advancedTrackingTimeout])
  
  const handleQuickFilter = (filterType: string, value: string) => {
    console.log(`Applying quick filter: ${filterType} = ${value}`)
    
    if (filterType === 'date' && value === 'today') {
      const today = new Date()
      handleFilterChange('desde', today)
      handleFilterChange('hasta', today)
      toast({
        title: "Filtro aplicado",
        description: "Mostrando paquetes de hoy",
      })
    } else if (filterType === 'estado') {
      handleFilterChange('estado', value)
      toast({
        title: "Filtro aplicado",
        description: `Mostrando paquetes con estado: ${value}`,
      })
    } else if (filterType === 'pais') {
      handleFilterChange('pais', value)
      toast({
        title: "Filtro aplicado",
        description: `Mostrando paquetes de: ${value}`,
      })
    } else if (filterType === 'cliente') {
      handleFilterChange('buscarPorCliente', value)
      toast({
        title: "Filtro aplicado",
        description: `Buscando cliente: ${value}`,
      })
    }
  }
  
  // Count active advanced filters
  const getActiveAdvancedFiltersCount = () => {
    let count = 0
    if (filters.numeroTarima && filters.numeroTarima !== 'all') count++
    // Guía Aérea filter is disabled, so don't count it
    // if (filters.guiaAerea && filters.guiaAerea.trim()) count++
    if (filters.buscarPorCliente && filters.buscarPorCliente.trim()) count++
    if (filters.ciPaquete && filters.ciPaquete.trim()) count++
    if (filters.elementosPorPagina !== DEFAULT_PAGE_SIZE) count++
    return count
  }

  // Selection handlers
  const togglePackageSelection = (nid: number) => {
    const newSelection = new Set(selectedPackages)
    if (newSelection.has(nid)) {
      newSelection.delete(nid)
    } else {
      newSelection.add(nid)
    }
    setSelectedPackages(newSelection)
  }

  const toggleAllPackages = () => {
    if (selectedPackages.size === packages.length) {
      setSelectedPackages(new Set())
      toast({
        title: "Selección eliminada",
        description: "Se han deseleccionado todos los paquetes",
      })
    } else {
      setSelectedPackages(new Set(packages.map(p => p.nid)))
      toast({
        title: "Paquetes seleccionados",
        description: `Se han seleccionado ${packages.length} paquetes`,
      })
    }
  }


  const totalPages = Math.ceil(totalCount / filters.elementosPorPagina)
  const startItem = (filters.pagina - 1) * filters.elementosPorPagina + 1
  const endItem = Math.min(filters.pagina * filters.elementosPorPagina, totalCount)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-accent-blue flex items-center gap-3">
          <Plane className="w-8 h-8" />
          Recibidor de Miami
        </h1>
        <p className="text-muted-foreground">
          {fastSearchResults && fastSearchMeta ? (
            `Mostrando ${((fastSearchMeta.currentPage - 1) * fastSearchMeta.pageSize) + 1} - ${((fastSearchMeta.currentPage - 1) * fastSearchMeta.pageSize) + fastSearchResults.length} de ${fastSearchMeta.totalAvailable?.toLocaleString() || 0} resultados`
          ) : (
            `Mostrando ${startItem} - ${endItem} de ${totalCount} paquetes`
          )}
        </p>
      </div>

      {/* Google-Inspired Search Hero */}
      <SearchHero
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        onQuickFilter={handleQuickFilter}
        onFastSearchResult={handleFastSearchResult}
        isLoading={loading}
        resultsCount={fastSearchMeta?.totalAvailable || totalCount}
      />

      {/* Smart Filter Bar */}
      <SmartFilterBar
        filters={{
          estado: filters.estado,
          pais: filters.pais,
          desde: filters.desde,
          hasta: filters.hasta
        }}
        availableStates={availableStates}
        availableCountries={availableCountries}
        onFilterChange={(key, value) => handleFilterChange(key as keyof PackageFilters, value)}
        onClearFilter={clearFilter}
        onClearAll={clearFilters}
        onShowAdvanced={() => setIsAdvancedOpen(!isAdvancedOpen)}
        onRefresh={() => {
          fetchPackages()
          toast({
            title: "Datos actualizados",
            description: "Se han recargado los paquetes desde la base de datos",
          })
        }}
        isAdvancedOpen={isAdvancedOpen}
        activeFiltersCount={getActiveAdvancedFiltersCount()}
      />

      {/* Advanced Filters */}
      <AdvancedFilters
        filters={{
          numeroTarima: filters.numeroTarima,
          guiaAerea: filters.guiaAerea,
          buscarPorTracking: filters.buscarPorTracking,
          buscarPorCliente: filters.buscarPorCliente,
          ciPaquete: filters.ciPaquete,
          elementosPorPagina: filters.elementosPorPagina
        }}
        availableTarimas={availableTarimas}
        onFilterChange={(key, value) => {
          handleFilterChange(key as keyof PackageFilters, value)
        }}
        onCiPaqueteChange={handleCiPaqueteChange}
        onClientChange={handleClientChange}
        onAdvancedTrackingChange={handleAdvancedTrackingChange}
        onClearFilter={(key) => {
          if (key === 'ciPaquete') {
            setCiPaqueteSearchState({ isSearching: false })
          } else if (key === 'buscarPorCliente') {
            setClientSearchState({ isSearching: false })
          } else if (key === 'buscarPorTracking') {
            setAdvancedTrackingSearchState({ isSearching: false })
          }
          clearFilter(key)
        }}
        isOpen={isAdvancedOpen}
        onToggle={() => setIsAdvancedOpen(!isAdvancedOpen)}
        activeFiltersCount={getActiveAdvancedFiltersCount()}
        ciPaqueteSearchState={ciPaqueteSearchState}
        clientSearchState={clientSearchState}
        advancedTrackingSearchState={advancedTrackingSearchState}
      />


      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
          <CardContent className="pt-6">
            <div className="text-red-800 dark:text-red-400">
              <strong>Error:</strong> {error}
            </div>
            {error.includes('servidor') && (
              <div className="mt-2 text-sm text-red-600 dark:text-red-300">
                <p>Para solucionar este problema:</p>
                <ol className="list-decimal list-inside mt-1 space-y-1">
                  <li>Navegue al directorio del backend: <code className="bg-red-100 dark:bg-red-900/30 px-1 rounded">cd backend/WareHouseManagementSystemAPI/WareHouseManagementSystemAPI</code></li>
                  <li>Execute el servidor: <code className="bg-red-100 dark:bg-red-900/30 px-1 rounded">dotnet run</code></li>
                  <li>Verifique que el servidor esté corriendo en el puerto 5000</li>
                </ol>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Debug Info (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20">
          <CardContent className="pt-6">
            <div className="text-blue-800 dark:text-blue-400 text-sm">
              <strong>Debug Info:</strong>
              <div className="mt-2 space-y-2">
                <div>
                  <strong>Available Estados:</strong> {availableStates.join(', ') || 'Loading...'}
                </div>
                <div>
                  <strong>Available Countries:</strong> {availableCountries.join(', ') || 'Loading...'}
                </div>
                <div>
                  <strong>Current Filters:</strong>
                </div>
                <pre className="text-xs overflow-x-auto bg-blue-100 dark:bg-blue-900/30 p-2 rounded">
{JSON.stringify({ 
  filters: {
    estado: filters.estado,
    pais: filters.pais,
    desde: filters.desde?.toDateString(),
    hasta: filters.hasta?.toDateString(),
    buscarPorTracking: filters.buscarPorTracking,
    totalCount
  },
  loading,
  packagesCount: packages.length
}, null, 2)}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Paquetes</CardTitle>
            {selectedPackages.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedPackages.size} seleccionados
                </span>
                <Button size="sm" variant="outline" className="rounded-full">
                  Acciones
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={packages.length > 0 && selectedPackages.size === packages.length}
                      onCheckedChange={toggleAllPackages}
                    />
                  </TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Creado por</TableHead>
                  <TableHead>País</TableHead>
                  <TableHead>Tracking</TableHead>
                  <TableHead>#_Tarima</TableHead>
                  <TableHead>Guía Aérea</TableHead>
                  <TableHead>CI Paquete</TableHead>
                  <TableHead>Contenido</TableHead>
                  <TableHead>Total a pagar</TableHead>
                  <TableHead>Peso</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Operación</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(loading || isPaginationLoading) ? (
                  // Loading skeletons
                  Array.from({ length: isPaginationLoading ? (fastSearchMeta?.pageSize || DEFAULT_PAGE_SIZE) : 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    </TableRow>
                  ))
                ) : (fastSearchResults || packages).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center py-8 text-muted-foreground">
                      {fastSearchResults ? 
                        "No se encontraron resultados para tu búsqueda" : 
                        "No se encontraron paquetes con los filtros aplicados"
                      }
                    </TableCell>
                  </TableRow>
                ) : (
                  (fastSearchResults || packages).map((pkg) => (
                    <TableRow key={pkg.nid}>
                      <TableCell>
                        <Checkbox
                          checked={selectedPackages.has(pkg.nid)}
                          onCheckedChange={() => togglePackageSelection(pkg.nid)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{pkg.fecha}</TableCell>
                      <TableCell>{pkg.creadoPor}</TableCell>
                      <TableCell>{pkg.pais}</TableCell>
                      <TableCell className="font-mono text-sm">{pkg.tracking}</TableCell>
                      <TableCell>{pkg.numeroTarima}</TableCell>
                      <TableCell>{pkg.guiaAerea}</TableCell>
                      <TableCell>{pkg.ciPaquete}</TableCell>
                      <TableCell className="max-w-32 truncate" title={pkg.contenido}>
                        {pkg.contenido}
                      </TableCell>
                      <TableCell>{pkg.totalAPagar}</TableCell>
                      <TableCell>{pkg.peso}</TableCell>
                      <TableCell>{pkg.estado}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Fast Search Pagination */}
          {fastSearchResults && fastSearchMeta && (fastSearchMeta.hasNextPage || fastSearchMeta.hasPreviousPage) && (
            <div className="flex flex-col gap-3 mt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-muted-foreground flex items-center gap-2 justify-center sm:justify-start">
                <span className="text-center sm:text-left">Página {fastSearchMeta.currentPage} de {Math.ceil((fastSearchMeta.totalAvailable || 0) / fastSearchMeta.pageSize)} • Búsqueda rápida</span>
                {isPaginationLoading && (
                  <div className="animate-spin h-4 w-4 border-2 border-accent-blue border-t-transparent rounded-full"></div>
                )}
              </div>
              
              <div className="flex items-center justify-center gap-1 sm:gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFastSearchPageChange(fastSearchMeta.currentPage - 1)}
                  disabled={!fastSearchMeta.hasPreviousPage || isPaginationLoading}
                  className="rounded-full px-3 py-2 h-10 text-sm sm:px-4 sm:text-sm sm:h-8"
                >
                  <span className="sm:hidden">Ant</span>
                  <span className="hidden sm:inline">Anterior</span>
                </Button>
                
                <div className="flex items-center gap-1 overflow-x-auto px-2 sm:px-0">
                  {(() => {
                    const totalPages = Math.ceil((fastSearchMeta.totalAvailable || 0) / fastSearchMeta.pageSize)
                    const currentPage = fastSearchMeta.currentPage
                    
                    // Responsive maxButtons: 3 on mobile, 4 on medium, 5 on large screens
                    const maxButtonsMobile = 3
                    const maxButtonsMedium = 4
                    const maxButtonsDesktop = 5
                    
                    // Calculate for mobile (simple range)
                    let startPageMobile = Math.max(1, currentPage - Math.floor(maxButtonsMobile / 2))
                    let endPageMobile = Math.min(totalPages, startPageMobile + maxButtonsMobile - 1)
                    if (endPageMobile - startPageMobile + 1 < maxButtonsMobile) {
                      startPageMobile = Math.max(1, endPageMobile - maxButtonsMobile + 1)
                    }
                    
                    // Calculate for medium screens
                    let startPageMedium = Math.max(1, currentPage - Math.floor(maxButtonsMedium / 2))
                    let endPageMedium = Math.min(totalPages, startPageMedium + maxButtonsMedium - 1)
                    if (endPageMedium - startPageMedium + 1 < maxButtonsMedium) {
                      startPageMedium = Math.max(1, endPageMedium - maxButtonsMedium + 1)
                    }
                    
                    // Calculate for desktop (with ellipsis logic)
                    let startPageDesktop = Math.max(1, currentPage - Math.floor(maxButtonsDesktop / 2))
                    let endPageDesktop = Math.min(totalPages, startPageDesktop + maxButtonsDesktop - 1)
                    if (endPageDesktop - startPageDesktop + 1 < maxButtonsDesktop) {
                      startPageDesktop = Math.max(1, endPageDesktop - maxButtonsDesktop + 1)
                    }
                    
                    const pages = []
                    
                    // Add first page if not in desktop range (desktop only)
                    if (startPageDesktop > 1) {
                      pages.push(
                        <Button
                          key={1}
                          variant="outline"
                          size="sm"
                          onClick={() => handleFastSearchPageChange(1)}
                          className="min-w-10 h-10 rounded-full px-3 text-sm sm:min-w-8 sm:h-8 sm:px-3 sm:text-base flex-shrink-0 hidden lg:flex"
                        >
                          1
                        </Button>
                      )
                      if (startPageDesktop > 2) {
                        pages.push(
                          <span key="ellipsis1" className="px-2 text-muted-foreground hidden lg:inline">
                            ...
                          </span>
                        )
                      }
                    }
                    
                    // Add page range - show different ranges for mobile/medium/desktop
                    for (let i = 1; i <= totalPages; i++) {
                      const isInMobileRange = i >= startPageMobile && i <= endPageMobile
                      const isInMediumRange = i >= startPageMedium && i <= endPageMedium
                      const isInDesktopRange = i >= startPageDesktop && i <= endPageDesktop
                      
                      if (isInMobileRange || isInMediumRange || isInDesktopRange) {
                        // Determine visibility classes
                        let visibilityClass = ''
                        if (isInMobileRange && !isInMediumRange && !isInDesktopRange) {
                          visibilityClass = 'flex sm:hidden'
                        } else if (isInMediumRange && !isInMobileRange && !isInDesktopRange) {
                          visibilityClass = 'hidden sm:flex lg:hidden'
                        } else if (isInDesktopRange && !isInMobileRange && !isInMediumRange) {
                          visibilityClass = 'hidden lg:flex'
                        } else if (isInMobileRange && isInMediumRange && !isInDesktopRange) {
                          visibilityClass = 'flex lg:hidden'
                        } else if (isInMobileRange && isInDesktopRange && !isInMediumRange) {
                          visibilityClass = 'flex sm:hidden lg:flex'
                        } else if (isInMediumRange && isInDesktopRange && !isInMobileRange) {
                          visibilityClass = 'hidden sm:flex'
                        } else if (isInMobileRange && isInMediumRange && isInDesktopRange) {
                          visibilityClass = 'flex'
                        }
                        
                        pages.push(
                          <Button
                            key={i}
                            variant={currentPage === i ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleFastSearchPageChange(i)}
                            disabled={isPaginationLoading}
                            className={`min-w-10 h-10 rounded-full px-3 text-sm sm:min-w-8 sm:h-8 sm:px-3 sm:text-base flex-shrink-0 ${visibilityClass}`}
                          >
                            {i}
                          </Button>
                        )
                      }
                    }
                    
                    // Add last page if not in desktop range (desktop only)
                    if (endPageDesktop < totalPages) {
                      if (endPageDesktop < totalPages - 1) {
                        pages.push(
                          <span key="ellipsis2" className="px-2 text-muted-foreground hidden lg:inline">
                            ...
                          </span>
                        )
                      }
                      pages.push(
                        <Button
                          key={totalPages}
                          variant="outline"
                          size="sm"
                          onClick={() => handleFastSearchPageChange(totalPages)}
                          className="min-w-10 h-10 rounded-full px-3 text-sm sm:min-w-8 sm:h-8 sm:px-3 sm:text-base flex-shrink-0 hidden lg:flex"
                        >
                          {totalPages}
                        </Button>
                      )
                    }
                    
                    return pages
                  })()}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFastSearchPageChange(fastSearchMeta.currentPage + 1)}
                  disabled={!fastSearchMeta.hasNextPage || isPaginationLoading}
                  className="rounded-full px-3 py-2 h-10 text-sm sm:px-4 sm:text-sm sm:h-8"
                >
                  <span className="sm:hidden">Sig</span>
                  <span className="hidden sm:inline">Siguiente</span>
                </Button>
              </div>
            </div>
          )}

          {/* Regular Pagination - Hide when showing fast search results */}
          {!fastSearchResults && totalPages > 1 && (
            <div className="flex flex-col gap-3 mt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-muted-foreground text-center sm:text-left">
                Mostrando {startItem} a {endItem} de {totalCount} resultados
              </div>
              
              <div className="flex items-center justify-center gap-1 sm:gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(filters.pagina - 1)}
                  disabled={filters.pagina === 1}
                  className="rounded-full px-3 py-2 h-10 text-sm sm:px-4 sm:text-sm sm:h-8"
                >
                  <span className="sm:hidden">Ant</span>
                  <span className="hidden sm:inline">Anterior</span>
                </Button>
                
                <div className="flex items-center gap-1 overflow-x-auto px-2 sm:px-0">
                  {(() => {
                    const currentPage = filters.pagina
                    
                    // Responsive maxButtons: 3 on mobile, 5 on medium, 7 on desktop
                    const maxButtonsMobile = 3
                    const maxButtonsMedium = 5
                    const maxButtonsDesktop = 7
                    
                    // Calculate for mobile (simple range)
                    let startPageMobile = Math.max(1, currentPage - Math.floor(maxButtonsMobile / 2))
                    let endPageMobile = Math.min(totalPages, startPageMobile + maxButtonsMobile - 1)
                    if (endPageMobile - startPageMobile + 1 < maxButtonsMobile) {
                      startPageMobile = Math.max(1, endPageMobile - maxButtonsMobile + 1)
                    }
                    
                    // Calculate for medium screens
                    let startPageMedium = Math.max(1, currentPage - Math.floor(maxButtonsMedium / 2))
                    let endPageMedium = Math.min(totalPages, startPageMedium + maxButtonsMedium - 1)
                    if (endPageMedium - startPageMedium + 1 < maxButtonsMedium) {
                      startPageMedium = Math.max(1, endPageMedium - maxButtonsMedium + 1)
                    }
                    
                    // Calculate for desktop (with ellipsis logic)
                    let startPageDesktop = Math.max(1, currentPage - Math.floor(maxButtonsDesktop / 2))
                    let endPageDesktop = Math.min(totalPages, startPageDesktop + maxButtonsDesktop - 1)
                    if (endPageDesktop - startPageDesktop + 1 < maxButtonsDesktop) {
                      startPageDesktop = Math.max(1, endPageDesktop - maxButtonsDesktop + 1)
                    }
                    
                    const pages = []
                    
                    // Add first page if not in desktop range (desktop only)
                    if (startPageDesktop > 1) {
                      pages.push(
                        <Button
                          key={1}
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(1)}
                          className="min-w-10 h-10 rounded-full px-3 text-sm sm:min-w-8 sm:h-8 sm:px-3 sm:text-base flex-shrink-0 hidden lg:flex"
                        >
                          1
                        </Button>
                      )
                      if (startPageDesktop > 2) {
                        pages.push(
                          <span key="ellipsis1" className="px-2 text-muted-foreground hidden lg:inline">
                            ...
                          </span>
                        )
                      }
                    }
                    
                    // Add page range - show different ranges for mobile/medium/desktop
                    for (let i = 1; i <= totalPages; i++) {
                      const isInMobileRange = i >= startPageMobile && i <= endPageMobile
                      const isInMediumRange = i >= startPageMedium && i <= endPageMedium
                      const isInDesktopRange = i >= startPageDesktop && i <= endPageDesktop
                      
                      if (isInMobileRange || isInMediumRange || isInDesktopRange) {
                        // Determine visibility classes
                        let visibilityClass = ''
                        if (isInMobileRange && !isInMediumRange && !isInDesktopRange) {
                          visibilityClass = 'flex sm:hidden'
                        } else if (isInMediumRange && !isInMobileRange && !isInDesktopRange) {
                          visibilityClass = 'hidden sm:flex lg:hidden'
                        } else if (isInDesktopRange && !isInMobileRange && !isInMediumRange) {
                          visibilityClass = 'hidden lg:flex'
                        } else if (isInMobileRange && isInMediumRange && !isInDesktopRange) {
                          visibilityClass = 'flex lg:hidden'
                        } else if (isInMobileRange && isInDesktopRange && !isInMediumRange) {
                          visibilityClass = 'flex sm:hidden lg:flex'
                        } else if (isInMediumRange && isInDesktopRange && !isInMobileRange) {
                          visibilityClass = 'hidden sm:flex'
                        } else if (isInMobileRange && isInMediumRange && isInDesktopRange) {
                          visibilityClass = 'flex'
                        }
                        
                        pages.push(
                          <Button
                            key={i}
                            variant={currentPage === i ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(i)}
                            className={`min-w-10 h-10 rounded-full px-3 text-sm sm:min-w-8 sm:h-8 sm:px-3 sm:text-base flex-shrink-0 ${visibilityClass}`}
                          >
                            {i}
                          </Button>
                        )
                      }
                    }
                    
                    // Add last page if not in desktop range (desktop only)
                    if (endPageDesktop < totalPages) {
                      if (endPageDesktop < totalPages - 1) {
                        pages.push(
                          <span key="ellipsis2" className="px-2 text-muted-foreground hidden lg:inline">
                            ...
                          </span>
                        )
                      }
                      pages.push(
                        <Button
                          key={totalPages}
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(totalPages)}
                          className="min-w-10 h-10 rounded-full px-3 text-sm sm:min-w-8 sm:h-8 sm:px-3 sm:text-base flex-shrink-0 hidden lg:flex"
                        >
                          {totalPages}
                        </Button>
                      )
                    }
                    
                    return pages
                  })()}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(filters.pagina + 1)}
                  disabled={filters.pagina === totalPages}
                  className="rounded-full px-3 py-2 h-10 text-sm sm:px-4 sm:text-sm sm:h-8"
                >
                  <span className="sm:hidden">Sig</span>
                  <span className="hidden sm:inline">Siguiente</span>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
"use client"

import { useState, useEffect, useCallback } from "react"
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
import { format } from "date-fns"
import { type PackageSearchResult, type SearchResult, useFastSearch } from "@/hooks/useFastSearch"

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
      <RecibidorMiamiContent />
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
  const fetchPackages = useCallback(async () => {
    try {
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
      if (filters.ciPaquete) params.append('ClPaquete', filters.ciPaquete)
      if (filters.desde) params.append('Desde', format(filters.desde, 'dd/MM/yyyy'))
      if (filters.hasta) params.append('Hasta', format(filters.hasta, 'dd/MM/yyyy'))
      
      params.append('ElementosPorPagina', filters.elementosPorPagina.toString())
      params.append('Pagina', filters.pagina.toString())
      
      // Add sorting for most recent packages first
      params.append('OrderBy', 'fecha')
      params.append('SortDirection', 'desc')

      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5001'
      const response = await fetch(`${apiBaseUrl}/api/Packages?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data: PaginatedResponse = await response.json()
      
      if (data.success) {
        setPackages(data.data)
        setTotalCount(data.totalCount)
        
        // Show success toast only if it's not the initial load
        if (filters.pagina > 1 || Object.values(filters).some(value => 
          value !== "" && value !== "all" && value !== undefined && value !== DEFAULT_PAGE_SIZE && value !== 1)) {
          toast({
            title: "Paquetes cargados",
            description: `Se encontraron ${data.totalCount.toLocaleString()} paquetes`,
          })
        }
      } else {
        throw new Error(data.message || 'Failed to fetch packages')
      }
    } catch (err) {
      console.error('Error fetching packages:', err)
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      setPackages([])
      setTotalCount(0)
      
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
    }
  }, [filters, toast])

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
    }
  }, [])

  // Effects
  useEffect(() => {
    fetchMetadata()
  }, [fetchMetadata])

  useEffect(() => {
    fetchPackages()
  }, [fetchPackages])

  // Filter handlers
  const handleFilterChange = (key: keyof PackageFilters, value: FilterValue) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      pagina: 1 // Reset to first page when filter changes
    }))
  }

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
      const results = await smartSearch(fastSearchMeta.query, newPage, fastSearchMeta.pageSize)
      if (results) {
        console.log(`Got ${results.results.length} results for page ${newPage}`)
        setFastSearchResults(results.results)
        setFastSearchMeta(results)
      } else {
        console.error('No results returned from smartSearch')
      }
    } catch (error) {
      console.error('Fast search pagination error:', error)
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
  
  // Cleanup timeout on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout)
      }
    }
  }, [searchTimeout])
  
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
    if (filters.guiaAerea && filters.guiaAerea.trim()) count++
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
        onFilterChange={(key, value) => handleFilterChange(key as keyof PackageFilters, value)}
        onClearFilter={clearFilter}
        isOpen={isAdvancedOpen}
        onToggle={() => setIsAdvancedOpen(!isAdvancedOpen)}
        activeFiltersCount={getActiveAdvancedFiltersCount()}
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
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <span>Página {fastSearchMeta.currentPage} de {Math.ceil((fastSearchMeta.totalAvailable || 0) / fastSearchMeta.pageSize)} • Búsqueda rápida</span>
                {isPaginationLoading && (
                  <div className="animate-spin h-4 w-4 border-2 border-accent-blue border-t-transparent rounded-full"></div>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFastSearchPageChange(fastSearchMeta.currentPage - 1)}
                  disabled={!fastSearchMeta.hasPreviousPage || isPaginationLoading}
                  className="rounded-full"
                >
                  Anterior
                </Button>
                
                <div className="flex items-center gap-1">
                  {(() => {
                    const totalPages = Math.ceil((fastSearchMeta.totalAvailable || 0) / fastSearchMeta.pageSize)
                    const currentPage = fastSearchMeta.currentPage
                    const maxButtons = 5
                    
                    // Calculate start and end page numbers to show
                    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2))
                    let endPage = Math.min(totalPages, startPage + maxButtons - 1)
                    
                    // Adjust start if we're near the end
                    if (endPage - startPage + 1 < maxButtons) {
                      startPage = Math.max(1, endPage - maxButtons + 1)
                    }
                    
                    const pages = []
                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(i)
                    }
                    
                    return pages.map(pageNum => (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleFastSearchPageChange(pageNum)}
                        disabled={isPaginationLoading}
                        className="w-8 h-8 rounded-full"
                      >
                        {pageNum}
                      </Button>
                    ))
                  })()}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFastSearchPageChange(fastSearchMeta.currentPage + 1)}
                  disabled={!fastSearchMeta.hasNextPage || isPaginationLoading}
                  className="rounded-full"
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}

          {/* Regular Pagination - Hide when showing fast search results */}
          {!fastSearchResults && totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Mostrando {startItem} a {endItem} de {totalCount} resultados
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(filters.pagina - 1)}
                  disabled={filters.pagina === 1}
                  className="rounded-full"
                >
                  Anterior
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const pageNum = i + 1
                    return (
                      <Button
                        key={pageNum}
                        variant={filters.pagina === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className="w-8 h-8 rounded-full"
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(filters.pagina + 1)}
                  disabled={filters.pagina === totalPages}
                  className="rounded-full"
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
"use client"

import { useState, useEffect, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Search, Package, Clock, User, Hash, Building2, Plane, AlertTriangle } from "lucide-react"
import { useFastSearch, type SearchResult, type PackageSearchResult } from "@/hooks/useFastSearch"
import { InlineSearchSkeleton } from "@/components/ui/loading"

interface SearchHeroProps {
  searchValue: string
  onSearchChange: (value: string) => void
  onQuickFilter: (filterType: string, value: string) => void
  onFastSearchResult?: (results: PackageSearchResult[], searchMeta?: SearchResult) => void
  isLoading?: boolean
  resultsCount?: number
}

interface QuickAction {
  id: string
  label: string
  icon: React.ElementType
  filterType: string
  filterValue: string
  color: string
}

// Constants
const DEFAULT_PAGE_SIZE = 25

const quickActions: QuickAction[] = [
  {
    id: "prealertados",
    label: "Prealertados",
    icon: Clock,
    filterType: "estado",
    filterValue: "Prealertado",
    color: "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
  },
  {
    id: "en-aduana",
    label: "En aduana",
    icon: Building2,
    filterType: "estado",
    filterValue: "En aduana",
    color: "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 border border-green-200 dark:border-green-800"
  },
  {
    id: "vuelo-asignado",
    label: "Vuelo Asignado",
    icon: Plane,
    filterType: "estado", 
    filterValue: "Vuelo Asignado",
    color: "bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/20 dark:text-orange-400 border border-orange-200 dark:border-orange-800"
  }
]

export function SearchHero({ 
  searchValue, 
  onSearchChange, 
  onQuickFilter,
  onFastSearchResult,
  isLoading = false,
  resultsCount = 0 
}: SearchHeroProps) {
  const [searchFocused, setSearchFocused] = useState(false)
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)
  const [fastSearchResults, setFastSearchResults] = useState<SearchResult | null>(null)
  
  const { 
    smartSearch, 
    isSearching, 
    searchError, 
    detectSearchType,
    clearSearch,
    setCurrentSearchResult
  } = useFastSearch()

  // Handle fast search with debouncing
  const performFastSearch = useCallback(async (query: string, page: number = 1) => {
    if (!query.trim() || query.trim().length < 3) {
      setFastSearchResults(null)
      return
    }

    try {
      const results = await smartSearch(query, page, DEFAULT_PAGE_SIZE)
      if (results) {
        setFastSearchResults(results)
        setCurrentSearchResult(results)
        // Pass results to parent component if callback provided
        if (onFastSearchResult) {
          onFastSearchResult(results.results, results)
        }
      }
    } catch (error) {
      console.error('Fast search error:', error)
    }
  }, [smartSearch, onFastSearchResult, setCurrentSearchResult])

  // Debounced search effect
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }

    const timeout = setTimeout(() => {
      performFastSearch(searchValue)
    }, 300) // 300ms debounce for fast search

    setSearchTimeout(timeout)

    return () => {
      if (timeout) clearTimeout(timeout)
    }
  }, [searchValue, performFastSearch])

  // Clear results when search is empty
  useEffect(() => {
    if (!searchValue.trim()) {
      setFastSearchResults(null)
      clearSearch()
    }
  }, [searchValue, clearSearch])

  const handleQuickAction = (action: QuickAction) => {
    onQuickFilter(action.filterType, action.filterValue)
  }

  const handleSearchInputChange = (value: string) => {
    onSearchChange(value)
    // Clear previous fast search results while typing
    if (fastSearchResults && value !== searchValue) {
      setFastSearchResults(null)
    }
  }

  const searchType = searchValue ? detectSearchType(searchValue) : 'tracking'

  return (
    <div className="space-y-6">
      {/* Main Search Section */}
      <Card className="p-6 border-0 bg-gradient-to-r from-accent-blue/5 to-accent-blue/10 dark:from-accent-blue/10 dark:to-accent-blue/20">
        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <div className={`relative transition-all duration-200 ${
              searchFocused ? 'transform scale-[1.02]' : ''
            }`}>
              <Search className={`absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 transition-colors duration-200 ${
                searchFocused ? 'text-accent-blue' : 'text-muted-foreground'
              } w-4 h-4 sm:w-5 sm:h-5`} />
              <Input
                type="text"
                placeholder="Buscar por número de tracking..."
                value={searchValue}
                onChange={(e) => handleSearchInputChange(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 200)} // Delay to allow clicking suggestions
                className={`pl-10 sm:pl-12 pr-16 py-4 sm:py-6 text-base sm:text-lg rounded-2xl border-2 transition-all duration-200 ${
                  searchFocused 
                    ? 'border-accent-blue shadow-lg shadow-accent-blue/10' 
                    : 'border-border hover:border-accent-blue/50'
                } bg-background/80 backdrop-blur-sm`}
              />
              {/* Loading and Search Type Indicators */}
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                {/* Search Type Indicator */}
                {searchValue && (
                  <div className="flex items-center gap-1 text-xs bg-accent-blue/10 text-accent-blue px-2 py-1 rounded-full">
                    {searchType === 'tracking' && <Hash className="w-3 h-3" />}
                    {searchType === 'client' && <User className="w-3 h-3" />}
                    {searchType === 'mixed' && <Search className="w-3 h-3" />}
                    <span className="hidden sm:inline">
                      {searchType === 'tracking' && 'Tracking'}
                      {searchType === 'client' && 'Cliente'}
                      {searchType === 'mixed' && 'Mixto'}
                    </span>
                  </div>
                )}
                {/* Loading Skeleton */}
                {(isLoading || isSearching) && (
                  <InlineSearchSkeleton />
                )}
              </div>
            </div>
          </div>

          {/* Results Count - Show fast search results if available */}
          {(fastSearchResults?.totalFound ?? resultsCount) > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Package className="w-4 h-4" />
                <span>
                  {(fastSearchResults?.totalFound ?? resultsCount).toLocaleString()} paquete{(fastSearchResults?.totalFound ?? resultsCount) !== 1 ? 's' : ''} encontrado{(fastSearchResults?.totalFound ?? resultsCount) !== 1 ? 's' : ''}
                </span>
                {fastSearchResults && (
                  <span className="text-accent-blue font-medium">
                    (búsqueda rápida{fastSearchResults.totalAvailable && fastSearchResults.totalAvailable > fastSearchResults.totalFound ? ` - mostrando ${fastSearchResults.totalFound} de ${fastSearchResults.totalAvailable.toLocaleString()}` : ''})
                  </span>
                )}
              </div>
              {/* Performance indicator */}
              {fastSearchResults?.executionTimeMs && (
                <div className="text-xs text-muted-foreground">
                  {fastSearchResults.executionTimeMs}ms
                </div>
              )}
            </div>
          )}

          {/* Search Error */}
          {searchError && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertTriangle className="w-4 h-4" />
              <span>Error en búsqueda: {searchError}</span>
            </div>
          )}
        </div>
      </Card>

      {/* Quick Action Chips */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-muted-foreground">Acceso rápido:</h3>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
          {quickActions.map((action) => {
            const IconComponent = action.icon
            return (
              <Button
                key={action.id}
                variant="ghost"
                size="sm"
                onClick={() => handleQuickAction(action)}
                className={`${action.color} rounded-full px-3 sm:px-4 py-3 sm:py-2 h-12 sm:h-auto w-full sm:w-auto font-medium transition-all duration-200 hover:scale-105 hover:shadow-md text-base sm:text-sm justify-start sm:justify-center whitespace-nowrap`}
              >
                <IconComponent className="w-4 h-4 sm:w-3 sm:h-3 lg:w-4 lg:h-4 mr-3 sm:mr-1.5 lg:mr-2" />
                <span className="block">{action.label}</span>
              </Button>
            )
          })}
        </div>
      </div>

      {/* Smart Search Suggestions */}
      {searchFocused && searchValue.length > 2 && !fastSearchResults && (
        <Card className="border border-accent-blue/20 shadow-lg">
          <div className="p-4 space-y-2">
            <div className="text-sm font-medium text-muted-foreground mb-2">
              Tipo de búsqueda detectado: 
              <span className="text-accent-blue ml-1 capitalize">
                {searchType === 'tracking' && 'Número de Tracking'}
                {searchType === 'client' && 'Nombre de Cliente'}  
                {searchType === 'mixed' && 'Búsqueda Mixta'}
              </span>
            </div>
            <div className="space-y-1">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start h-auto py-2 px-3 text-left font-normal hover:bg-accent-blue/10"
                onClick={() => performFastSearch(searchValue)}
              >
                <Hash className="w-4 h-4 mr-2 text-accent-blue" />
                Buscar tracking: &quot;{searchValue}&quot;
              </Button>
              {searchType === 'client' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start h-auto py-2 px-3 text-left font-normal hover:bg-accent-blue/10"
                  onClick={() => performFastSearch(searchValue)}
                >
                  <User className="w-4 h-4 mr-2 text-green-600" />
                  Buscar cliente: &quot;{searchValue}&quot;
                </Button>
              )}
              {searchType === 'mixed' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start h-auto py-2 px-3 text-left font-normal hover:bg-accent-blue/10"
                  onClick={() => performFastSearch(searchValue)}
                >
                  <User className="w-4 h-4 mr-2 text-green-600" />
                  Buscar cliente: &quot;{searchValue}&quot;
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Fast Search Results Preview */}
      {fastSearchResults && fastSearchResults.results.length > 0 && searchFocused && (
        <Card className="border border-green-200 shadow-lg bg-green-50/50">
          <div className="p-4 space-y-2">
            <div className="text-sm font-medium text-green-800 mb-2">
              Resultados encontrados ({fastSearchResults.totalFound}):
            </div>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {fastSearchResults.results.slice(0, 3).map((pkg) => (
                <div key={pkg.nid} className="p-2 bg-white rounded border border-green-200 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{pkg.tracking || pkg.ciPaquete}</span>
                    <span className="text-xs text-muted-foreground">{pkg.estado}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {pkg.contenido} • {pkg.creadoPor?.split('_')?.[1] || 'Cliente'}
                  </div>
                </div>
              ))}
              {fastSearchResults.results.length > 3 && (
                <div className="text-xs text-muted-foreground text-center py-2">
                  +{fastSearchResults.results.length - 3} resultados más...
                </div>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
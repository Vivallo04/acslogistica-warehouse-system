import { useState, useCallback } from 'react'

// Types for search functionality
export interface SearchResult {
  query: string
  searchType: 'tracking' | 'client' | 'mixed'
  results: PackageSearchResult[]
  totalFound: number
  totalAvailable?: number // Total available results in database
  currentPage: number
  pageSize: number
  hasNextPage: boolean
  hasPreviousPage: boolean
  executionTimeMs?: number
  cached?: boolean
}

export interface PackageSearchResult {
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

export interface SearchSuggestion {
  type: 'tracking' | 'client' | 'ci'
  value: string
  label: string
  count?: number
}

// Search type detection utility
export function detectSearchType(query: string): 'tracking' | 'client' | 'mixed' {
  if (!query || query.trim().length === 0) return 'mixed'
  
  const cleanQuery = query.trim()
  
  // Tracking numbers are typically long numeric strings (10+ digits)
  if (/^\d{10,}$/.test(cleanQuery)) return 'tracking'
  
  // CI numbers are shorter numeric (usually 6-8 digits)
  if (/^\d{6,9}$/.test(cleanQuery)) return 'mixed'
  
  // Common tracking prefixes (TBA, UPS, FDX, etc.) - these should be treated as tracking searches
  if (/^(TBA|UPS|FDX|FEDEX|DHL|USPS|1Z|SPXMIA|GF|420331|TBADD)\w*/i.test(cleanQuery)) return 'tracking'
  
  // If it's short (1-4 chars) and contains letters, likely a tracking prefix
  if (cleanQuery.length <= 4 && /^[A-Z0-9]+$/i.test(cleanQuery)) return 'tracking'
  
  // If it contains letters and is longer, likely a client name
  if (/[a-zA-Z]/.test(cleanQuery) && cleanQuery.length > 4) return 'client'
  
  // Default to mixed search for other patterns
  return 'mixed'
}

// Main fast search hook
export function useFastSearch() {
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [currentSearchResult, setCurrentSearchResult] = useState<SearchResult | null>(null)

  // Search by tracking number using dedicated endpoint
  const searchByTracking = useCallback(async (query: string, page: number = 1, pageSize: number = 25): Promise<SearchResult | null> => {
    if (!query.trim()) return null
    
    setIsSearching(true)
    setSearchError(null)
    
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5286'
      const response = await fetch(`${apiBaseUrl}/api/Packages/search/tracking/${encodeURIComponent(query.trim())}`)
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`)
      }
      
      const allResults: PackageSearchResult[] = await response.json()
      
      // Manual pagination since tracking endpoint returns all results
      const startIndex = (page - 1) * pageSize
      const endIndex = startIndex + pageSize
      const paginatedResults = allResults.slice(startIndex, endIndex)
      
      return {
        query: query.trim(),
        searchType: 'tracking',
        results: paginatedResults,
        totalFound: paginatedResults.length,
        totalAvailable: allResults.length,
        currentPage: page,
        pageSize: pageSize,
        hasNextPage: endIndex < allResults.length,
        hasPreviousPage: page > 1,
        executionTimeMs: undefined,
        cached: false
      }
    } catch (error) {
      console.error('Tracking search error:', error)
      setSearchError(error instanceof Error ? error.message : 'Search failed')
      return null
    } finally {
      setIsSearching(false)
    }
  }, [])

  // Search by client using general endpoint with client filter
  const searchByClient = useCallback(async (query: string, page: number = 1, pageSize: number = 25): Promise<SearchResult | null> => {
    if (!query.trim()) return null
    
    setIsSearching(true)
    setSearchError(null)
    
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5286'
      const params = new URLSearchParams({
        BuscarPorCliente: query.trim(),
        ElementosPorPagina: pageSize.toString(),
        Pagina: page.toString(),
        OrderBy: 'fecha',
        SortDirection: 'desc'
      })
      
      const response = await fetch(`${apiBaseUrl}/api/Packages?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`)
      }
      
      const data = await response.json()
      
      return {
        query: query.trim(),
        searchType: 'client',
        results: data.data || [],
        totalFound: (data.data || []).length,
        totalAvailable: data.totalCount || 0,
        currentPage: page,
        pageSize: pageSize,
        hasNextPage: data.hasNext || false,
        hasPreviousPage: data.hasPrevious || false,
        executionTimeMs: undefined,
        cached: false
      }
    } catch (error) {
      console.error('Client search error:', error)
      setSearchError(error instanceof Error ? error.message : 'Search failed')
      return null
    } finally {
      setIsSearching(false)
    }
  }, [])

  // Smart search that auto-detects search type
  const smartSearch = useCallback(async (query: string, page: number = 1, pageSize: number = 25): Promise<SearchResult | null> => {
    if (!query.trim()) return null
    
    const searchType = detectSearchType(query)
    
    switch (searchType) {
      case 'tracking':
        return await searchByTracking(query, page, pageSize)
      case 'client':
        return await searchByClient(query, page, pageSize)
      case 'mixed':
        // For mixed queries, try tracking first (faster), then client
        const trackingResult = await searchByTracking(query, page, pageSize)
        if (trackingResult && trackingResult.results.length > 0) {
          return trackingResult
        }
        return await searchByClient(query, page, pageSize)
      default:
        return await searchByClient(query, page, pageSize)
    }
  }, [searchByTracking, searchByClient])

  // Paginate current search results
  const paginateSearch = useCallback(async (page: number): Promise<SearchResult | null> => {
    if (!currentSearchResult) return null
    
    return await smartSearch(currentSearchResult.query, page, currentSearchResult.pageSize)
  }, [currentSearchResult, smartSearch])

  // Get search suggestions (placeholder for future backend endpoint)
  const getSuggestions = useCallback(async (query: string): Promise<SearchSuggestion[]> => {
    if (!query.trim() || query.trim().length < 2) return []
    
    // For now, return basic suggestions based on query type
    const searchType = detectSearchType(query)
    const suggestions: SearchSuggestion[] = []
    
    if (searchType === 'tracking' || searchType === 'mixed') {
      suggestions.push({
        type: 'tracking',
        value: query.trim(),
        label: `Buscar tracking: "${query.trim()}"`
      })
    }
    
    if (searchType === 'client' || searchType === 'mixed') {
      suggestions.push({
        type: 'client', 
        value: query.trim(),
        label: `Buscar cliente: "${query.trim()}"`
      })
    }
    
    return suggestions
  }, [])

  // Clear search state
  const clearSearch = useCallback(() => {
    setSearchError(null)
    setIsSearching(false)
    setCurrentSearchResult(null)
  }, [])

  return {
    // Search functions
    searchByTracking,
    searchByClient,
    smartSearch,
    paginateSearch,
    getSuggestions,
    
    // State
    isSearching,
    searchError,
    currentSearchResult,
    clearSearch,
    
    // Utilities
    detectSearchType,
    
    // Actions
    setCurrentSearchResult
  }
}
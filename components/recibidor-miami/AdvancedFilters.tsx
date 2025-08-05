"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  Package, 
  Hash, 
  User, 
  FileText, 
  Settings,
  X,
  XCircle,
  Loader2
} from "lucide-react"
import { cn } from "@/lib/utils"

type FilterValue = string | number | Date | undefined

interface AdvancedFiltersProps {
  filters: {
    numeroTarima: string
    guiaAerea: string
    buscarPorTracking: string
    buscarPorCliente: string
    ciPaquete: string
    elementosPorPagina: number
  }
  availableTarimas: string[]
  onFilterChange: (key: keyof AdvancedFiltersProps['filters'], value: FilterValue) => void
  onClearFilter: (key: string) => void
  isOpen: boolean
  onToggle: () => void
  activeFiltersCount: number
  ciPaqueteSearchState?: {
    isSearching: boolean
    resultCount?: number
    hasError?: boolean
  }
  onCiPaqueteChange?: (value: string) => void
  clientSearchState?: {
    isSearching: boolean
    resultCount?: number
    hasError?: boolean
  }
  onClientChange?: (value: string) => void
  advancedTrackingSearchState?: {
    isSearching: boolean
    resultCount?: number
    hasError?: boolean
    searchType?: 'tracking' | 'client' | 'mixed'
  }
  onAdvancedTrackingChange?: (value: string) => void
}

interface AdvancedFilterChipProps {
  label: string
  value: string | number
  onClear: () => void
  icon?: React.ElementType
  isActive: boolean
}

function AdvancedFilterChip({ label, value, onClear, icon: Icon, isActive }: AdvancedFilterChipProps) {
  if (!isActive) return null

  return (
    <Badge 
      variant="secondary" 
      className="px-3 py-2 rounded-full bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200 transition-colors dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800"
    >
      {Icon && <Icon className="w-3 h-3 mr-1.5" />}
      <span className="font-medium text-sm">{label}:</span>
      <span className="ml-1 font-normal">{value}</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={onClear}
        className="ml-2 h-4 w-4 p-0 hover:bg-orange-300 dark:hover:bg-orange-800 rounded-full"
      >
        <X className="w-3 h-3" />
      </Button>
    </Badge>
  )
}

export function AdvancedFilters({
  filters,
  availableTarimas,
  onFilterChange,
  onClearFilter,
  isOpen,
  onToggle,
  activeFiltersCount,
  ciPaqueteSearchState,
  onCiPaqueteChange,
  clientSearchState,
  onClientChange,
  advancedTrackingSearchState,
  onAdvancedTrackingChange
}: AdvancedFiltersProps) {
  const isTrackingActive = !!(filters.buscarPorTracking && filters.buscarPorTracking.trim() !== '')
  const isGuiaActive = false // Disabled filter
  const isTarimaActive = !!(filters.numeroTarima && filters.numeroTarima !== 'all')
  const isClienteActive = !!(filters.buscarPorCliente && filters.buscarPorCliente.trim() !== '')
  const isCiPaqueteActive = !!(filters.ciPaquete && filters.ciPaquete.trim() !== '')
  const isPageSizeActive = filters.elementosPorPagina !== 25

  const hasActiveAdvancedFilters = isTrackingActive || isTarimaActive || isClienteActive || isCiPaqueteActive || isPageSizeActive

  return (
    <div className="space-y-4">
      {/* Collapsible Advanced Filters */}
      <div className={cn(
        "overflow-hidden transition-all duration-300 ease-in-out",
        isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
      )}>
        <Card className="p-6 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50 border-slate-200 dark:border-slate-700">
          <div className="space-y-6">
            {/* Section Header */}
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-700">
              <Settings className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              <h3 className="font-medium text-slate-900 dark:text-slate-100">Filtros avanzados</h3>
            </div>

            {/* Advanced Filter Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Advanced Tracking Search - Enhanced */}
              <div className="space-y-3">
                <Label htmlFor="advanced-tracking" className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 sm:gap-2">
                  <Search className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="text-xs sm:text-sm">Buscar por Tracking</span>
                  {/* Search Type Indicator */}
                  {filters.buscarPorTracking && filters.buscarPorTracking.length >= 3 && advancedTrackingSearchState?.searchType && (
                    <Badge variant="outline" className="text-xs px-2 py-0">
                      {advancedTrackingSearchState.searchType === 'tracking' ? 'Tracking' : 
                       advancedTrackingSearchState.searchType === 'client' ? 'Cliente' : 'Mixto'}
                    </Badge>
                  )}
                </Label>
                
                <div className="relative">
                  <Input
                    id="advanced-tracking"
                    type="text"
                    placeholder="Número de tracking o cliente"
                    value={filters.buscarPorTracking}
                    onChange={(e) => {
                      const value = e.target.value
                      if (onAdvancedTrackingChange) {
                        onAdvancedTrackingChange(value)
                      } else {
                        onFilterChange('buscarPorTracking', value)
                      }
                    }}
                    className={cn(
                      "rounded-xl border-2 transition-all duration-200 pr-10",
                      advancedTrackingSearchState?.isSearching 
                        ? "border-blue-500 focus:border-blue-600" 
                        : advancedTrackingSearchState?.resultCount !== undefined
                        ? advancedTrackingSearchState.resultCount > 0
                          ? "border-green-500 focus:border-green-600"
                          : "border-orange-500 focus:border-orange-600"
                        : "focus:border-accent-blue focus:ring-1 focus:ring-accent-blue/20"
                    )}
                  />
                  
                  {/* Right side indicators */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {advancedTrackingSearchState?.isSearching ? (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    ) : filters.buscarPorTracking && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onClearFilter('buscarPorTracking')}
                        className="h-6 w-6 p-0 hover:bg-muted rounded-full"
                      >
                        <XCircle className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Search Status */}
                {filters.buscarPorTracking && filters.buscarPorTracking.length >= 3 && (
                  <div className="text-xs">
                    {advancedTrackingSearchState?.isSearching ? (
                      <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Buscando {advancedTrackingSearchState.searchType === 'tracking' ? 'tracking' : 
                                 advancedTrackingSearchState.searchType === 'client' ? 'cliente' : 
                                 'tracking/cliente'} &apos;{filters.buscarPorTracking}&apos;...
                      </span>
                    ) : advancedTrackingSearchState?.resultCount !== undefined ? (
                      <span className={cn(
                        "flex items-center gap-1",
                        advancedTrackingSearchState.resultCount > 0 
                          ? "text-green-600 dark:text-green-400" 
                          : "text-orange-600 dark:text-orange-400"
                      )}>
                        <Search className="h-3 w-3" />
                        {advancedTrackingSearchState.resultCount > 0 
                          ? `Encontrados ${advancedTrackingSearchState.resultCount} paquetes`
                          : `No se encontraron resultados para '${filters.buscarPorTracking}'`
                        }
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        Escribe al menos 3 caracteres para buscar
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Guía Aérea - Disabled */}
              <div className="space-y-3 opacity-50">
                <Label htmlFor="advanced-guia" className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 sm:gap-2">
                  <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="text-xs sm:text-sm">Guía Aérea</span>
                </Label>
                <Input
                  id="advanced-guia"
                  placeholder="Número de guía"
                  value={filters.guiaAerea}
                  onChange={(e) => onFilterChange('guiaAerea', e.target.value)}
                  className="rounded-xl border-2 transition-all duration-200 focus:border-accent-blue focus:ring-1 focus:ring-accent-blue/20"
                  disabled
                />
              </div>

              {/* Tarima Filter */}
              <div className="space-y-3">
                <Label htmlFor="advanced-tarima" className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 sm:gap-2">
                  <Package className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="text-xs sm:text-sm"># Tarima</span>
                </Label>
                <Select value={filters.numeroTarima} onValueChange={(value) => onFilterChange('numeroTarima', value)}>
                  <SelectTrigger className="rounded-xl border-2 transition-all duration-200 focus:border-accent-blue">
                    <SelectValue placeholder="Seleccionar tarima" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las tarimas</SelectItem>
                    {(() => {
                      // Get current month in MMYY format (e.g., "0825" for August 2025)
                      const now = new Date()
                      const currentMonth = String(now.getMonth() + 1).padStart(2, '0')
                      const currentYear = String(now.getFullYear()).slice(-2)
                      const currentMonthPattern = `${currentMonth}${currentYear}`
                      
                      // Sort tarimas: current month first, then the rest
                      const sortedTarimas = [...availableTarimas].sort((a, b) => {
                        const aIsCurrentMonth = a.includes(currentMonthPattern)
                        const bIsCurrentMonth = b.includes(currentMonthPattern)
                        
                        if (aIsCurrentMonth && !bIsCurrentMonth) return -1
                        if (!aIsCurrentMonth && bIsCurrentMonth) return 1
                        
                        // Within the same group (current month or others), sort naturally
                        return a.localeCompare(b, undefined, { numeric: true })
                      })
                      
                      return sortedTarimas.map(tarima => (
                        <SelectItem key={tarima} value={tarima}>
                          Tarima {tarima}
                          {tarima.includes(currentMonthPattern) && (
                            <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">• Este mes</span>
                          )}
                        </SelectItem>
                      ))
                    })()}
                  </SelectContent>
                </Select>
              </div>

              {/* Client Search - Enhanced */}
              <div className="space-y-3">
                <Label htmlFor="advanced-cliente" className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 sm:gap-2">
                  <User className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="text-xs sm:text-sm">Buscar por Cliente</span>
                </Label>
                <div className="relative">
                  <Input
                    id="advanced-cliente"
                    type="text"
                    placeholder="Nombre del cliente"
                    value={filters.buscarPorCliente}
                    onChange={(e) => {
                      const value = e.target.value
                      if (onClientChange) {
                        onClientChange(value)
                      } else {
                        onFilterChange('buscarPorCliente', value)
                      }
                    }}
                    className={cn(
                      "rounded-xl border-2 transition-all duration-200 pr-10",
                      clientSearchState?.isSearching 
                        ? "border-blue-500 focus:border-blue-600" 
                        : clientSearchState?.resultCount !== undefined
                        ? clientSearchState.resultCount > 0
                          ? "border-green-500 focus:border-green-600"
                          : "border-orange-500 focus:border-orange-600"
                        : "focus:border-accent-blue focus:ring-1 focus:ring-accent-blue/20"
                    )}
                  />
                  
                  {/* Right side indicators */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {clientSearchState?.isSearching ? (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    ) : filters.buscarPorCliente && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onClearFilter('buscarPorCliente')}
                        className="h-6 w-6 p-0 hover:bg-muted rounded-full"
                      >
                        <XCircle className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Search Status */}
                {filters.buscarPorCliente && filters.buscarPorCliente.length >= 2 && (
                  <div className="text-xs">
                    {clientSearchState?.isSearching ? (
                      <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Buscando clientes con &apos;{filters.buscarPorCliente}&apos;...
                      </span>
                    ) : clientSearchState?.resultCount !== undefined ? (
                      <span className={cn(
                        "flex items-center gap-1",
                        clientSearchState.resultCount > 0 
                          ? "text-green-600 dark:text-green-400" 
                          : "text-orange-600 dark:text-orange-400"
                      )}>
                        <User className="h-3 w-3" />
                        {clientSearchState.resultCount > 0 
                          ? `Encontrados ${clientSearchState.resultCount} paquetes de clientes con '${filters.buscarPorCliente}'`
                          : `No se encontraron clientes con '${filters.buscarPorCliente}'`
                        }
                      </span>
                    ) : filters.buscarPorCliente.length < 2 && (
                      <span className="text-muted-foreground">
                        Escribe al menos 2 caracteres para buscar
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* CI Paquete - Enhanced Search */}
              <div className="space-y-3">
                <Label htmlFor="advanced-cl-paquete" className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 sm:gap-2">
                  <Hash className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="text-xs sm:text-sm">CI Paquete</span>
                </Label>
                <div className="relative">
                  <Input
                    id="advanced-cl-paquete"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="Ej: 129541... (mín. 3 dígitos)"
                    value={filters.ciPaquete}
                    onChange={(e) => {
                      // Only allow numbers
                      const value = e.target.value.replace(/[^0-9]/g, '')
                      if (onCiPaqueteChange) {
                        onCiPaqueteChange(value)
                      } else {
                        onFilterChange('ciPaquete', value)
                      }
                    }}
                    className={cn(
                      "rounded-xl border-2 transition-all duration-200 pr-10",
                      ciPaqueteSearchState?.isSearching 
                        ? "border-blue-500 focus:border-blue-600" 
                        : ciPaqueteSearchState?.resultCount !== undefined
                        ? ciPaqueteSearchState.resultCount > 0
                          ? "border-green-500 focus:border-green-600"
                          : "border-orange-500 focus:border-orange-600"
                        : "focus:border-accent-blue focus:ring-1 focus:ring-accent-blue/20"
                    )}
                  />
                  
                  {/* Right side indicators */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {ciPaqueteSearchState?.isSearching ? (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    ) : filters.ciPaquete && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onClearFilter('ciPaquete')}
                        className="h-6 w-6 p-0 hover:bg-muted rounded-full"
                      >
                        <XCircle className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Search Status */}
                {filters.ciPaquete && filters.ciPaquete.length >= 3 && (
                  <div className="text-xs">
                    {ciPaqueteSearchState?.isSearching ? (
                      <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Buscando paquetes que empiecen con {filters.ciPaquete}...
                      </span>
                    ) : ciPaqueteSearchState?.resultCount !== undefined ? (
                      <span className={cn(
                        "flex items-center gap-1",
                        ciPaqueteSearchState.resultCount > 0 
                          ? "text-green-600 dark:text-green-400" 
                          : "text-orange-600 dark:text-orange-400"
                      )}>
                        <Hash className="h-3 w-3" />
                        {ciPaqueteSearchState.resultCount > 0 
                          ? `Encontrados ${ciPaqueteSearchState.resultCount} paquetes`
                          : "No se encontraron paquetes"
                        }
                      </span>
                    ) : filters.ciPaquete.length >= 3 && (
                      <span className="text-muted-foreground">
                        Escribe al menos 3 dígitos para buscar
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Elements per page */}
              <div className="space-y-3">
                <Label htmlFor="advanced-per-page" className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 sm:gap-2">
                  <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="text-xs sm:text-sm">Elementos por página</span>
                </Label>
                <Select value={filters.elementosPorPagina.toString()} onValueChange={(value) => onFilterChange('elementosPorPagina', parseInt(value))}>
                  <SelectTrigger className="rounded-xl border-2 transition-all duration-200 focus:border-accent-blue">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Show "Show All" option only when a specific tarima is selected */}
                    {isTarimaActive && (
                      <SelectItem value="1000">Mostrar todos (esta tarima)</SelectItem>
                    )}
                    <SelectItem value="10">10 por página</SelectItem>
                    <SelectItem value="25">25 por página</SelectItem>
                    <SelectItem value="50">50 por página</SelectItem>
                    <SelectItem value="100">100 por página</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Active Advanced Filter Chips */}
      {hasActiveAdvancedFilters && (
        <div className="flex flex-wrap items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-orange-50 dark:bg-orange-900/10 rounded-xl border border-orange-200 dark:border-orange-800">
          <div className="text-xs sm:text-sm text-orange-700 dark:text-orange-400 font-medium">Filtros avanzados:</div>
          
          <AdvancedFilterChip
            label="Tracking"
            value={filters.buscarPorTracking}
            onClear={() => onClearFilter('buscarPorTracking')}
            icon={Search}
            isActive={isTrackingActive}
          />
          
          {/* Guía Aérea chip disabled */}
          {false && <AdvancedFilterChip
            label="Guía"
            value={filters.guiaAerea}
            onClear={() => onClearFilter('guiaAerea')}
            icon={FileText}
            isActive={isGuiaActive}
          />}
          
          <AdvancedFilterChip
            label="Tarima"
            value={filters.numeroTarima}
            onClear={() => onClearFilter('numeroTarima')}
            icon={Package}
            isActive={isTarimaActive}
          />
          
          <AdvancedFilterChip
            label="Cliente"
            value={filters.buscarPorCliente}
            onClear={() => onClearFilter('buscarPorCliente')}
            icon={User}
            isActive={isClienteActive}
          />
          
          <AdvancedFilterChip
            label="CI Paquete"
            value={filters.ciPaquete}
            onClear={() => onClearFilter('ciPaquete')}
            icon={Hash}
            isActive={isCiPaqueteActive}
          />
          
          <AdvancedFilterChip
            label="Por página"
            value={filters.elementosPorPagina === 1000 && isTarimaActive ? "Todos" : filters.elementosPorPagina}
            onClear={() => onFilterChange('elementosPorPagina', 25)}
            icon={Settings}
            isActive={isPageSizeActive}
          />
        </div>
      )}
    </div>
  )
}
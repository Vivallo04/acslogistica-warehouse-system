"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { 
 
  X, 
  Calendar, 
  ChevronDown, 
  Settings2,
  MapPin,
  CheckCircle2,
  CalendarDays,
  RefreshCw
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"

type FilterValue = string | number | Date | undefined

// Helper function to format country names for display
function formatCountryName(country: string): string {
  const countryMap: Record<string, string> = {
    'colombia': 'Colombia',
    'estados_unidos': 'Estados Unidos'
  }
  return countryMap[country] || country.charAt(0).toUpperCase() + country.slice(1)
}

interface SmartFilterBarProps {
  filters: {
    estado: string
    pais: string
    desde: Date | undefined
    hasta: Date | undefined
  }
  availableStates: string[]
  availableCountries: string[]
  onFilterChange: (key: string, value: FilterValue) => void
  onClearFilter: (key: string) => void
  onClearAll: () => void
  onShowAdvanced: () => void
  onRefresh: () => void
  isAdvancedOpen: boolean
  activeFiltersCount: number
}

interface FilterChipProps {
  label: string
  value: string | Date | undefined
  onClear: () => void
  icon?: React.ElementType
  isActive: boolean
  displayValue?: string
}

function FilterChip({ label, value, onClear, icon: Icon, isActive, displayValue }: FilterChipProps) {
  const display = displayValue || (value instanceof Date ? format(value, "dd/MM/yyyy", { locale: es }) : value)
  
  if (!isActive) return null

  return (
    <Badge 
      variant="secondary" 
      className="px-3 py-2 rounded-full bg-accent-blue/10 text-accent-blue border-accent-blue/20 hover:bg-accent-blue/20 transition-colors"
    >
      {Icon && <Icon className="w-3 h-3 mr-1.5" />}
      <span className="font-medium text-sm">{label}:</span>
      <span className="ml-1 font-normal">{display}</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={onClear}
        className="ml-2 h-4 w-4 p-0 hover:bg-accent-blue/30 rounded-full"
      >
        <X className="w-3 h-3" />
      </Button>
    </Badge>
  )
}

export function SmartFilterBar({
  filters,
  availableStates,
  availableCountries,
  onFilterChange,
  onClearFilter,
  onClearAll,
  onShowAdvanced,
  onRefresh,
  isAdvancedOpen,
  activeFiltersCount
}: SmartFilterBarProps) {
  const [datePickerOpen, setDatePickerOpen] = useState<'desde' | 'hasta' | null>(null)

  const isEstadoActive = !!(filters.estado && filters.estado !== 'all')
  const isPaisActive = !!(filters.pais && filters.pais !== 'all')
  const isDateActive = !!(filters.desde || filters.hasta)

  const getDateRangeDisplay = () => {
    if (filters.desde && filters.hasta) {
      return `${format(filters.desde, "dd/MM", { locale: es })} - ${format(filters.hasta, "dd/MM", { locale: es })}`
    }
    if (filters.desde) {
      return `Desde ${format(filters.desde, "dd/MM/yyyy", { locale: es })}`
    }
    if (filters.hasta) {
      return `Hasta ${format(filters.hasta, "dd/MM/yyyy", { locale: es })}`
    }
    return ""
  }

  return (
    <Card className="p-4 bg-card/50 backdrop-blur-sm border-border/50">
      <div className="space-y-4">
        {/* Mobile: Vertical Layout, Desktop: Horizontal Layout */}
        <div className="space-y-4 sm:space-y-0">
          {/* Section Header for Mobile */}
          <div className="flex items-center gap-2 sm:hidden">
            <h3 className="text-sm font-medium text-muted-foreground">Filtros de búsqueda</h3>
            <div className="flex-1 h-px bg-border"></div>
          </div>

          {/* Primary Filters - Mobile: Column, Desktop: Row */}
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
            {/* Mobile Filters Section */}
            <div className="space-y-3 sm:space-y-0 sm:flex sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2 sm:hidden">
                <span>Filtros principales:</span>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
              {/* Estado Filter */}
              <Select 
                value={filters.estado} 
                onValueChange={(value) => onFilterChange('estado', value)}
              >
                <SelectTrigger className={cn(
                  "rounded-full border-2 transition-all duration-200 h-12 sm:h-auto w-full sm:w-auto sm:min-w-[120px] text-base sm:text-sm lg:text-base",
                  isEstadoActive 
                    ? "border-accent-blue bg-accent-blue/5 text-accent-blue font-medium" 
                    : "border-border hover:border-accent-blue/50"
                )}>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <SelectValue placeholder="Todos los estados" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="Prealertado">Prealertado</SelectItem>
                  <SelectItem value="Recibido en Miami">Recibido en Miami</SelectItem>
                  <SelectItem value="Vuelo asignado">Vuelo asignado</SelectItem>
                  <SelectItem value="En Aduana">En Aduana</SelectItem>
                </SelectContent>
              </Select>

              {/* País Filter */}
              <Select 
                value={filters.pais} 
                onValueChange={(value) => onFilterChange('pais', value)}
              >
                <SelectTrigger className={cn(
                  "rounded-full border-2 transition-all duration-200 h-12 sm:h-auto w-full sm:w-auto sm:min-w-[120px] text-base sm:text-sm lg:text-base",
                  isPaisActive 
                    ? "border-accent-blue bg-accent-blue/5 text-accent-blue font-medium" 
                    : "border-border hover:border-accent-blue/50"
                )}>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <SelectValue placeholder="Todos los países" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los países</SelectItem>
                  {/* Dynamic countries from API with proper formatting */}
                  {availableCountries.map(country => (
                    <SelectItem key={country} value={country}>{formatCountryName(country)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Date Range Filter */}
              <Popover 
                open={datePickerOpen === 'desde'} 
                onOpenChange={(open) => setDatePickerOpen(open ? 'desde' : null)}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "rounded-full border-2 transition-all duration-200 h-12 sm:h-auto w-full sm:w-auto sm:min-w-[140px] text-base sm:text-sm lg:text-base justify-start sm:justify-center",
                      isDateActive 
                        ? "border-accent-blue bg-accent-blue/5 text-accent-blue font-medium" 
                        : "border-border hover:border-accent-blue/50"
                    )}
                  >
                    <CalendarDays className="w-4 h-4 mr-2" />
                    <span>{isDateActive ? "Fechas seleccionadas" : "Fechas"}</span>
                    <ChevronDown className="w-4 h-4 ml-auto sm:ml-2" />
                  </Button>
                </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="p-4 space-y-3">
                {/* Header */}
                <div className="text-sm font-medium text-center text-muted-foreground">
                  Seleccionar fechas
                </div>

                {/* Calendar for Range Selection */}
                <div className="flex justify-center">
                  <CalendarComponent
                    mode="range"
                    selected={{
                      from: filters.desde,
                      to: filters.hasta
                    }}
                    onSelect={(range) => {
                      if (range) {
                        onFilterChange('desde', range.from)
                        onFilterChange('hasta', range.to)
                      } else {
                        onFilterChange('desde', undefined)
                        onFilterChange('hasta', undefined)
                      }
                    }}
                    className="rounded-lg border border-accent-blue/20"
                    classNames={{
                      day_selected: "bg-accent-blue text-white hover:bg-accent-blue/90",
                      day_today: "bg-accent-blue/10 text-accent-blue font-semibold",
                      day_range_start: "bg-accent-blue text-white hover:bg-accent-blue/90 rounded-l-md",
                      day_range_end: "bg-accent-blue text-white hover:bg-accent-blue/90 rounded-r-md", 
                      day_range_middle: "bg-accent-blue/20 text-accent-blue-foreground hover:bg-accent-blue/30 rounded-none",
                      day_outside: "text-muted-foreground opacity-50",
                      day_disabled: "text-muted-foreground opacity-50",
                      day_hidden: "invisible"
                    }}
                  />
                </div>

                {/* Quick Selection Buttons */}
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground text-center">Selección rápida</div>
                  <div className="flex gap-2 justify-center">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        const today = new Date()
                        onFilterChange('desde', today)
                        onFilterChange('hasta', today)
                      }}
                      className="text-xs px-3 py-1 h-7 hover:bg-accent-blue/10 hover:border-accent-blue/50"
                    >
                      Hoy
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        const today = new Date()
                        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
                        onFilterChange('desde', weekAgo)
                        onFilterChange('hasta', today)
                      }}
                      className="text-xs px-3 py-1 h-7 hover:bg-accent-blue/10 hover:border-accent-blue/50"
                    >
                      Semana
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        const today = new Date()
                        const monthAgo = new Date(today)
                        monthAgo.setMonth(monthAgo.getMonth() - 1)
                        onFilterChange('desde', monthAgo)
                        onFilterChange('hasta', today)
                      }}
                      className="text-xs px-3 py-1 h-7 hover:bg-accent-blue/10 hover:border-accent-blue/50"
                    >
                      Mes
                    </Button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2 border-t">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => {
                      onClearFilter('desde')
                      onClearFilter('hasta')
                      setDatePickerOpen(null)
                    }}
                    className="flex-1 h-8 text-xs hover:bg-destructive/10 hover:border-destructive/50 hover:text-destructive"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Limpiar
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => setDatePickerOpen(null)}
                    className="flex-1 h-8 text-xs bg-accent-blue hover:bg-accent-blue/90 text-white"
                  >
                    Aplicar
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

              </div>
            </div>

            {/* Action Buttons - Mobile: Vertical, Desktop: Horizontal */}
            <div className="space-y-3 sm:space-y-0 sm:flex sm:flex-row sm:items-center sm:gap-3 sm:ml-auto">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2 sm:hidden">
                <span>Acciones:</span>
                <div className="flex-1 h-px bg-border"></div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
              {/* More Filters Button */}
              <Button
                variant="outline"
                onClick={onShowAdvanced}
                className={cn(
                  "rounded-full border-2 transition-all duration-200 h-12 sm:h-auto w-full sm:w-auto text-base sm:text-sm lg:text-base justify-start sm:justify-center",
                  isAdvancedOpen 
                    ? "border-accent-blue bg-accent-blue/5 text-accent-blue" 
                    : "border-border hover:border-accent-blue/50"
                )}
              >
                <Settings2 className="w-4 h-4 mr-3 sm:mr-1.5 lg:mr-2" />
                <span className="sm:hidden">Más filtros</span>
                <span className="hidden sm:inline">Más filtros</span>
                {activeFiltersCount > 0 && (
                  <Badge className="ml-auto sm:ml-1.5 lg:ml-2 bg-accent-blue text-white text-xs px-1.5 py-0.5 rounded-full">
                    {activeFiltersCount}
                  </Badge>
                )}
                <ChevronDown className={cn(
                  "w-4 h-4 ml-2 sm:ml-1.5 lg:ml-2 transition-transform duration-200",
                  isAdvancedOpen && "rotate-180"
                )} />
              </Button>

              {/* Refresh Button */}
              <Button 
                variant="outline" 
                onClick={onRefresh}
                className="rounded-full border-2 hover:border-accent-blue hover:bg-accent-blue/5 transition-all duration-200 h-12 sm:h-auto w-full sm:w-auto text-base sm:text-sm lg:text-base justify-start sm:justify-center"
              >
                <RefreshCw className="w-4 h-4 mr-3 sm:mr-1.5 lg:mr-2" />
                <span>Actualizar</span>
              </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Active Filter Chips */}
        {(isEstadoActive || isPaisActive || isDateActive) && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/50">
            <div className="text-sm text-muted-foreground font-medium">Filtros activos:</div>
            
            <FilterChip
              label="Estado"
              value={filters.estado}
              onClear={() => onClearFilter('estado')}
              icon={CheckCircle2}
              isActive={isEstadoActive}
            />
            
            <FilterChip
              label="País"
              value={filters.pais}
              onClear={() => onClearFilter('pais')}
              icon={MapPin}
              isActive={isPaisActive}
              displayValue={filters.pais !== 'all' ? formatCountryName(filters.pais) : undefined}
            />
            
            <FilterChip
              label="Fechas"
              value={filters.desde || filters.hasta}
              onClear={() => {
                onClearFilter('desde')
                onClearFilter('hasta')
              }}
              icon={Calendar}
              isActive={isDateActive}
              displayValue={getDateRangeDisplay()}
            />

            {(isEstadoActive || isPaisActive || isDateActive) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearAll}
                className="text-muted-foreground hover:text-foreground rounded-full px-3 py-1"
              >
                <X className="w-3 h-3 mr-1" />
                Limpiar todo
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
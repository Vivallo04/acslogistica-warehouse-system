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
        {/* Primary Filters Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Estado Filter */}
          <div className="flex items-center gap-2">
            <Select 
              value={filters.estado} 
              onValueChange={(value) => onFilterChange('estado', value)}
            >
              <SelectTrigger className={cn(
                "rounded-full border-2 transition-all duration-200 min-w-[100px] sm:min-w-[120px] text-sm sm:text-base",
                isEstadoActive 
                  ? "border-accent-blue bg-accent-blue/5 text-accent-blue font-medium" 
                  : "border-border hover:border-accent-blue/50"
              )}>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  <SelectValue placeholder="Estado" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="Prealertado">Prealertado</SelectItem>
                <SelectItem value="Recibido">Recibido</SelectItem>
                <SelectItem value="Procesando">Procesando</SelectItem>
                <SelectItem value="Enviado">Enviado</SelectItem>
                {/* Dynamic states from API */}
                {availableStates.filter(state => !['Prealertado', 'Recibido', 'Procesando', 'Enviado'].includes(state)).map(state => (
                  <SelectItem key={state} value={state}>{state}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* País Filter */}
          <div className="flex items-center gap-2">
            <Select 
              value={filters.pais} 
              onValueChange={(value) => onFilterChange('pais', value)}
            >
              <SelectTrigger className={cn(
                "rounded-full border-2 transition-all duration-200 min-w-[100px] sm:min-w-[120px] text-sm sm:text-base",
                isPaisActive 
                  ? "border-accent-blue bg-accent-blue/5 text-accent-blue font-medium" 
                  : "border-border hover:border-accent-blue/50"
              )}>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                  <SelectValue placeholder="País" />
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
          </div>

          {/* Date Range Filter */}
          <Popover 
            open={datePickerOpen === 'desde'} 
            onOpenChange={(open) => setDatePickerOpen(open ? 'desde' : null)}
          >
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "rounded-full border-2 transition-all duration-200 min-w-[120px] sm:min-w-[140px] text-sm sm:text-base",
                  isDateActive 
                    ? "border-accent-blue bg-accent-blue/5 text-accent-blue font-medium" 
                    : "border-border hover:border-accent-blue/50"
                )}
              >
                <CalendarDays className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                <span className="hidden sm:inline">{isDateActive ? "Rango de fechas" : "Fechas"}</span>
                <span className="sm:hidden">{isDateActive ? "Fechas" : "Fechas"}</span>
                <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 ml-1.5 sm:ml-2" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="p-6 space-y-6 min-w-[420px]">
                {/* Header */}
                <div className="text-center space-y-1">
                  <div className="text-base font-semibold text-foreground">Seleccionar Rango de Fechas</div>
                  <div className="text-sm text-muted-foreground">Elija la fecha de inicio y fin para filtrar los paquetes</div>
                </div>
                
                {/* Current Selection Display */}
                <div className="bg-accent-blue/5 border border-accent-blue/20 rounded-lg p-4">
                  <div className="text-xs font-medium text-accent-blue mb-3 text-center">RANGO SELECCIONADO</div>
                  <div className="flex items-center justify-center gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-accent-blue" />
                      <span className={filters.desde ? "text-foreground font-semibold" : "text-muted-foreground italic"}>
                        {filters.desde ? format(filters.desde, "dd/MM/yyyy", { locale: es }) : "Fecha inicio"}
                      </span>
                    </div>
                    <div className="text-accent-blue font-bold text-lg">→</div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-accent-blue" />
                      <span className={filters.hasta ? "text-foreground font-semibold" : "text-muted-foreground italic"}>
                        {filters.hasta ? format(filters.hasta, "dd/MM/yyyy", { locale: es }) : "Fecha fin"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Single Calendar for Range Selection */}
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
                    className="rounded-lg border-2 border-accent-blue/20"
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
                <div className="space-y-3">
                  <div className="text-sm font-medium text-muted-foreground text-center">Selección rápida:</div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        const today = new Date()
                        onFilterChange('desde', today)
                        onFilterChange('hasta', today)
                      }}
                      className="text-xs hover:bg-accent-blue/10 hover:border-accent-blue/50"
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
                      className="text-xs hover:bg-accent-blue/10 hover:border-accent-blue/50"
                    >
                      Última semana
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
                      className="text-xs hover:bg-accent-blue/10 hover:border-accent-blue/50"
                    >
                      Último mes
                    </Button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2 border-t">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => {
                      onClearFilter('desde')
                      onClearFilter('hasta')
                      setDatePickerOpen(null)
                    }}
                    className="flex-1 hover:bg-destructive/10 hover:border-destructive/50 hover:text-destructive"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Limpiar
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => setDatePickerOpen(null)}
                    className="flex-1 bg-accent-blue hover:bg-accent-blue/90 text-white"
                  >
                    <CalendarDays className="w-4 h-4 mr-2" />
                    Aplicar Filtro
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* More Filters Button */}
          <Button
            variant="outline"
            onClick={onShowAdvanced}
            className={cn(
              "rounded-full border-2 transition-all duration-200 text-sm sm:text-base",
              isAdvancedOpen 
                ? "border-accent-blue bg-accent-blue/5 text-accent-blue" 
                : "border-border hover:border-accent-blue/50"
            )}
          >
            <Settings2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
            <span className="hidden sm:inline">Más filtros</span>
            <span className="sm:hidden">Más</span>
            {activeFiltersCount > 0 && (
              <Badge className="ml-1.5 sm:ml-2 bg-accent-blue text-white text-xs px-1.5 py-0.5 rounded-full">
                {activeFiltersCount}
              </Badge>
            )}
            <ChevronDown className={cn(
              "w-3 h-3 sm:w-4 sm:h-4 ml-1.5 sm:ml-2 transition-transform duration-200",
              isAdvancedOpen && "rotate-180"
            )} />
          </Button>

          </div>

          {/* Refresh Button - Right Side */}
          <Button 
            variant="outline" 
            onClick={onRefresh}
            className="rounded-full border-2 hover:border-accent-blue hover:bg-accent-blue/5 transition-all duration-200 text-sm sm:text-base ml-auto"
          >
            <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
            <span className="hidden sm:inline">Actualizar</span>
            <span className="sm:hidden">Actualizar</span>
          </Button>
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
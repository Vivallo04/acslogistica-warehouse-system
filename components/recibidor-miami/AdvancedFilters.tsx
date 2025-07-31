"use client"

import { useState } from "react"
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
  ChevronUp,
  X
} from "lucide-react"
import { cn } from "@/lib/utils"

type FilterValue = string | number | Date

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
  activeFiltersCount
}: AdvancedFiltersProps) {
  const isTrackingActive = !!(filters.buscarPorTracking && filters.buscarPorTracking.trim() !== '')
  const isGuiaActive = !!(filters.guiaAerea && filters.guiaAerea.trim() !== '')
  const isTarimaActive = !!(filters.numeroTarima && filters.numeroTarima !== 'all')
  const isClienteActive = !!(filters.buscarPorCliente && filters.buscarPorCliente.trim() !== '')
  const isCiPaqueteActive = !!(filters.ciPaquete && filters.ciPaquete.trim() !== '')
  const isPageSizeActive = filters.elementosPorPagina !== 25

  const hasActiveAdvancedFilters = isTrackingActive || isGuiaActive || isTarimaActive || isClienteActive || isCiPaqueteActive || isPageSizeActive

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
              {/* Tracking Search */}
              <div className="space-y-3">
                <Label htmlFor="advanced-tracking" className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 sm:gap-2">
                  <Search className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="text-xs sm:text-sm">Buscar por Tracking</span>
                </Label>
                <Input
                  id="advanced-tracking"
                  placeholder="Número de tracking"
                  value={filters.buscarPorTracking}
                  onChange={(e) => onFilterChange('buscarPorTracking', e.target.value)}
                  className="rounded-xl border-2 transition-all duration-200 focus:border-accent-blue focus:ring-1 focus:ring-accent-blue/20"
                />
              </div>

              {/* Guía Aérea */}
              <div className="space-y-3">
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
                    {availableTarimas.map(tarima => (
                      <SelectItem key={tarima} value={tarima}>Tarima {tarima}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Client Search */}
              <div className="space-y-3">
                <Label htmlFor="advanced-cliente" className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 sm:gap-2">
                  <User className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="text-xs sm:text-sm">Buscar por Cliente</span>
                </Label>
                <Input
                  id="advanced-cliente"
                  placeholder="Nombre del cliente"
                  value={filters.buscarPorCliente}
                  onChange={(e) => onFilterChange('buscarPorCliente', e.target.value)}
                  className="rounded-xl border-2 transition-all duration-200 focus:border-accent-blue focus:ring-1 focus:ring-accent-blue/20"
                />
              </div>

              {/* CI Paquete */}
              <div className="space-y-3">
                <Label htmlFor="advanced-cl-paquete" className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 sm:gap-2">
                  <Hash className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="text-xs sm:text-sm">CI Paquete</span>
                </Label>
                <Input
                  id="advanced-cl-paquete"
                  placeholder="ID del paquete"
                  value={filters.ciPaquete}
                  onChange={(e) => onFilterChange('ciPaquete', e.target.value)}
                  className="rounded-xl border-2 transition-all duration-200 focus:border-accent-blue focus:ring-1 focus:ring-accent-blue/20"
                />
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
          
          <AdvancedFilterChip
            label="Guía"
            value={filters.guiaAerea}
            onClear={() => onClearFilter('guiaAerea')}
            icon={FileText}
            isActive={isGuiaActive}
          />
          
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
            value={filters.elementosPorPagina}
            onClear={() => onFilterChange('elementosPorPagina', 25)}
            icon={Settings}
            isActive={isPageSizeActive}
          />
        </div>
      )}
    </div>
  )
}
"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Search, Package, Clock, AlertTriangle, Zap, MapPin } from "lucide-react"

interface SearchHeroProps {
  searchValue: string
  onSearchChange: (value: string) => void
  onQuickFilter: (filterType: string, value: string) => void
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
    id: "recibidos",
    label: "Recibidos",
    icon: Package,
    filterType: "estado",
    filterValue: "Recibido",
    color: "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 border border-green-200 dark:border-green-800"
  },
  {
    id: "procesando",
    label: "Procesando",
    icon: AlertTriangle,
    filterType: "estado", 
    filterValue: "Procesando",
    color: "bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/20 dark:text-orange-400 border border-orange-200 dark:border-orange-800"
  },
  {
    id: "enviados",
    label: "Enviados",
    icon: Zap,
    filterType: "estado",
    filterValue: "Enviado",
    color: "bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/20 dark:text-purple-400 border border-purple-200 dark:border-purple-800"
  }
]

export function SearchHero({ 
  searchValue, 
  onSearchChange, 
  onQuickFilter, 
  isLoading = false,
  resultsCount = 0 
}: SearchHeroProps) {
  const [searchFocused, setSearchFocused] = useState(false)

  const handleQuickAction = (action: QuickAction) => {
    onQuickFilter(action.filterType, action.filterValue)
  }

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
                placeholder="Buscar por número de tracking, cliente o contenido..."
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className={`pl-10 sm:pl-12 pr-4 py-4 sm:py-6 text-base sm:text-lg rounded-2xl border-2 transition-all duration-200 ${
                  searchFocused 
                    ? 'border-accent-blue shadow-lg shadow-accent-blue/10' 
                    : 'border-border hover:border-accent-blue/50'
                } bg-background/80 backdrop-blur-sm`}
              />
              {isLoading && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin h-5 w-5 border-2 border-accent-blue border-t-transparent rounded-full"></div>
                </div>
              )}
            </div>
          </div>

          {/* Results Count */}
          {resultsCount > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Package className="w-4 h-4" />
              <span>
                {resultsCount.toLocaleString()} paquete{resultsCount !== 1 ? 's' : ''} encontrado{resultsCount !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* Quick Action Chips */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-muted-foreground">Acceso rápido:</h3>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {quickActions.map((action) => {
            const IconComponent = action.icon
            return (
              <Button
                key={action.id}
                variant="ghost"
                size="sm"
                onClick={() => handleQuickAction(action)}
                className={`${action.color} rounded-full px-3 sm:px-4 py-2 h-auto font-medium transition-all duration-200 hover:scale-105 hover:shadow-md text-xs sm:text-sm whitespace-nowrap`}
              >
                <IconComponent className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                <span className="block">{action.label}</span>
              </Button>
            )
          })}
        </div>
      </div>

      {/* Search Suggestions (when focused and has value) */}
      {searchFocused && searchValue.length > 2 && (
        <Card className="border border-accent-blue/20 shadow-lg">
          <div className="p-4 space-y-2">
            <div className="text-sm font-medium text-muted-foreground mb-2">Sugerencias:</div>
            <div className="space-y-1">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start h-auto py-2 px-3 text-left font-normal hover:bg-accent-blue/10"
                onClick={() => onSearchChange(searchValue.toUpperCase())}
              >
                <Search className="w-4 h-4 mr-2 text-muted-foreground" />
                Buscar &quot;{searchValue.toUpperCase()}&quot; como tracking
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start h-auto py-2 px-3 text-left font-normal hover:bg-accent-blue/10"
                onClick={() => {
                  onSearchChange("")
                  onQuickFilter("cliente", searchValue)
                }}
              >
                <Package className="w-4 h-4 mr-2 text-muted-foreground" />
                Buscar &quot;{searchValue}&quot; como cliente
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
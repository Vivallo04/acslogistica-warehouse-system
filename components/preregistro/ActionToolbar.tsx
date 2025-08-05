"use client"

import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Card } from "@/components/ui/card"
import { 
  Search, 
  Package, 
  Printer, 
  BarChart3, 
  Settings, 
  Zap
} from "lucide-react"

interface ActionToolbarProps {
  onScanToggle: () => void
  onBatchMode: () => void
  onPrintLabels: () => void
  onReports: () => void
  onSettings: () => void
  autoSync: boolean
  onAutoSyncToggle: (enabled: boolean) => void
}

export function ActionToolbar({
  onScanToggle,
  onBatchMode,
  onPrintLabels,
  onReports,
  onSettings,
  autoSync,
  onAutoSyncToggle
}: ActionToolbarProps) {
  return (
    <Card className="p-3 sm:p-4 bg-card/50 backdrop-blur-sm border-border/50">
      <div className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
        {/* Action buttons - Mobile: 2x3 grid, Desktop: horizontal */}
        <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 sm:gap-3">
          <Button
            onClick={onScanToggle}
            className="bg-accent-blue hover:bg-accent-blue/90 text-white rounded-full px-3 sm:px-4 py-2 h-11 sm:h-auto font-medium transition-all duration-200 hover:scale-105 hover:shadow-md text-sm justify-center"
          >
            <Search className="w-4 h-4 sm:mr-2" />
            <span className="hidden xs:inline sm:hidden ml-2">Escaneo</span>
            <span className="hidden sm:inline ml-2">Escaneo Rápido</span>
            <kbd className="hidden lg:inline ml-2 px-1.5 py-0.5 text-xs bg-white/20 rounded">F2</kbd>
          </Button>
          
          <Button
            variant="outline"
            onClick={onBatchMode}
            className="rounded-full border-2 hover:border-accent-blue/50 transition-all duration-200 text-sm h-11 sm:h-auto justify-center"
          >
            <Package className="w-4 h-4 sm:mr-2" />
            <span className="hidden xs:inline ml-2">Lote</span>
            <kbd className="hidden lg:inline ml-2 px-1.5 py-0.5 text-xs bg-muted rounded">F3</kbd>
          </Button>
          
          <Button
            variant="outline"
            onClick={onPrintLabels}
            className="rounded-full border-2 hover:border-accent-blue/50 transition-all duration-200 text-sm h-11 sm:h-auto justify-center"
          >
            <Printer className="w-4 h-4 sm:mr-2" />
            <span className="hidden xs:inline sm:hidden ml-2">Imprimir</span>
            <span className="hidden sm:inline ml-2">Imprimir Etiquetas</span>
            <kbd className="hidden lg:inline ml-2 px-1.5 py-0.5 text-xs bg-muted rounded">F4</kbd>
          </Button>
          
          <Button
            variant="outline"
            onClick={onReports}
            className="rounded-full border-2 hover:border-accent-blue/50 transition-all duration-200 text-sm h-11 sm:h-auto justify-center"
          >
            <BarChart3 className="w-4 h-4 sm:mr-2" />
            <span className="hidden xs:inline ml-2">Reportes</span>
            <kbd className="hidden lg:inline ml-2 px-1.5 py-0.5 text-xs bg-muted rounded">F5</kbd>
          </Button>
          
          <Button
            variant="outline"
            onClick={onSettings}
            className="col-span-2 sm:col-span-1 rounded-full border-2 hover:border-accent-blue/50 transition-all duration-200 text-sm h-11 sm:h-auto justify-center"
          >
            <Settings className="w-4 h-4 sm:mr-2" />
            <span className="hidden xs:inline sm:hidden ml-2">Config</span>
            <span className="hidden sm:inline ml-2">Configuración</span>
          </Button>
        </div>

        {/* Auto sync toggle - Mobile: full width, Desktop: right side */}
        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Zap className="w-4 h-4" />
            <span className="text-xs sm:text-sm">Sincronización automática</span>
          </div>
          <Switch
            checked={autoSync}
            onCheckedChange={onAutoSyncToggle}
            className="data-[state=checked]:bg-accent-blue"
          />
        </div>
      </div>
    </Card>
  )
}
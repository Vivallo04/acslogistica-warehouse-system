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
    <Card className="p-4 bg-card/50 backdrop-blur-sm border-border/50">
      <div className="flex items-center justify-between">
        {/* Left side - Action buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            onClick={onScanToggle}
            className="bg-accent-blue hover:bg-accent-blue/90 text-white rounded-full px-4 py-2 h-auto font-medium transition-all duration-200 hover:scale-105 hover:shadow-md text-sm"
          >
            <Search className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Escaneo Rápido</span>
            <span className="sm:hidden">Escaneo</span>
            <kbd className="ml-2 px-1.5 py-0.5 text-xs bg-white/20 rounded">F2</kbd>
          </Button>
          
          <Button
            variant="outline"
            onClick={onBatchMode}
            className="rounded-full border-2 hover:border-accent-blue/50 transition-all duration-200 text-sm"
          >
            <Package className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Modo Lote</span>
            <span className="sm:hidden">Lote</span>
            <kbd className="ml-2 px-1.5 py-0.5 text-xs bg-muted rounded">F3</kbd>
          </Button>
          
          <Button
            variant="outline"
            onClick={onPrintLabels}
            className="rounded-full border-2 hover:border-accent-blue/50 transition-all duration-200 text-sm"
          >
            <Printer className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Imprimir Etiquetas</span>
            <span className="sm:hidden">Imprimir</span>
            <kbd className="ml-2 px-1.5 py-0.5 text-xs bg-muted rounded">F4</kbd>
          </Button>
          
          <Button
            variant="outline"
            onClick={onReports}
            className="rounded-full border-2 hover:border-accent-blue/50 transition-all duration-200 text-sm"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Reportes</span>
            <span className="sm:hidden">Reportes</span>
            <kbd className="ml-2 px-1.5 py-0.5 text-xs bg-muted rounded">F5</kbd>
          </Button>
          
          <Button
            variant="outline"
            onClick={onSettings}
            className="rounded-full border-2 hover:border-accent-blue/50 transition-all duration-200 text-sm"
          >
            <Settings className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Configuración</span>
            <span className="sm:hidden">Config</span>
          </Button>
        </div>

        {/* Right side - Auto sync toggle */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Zap className="w-4 h-4" />
            <span className="hidden sm:inline">Sincronización automática:</span>
            <span className="sm:hidden">Sync:</span>
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
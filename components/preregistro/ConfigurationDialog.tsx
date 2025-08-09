"use client"

import { useState } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, Printer, Bell, Shield } from "lucide-react"
import { PrinterConfigurationSection } from "./PrinterConfigurationSection"

interface ConfigurationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ConfigurationDialog({
  open,
  onOpenChange
}: ConfigurationDialogProps) {
  const [selectedPrinter, setSelectedPrinter] = useState<any>(null)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configuración del Sistema
          </DialogTitle>
          <DialogDescription>
            Configure las opciones del sistema, impresoras y preferencias de la aplicación
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="printers" className="flex-1 min-h-0 flex flex-col">
          <TabsList className="grid w-full grid-cols-4 flex-shrink-0 rounded-full">
            <TabsTrigger value="printers" className="gap-2 rounded-full">
              <Printer className="w-4 h-4" />
              Impresoras
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2 rounded-full">
              <Bell className="w-4 h-4" />
              Notificaciones
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2 rounded-full">
              <Shield className="w-4 h-4" />
              Seguridad
            </TabsTrigger>
            <TabsTrigger value="general" className="gap-2 rounded-full">
              <Settings className="w-4 h-4" />
              General
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 min-h-0 mt-6">
            <TabsContent value="printers" className="h-full m-0">
              <PrinterManagementContent
                onPrinterSelected={setSelectedPrinter}
              />
            </TabsContent>

            <TabsContent value="notifications" className="h-full m-0">
              <div className="p-6 text-center text-muted-foreground">
                <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Configuración de Notificaciones</h3>
                <p>Esta sección estará disponible en una futura actualización</p>
              </div>
            </TabsContent>

            <TabsContent value="security" className="h-full m-0">
              <div className="p-6 text-center text-muted-foreground">
                <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Configuración de Seguridad</h3>
                <p>Esta sección estará disponible en una futura actualización</p>
              </div>
            </TabsContent>

            <TabsContent value="general" className="h-full m-0">
              <div className="p-6 text-center text-muted-foreground">
                <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Configuración General</h3>
                <p>Esta sección estará disponible en una futura actualización</p>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

// Separate component for printer management content
function PrinterManagementContent({ 
  onPrinterSelected 
}: { 
  onPrinterSelected: (printer: any) => void 
}) {
  return (
    <PrinterConfigurationSection
      onPrinterSelected={onPrinterSelected}
    />
  )
}
"use client"

import { useState } from "react"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Package } from "lucide-react"

interface PreRegistroForm {
  numeroTracking: string
  numeroCasillero: string
  contenido: string
  peso: string
  numeroTarima: string
}

export default function PreRegistroPage() {
  return (
    <ProtectedRoute>
      <PreRegistroContent />
    </ProtectedRoute>
  )
}

function PreRegistroContent() {
  const [formData, setFormData] = useState<PreRegistroForm>({
    numeroTracking: "",
    numeroCasillero: "",
    contenido: "",
    peso: "",
    numeroTarima: ""
  })

  const handleInputChange = (field: keyof PreRegistroForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement form submission logic
    console.log("Form submitted:", formData)
  }

  const resetForm = () => {
    setFormData({
      numeroTracking: "",
      numeroCasillero: "",
      contenido: "",
      peso: "",
      numeroTarima: ""
    })
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-accent-blue flex items-center gap-3">
          <Package className="w-8 h-8" />
          Pre Registro de Paquetes
        </h1>
        <p className="text-muted-foreground">
          Registra la información básica de los paquetes antes de su procesamiento completo
        </p>
      </div>

      {/* Main Form Card */}
      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle>Información del Paquete</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Número de Tracking - Required */}
            <div className="space-y-2">
              <Label htmlFor="numeroTracking" className="text-sm font-medium">
                Número de Tracking <span className="text-red-500">*</span>
              </Label>
              <Input
                id="numeroTracking"
                type="text"
                value={formData.numeroTracking}
                onChange={(e) => handleInputChange("numeroTracking", e.target.value)}
                placeholder="Ingresa el número de tracking"
                required
                className="w-full"
              />
            </div>

            {/* Número de Casillero / Cliente Asignado */}
            <div className="space-y-2">
              <Label htmlFor="numeroCasillero" className="text-sm font-medium">
                Número de Casillero / Cliente Asignado
              </Label>
              <Select 
                value={formData.numeroCasillero} 
                onValueChange={(value) => handleInputChange("numeroCasillero", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona un casillero o cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="casillero-001">Casillero 001</SelectItem>
                  <SelectItem value="casillero-002">Casillero 002</SelectItem>
                  <SelectItem value="casillero-003">Casillero 003</SelectItem>
                  <SelectItem value="cliente-premium">Cliente Premium</SelectItem>
                  <SelectItem value="cliente-corporativo">Cliente Corporativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Contenido */}
            <div className="space-y-2">
              <Label htmlFor="contenido" className="text-sm font-medium">
                Contenido
              </Label>
              <Textarea
                id="contenido"
                value={formData.contenido}
                onChange={(e) => handleInputChange("contenido", e.target.value)}
                placeholder="Describe el contenido del paquete"
                className="w-full min-h-[100px]"
              />
            </div>

            {/* Peso */}
            <div className="space-y-2">
              <Label htmlFor="peso" className="text-sm font-medium">
                Peso
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="peso"
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.peso}
                  onChange={(e) => handleInputChange("peso", e.target.value)}
                  placeholder="2.5"
                  className="w-full"
                />
                <span className="text-sm text-muted-foreground">kg</span>
              </div>
            </div>

            {/* Número de Tarima - Required */}
            <div className="space-y-2">
              <Label htmlFor="numeroTarima" className="text-sm font-medium">
                Número de Tarima <span className="text-red-500">*</span>
              </Label>
              <Select 
                value={formData.numeroTarima} 
                onValueChange={(value) => handleInputChange("numeroTarima", value)}
                required
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="- Seleccione una tarima -" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tarima-001">Tarima 001</SelectItem>
                  <SelectItem value="tarima-002">Tarima 002</SelectItem>
                  <SelectItem value="tarima-003">Tarima 003</SelectItem>
                  <SelectItem value="tarima-004">Tarima 004</SelectItem>
                  <SelectItem value="tarima-005">Tarima 005</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6">
              <Button 
                type="submit" 
                className="bg-accent-blue hover:bg-accent-blue/90 text-white px-8"
              >
                Procesar
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={resetForm}
                className="px-8"
              >
                Limpiar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
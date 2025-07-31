"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Bug, Loader2, AlertCircle, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

interface ReportIssueDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const issueTypes = [
  { value: "bug", label: "Error", icon: Bug, color: "text-red-500" },
  { value: "crash", label: "Fallo/Error", icon: AlertTriangle, color: "text-orange-500" },
  { value: "performance", label: "Problema de Rendimiento", icon: Zap, color: "text-yellow-500" },
  { value: "ui_issue", label: "Problema de Interfaz", icon: AlertCircle, color: "text-blue-500" },
]

const priorityLevels = [
  { value: "low", label: "Baja", color: "bg-green-100 text-green-800" },
  { value: "medium", label: "Media", color: "bg-yellow-100 text-yellow-800" },
  { value: "high", label: "Alta", color: "bg-orange-100 text-orange-800" },
  { value: "critical", label: "Crítica", color: "bg-red-100 text-red-800" },
]

export function ReportIssueDialog({ open, onOpenChange }: ReportIssueDialogProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [issueType, setIssueType] = useState("")
  const [priority, setPriority] = useState("medium")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [stepsToReproduce, setStepsToReproduce] = useState("")
  const [expectedBehavior, setExpectedBehavior] = useState("")
  const [actualBehavior, setActualBehavior] = useState("")
  const [email, setEmail] = useState(user?.email || "")
  const [includeScreenshot, setIncludeScreenshot] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!issueType || !title || !description) {
      toast({
        title: "Información Faltante",
        description: "Por favor completa todos los campos requeridos.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Capture detailed environment info for debugging
      const environmentInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
        url: window.location.href,
        referrer: document.referrer,
        timestamp: new Date().toISOString(),
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        windowSize: `${window.innerWidth}x${window.innerHeight}`,
        colorDepth: window.screen.colorDepth,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }

      const issueData = {
        type: issueType,
        priority,
        title,
        description,
        stepsToReproduce,
        expectedBehavior,
        actualBehavior,
        email,
        userRole: user?.email || 'anonymous',
        includeScreenshot,
        environment: environmentInfo,
      }

      const response = await fetch('/api/issues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(issueData),
      })

      if (!response.ok) {
        throw new Error('Failed to submit issue report')
      }

      const result = await response.json()

      toast({
        title: "¡Incidencia Reportada!",
        description: `Incidencia #${result.issueId || 'desconocida'} ha sido creada. La investigaremos pronto.`,
      })

      // Reset form
      setIssueType("")
      setPriority("medium")
      setTitle("")
      setDescription("")
      setStepsToReproduce("")
      setExpectedBehavior("")
      setActualBehavior("")
      setIncludeScreenshot(false)
      onOpenChange(false)

    } catch (error) {
      console.error('Error submitting issue:', error)
      toast({
        title: "Error",
        description: "No se pudo enviar el reporte de incidencia. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedIssueType = issueTypes.find(type => type.value === issueType)
  const selectedPriority = priorityLevels.find(p => p.value === priority)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bug className="w-5 h-5 text-red-500" />
            Reportar Incidencia
          </DialogTitle>
          <DialogDescription>
            Reporta errores, fallos o problemas técnicos que experimentes con el WareHouse.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Issue Type */}
          <div className="space-y-2">
            <Label htmlFor="issue-type">Tipo de Incidencia *</Label>
            <Select value={issueType} onValueChange={setIssueType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el tipo de incidencia">
                  {selectedIssueType && (
                    <div className="flex items-center gap-2">
                      <selectedIssueType.icon className={cn("w-4 h-4", selectedIssueType.color)} />
                      {selectedIssueType.label}
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {issueTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <type.icon className={cn("w-4 h-4", type.color)} />
                      {type.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="priority">Nivel de Prioridad</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue>
                  {selectedPriority && (
                    <Badge className={selectedPriority.color}>
                      {selectedPriority.label}
                    </Badge>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {priorityLevels.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    <Badge className={level.color}>
                      {level.label}
                    </Badge>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Título de la Incidencia *</Label>
            <Input
              id="title"
              placeholder="Resumen breve de la incidencia"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descripción *</Label>
            <Textarea
              id="description"
              placeholder="Descripción detallada de la incidencia..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Steps to Reproduce */}
          <div className="space-y-2">
            <Label htmlFor="steps">Pasos para Reproducir (opcional)</Label>
            <Textarea
              id="steps"
              placeholder="1. Ve a...&#10;2. Haz clic en...&#10;3. Ve el error..."
              value={stepsToReproduce}
              onChange={(e) => setStepsToReproduce(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Expected Behavior */}
            <div className="space-y-2">
              <Label htmlFor="expected">Comportamiento Esperado</Label>
              <Textarea
                id="expected"
                placeholder="Lo que debería pasar..."
                value={expectedBehavior}
                onChange={(e) => setExpectedBehavior(e.target.value)}
                rows={2}
              />
            </div>

            {/* Actual Behavior */}
            <div className="space-y-2">
              <Label htmlFor="actual">Comportamiento Real</Label>
              <Textarea
                id="actual"
                placeholder="Lo que realmente pasa..."
                value={actualBehavior}
                onChange={(e) => setActualBehavior(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Correo de Contacto</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Screenshot Option */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="screenshot"
              checked={includeScreenshot}
              onCheckedChange={(checked) => setIncludeScreenshot(checked === true)}
            />
            <Label htmlFor="screenshot" className="text-sm">
              Incluir información del entorno para depuración
            </Label>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !issueType || !title || !description}
            className="bg-red-600 hover:bg-red-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Bug className="w-4 h-4 mr-2" />
                Reportar Incidencia
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
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
import { Star, Send, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface FeedbackDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const feedbackTypes = [
  { value: "feature_request", label: "Solicitud de Función" },
  { value: "general_feedback", label: "Comentarios Generales" },
  { value: "user_experience", label: "Experiencia de Usuario" },
  { value: "performance", label: "Rendimiento" },
  { value: "other", label: "Otro" },
]

export function FeedbackDialog({ open, onOpenChange }: FeedbackDialogProps) {
  const { user, userRole } = useAuth()
  const { toast } = useToast()
  
  const [feedbackType, setFeedbackType] = useState("")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [rating, setRating] = useState(0)
  const [email, setEmail] = useState(user?.email || "")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    
    if (!feedbackType || !subject || !message) {
      toast({
        title: "Información Faltante",
        description: "Por favor completa todos los campos requeridos.",
        variant: "destructive",
      })
      return
    }
    
    if (email && !emailRegex.test(email)) {
      toast({
        title: "Email Inválido",
        description: "Por favor ingresa un email válido.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Get environment info for context
      const environmentInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        url: window.location.href,
        timestamp: new Date().toISOString(),
      }

      const feedbackData = {
        type: feedbackType,
        subject,
        message,
        rating,
        email,
        userRole: userRole?.role || 'anonymous',
        environment: environmentInfo,
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout
      
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedbackData),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to submit feedback')
      }

      toast({
        title: "¡Comentarios Enviados!",
        description: "Gracias por tus comentarios. Los revisaremos pronto.",
      })

      // Reset form
      setFeedbackType("")
      setSubject("")
      setMessage("")
      setRating(0)
      onOpenChange(false)

    } catch (error) {
      console.error('Error submitting feedback:', error)
      
      let errorMessage = "No se pudo enviar el comentario. Inténtalo de nuevo."
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = "El envío tardó demasiado tiempo. Verifica tu conexión e inténtalo de nuevo."
        } else if (error.message) {
          errorMessage = error.message
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStarRating = () => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            className={cn(
              "p-1 rounded-sm transition-colors hover:bg-muted",
              star <= rating ? "text-yellow-400" : "text-muted-foreground"
            )}
          >
            <Star className="w-5 h-5 fill-current" />
          </button>
        ))}
        <span className="ml-2 text-sm text-muted-foreground">
          {rating > 0 ? `${rating}/5` : "Califica tu experiencia"}
        </span>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            Enviar Comentarios
          </DialogTitle>
          <DialogDescription>
            Ayúdanos a mejorar el WareHouse ACS Logística compartiendo tus comentarios y sugerencias.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Feedback Type */}
          <div className="space-y-2">
            <Label htmlFor="feedback-type">Tipo de Comentario *</Label>
            <Select value={feedbackType} onValueChange={setFeedbackType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el tipo de comentario" />
              </SelectTrigger>
              <SelectContent>
                {feedbackTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Asunto *</Label>
            <Input
              id="subject"
              placeholder="Descripción breve de tu comentario"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Mensaje *</Label>
            <Textarea
              id="message"
              placeholder="Por favor proporciona comentarios detallados..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </div>

          {/* Rating */}
          <div className="space-y-2">
            <Label>Calificación General (opcional)</Label>
            {renderStarRating()}
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
            <p className="text-xs text-muted-foreground">
              Lo usaremos para seguimiento si es necesario
            </p>
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
            disabled={isSubmitting || !feedbackType || !subject || !message}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Enviar Comentarios
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
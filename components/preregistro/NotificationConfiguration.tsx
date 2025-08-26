"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Bell, MessageCircle, Mail, Smartphone, CheckCircle2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"

export interface NotificationSettings {
  whatsappEnabled: boolean
  whatsappOnSuccess: boolean
  whatsappOnError: boolean
  emailEnabled: boolean
  emailOnBatchComplete: boolean
  pushEnabled: boolean
  soundEnabled: boolean
}

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  whatsappEnabled: false,
  whatsappOnSuccess: false,
  whatsappOnError: false,
  emailEnabled: false,
  emailOnBatchComplete: false,
  pushEnabled: true,
  soundEnabled: true
}

const STORAGE_KEY = 'wms-notification-settings'

interface NotificationConfigurationProps {
  onSettingsChange?: (settings: NotificationSettings) => void
}

export function NotificationConfiguration({ onSettingsChange }: NotificationConfigurationProps) {
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS)
  const [hasChanges, setHasChanges] = useState(false)

  // Load settings from localStorage on mount
  useEffect(() => {
    const loadSettings = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          const parsedSettings = JSON.parse(stored)
          setSettings({ ...DEFAULT_NOTIFICATION_SETTINGS, ...parsedSettings })
        }
      } catch (error) {
        console.error('Error loading notification settings:', error)
      }
    }
    loadSettings()
  }, [])

  // Save settings to localStorage and notify parent
  const saveSettings = (newSettings: NotificationSettings) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings))
      onSettingsChange?.(newSettings)
      setHasChanges(false)
      
      toast({
        title: "Configuración guardada",
        description: "Las preferencias de notificación han sido actualizadas",
        duration: 2000
      })
    } catch (error) {
      console.error('Error saving notification settings:', error)
      toast({
        variant: "destructive",
        title: "Error al guardar",
        description: "No se pudieron guardar las preferencias de notificación"
      })
    }
  }

  const handleToggle = (key: keyof NotificationSettings) => {
    const newSettings = { ...settings, [key]: !settings[key] }
    setSettings(newSettings)
    setHasChanges(true)
    
    // Auto-save after a short delay
    setTimeout(() => saveSettings(newSettings), 500)
  }

  return (
    <div className="space-y-6">
      {/* WhatsApp Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageCircle className="w-5 h-5 text-green-600" />
            Notificaciones WhatsApp
          </CardTitle>
          <CardDescription>
            Enviar notificaciones instantáneas en WhatsApp cuando se procesen paquetes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="whatsapp-enabled" className="text-base font-medium">
                Habilitar WhatsApp
              </Label>
              <p className="text-sm text-muted-foreground">
                Activar notificacionespor WhatsApp para los clientes al procesar paquetes
              </p>
            </div>
            <Switch
              id="whatsapp-enabled"
              checked={settings.whatsappEnabled}
              onCheckedChange={() => handleToggle('whatsappEnabled')}
              className="data-[state=checked]:bg-green-600"
              disabled={true}
            />
          </div>

          {settings.whatsappEnabled && (
            <div className="ml-6 space-y-4 border-l-2 border-muted pl-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="whatsapp-success" className="text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    Paquetes recibidos
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Notificar a los clientes que ya recibimos su paquete
                  </p>
                </div>
                <Switch
                  id="whatsapp-success"
                  checked={settings.whatsappOnSuccess}
                  onCheckedChange={() => handleToggle('whatsappOnSuccess')}
                  disabled={!settings.whatsappEnabled}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status indicator */}
      {hasChanges && (
        <div className="text-sm text-muted-foreground text-center">
          Guardando cambios...
        </div>
      )}
    </div>
  )
}

// Export function to get current settings
export function getNotificationSettings(): NotificationSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(stored) }
    }
  } catch (error) {
    console.error('Error loading notification settings:', error)
  }
  return DEFAULT_NOTIFICATION_SETTINGS
}
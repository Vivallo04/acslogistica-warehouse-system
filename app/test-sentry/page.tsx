"use client"

import * as Sentry from "@sentry/nextjs"
import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Bug, Zap, Database, Shield } from "lucide-react"

class WMSTestError extends Error {
  constructor(message: string | undefined) {
    super(message)
    this.name = "WMSTestError"
  }
}

export default function TestSentryPage() {
  return (
    <ProtectedRoute>
      <TestSentryContent />
    </ProtectedRoute>
  )
}

function TestSentryContent() {
  const [hasSentError, setHasSentError] = useState(false)
  const [isConnected, setIsConnected] = useState(true)
  
  useEffect(() => {
    async function checkConnectivity() {
      const result = await Sentry.diagnoseSdkConnectivity()
      setIsConnected(result !== 'sentry-unreachable')
    }
    checkConnectivity()
  }, [])

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-accent-blue flex items-center gap-3">
          <Shield className="w-8 h-8" />
          Test Sentry - WMS
        </h1>
        <p className="text-muted-foreground">
          Prueba la integración de Sentry con errores simulados del sistema WMS
        </p>
      </div>

      {/* Connectivity Status */}
      {!isConnected && (
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg dark:bg-orange-950/20 dark:border-orange-800/30">
          <p className="text-sm text-orange-700 dark:text-orange-300">
            ⚠️ Parece que las solicitudes a Sentry están siendo bloqueadas. Desactiva tu ad-blocker para completar la prueba.
          </p>
        </div>
      )}

      {/* Test Buttons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Frontend Error */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bug className="w-5 h-5" />
              Error Frontend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Simula un error en el cliente (componente React)
            </p>
            <Button
              onClick={async () => {
                await Sentry.startSpan({
                  name: 'WMS Frontend Error Test',
                  op: 'test'
                }, async () => {
                  setHasSentError(true)
                  throw new WMSTestError("Error simulado en el frontend del WMS - Componente de paquetes falló")
                })
              }}
              disabled={!isConnected}
              variant="destructive"
              className="w-full"
            >
              Lanzar Error Frontend
            </Button>
          </CardContent>
        </Card>

        {/* Backend Error */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Error Backend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Simula un error en el servidor (API route)
            </p>
            <Button
              onClick={async () => {
                await Sentry.startSpan({
                  name: 'WMS Backend Error Test',
                  op: 'test'
                }, async () => {
                  const res = await fetch("/api/sentry-example-api")
                  if (!res.ok) {
                    setHasSentError(true)
                  }
                })
              }}
              disabled={!isConnected}
              variant="destructive"
              className="w-full"
            >
              Lanzar Error Backend
            </Button>
          </CardContent>
        </Card>

        {/* Package Processing Error */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Error Procesamiento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Simula error durante procesamiento de paquetes
            </p>
            <Button
              onClick={async () => {
                await Sentry.startSpan({
                  name: 'Package Processing Error',
                  op: 'wms.process'
                }, async () => {
                  Sentry.setTag('wms.operation', 'package-processing')
                  Sentry.setContext('package', {
                    tracking: 'TEST123456789',
                    tarima: '310725-1',
                    cliente: 'TEST_USER'
                  })
                  setHasSentError(true)
                  throw new WMSTestError("Error procesando paquete TEST123456789 - Falló validación de tracking")
                })
              }}
              disabled={!isConnected}
              variant="destructive"
              className="w-full"
            >
              Error Procesamiento
            </Button>
          </CardContent>
        </Card>

        {/* Database Error */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Error Base de Datos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Simula error de conexión con MySQL
            </p>
            <Button
              onClick={async () => {
                await Sentry.startSpan({
                  name: 'Database Connection Error',
                  op: 'db.mysql'
                }, async () => {
                  Sentry.setTag('db.operation', 'package-fetch')
                  Sentry.setContext('database', {
                    type: 'mysql',
                    operation: 'connection_test',
                    environment: 'test'
                  })
                  setHasSentError(true)
                  throw new WMSTestError("Error conectando a MySQL - Conexión rechazada en puerto 3306")
                })
              }}
              disabled={!isConnected}
              variant="destructive"
              className="w-full"
            >
              Error Base de Datos
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Status Message */}
      {hasSentError ? (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg dark:bg-green-950/20 dark:border-green-800/30">
          <p className="text-green-800 dark:text-green-400 font-medium">
            ✅ Error enviado a Sentry correctamente. Revisa el dashboard de Sentry para ver los detalles.
          </p>
        </div>
      ) : (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-950/20 dark:border-blue-800/30">
          <p className="text-blue-800 dark:text-blue-400">
            💡 Haz clic en cualquier botón para enviar un error de prueba a Sentry
          </p>
        </div>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Instrucciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h4 className="font-medium">1. Prueba los errores</h4>
            <p className="text-sm text-muted-foreground">
              Haz clic en los botones para enviar diferentes tipos de errores a Sentry
            </p>
          </div>
          <div>
            <h4 className="font-medium">2. Revisa Sentry</h4>
            <p className="text-sm text-muted-foreground">
              Ve al dashboard de Sentry para ver los errores capturados con contexto del WMS
            </p>
          </div>
          <div>
            <h4 className="font-medium">3. Analiza el contexto</h4>
            <p className="text-sm text-muted-foreground">
              Cada error incluye tags y contexto específico del sistema WMS
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
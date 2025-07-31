"use client"

import React from "react"
import * as Sentry from "@sentry/nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw } from "lucide-react"

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

class WMSErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20 m-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800 dark:text-red-400">
              <AlertCircle className="w-5 h-5" />
              Error en el Sistema WMS
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-red-700 dark:text-red-300">
              <p>Ha ocurrido un error inesperado en el sistema.</p>
              <p className="text-sm mt-2 opacity-80">
                El error ha sido reportado automáticamente a nuestro equipo técnico.
              </p>
            </div>
            <Button
              onClick={() => {
                this.setState({ hasError: false })
                window.location.reload()
              }}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Recargar Página
            </Button>
          </CardContent>
        </Card>
      )
    }

    return this.props.children
  }
}

export { WMSErrorBoundary }
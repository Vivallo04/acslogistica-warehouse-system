"use client"

import type React from "react"

import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { DotsLoader } from "@/components/ui/loading"
import { AlertCircle, Clock } from "lucide-react"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredPermission?: string
}

export function ProtectedRoute({
  children,
  requiredPermission,
}: ProtectedRouteProps) {
  const { user, userRole, isLoading, hasPermission } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/login")
        return
      }

      if (!userRole) {
        return
      }

      if (!userRole.approved) {
        router.push("/pending-approval")
        return
      }

      if (requiredPermission && !hasPermission(requiredPermission)) {
        router.push("/unauthorized")
        return
      }
    }
  }, [user, userRole, isLoading, router, requiredPermission, hasPermission])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-blue-600">
          <DotsLoader size="lg" />
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export function PendingApprovalPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardContent className="p-6 text-center">
          <Clock className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-card-foreground mb-2">Cuenta Pendiente de Aprobación</h1>
          <p className="text-muted-foreground mb-4">
            Tu cuenta ha sido creada exitosamente. Un administrador debe aprobar tu acceso antes de que puedas usar el
            sistema.
          </p>
          <p className="text-sm text-muted-foreground">Recibirás un email cuando tu cuenta sea aprobada.</p>
        </CardContent>
      </Card>
    </div>
  )
}

export function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardContent className="p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-card-foreground mb-2">Acceso No Autorizado</h1>
          <p className="text-muted-foreground mb-4">No tienes permisos para acceder a esta sección del sistema.</p>
          <p className="text-sm text-muted-foreground">Contacta al administrador si crees que esto es un error.</p>
        </CardContent>
      </Card>
    </div>
  )
}

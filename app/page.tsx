"use client"

import { ProtectedRoute } from "@/components/ProtectedRoute"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, User, Shield, Clock } from "lucide-react"

export default function HomePage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}

function DashboardContent() {
  const { user, userRole } = useAuth()

  const getWelcomeMessage = () => {
    const currentHour = new Date().getHours()
    const userName = user?.email?.split('@')[0] || 'Usuario'
    
    if (currentHour < 12) {
      return `¡Buenos días, ${userName}!`
    } else if (currentHour < 18) {
      return `¡Buenas tardes, ${userName}!`
    } else {
      return `¡Buenas noches, ${userName}!`
    }
  }

  const getRoleBadge = (role: string) => {
    const roleColors = {
      super_admin: "bg-destructive/10 text-destructive dark:bg-destructive/20",
      manager: "bg-accent-blue/10 text-accent-blue dark:bg-accent-blue/20",
      pending: "bg-muted text-muted-foreground",
    }

    const roleNames = {
      super_admin: "Super Administrador",
      manager: "Gerente",
      pending: "Pendiente",
    }

    return (
      <Badge className={roleColors[role as keyof typeof roleColors] || "bg-muted text-muted-foreground"}>
        {roleNames[role as keyof typeof roleNames] || role}
      </Badge>
    )
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-card-foreground">
          {getWelcomeMessage()}
        </h1>
        <p className="text-muted-foreground flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Hoy es {formatDate(new Date())}
        </p>
      </div>

      {/* User Info Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuario Actual</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{user?.email}</div>
            <p className="text-xs text-muted-foreground">
              {user?.emailVerified ? "Correo verificado" : "Correo sin verificar"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rol de Usuario</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {userRole && getRoleBadge(userRole.role)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {userRole?.approved ? "Cuenta aprobada" : "Pendiente de aprobación"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Último Acceso</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {new Date().toLocaleTimeString('es-ES', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
            <p className="text-xs text-muted-foreground">Hora actual</p>
          </CardContent>
        </Card>
      </div>

      {/* Welcome Message Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-accent-blue" />
            Bienvenido al WareHouse
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Te damos la bienvenida al WareHouse de ACS Logística. Desde aquí podrás gestionar 
            todas las operaciones y configuraciones del sistema.
          </p>
          
          {userRole?.role === 'super_admin' && (
            <div className="p-4 bg-accent-blue/5 border border-accent-blue/20 rounded-lg">
              <p className="text-sm text-accent-blue font-medium">
                👑 Como Super Administrador, tienes acceso completo a todas las funcionalidades del sistema.
              </p>
            </div>
          )}
          
          {userRole?.role === 'manager' && (
            <div className="p-4 bg-accent-blue/5 border border-accent-blue/20 rounded-lg">
              <p className="text-sm text-accent-blue font-medium">
                🎯 Como Gerente, puedes supervisar las operaciones y acceder a las herramientas de gestión.
              </p>
            </div>
          )}

          {userRole?.role === 'pending' && (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg dark:bg-orange-950/20 dark:border-orange-800/30">
              <p className="text-sm text-orange-700 dark:text-orange-300 font-medium">
                ⏳ Tu cuenta está pendiente de aprobación. Un administrador revisará tu solicitud pronto.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

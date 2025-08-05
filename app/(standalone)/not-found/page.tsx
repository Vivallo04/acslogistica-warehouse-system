"use client"

import Image from "next/image"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DotsLoader } from "@/components/ui/loading"
import { FileQuestion, Home, ArrowLeft } from "lucide-react"

export default function NotFound() {
  const { user, isLoading } = useAuth()

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-blue-600">
          <DotsLoader size="lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo and Header */}
        <div className="text-center">
          <div className="w-24 h-24 flex items-center justify-center mx-auto mb-4">
            <Image
              src="/acs-control-center-logo.svg"
              alt="ACS Logística Logo"
              width={96}
              height={96}
              className="w-full h-full object-contain"
              priority
            />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Warehouse Management System</h2>
          <p className="mt-1 text-sm text-muted-foreground">ACS Logística</p>
        </div>

        {/* 404 Error Card */}
        <Card className="shadow-lg">
          <CardContent className="p-8 text-center">
            <FileQuestion className="w-16 h-16 text-orange-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-foreground mb-2">404</h1>
            <h2 className="text-xl font-semibold text-card-foreground mb-4">Página no encontrada</h2>
            <p className="text-muted-foreground mb-6">
              La página que estás buscando no existe o ha sido movida a otra ubicación.
            </p>
            
            {/* Action Buttons - Show different options based on auth state */}
            <div className="space-y-3">
              {user ? (
                <>
                  <Link href="/" className="w-full">
                    <Button className="w-full bg-accent-blue hover:bg-accent-blue/90 rounded-full">
                      <Home className="w-4 h-4 mr-2" />
                      Ir al Dashboard
                    </Button>
                  </Link>
                  
                  <Button 
                    variant="outline" 
                    className="w-full rounded-full"
                    onClick={() => window.history.back()}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Volver atrás
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login" className="w-full">
                    <Button className="w-full bg-accent-blue hover:bg-accent-blue/90 rounded-full">
                      <Home className="w-4 h-4 mr-2" />
                      Iniciar Sesión
                    </Button>
                  </Link>
                  
                  <Link href="/register" className="w-full">
                    <Button variant="outline" className="w-full rounded-full">
                      Solicitar Acceso
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground">
          <p>{new Date().getFullYear()} ACS Logística. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  )
}
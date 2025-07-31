"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DotsLoader } from "@/components/ui/loading"
import { Eye, EyeOff, LogIn, AlertCircle } from "lucide-react"
import { loginUser } from "@/lib/auth"
import * as Sentry from "@sentry/nextjs"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    await Sentry.startSpan({
      name: 'User Login',
      op: 'auth.login'
    }, async () => {
      try {
        await loginUser(email, password)
        // Redirect to home page after successful login
        router.push("/")
      } catch (error: any) {
        Sentry.captureException(error, {
          tags: {
            section: 'login-form',
            email: email
          }
        })
        setError(error.message || 'Error de autenticación desconocido')
      } finally {
        setIsLoading(false)
      }
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo and Header */}
        <div className="text-center">
          <div className="w-36 h-36 flex items-center justify-center mx-auto mb-2">
            <Image
              src="/acs-control-center-logo.svg"
              alt="ACS Logística Logo"
              width={96}
              height={96}
              className="w-full h-full object-contain"
              priority
            />
          </div>
          <h2 className="text-3xl font-bold text-foreground">WareHouse</h2>
          <p className="mt-2 text-sm text-muted-foreground">ACS Logística</p>
        </div>

        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Iniciar Sesión</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Login Form Error */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}


              <div className="space-y-2">
                <Label htmlFor="email">Email Corporativo</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Tu usuario de ACS Logística"
                  required
                  disabled={isLoading}
                  className="rounded-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={isLoading}
                    className="rounded-full pr-12"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent rounded-full"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full bg-accent-blue hover:bg-accent-blue/90 rounded-full" disabled={isLoading}>
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="mr-2 text-white">
                      <DotsLoader size="sm" />
                    </div>
                    Iniciando sesión...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <LogIn className="w-4 h-4 mr-2" />
                    Iniciar Sesión
                  </div>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                ¿No tienes cuenta?{" "}
                <Link href="/register" className="text-accent-blue hover:text-accent-blue/80 font-medium">
                  Solicitar Acceso
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground">
          <p>{new Date().getFullYear() } ACS Logística. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  )
}

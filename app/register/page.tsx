"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DotsLoader } from "@/components/ui/loading"
import { 
  Eye, EyeOff, UserPlus, CheckCircle, Mail, Lock, User, 
  Shield, Truck, BarChart3, MessageSquare, Smartphone, 
  ArrowRight, Check, AlertCircle 
} from "lucide-react"
import { registerUser } from "@/lib/auth"

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({})

  // Password strength calculation
  const getPasswordStrength = (password: string) => {
    let strength = 0
    if (password.length >= 8) strength += 25
    if (/[A-Z]/.test(password)) strength += 25
    if (/[a-z]/.test(password)) strength += 25
    if (/[0-9]/.test(password)) strength += 25
    return strength
  }

  const validateField = (name: string, value: string, currentFormData = formData) => {
    switch (name) {
      case "fullName":
        if (!value.trim()) return "El nombre es requerido"
        if (value.trim().length < 2) return "El nombre debe tener al menos 2 caracteres"
        break
      case "email":
        if (!value) return "El email es requerido"
        if (!/\S+@\S+\.\S+/.test(value)) return "Formato de email inválido"
        break
      case "password":
        if (!value) return "La contraseña es requerida"
        if (value.length < 6) return "Mínimo 6 caracteres"
        break
      case "confirmPassword":
        if (!value) return "Confirma tu contraseña"
        if (value !== currentFormData.password) return "Las contraseñas no coinciden"
        break
    }
    return ""
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const newFormData = { ...formData, [name]: value }
    setFormData(newFormData)
    
    // Real-time validation
    if (touchedFields[name]) {
      const error = validateField(name, value, newFormData)
      setFieldErrors(prev => ({ ...prev, [name]: error }))
    }
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setTouchedFields(prev => ({ ...prev, [name]: true }))
    const error = validateField(name, value)
    setFieldErrors(prev => ({ ...prev, [name]: error }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Validate all fields
    const errors: Record<string, string> = {}
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key as keyof typeof formData])
      if (error) errors[key] = error
    })

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setTouchedFields(Object.fromEntries(Object.keys(formData).map(key => [key, true])))
      setIsLoading(false)
      return
    }

    try {
      await registerUser(formData.email, formData.password, formData.fullName)
      setSuccess(true)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Error inesperado durante el registro')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-0 bg-card backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">¡Cuenta Creada!</h1>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Tu solicitud ha sido enviada exitosamente. Recibirás un email de confirmación y 
              notificación cuando tu cuenta sea aprobada por nuestro equipo.
            </p>
            <Link href="/login">
              <Button variant="accent" className="w-full h-12 font-medium shadow-lg transition-all duration-200 rounded-full">
                Continuar al Login
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex">
      {/* Left Panel - Branding & Value Proposition */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-2/5 bg-accent-blue p-12 flex-col justify-between text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/5 rounded-full"></div>
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-white/5 rounded-full"></div>
        
        <div className="relative z-10">
          {/* Logo & Brand */}
          <div className="flex items-center mb-12">
            <div className="w-24 h-24 flex items-center justify-center mr-4">
              <Image
                src="/acs-control-center-logo.svg"
                alt="ACS Logística Logo"
                width={48}
                height={48}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold">ACS Logística</h1>
              <p className="text-blue-100 text-sm">WareHouse</p>
            </div>
          </div>

          {/* Value Propositions */}
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold mb-6 leading-tight">
                WareHouse Unificado para ACS Logística
              </h2>
              <p className="text-xl text-blue-50 leading-relaxed">
                Gestiona campañas WhatsApp, analiza métricas en tiempo real
                y la aplicación móvil desde una plataforma centralizada.
              </p>
            </div>
          </div>
        </div>
        <div className="relative z-10 mt-12">
          <p className="text-sm text-blue-100">
            © {new Date().getFullYear()} ACS Logística. Todos los derechos reservados.
          </p>
        </div>
      </div>

      {/* Right Panel - Registration Form */}
      <div className="w-full lg:w-1/2 xl:w-3/5 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Image
                src="/acs-control-center-logo.svg"
                alt="ACS Logística Logo"
                width={64}
                height={64}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">ACS Logística</h1>
            <p className="text-gray-600">WareHouse</p>
          </div>

          {/* Header */}
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Solicitar Acceso</h2>
            <p className="text-gray-600">Crea tu cuenta para comenzar a gestionar tu operación</p>
          </div>

          {/* Form */}
          <Card className="shadow-xl border-0 bg-card backdrop-blur-sm">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Alert variant="destructive" className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-red-800">{error}</AlertDescription>
                  </Alert>
                )}

                {/* Full Name Field */}
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-medium text-card-foreground">
                    Nombre Completo
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                      <User className="h-5 w-5 text-muted-foreground/80" />
                    </div>
                    <Input
                      id="fullName"
                      name="fullName"
                      type="text"
                      value={formData.fullName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="Tu nombre completo"
                      required
                      disabled={isLoading}
                      className={`pl-11 h-12 text-base text-gray-900 block w-full rounded-full border shadow-sm focus:ring-2 focus:ring-accent-blue transition-all duration-200 ${
                        fieldErrors.fullName && touchedFields.fullName
                          ? 'border-border bg-red-50 focus:border-destructive'
                          : 'border-border focus:border-accent-blue'
                      }`}
                    />
                  </div>
                  {fieldErrors.fullName && touchedFields.fullName && (
                    <p className="text-sm text-red-600 flex items-center mt-1">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {fieldErrors.fullName}
                    </p>
                  )}
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-card-foreground">
                    Correo Electrónico
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                      <Mail className="h-5 w-5 text-muted-foreground/80" />
                    </div>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="Tu usuario de ACS Logística"
                      required
                      disabled={isLoading}
                      className={`pl-11 h-12 text-base text-gray-900 block w-full rounded-full border shadow-sm focus:ring-2 focus:ring-accent-blue transition-all duration-200 ${
                        fieldErrors.email && touchedFields.email
                          ? 'border-border bg-red-50 focus:border-destructive'
                          : 'border-border focus:border-accent-blue'
                      }`}
                    />
                  </div>
                  {fieldErrors.email && touchedFields.email && (
                    <p className="text-sm text-red-600 flex items-center mt-1">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {fieldErrors.email}
                    </p>
                  )}
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-card-foreground">
                    Contraseña
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                      <Lock className="h-5 w-5 text-muted-foreground/80" />
                    </div>
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="Contraseña"
                      required
                      disabled={isLoading}
                      className={`pl-11 pr-12 h-12 text-base text-gray-900 block w-full rounded-full border shadow-sm focus:ring-2 focus:ring-accent-blue transition-all duration-200 ${
                        fieldErrors.password && touchedFields.password
                          ? 'border-border bg-red-50 focus:border-destructive'
                          : 'border-border focus:border-accent-blue'
                      }`}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-muted/30 rounded-full"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground/80" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground/80" />
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  {/* Password Strength Indicator */}
                  {formData.password && (
                    <div className="space-y-2">
                      <div className="flex space-x-1">
                        {[25, 50, 75, 100].map((threshold) => (
                          <div
                            key={threshold}
                            className={`h-1 flex-1 rounded-full transition-colors duration-200 ${
                              getPasswordStrength(formData.password) >= threshold
                                ? threshold <= 50 ? 'bg-yellow-400' : threshold <= 75 ? 'bg-orange-400' : 'bg-green-500'
                                : 'bg-muted/30'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Fortaleza: {getPasswordStrength(formData.password) < 50 ? 'Débil' : 
                                  getPasswordStrength(formData.password) < 75 ? 'Media' : 'Fuerte'}
                      </p>
                    </div>
                  )}
                  
                  {fieldErrors.password && touchedFields.password && (
                    <p className="text-sm text-red-600 flex items-center mt-1">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {fieldErrors.password}
                    </p>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-card-foreground">
                    Confirmar Contraseña
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                      <Lock className="h-5 w-5 text-muted-foreground/80" />
                    </div>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="Repetir contraseña"
                      required
                      disabled={isLoading}
                      className={`pl-11 pr-12 h-12 text-base text-gray-900 block w-full rounded-full border shadow-sm focus:ring-2 focus:ring-accent-blue transition-all duration-200 ${
                        fieldErrors.confirmPassword && touchedFields.confirmPassword
                          ? 'border-border bg-red-50 focus:border-destructive'
                          : formData.confirmPassword && formData.confirmPassword === formData.password
                          ? 'border-border bg-green-50 focus:border-accent-blue'
                          : 'border-border focus:border-accent-blue'
                      }`}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-muted/30 rounded-full"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        disabled={isLoading}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground/80" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground/80" />
                        )}
                      </Button>
                    </div>
                  </div>
                  {fieldErrors.confirmPassword && touchedFields.confirmPassword && (
                    <p className="text-sm text-red-600 flex items-center mt-1">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {fieldErrors.confirmPassword}
                    </p>
                  )}
                  {formData.confirmPassword && formData.confirmPassword === formData.password && !fieldErrors.confirmPassword && (
                    <p className="text-sm text-green-600 flex items-center mt-1">
                      <Check className="w-4 h-4 mr-1" />
                      Las contraseñas coinciden
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  variant="accent"
                  className="w-full h-12 font-semibold shadow-lg transition-all duration-200 transform hover:scale-[1.02] rounded-full" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="mr-3 text-white">
                        <DotsLoader size="sm" />
                      </div>
                      Creando cuenta...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <UserPlus className="w-5 h-5 mr-2" />
                      Solicitar Acceso
                    </div>
                  )}
                </Button>

                {/* Login Link */}
                <div className="text-center pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    ¿Ya tienes una cuenta?{" "}
                    <Link href="/login" className="text-accent-blue hover:text-accent-blue/80 font-semibold transition-colors duration-200">
                      Iniciar Sesión
                    </Link>
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}
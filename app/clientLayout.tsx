"use client"

import React, { useState, useEffect } from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/AuthContext"
import { ThemeProvider } from "@/components/theme-provider"
import { Sidebar } from "@/components/sidebar"
import { MobileBottomNav } from "@/components/MobileBottomNav"
import { Toaster } from "@/components/ui/toaster"
import { usePathname, useRouter } from "next/navigation"
import { Analytics } from "@vercel/analytics/next"
import { logoutUser } from "@/lib/auth"

const inter = Inter({ subsets: ["latin"] })

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [is404Page, setIs404Page] = useState(false)
  
  const isAuthPage = pathname === "/login" || pathname === "/register"
  
  // Check for standalone pages (login, register, error pages)
  const isStandalonePage = isAuthPage || 
                           pathname === "/unauthorized" ||
                           pathname === "/pending-approval"

  // Check for 404 page using pathname pattern
  useEffect(() => {
    // Known valid routes pattern
    const validRoutes = [
      '/',
      '/login',
      '/register',
      '/unauthorized',
      '/pending-approval',
      '/recibidor-miami',
      '/preregistro'
    ]
    
    // Check if current path matches any known route or is an API route
    const isValidRoute = validRoutes.some(route => 
      pathname === route || pathname.startsWith(route + '/')
    ) || pathname.startsWith('/api/')
    
    // If it's not a valid route and not already detected as standalone, it's likely a 404
    setIs404Page(!isValidRoute && !isStandalonePage)
  }, [pathname, isStandalonePage])

  const shouldShowStandalone = isStandalonePage || is404Page

  const handleLogout = async () => {
    try {
      await logoutUser()
      router.push("/login")
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  // Debug logging (remove in production)
  // console.log('Layout Debug:', { pathname, isAuthPage, isStandalonePage, is404Page, shouldShowStandalone })

  if (shouldShowStandalone) {
    return <div className="min-h-screen">{children}</div>
  }

  return (
    <>
      {/* Desktop Layout */}
      <div className="hidden md:flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden bg-background min-h-screen">
        <main className="mobile-content-padding overflow-auto">
          {children}
        </main>
        <MobileBottomNav onLogout={handleLogout} />
      </div>
    </>
  )
}

export default function ClientRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange={false}
        >
          <AuthProvider>
            <LayoutContent>{children}</LayoutContent>
          </AuthProvider>
        </ThemeProvider>
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}

"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ThemeToggle } from "@/components/theme-toggle"
import { WhatsNewDialog } from "@/components/WhatsNewDialog"
import { FeedbackDialog } from "@/components/FeedbackDialog"
import { ReportIssueDialog } from "@/components/ReportIssueDialog"
import { 
  Home, 
  Package, 
  Plane, 
  User, 
  MoreHorizontal,
  LogOut,
  MessageCircle,
  Bug,
  HelpCircle,
  Palette
} from "lucide-react"

const coreNavigation = [
  {
    name: "Home",
    href: "/",
    icon: Home,
    activeIcon: Home,
  },
  {
    name: "PreReg",
    href: "/preregistro", 
    icon: Package,
    activeIcon: Package,
  },
  {
    name: "Miami",
    href: "/recibidor-miami",
    icon: Plane,
    activeIcon: Plane,
  },
  {
    name: "Profile",
    href: "#profile",
    icon: User,
    activeIcon: User,
    isProfile: true,
  },
  {
    name: "More",
    href: "#more",
    icon: MoreHorizontal,
    activeIcon: MoreHorizontal,
    isMore: true,
  },
]

interface MobileBottomNavProps {
  onLogout?: () => void
}

export function MobileBottomNav({ onLogout }: MobileBottomNavProps) {
  const pathname = usePathname()
  const { user, userRole } = useAuth()
  const [showProfileSheet, setShowProfileSheet] = useState(false)
  const [showMoreSheet, setShowMoreSheet] = useState(false)
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false)
  const [showIssueDialog, setShowIssueDialog] = useState(false)

  const getRoleBadge = (role: string) => {
    const roleColors = {
      super_admin: "bg-destructive/10 text-destructive dark:bg-destructive/20",
      manager: "bg-accent-blue/10 text-accent-blue dark:bg-accent-blue/20",
      whatsapp_admin: "bg-success/10 text-success dark:bg-success/20",
      mobile_app_admin: "bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400",
      pending: "bg-muted text-muted-foreground",
    }

    const roleNames = {
      super_admin: "Super Admin",
      manager: "Manager",
      whatsapp_admin: "WhatsApp Admin", 
      mobile_app_admin: "Mobile Admin",
      pending: "Pendiente",
    }

    return (
      <Badge className={cn("text-xs", roleColors[role as keyof typeof roleColors] || "bg-muted text-muted-foreground")}>
        {roleNames[role as keyof typeof roleNames] || role}
      </Badge>
    )
  }

  const handleNavClick = (item: typeof coreNavigation[0]) => {
    if (item.isProfile) {
      setShowProfileSheet(true)
    } else if (item.isMore) {
      setShowMoreSheet(true)
    }
  }

  const isActiveItem = (item: typeof coreNavigation[0]) => {
    if (item.isProfile) return showProfileSheet
    if (item.isMore) return showMoreSheet
    return pathname === item.href
  }

  return (
    <>
      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        <div className="bg-background/80 backdrop-blur-md border-t border-border">
          <div className="safe-area-padding-bottom">
            <div className="flex items-center justify-around px-2 py-2">
              {coreNavigation.map((item) => {
                const isActive = isActiveItem(item)
                const IconComponent = isActive ? item.activeIcon : item.icon
                
                if (item.isProfile || item.isMore) {
                  return (
                    <button
                      key={item.name}
                      onClick={() => handleNavClick(item)}
                      className={cn(
                        "flex flex-col items-center justify-center min-w-0 flex-1 py-2 px-1 rounded-lg transition-all duration-200",
                        isActive ? "text-accent-blue scale-105" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <div className={cn(
                        "flex items-center justify-center w-6 h-6 mb-1 transition-transform duration-200",
                        isActive && "scale-110"
                      )}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-medium truncate max-w-full">
                        {item.name}
                      </span>
                    </button>
                  )
                }

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex flex-col items-center justify-center min-w-0 flex-1 py-2 px-1 rounded-lg transition-all duration-200",
                      isActive ? "text-accent-blue scale-105" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <div className={cn(
                      "flex items-center justify-center w-6 h-6 mb-1 transition-transform duration-200",
                      isActive && "scale-110"
                    )}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-medium truncate max-w-full">
                      {item.name}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Sheet */}
      <Sheet open={showProfileSheet} onOpenChange={setShowProfileSheet}>
        <SheetContent side="bottom" className="rounded-t-xl">
          <SheetHeader className="text-left pb-6">
            <SheetTitle>Perfil de Usuario</SheetTitle>
          </SheetHeader>
          
          <div className="space-y-6">
            {/* User Info */}
            <div className="flex items-center space-x-4 p-4 bg-muted/30 rounded-lg">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-medium text-foreground truncate">
                  {user?.email?.split("@")[0] || "Usuario"}
                </p>
                <p className="text-sm text-muted-foreground truncate mb-2">
                  {user?.email}
                </p>
                {userRole && getRoleBadge(userRole.role)}
              </div>
            </div>

            {/* Support Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Soporte
              </h3>
              
              <Button
                variant="ghost"
                className="w-full justify-start h-12 px-4"
                onClick={() => {
                  setShowProfileSheet(false)
                  setShowFeedbackDialog(true)
                }}
              >
                <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center mr-3">
                  <MessageCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">Enviar Comentarios</span>
                  <span className="text-xs text-muted-foreground">Comparte tu experiencia</span>
                </div>
              </Button>

              <Button
                variant="ghost"
                className="w-full justify-start h-12 px-4"
                onClick={() => {
                  setShowProfileSheet(false)
                  setShowIssueDialog(true)
                }}
              >
                <div className="w-8 h-8 rounded-full bg-orange-50 dark:bg-orange-950/50 flex items-center justify-center mr-3">
                  <Bug className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">Reportar Incidencia</span>
                  <span className="text-xs text-muted-foreground">Reporta un problema</span>
                </div>
              </Button>
            </div>

            {/* Account Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Cuenta
              </h3>
              
              <Button
                variant="ghost"
                className="w-full justify-start h-12 px-4 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50"
                onClick={() => {
                  setShowProfileSheet(false)
                  onLogout?.()
                }}
              >
                <div className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-950/50 flex items-center justify-center mr-3">
                  <LogOut className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">Cerrar Sesión</span>
                  <span className="text-xs text-muted-foreground">Salir del sistema</span>
                </div>
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* More Sheet */}
      <Sheet open={showMoreSheet} onOpenChange={setShowMoreSheet}>
        <SheetContent side="bottom" className="rounded-t-xl">
          <SheetHeader className="text-left pb-6">
            <SheetTitle>Más Opciones</SheetTitle>
          </SheetHeader>
          
          <div className="space-y-6">
            {/* Theme Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Apariencia
              </h3>
              
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center">
                    <Palette className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <span className="text-sm font-medium">Tema</span>
                    <p className="text-xs text-muted-foreground">Cambiar apariencia</p>
                  </div>
                </div>
                <ThemeToggle showText={false} />
              </div>
            </div>

            {/* Help Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Ayuda
              </h3>
              
              <WhatsNewDialog>
                <Button
                  variant="ghost"
                  className="w-full justify-start h-12 px-4"
                  onClick={() => setShowMoreSheet(false)}
                >
                  <div className="w-8 h-8 rounded-full bg-green-50 dark:bg-green-950/50 flex items-center justify-center mr-3">
                    <HelpCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium">¿Qué hay de nuevo?</span>
                    <span className="text-xs text-muted-foreground">Ver actualizaciones</span>
                  </div>
                </Button>
              </WhatsNewDialog>
            </div>

            {/* App Info */}
            <div className="pt-4 border-t border-border">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  ACS Logística WMS
                </p>
                <p className="text-xs text-muted-foreground/60">
                  Versión 1.2.0
                </p>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Feedback Dialogs */}
      <FeedbackDialog 
        open={showFeedbackDialog} 
        onOpenChange={setShowFeedbackDialog} 
      />
      
      <ReportIssueDialog 
        open={showIssueDialog} 
        onOpenChange={setShowIssueDialog} 
      />
    </>
  )
}
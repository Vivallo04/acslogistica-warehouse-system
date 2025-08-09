"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"
import { logoutUser } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/theme-toggle"
import { FeedbackDialog } from "@/components/FeedbackDialog"
import { ReportIssueDialog } from "@/components/ReportIssueDialog"
import { WhatsNewDialog } from "@/components/WhatsNewDialog"
import { Home, LogOut, User, MessageCircle, Bug, MoreVertical, Package, Plane, HelpCircle, ChevronLeft, Menu } from "lucide-react"

const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: Home,
  },
  {
    name: "Pre Registro",
    href: "/preregistro",
    icon: Package,
  },
  {
    name: "Recibidor de Miami",
    href: "/recibidor-miami",
    icon: Plane,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, userRole, hasPermission } = useAuth()
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false)
  const [showIssueDialog, setShowIssueDialog] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)


  const handleLogout = async () => {
    try {
      await logoutUser()
      router.push("/login")
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

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
      <Badge className={roleColors[role as keyof typeof roleColors] || "bg-muted text-muted-foreground"}>
        {roleNames[role as keyof typeof roleNames] || role}
      </Badge>
    )
  }

  const shouldShowNavItem = (item: any) => {
    // Check permission if specified
    if (item.permission && !hasPermission(item.permission)) {
      return false
    }

    return true
  }

  return (
    <div className={cn(
      "bg-card border-r border-border flex flex-col transition-all duration-300 ease-in-out",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Logo */}
      <div className="p-6 border-b border-border relative">
        {!isCollapsed ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-10 h-10 flex items-center justify-center">
                <Image
                  src="/acs-control-center-logo.svg"
                  alt="ACS Logística Logo"
                  width={40}
                  height={40}
                  className="w-full h-full object-contain"
                  priority
                />
              </div>
              <div className="ml-3">
                <h1 className="text-lg font-semibold text-card-foreground leading-tight">ACS Logística</h1>
                <p className="text-xs text-muted-foreground font-normal leading-tight">Warehouse Management System</p>
              </div>
            </div>
            
            {/* Collapse Toggle Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="h-8 w-8 rounded-full hover:bg-accent flex-shrink-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex justify-center">
            {/* Collapse Toggle Button - Centered when collapsed */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="h-8 w-8 rounded-full hover:bg-accent"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className={cn("flex-1 p-4 space-y-2 overflow-y-auto", isCollapsed && "px-2")}>
        {navigation.map((item) => {
          if (!shouldShowNavItem(item)) return null

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center text-sm font-medium rounded-full transition-colors",
                pathname === item.href ? "bg-accent/10 text-accent-blue" : "text-foreground hover:bg-accent/10",
                isCollapsed 
                  ? "justify-center px-2 py-3" 
                  : "px-3 py-2"
              )}
              title={isCollapsed ? item.name : undefined}
            >
              <item.icon className={cn(
                isCollapsed ? "w-6 h-6" : "w-5 h-5 mr-3"
              )} />
              {!isCollapsed && item.name}
            </Link>
          )
        })}
        
      </nav>


      {/* Theme Toggle and What's New */}
      <div className={cn("px-3 py-4 space-y-3", isCollapsed && "items-center")}>
        <ThemeToggle showText={!isCollapsed} />
        
        <WhatsNewDialog>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "rounded-full gap-2 text-muted-foreground hover:text-foreground",
              isCollapsed ? "w-10 h-10 p-0 justify-center" : "w-full justify-start"
            )}
            title={isCollapsed ? "¿Qué hay de nuevo?" : undefined}
          >
            <HelpCircle className="w-4 h-4" />
            {!isCollapsed && <span className="text-sm">¿Qué hay de nuevo?</span>}
          </Button>
        </WhatsNewDialog>
      </div>

      {/* User Info */}
      <div className="p-4 border-t border-b border-border">
        {!isCollapsed ? (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-card-foreground truncate">{user?.email?.split("@")[0]}</p>
              <div className="mt-1">{userRole && getRoleBadge(userRole.role)}</div>
            </div>
            
            {/* Profile Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-accent/10"
                >
                  <MoreVertical className="h-4 w-4 text-muted-foreground" />
                  <span className="sr-only">Abrir menú de acciones</span>
                </Button>
              </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="right" className="w-56 p-2">
                {/* Support Section */}
                <div className="px-2 py-1.5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Soporte
                  </p>
                </div>
                
              <DropdownMenuItem 
                onClick={() => setShowFeedbackDialog(true)}
                className="px-3 py-2.5 cursor-pointer transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center mr-3">
                    <MessageCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Enviar Comentarios</span>
                    <span className="text-xs text-muted-foreground">Comparte tu experiencia</span>
                  </div>
                </div>
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={() => setShowIssueDialog(true)}
                className="px-3 py-2.5 cursor-pointer transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-orange-50 dark:bg-orange-950/50 flex items-center justify-center mr-3">
                    <Bug className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Reportar Incidencia</span>
                    <span className="text-xs text-muted-foreground">Reporta un problema</span>
                  </div>
                </div>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="my-2" />
              
              {/* Account Section */}
              <div className="px-2 py-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Cuenta
                </p>
              </div>
              
              <DropdownMenuItem 
                onClick={handleLogout}
                className="px-3 py-2.5 cursor-pointer transition-colors hover:bg-red-50 dark:hover:bg-red-950/50 text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-950/50 flex items-center justify-center mr-3">
                    <LogOut className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Cerrar Sesión</span>
                    <span className="text-xs text-muted-foreground">Salir del sistema</span>
                  </div>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        ) : (
          <div className="flex justify-center">
            {/* Collapsed Account Button */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 w-10 rounded-full bg-muted hover:bg-accent transition-colors"
                  title="Cuenta"
                >
                  <User className="h-5 w-5 text-muted-foreground" />
                  <span className="sr-only">Abrir menú de cuenta</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="right" className="w-56 p-2">
                {/* Support Section */}
                <div className="px-2 py-1.5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Soporte
                  </p>
                </div>
                
                <DropdownMenuItem 
                  onClick={() => setShowFeedbackDialog(true)}
                  className="px-3 py-2.5 cursor-pointer transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center mr-3">
                      <MessageCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">Enviar Comentarios</span>
                      <span className="text-xs text-muted-foreground">Comparte tu experiencia</span>
                    </div>
                  </div>
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  onClick={() => setShowIssueDialog(true)}
                  className="px-3 py-2.5 cursor-pointer transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-orange-50 dark:bg-orange-950/50 flex items-center justify-center mr-3">
                      <Bug className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">Reportar Incidencia</span>
                      <span className="text-xs text-muted-foreground">Reporta un problema</span>
                    </div>
                  </div>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-2" />
                
                {/* Account Section */}
                <div className="px-2 py-1.5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Cuenta
                  </p>
                </div>
                
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="px-3 py-2.5 cursor-pointer transition-colors hover:bg-red-50 dark:hover:bg-red-950/50 text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-950/50 flex items-center justify-center mr-3">
                      <LogOut className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">Cerrar Sesión</span>
                      <span className="text-xs text-muted-foreground">Salir del sistema</span>
                    </div>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className={cn(
          "text-xs text-muted-foreground/60",
          isCollapsed ? "text-center" : "text-center"
        )}>
          {isCollapsed ? "v1.2.0" : "Versión 1.2.0"}
        </div>
      </div>
      
      {/* Feedback Dialogs */}
      <FeedbackDialog 
        open={showFeedbackDialog} 
        onOpenChange={setShowFeedbackDialog} 
      />
      
      <ReportIssueDialog 
        open={showIssueDialog} 
        onOpenChange={setShowIssueDialog} 
      />
    </div>
  )
}

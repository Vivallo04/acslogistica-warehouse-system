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
import { Home, LogOut, User, MessageCircle, Bug, MoreVertical, Package, Plane, HelpCircle } from "lucide-react"

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
    <div className="w-64 bg-card border-r border-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border">
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
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navigation.map((item) => {
          if (!shouldShowNavItem(item)) return null

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-full transition-colors",
                pathname === item.href ? "bg-accent/10 text-accent-blue" : "text-foreground hover:bg-accent/10",
              )}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.name}
            </Link>
          )
        })}
        
      </nav>


      {/* Theme Toggle and What's New */}
      <div className="px-3 py-4 space-y-3">
        <ThemeToggle showText={true} />
        
        <WhatsNewDialog>
          <Button
            variant="ghost"
            size="sm"
            className="w-full rounded-full justify-start gap-2 text-muted-foreground hover:text-foreground"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="text-sm">¿Qué hay de nuevo?</span>
          </Button>
        </WhatsNewDialog>
      </div>

      {/* User Info */}
      <div className="p-4 border-t border-b border-border">
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
            <DropdownMenuContent align="start" side="right" className="w-48">
              <DropdownMenuItem onClick={() => setShowFeedbackDialog(true)}>
                <MessageCircle className="mr-2 h-4 w-4" />
                Enviar Comentarios
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowIssueDialog(true)}>
                <Bug className="mr-2 h-4 w-4" />
                Reportar Incidencia
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border space-y-3">
        <Button
          variant="outline"
          onClick={handleLogout}
          className="w-full justify-center gap-2 text-destructive border-destructive/20 hover:bg-destructive/10 hover:border-destructive/30 transition-all duration-200 rounded-full"
        >
          <LogOut className="w-4 h-4" />
          Cerrar Sesión
        </Button>
        <div className="text-xs text-muted-foreground/60 text-center">Versión 1.0.0</div>
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

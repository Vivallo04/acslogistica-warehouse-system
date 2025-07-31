"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { onAuthStateChanged, type User } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { getUserRole, type UserRole } from "@/lib/auth"

interface AuthContextType {
  user: User | null
  userRole: UserRole | null
  isLoading: boolean
  hasPermission: (permission: string) => boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Import validateCompanyEmail here to avoid circular dependency
        const { validateCompanyEmail } = await import("@/lib/auth")
        
        // Enforce email validation on every auth state change
        if (!validateCompanyEmail(user.email || "")) {
          console.warn(`Unauthorized email attempted access: ${user.email}`)
          // Force logout unauthorized users
          await auth.signOut()
          setUser(null)
          setUserRole(null)
          setIsLoading(false)
          return
        }
        
        setUser(user)
        const role = getUserRole(user)
        setUserRole(role)
      } else {
        setUser(null)
        setUserRole(null)
      }
      setIsLoading(false)
    })

    return unsubscribe
  }, [])

  const hasPermission = useCallback((permission: string): boolean => {
    if (!userRole || !userRole.approved) return false
    return userRole.permissions.includes(permission) || userRole.role === "super_admin"
  }, [userRole])


  return (
    <AuthContext.Provider
      value={{
        user,
        userRole,
        isLoading,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

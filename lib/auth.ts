
import { auth } from "./firebase"
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  type User,
} from "firebase/auth"

export interface UserRole {
  role: "super_admin" | "manager" | "pending"
  approved: boolean
  permissions: string[]
}

export const ROLE_PERMISSIONS = {
  super_admin: [
    "users.manage",
    "system.settings",
    "billing.view",
  ],
  manager: [
    "dashboard.view",
  ],
  pending: [],
}

export function validateCompanyEmail(email: string): boolean {
  const normalizedEmail = email.toLowerCase().trim()
  
  // Allow @lambdahq.com emails
  if (normalizedEmail.endsWith('@lambdahq.com')) {
    return true
  }
  
  // Check against allowed members list
  try {
    // Note: In a real application, this would be loaded from an API or server-side
    // For now, we'll check against a known list of allowed emails from allowed_member.json
    const allowedEmails = [
      'publicidadacslogistica@gmail.com',
      'allisonacslogistica@gmail.com', 
      'nayeliespiacs@gmail.com',
      'ignacioacslogistica@gmail.com',
      'sdbhjbjh@hotmail.com',
      'pauloacslogistica@gmail.com',
      'kennethacslogistica@gmail.com',
      'keilormacslogistica@gmail.com',
      'jordansolorzanoacslogistica@gmail.com',
      'juanjoseacslogistica@gmail.com',
      'accounts@lambdahq.com',
      'acslogisticageovanna@gmail.com',
      'aurion25@hotmail.es',
      'acslogisticamaryelin@gmail.com',
      'juancarlosguerrero.mentative@gmail.com',
      'encargos@hotmail.co',
      'correo@hitmail.com',
      'diriam@hotmail.com',
      'ismael@hotmail.com',
      'franklin@hotmail.com',
      'luis@hotmail.com',
      'anthony@hotmail.com',
      'wendy@hotmail.com',
      'angie@hotmail.com',
      'brayan@hotmail.com',
      'andreycubero21@gmail.com',
      'acslogisticacr@gmail.com',
      'bypbrayan@hotmail.com',
      'edo.mc1391@gmail.com',
    ]
    
    return allowedEmails.includes(normalizedEmail)
  } catch (error) {
    console.error('Error validating email:', error)
    return false
  }
}

export async function registerUser(email: string, password: string, fullName: string) {
  if (!validateCompanyEmail(email)) {
    throw new Error("Acceso no autorizado. Contacta al administrador.")
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    // Send email verification
    await sendEmailVerification(user)

    // Create user record in database
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          firebaseUid: user.uid, 
          email, 
          fullName,
          role: 'pending',
          createdAt: new Date().toISOString()
        })
      })
      
      if (!response.ok) {
        // Rollback: delete the Firebase user if database creation fails
        await user.delete()
        throw new Error('Failed to create user record')
      }
    } catch (dbError) {
      // Rollback: delete the Firebase user if database creation fails
      try {
        await user.delete()
      } catch (deleteError) {
        console.error('Failed to rollback Firebase user creation:', deleteError)
      }
      throw new Error('Failed to create user record in database')
    }

    return {
      success: true,
      message: "Cuenta creada. Revisa tu email para verificar y espera la aprobación del administrador.",
    }
  } catch (error: any) {
    console.error("Error de registro:", error)
    
    switch (error.code) {
      case "auth/email-already-in-use":
        throw new Error("Ya existe una cuenta con este email")
      case "auth/weak-password":
        throw new Error("La contraseña debe tener al menos 6 caracteres")
      case "auth/invalid-email":
        throw new Error("El formato del email no es válido")
      case "auth/operation-not-allowed":
        throw new Error("El registro de usuarios no está habilitado")
      case "auth/network-request-failed":
        throw new Error("Error de conexión. Verifica tu conexión a internet e intenta nuevamente")
      default:
        throw new Error(`Error al crear la cuenta: ${error.message || "Error desconocido"}`)
    }
  }
}

export async function loginUser(email: string, password: string) {
  // Validate email before attempting login
  if (!validateCompanyEmail(email)) {
    throw new Error("Acceso no autorizado. Contacta al administrador.")
  }
  
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return userCredential.user
  } catch (error: any) {
    console.error("Error de autenticación:", error)
    
    switch (error.code) {
      case "auth/user-not-found":
        throw new Error("No existe una cuenta con este email")
      case "auth/wrong-password":
        throw new Error("La contraseña es incorrecta")
      case "auth/invalid-email":
        throw new Error("El formato del email no es válido")
      case "auth/user-disabled":
        throw new Error("Esta cuenta ha sido deshabilitada")
      case "auth/too-many-requests":
        throw new Error("Demasiados intentos fallidos. Por favor, espera unos minutos antes de intentar nuevamente")
      case "auth/network-request-failed":
        throw new Error("Error de conexión. Verifica tu conexión a internet e intenta nuevamente")
      case "auth/invalid-credential":
        throw new Error("Credenciales inválidas. Verifica tu email y contraseña")
      case "auth/operation-not-allowed":
        throw new Error("El inicio de sesión con email no está habilitado")
      case "auth/weak-password":
        throw new Error("La contraseña es muy débil")
      default:
        throw new Error(`Error de autenticación: ${error.message || "Error desconocido"}`)
    }
  }
}

export async function logoutUser() {
  try {
    await signOut(auth)
  } catch (error: any) {
    console.error("Error al cerrar sesión:", error)
    throw new Error("Error al cerrar sesión. Intenta nuevamente")
  }
}

export function getUserRole(user: User): UserRole {
  // In a real app, this would come from custom claims or database
  // For demo purposes, we'll simulate based on email
  const email = user.email?.toLowerCase() || ""
  
  // TESTING MODE: Auto-approve all verified emails as manager
  // Note: We can't await here since this is a synchronous function
  // Email validation is handled in the AuthContext where it can be async
  if (user.emailVerified) {
    console.log(`[AUTH] Email verified - auto-approving user as manager: ${email}`)
    return {
      role: "manager",
      approved: true,
      permissions: ROLE_PERMISSIONS.manager,
    }
  }

  // Role patterns for specific testing accounts
  if (email.includes("admin@")) {
    return {
      role: "super_admin",
      approved: true,
      permissions: ROLE_PERMISSIONS.super_admin,
    }
  }

  if (email.includes("manager@")) {
    return {
      role: "manager",
      approved: true,
      permissions: ROLE_PERMISSIONS.manager,
    }
  }

  // For unverified emails, still pending
  console.log(`[AUTH] Email not verified - keeping as pending: ${email}`)
  return {
    role: "pending",
    approved: false,
    permissions: ROLE_PERMISSIONS.pending,
  }
}

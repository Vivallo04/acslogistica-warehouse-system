import { NextRequest } from 'next/server'
import { validateCompanyEmail, getUserRole } from './auth'

/**
 * Validates Firebase ID token from Authorization header
 * Note: This is a simplified validation - in production, you should use Firebase Admin SDK
 */
export async function validateAuthToken(request: NextRequest): Promise<{ valid: boolean; user?: any; error?: string }> {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { valid: false, error: 'Missing or invalid authorization header' }
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix
    
    if (!token) {
      return { valid: false, error: 'Missing token' }
    }

    // In a production environment, you would verify the Firebase ID token here using Firebase Admin SDK
    // For now, we'll implement a basic validation
    // TODO: Replace with proper Firebase Admin SDK token verification
    
    // Basic token structure validation (Firebase tokens are JWTs)
    const tokenParts = token.split('.')
    if (tokenParts.length !== 3) {
      return { valid: false, error: 'Invalid token format' }
    }

    try {
      // Decode the payload (middle part of JWT)
      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString())
      
      // Basic validation
      if (!payload.email || !payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
        return { valid: false, error: 'Token expired or invalid' }
      }

      // Validate company email
      if (!validateCompanyEmail(payload.email)) {
        return { valid: false, error: 'Unauthorized email domain' }
      }

      return { 
        valid: true, 
        user: {
          email: payload.email,
          uid: payload.sub || payload.user_id,
          emailVerified: payload.email_verified || false
        }
      }
    } catch (decodeError) {
      return { valid: false, error: 'Failed to decode token' }
    }

  } catch (error) {
    console.error('Auth validation error:', error)
    return { valid: false, error: 'Authentication failed' }
  }
}

/**
 * Validates Firebase ID token from cookies (for middleware)
 */
export async function validateAuthFromCookies(request: NextRequest): Promise<{ valid: boolean; user?: any; error?: string }> {
  try {
    // Check for Firebase auth token in cookies
    const token = request.cookies.get('__session')?.value || 
                  request.cookies.get('firebase-auth-token')?.value

    if (!token) {
      return { valid: false, error: 'No authentication token found' }
    }

    // Similar validation as above but from cookies
    const tokenParts = token.split('.')
    if (tokenParts.length !== 3) {
      return { valid: false, error: 'Invalid token format' }
    }

    try {
      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString())
      
      if (!payload.email || !payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
        return { valid: false, error: 'Token expired or invalid' }
      }

      if (!validateCompanyEmail(payload.email)) {
        return { valid: false, error: 'Unauthorized email domain' }
      }

      return { 
        valid: true, 
        user: {
          email: payload.email,
          uid: payload.sub || payload.user_id,
          emailVerified: payload.email_verified || false
        }
      }
    } catch (decodeError) {
      return { valid: false, error: 'Failed to decode token' }
    }

  } catch (error) {
    console.error('Cookie auth validation error:', error)
    return { valid: false, error: 'Authentication failed' }
  }
}

/**
 * Standard error responses for authentication failures
 */
export const AUTH_RESPONSES = {
  UNAUTHORIZED: {
    error: 'No autorizado',
    message: 'Debes iniciar sesión para acceder a este recurso'
  },
  FORBIDDEN: {
    error: 'Acceso denegado', 
    message: 'No tienes permisos para acceder a este recurso'
  },
  INVALID_TOKEN: {
    error: 'Token inválido',
    message: 'El token de autenticación es inválido o ha expirado'
  }
} as const
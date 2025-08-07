// API utility functions for Recibidor de Miami operations
// Integrates with the .NET WMS API backend

export interface BulkStatusUpdateRequest {
  nids: number[]
  targetStatusId: number
  targetStatusName: string
  userId?: number
}

export interface BulkStatusUpdateResponse {
  success: boolean
  message: string
  data?: {
    updatedCount: number
    failedCount: number
    updatedPackages: Array<{
      nid: number
      tracking: string
      oldStatus: string
      newStatus: string
    }>
    failedPackages: Array<{
      nid: number
      tracking: string
      error: string
    }>
  }
  error?: string
}

export interface PackageStatusInfo {
  nid: number
  tracking: string
  currentStatus: string
  currentStatusId: number
  canUpdateStatus: boolean
}

// Status constants based on the Drupal taxonomy exploration
export const STATUS_MAPPING = {
  VUELO_ASIGNADO: {
    id: 3,
    name: "Vuelo Asignado"
  },
  EN_ADUANA: {
    id: 4,
    name: "En Aduana"
  },
  PREALERTADO: {
    id: 1,
    name: "Prealertado"
  },
  RECIBIDO_EN_MIAMI: {
    id: 2,
    name: "Recibido en Miami"
  },
  LISTO_PARA_ENTREGAR: {
    id: 5,
    name: "Listo para entregar"
  },
  ENTREGADO: {
    id: 6,
    name: "Entregado"
  }
} as const

// Base API URL - matches the pattern used in recibidor-miami/page.tsx
const getApiBaseUrl = () => {
  return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5001'
}

// Utility function for API calls with error handling
async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const apiBaseUrl = getApiBaseUrl()
  const url = `${apiBaseUrl}/api${endpoint}`
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error)
    throw error
  }
}

/**
 * Filter packages that can be updated from "Vuelo Asignado" to "En Aduana"
 * @param packages Array of packages with their current status
 * @returns Array of packages that can be status updated
 */
export function filterUpdatablePackages(packages: Array<{ 
  nid: number, 
  tracking: string, 
  estado: string, 
  estadoId?: number 
}>): PackageStatusInfo[] {
  return packages
    .map(pkg => ({
      nid: pkg.nid,
      tracking: pkg.tracking,
      currentStatus: pkg.estado,
      currentStatusId: pkg.estadoId || 0,
      canUpdateStatus: pkg.estado === STATUS_MAPPING.VUELO_ASIGNADO.name || 
                      pkg.estadoId === STATUS_MAPPING.VUELO_ASIGNADO.id
    }))
    .filter(pkg => pkg.canUpdateStatus)
}

/**
 * Bulk update package status from "Vuelo Asignado" to "En Aduana"
 * @param packageNids Array of package NIDs to update
 * @param userId Optional user ID performing the update
 * @returns Response with update results
 */
export async function bulkUpdatePackageStatus(
  packageNids: number[],
  userId: number = 1
): Promise<BulkStatusUpdateResponse> {
  if (packageNids.length === 0) {
    return {
      success: false,
      message: 'No packages provided for update',
      error: 'Empty package list'
    }
  }

  try {
    const payload = {
      packageNids: packageNids,
      targetStatusId: STATUS_MAPPING.EN_ADUANA.id,
      targetStatusName: STATUS_MAPPING.EN_ADUANA.name,
      userId: userId,
      updateTimestamp: new Date().toISOString()
    }

    const response = await apiCall<{
      success: boolean
      message: string
      updatedCount?: number
      failedCount?: number
      updatedPackages?: Array<{
        nid: number
        tracking: string
        oldStatus: string
        newStatus: string
      }>
      failedPackages?: Array<{
        nid: number
        tracking: string
        error: string
      }>
      errors?: string[]
    }>('/Packages/bulk-update-status', {
      method: 'PUT',
      body: JSON.stringify(payload)
    })

    // Transform backend response to frontend format
    return {
      success: response.success,
      message: response.message,
      data: response.success ? {
        updatedCount: response.updatedCount || 0,
        failedCount: response.failedCount || 0,
        updatedPackages: response.updatedPackages || [],
        failedPackages: response.failedPackages || []
      } : undefined,
      error: response.errors?.join('; ')
    }
  } catch (error) {
    console.error('Error updating package status:', error)
    return {
      success: false,
      message: 'Error al actualizar el estado de los paquetes',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get package status history (for future enhancement)
 * @param packageNid Package NID to get history for
 * @returns Status change history
 */
export async function getPackageStatusHistory(packageNid: number): Promise<Array<{
  timestamp: string
  oldStatus: string
  newStatus: string
  changedBy: string
}> | null> {
  try {
    const response = await apiCall<{ history: Array<{
      timestamp: string
      oldStatus: string
      newStatus: string
      changedBy: string
    }> }>(`/Packages/${packageNid}/status-history`)
    
    return response.history
  } catch (error) {
    console.error('Error fetching package status history:', error)
    return null
  }
}

/**
 * Validate if status transition is allowed
 * @param fromStatusId Current status ID
 * @param toStatusId Target status ID
 * @returns Whether the transition is allowed
 */
export function isStatusTransitionAllowed(fromStatusId: number, toStatusId: number): boolean {
  // Define allowed status transitions
  const allowedTransitions: Record<number, number[]> = {
    [STATUS_MAPPING.PREALERTADO.id]: [STATUS_MAPPING.VUELO_ASIGNADO.id],
    [STATUS_MAPPING.VUELO_ASIGNADO.id]: [STATUS_MAPPING.EN_ADUANA.id],
    [STATUS_MAPPING.EN_ADUANA.id]: [STATUS_MAPPING.LISTO_PARA_ENTREGAR.id],
    [STATUS_MAPPING.LISTO_PARA_ENTREGAR.id]: [STATUS_MAPPING.ENTREGADO.id],
  }

  const allowedTargets = allowedTransitions[fromStatusId] || []
  return allowedTargets.includes(toStatusId)
}

/**
 * Helper function to format status update message
 * @param updatedCount Number of successfully updated packages
 * @param failedCount Number of failed package updates
 * @returns Formatted message for user feedback
 */
export function formatStatusUpdateMessage(updatedCount: number, failedCount: number): string {
  if (updatedCount === 0 && failedCount === 0) {
    return 'No se actualizó ningún paquete'
  }
  
  if (failedCount === 0) {
    return `Se actualizaron ${updatedCount} paquete${updatedCount !== 1 ? 's' : ''} correctamente`
  }
  
  if (updatedCount === 0) {
    return `Error: No se pudo actualizar ninguno de los ${failedCount} paquetes`
  }
  
  return `Se actualizaron ${updatedCount} paquetes correctamente, ${failedCount} fallaron`
}

/**
 * Health check for the packages API
 * @returns Whether the packages API is available
 */
export async function checkPackagesApiHealth(): Promise<boolean> {
  try {
    await apiCall('/Packages/health/database')
    return true
  } catch (error) {
    console.error('Packages API health check failed:', error)
    return false
  }
}
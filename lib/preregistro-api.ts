// API utility functions for preregistro operations
// Integrates with the .NET WMS API backend

export interface PreregistroPackage {
  id?: string
  numeroTracking: string
  numeroCasillero: string
  contenido: string
  peso: string
  numeroTarima: string
  ci_paquete?: string
  estado?: string
  fecha_creacion?: string
  nid?: number
}

export interface TrackingSearchResult {
  packages: PreregistroPackage[]
  matchType: 'exact' | 'partial' | 'none'
  existingPackage?: PreregistroPackage
}

export interface PreregistroResponse {
  success: boolean
  message: string
  data?: {
    ci_paquete: string
    nid: number
    pdfUrl?: string
    package: PreregistroPackage
  }
  error?: string
}

export interface PreregistroStatistics {
  total_packages: number
  packages_today: number
  average_processing_time: number
  last_ci_generated: string
}

export interface CasilleroOption {
  value: string
  label: string
}

export interface ClientSearchResult {
  uid: number
  displayName: string
  label: string
}

// Base API URL - will use local .NET API
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL 
  ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api`
  : 'http://localhost:5286/api'

// Utility function for API calls with error handling
async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`
  
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
 * Search for packages by tracking number (exact or partial matches)
 * Returns packages with status 'prealertado' or 'vuelo asignado'
 */
export async function searchPackagesByTracking(trackingNumber: string): Promise<TrackingSearchResult> {
  if (!trackingNumber.trim()) {
    return { packages: [], matchType: 'none' }
  }

  try {
    // Use the test search endpoint with correct format
    const response = await apiCall<{
      results: Array<{
        nid: number
        tracking: string
        contenido?: string
        peso: string
        numeroTarima?: string
        numeroCasillero: string
        clienteName: string
        estado: string
        estadoId: number
        ciPaquete?: string
        fecha: string
      }>
    }>(`/Preregistro/test/search?tracking=${encodeURIComponent(trackingNumber)}`)

    // Transform backend format to frontend format
    const packages: PreregistroPackage[] = response.results?.map(pkg => ({
      id: pkg.nid.toString(),
      nid: pkg.nid,
      numeroTracking: pkg.tracking,
      numeroCasillero: pkg.numeroCasillero,
      contenido: pkg.contenido || '',
      peso: pkg.peso,
      numeroTarima: pkg.numeroTarima || '',
      ci_paquete: pkg.ciPaquete,
      estado: pkg.estado,
      fecha_creacion: pkg.fecha
    })) || []
    
    // Determine match type
    const exactMatch = packages.find(pkg => 
      pkg.numeroTracking.toLowerCase() === trackingNumber.toLowerCase()
    )
    
    const matchType: TrackingSearchResult['matchType'] = exactMatch 
      ? 'exact' 
      : packages.length > 0 
        ? 'partial' 
        : 'none'

    return {
      packages,
      matchType,
      existingPackage: exactMatch
    }
  } catch (error) {
    console.error('Error searching packages by tracking:', error)
    return { packages: [], matchType: 'none' }
  }
}

/**
 * Process a package (create new or update existing)
 * Handles CI generation and status transitions:
 * - Existing packages (prealertado): Change status to "vuelo asignado", keep existing CI
 * - Non-existing packages: Create new package with new CI generation
 */
export async function processPackage(
  packageData: PreregistroPackage, 
  existingPackage?: PreregistroPackage
): Promise<PreregistroResponse> {
  try {
    // Match the backend DTO structure exactly
    const payload = {
      packageNid: existingPackage?.nid || null, // null for new packages
      trackingNumber: packageData.numeroTracking,
      peso: parseFloat(packageData.peso),
      numeroTarima: packageData.numeroTarima,
      numeroCasillero: packageData.numeroCasillero,
      contenido: packageData.contenido || null,
      userId: 1, // TODO: Get from auth context
      processingStartTime: new Date().toISOString()
    }

    const response = await apiCall<{
      success: boolean
      message: string
      packageNid?: number
      ciNumber?: string
      pdfUrl?: string
      errors?: string[]
      processedAt: string
      processingTimeSeconds: number
    }>('/Preregistro/process', {
      method: 'POST',
      body: JSON.stringify(payload)
    })

    // Transform backend response to frontend format
    return {
      success: response.success,
      message: response.message,
      data: response.success && response.packageNid && response.ciNumber ? {
        ci_paquete: response.ciNumber,
        nid: response.packageNid,
        pdfUrl: response.pdfUrl,
        package: {
          ...packageData,
          id: response.packageNid.toString(),
          ci_paquete: response.ciNumber
        }
      } : undefined,
      error: response.errors?.join('; ')
    }
  } catch (error) {
    console.error('Error processing package:', error)
    return {
      success: false,
      message: 'Error al procesar el paquete',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get list of available casilleros/clients
 */
export async function getCasilleros(): Promise<CasilleroOption[]> {
  try {
    const response = await apiCall<CasilleroOption[]>('/Preregistro/casilleros')
    return Array.isArray(response) ? response : []
  } catch (error) {
    console.error('Error fetching casilleros:', error)
    return []
  }
}

/**
 * Search clients by name (minimum 2 characters)
 */
export async function searchClientsByName(searchTerm: string): Promise<ClientSearchResult[]> {
  try {
    if (!searchTerm || searchTerm.trim().length < 2) {
      return []
    }

    const response = await apiCall<ClientSearchResult[]>(`/Preregistro/clients/search?q=${encodeURIComponent(searchTerm.trim())}`)
    return Array.isArray(response) ? response.map(client => ({
      uid: client.uid,
      displayName: client.displayName,
      label: client.label || client.displayName
    })) : []
  } catch (error) {
    console.error('Error searching clients by name:', error)
    return []
  }
}

/**
 * Get preregistro statistics for dashboard
 */
export async function getPreregistroStatistics(): Promise<PreregistroStatistics | null> {
  try {
    const response = await apiCall<{ statistics: PreregistroStatistics }>('/preregistro/statistics')
    return response.statistics
  } catch (error) {
    console.error('Error fetching statistics:', error)
    return null
  }
}

/**
 * Health check for API connectivity
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    await apiCall('/preregistro/health')
    return true
  } catch (error) {
    console.error('API health check failed:', error)
    return false
  }
}

/**
 * Generate CI document URL for a given CI number
 */
export function getCIDocumentUrl(ciNumber: string): string {
  return `${API_BASE}/preregistro/ci/${ciNumber}/document`
}

/**
 * Helper function to format package data for display
 */
export function formatPackageForDisplay(pkg: PreregistroPackage): string {
  return `${pkg.numeroTracking} - ${pkg.numeroCasillero} (${pkg.peso}kg)`
}

/**
 * Validate tracking number format (basic validation)
 */
export function validateTrackingNumber(trackingNumber: string): boolean {
  if (!trackingNumber || trackingNumber.trim().length < 3) {
    return false
  }
  
  // Remove whitespace and check minimum length
  const cleaned = trackingNumber.trim()
  return cleaned.length >= 3 && cleaned.length <= 50
}

/**
 * Validate peso format and range
 */
export function validatePeso(peso: string): boolean {
  if (!peso || peso.trim() === '') {
    return false
  }
  
  const pesoNum = parseFloat(peso)
  return !isNaN(pesoNum) && pesoNum > 0 && pesoNum <= 1000 // Max 1000kg
}
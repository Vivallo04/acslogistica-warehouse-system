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
  suggestedMatch?: PreregistroPackage // Auto-selected partial match based on business logic
  filteredByClient?: PreregistroPackage[] // Matches filtered by selected client
  needsUserSelection?: boolean // True when multiple matches require user choice
  autoSelectedClient?: ClientSearchResult // Auto-selected client from suggested match
  matchingLogic?: string // Debug info about matching logic
}

export interface PreregistroResponse {
  success: boolean
  message: string
  data?: {
    ci_paquete: string
    nid: number
    pdfUrl?: string
    finalStatus?: string
    finalStatusId?: number
    actionTaken?: 'created' | 'updated' | 'status_changed'
    previousStatus?: string
    wasExistingPackage?: boolean
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
export async function searchPackagesByTracking(
  trackingNumber: string, 
  selectedClientId?: number
): Promise<TrackingSearchResult> {
  if (!trackingNumber.trim()) {
    return { packages: [], matchType: 'none' }
  }

  try {
    // Use the enhanced search endpoint
    const response = await apiCall<{
      allMatches: Array<{
        nid: number
        tracking: string
        content?: string
        weight?: string
        palletNumber?: string
        lockerNumber?: string
        clientName?: string
        status: string
        statusId: number
        ciPackage?: string
        date: string
      }>
      matchType: string
      exactMatch?: any
      suggestedMatch?: any
      clientFilteredMatches: Array<any>
      needsUserSelection: boolean
      autoSelectedClient?: {
        uid: number
        displayName: string
        label: string
      }
      matchingLogic: string
    }>('/Preregistro/search/enhanced', {
      method: 'POST',
      body: JSON.stringify({
        trackingNumber: trackingNumber,
        maxResults: 10,
        selectedClientId: selectedClientId
      })
    })

    // Transform backend format to frontend format
    const packages: PreregistroPackage[] = response.allMatches?.map(pkg => ({
      id: pkg.nid.toString(),
      nid: pkg.nid,
      numeroTracking: pkg.tracking,
      numeroCasillero: pkg.lockerNumber || '',
      contenido: pkg.content || '',
      peso: pkg.weight || '',
      numeroTarima: pkg.palletNumber || '',
      ci_paquete: pkg.ciPackage,
      estado: pkg.status,
      fecha_creacion: pkg.date
    })) || []
    
    // Transform suggested match
    const suggestedMatch = response.suggestedMatch ? {
      id: response.suggestedMatch.nid.toString(),
      nid: response.suggestedMatch.nid,
      numeroTracking: response.suggestedMatch.tracking,
      numeroCasillero: response.suggestedMatch.lockerNumber || '',
      contenido: response.suggestedMatch.content || '',
      peso: response.suggestedMatch.weight || '',
      numeroTarima: response.suggestedMatch.palletNumber || '',
      ci_paquete: response.suggestedMatch.ciPackage,
      estado: response.suggestedMatch.status,
      fecha_creacion: response.suggestedMatch.date
    } : undefined

    // Transform exact match
    const exactMatch = response.exactMatch ? {
      id: response.exactMatch.nid.toString(),
      nid: response.exactMatch.nid,
      numeroTracking: response.exactMatch.tracking,
      numeroCasillero: response.exactMatch.lockerNumber || '',
      contenido: response.exactMatch.content || '',
      peso: response.exactMatch.weight || '',
      numeroTarima: response.exactMatch.palletNumber || '',
      ci_paquete: response.exactMatch.ciPackage,
      estado: response.exactMatch.status,
      fecha_creacion: response.exactMatch.date
    } : undefined

    // Transform filtered matches
    const filteredByClient = response.clientFilteredMatches?.map(pkg => ({
      id: pkg.nid.toString(),
      nid: pkg.nid,
      numeroTracking: pkg.tracking,
      numeroCasillero: pkg.lockerNumber || '',
      contenido: pkg.content || '',
      peso: pkg.weight || '',
      numeroTarima: pkg.palletNumber || '',
      ci_paquete: pkg.ciPackage,
      estado: pkg.status,
      fecha_creacion: pkg.date
    })) || []

    return {
      packages,
      matchType: response.matchType as 'exact' | 'partial' | 'none',
      existingPackage: exactMatch || suggestedMatch, // Use suggested match if no exact match
      suggestedMatch,
      filteredByClient,
      needsUserSelection: response.needsUserSelection,
      autoSelectedClient: response.autoSelectedClient,
      matchingLogic: response.matchingLogic
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
  existingPackage?: PreregistroPackage,
  notificationSettings?: {
    whatsappEnabled: boolean
    whatsappOnSuccess: boolean
    whatsappOnError: boolean
  }
): Promise<PreregistroResponse> {
  try {
    // Match the backend DTO structure exactly
    const payload = {
      packageNid: existingPackage?.nid || null, // null for new packages
      trackingNumber: packageData.numeroTracking,
      weight: parseFloat(packageData.peso),
      palletNumber: packageData.numeroTarima,
      lockerNumber: packageData.numeroCasillero,
      content: packageData.contenido || null,
      userId: 1, // TODO: Get from auth context
      processingStartTime: new Date().toISOString(),
      // Include WhatsApp notification settings
      whatsappNotification: notificationSettings?.whatsappEnabled || false,
      notifyOnSuccess: notificationSettings?.whatsappOnSuccess || false,
      notifyOnError: notificationSettings?.whatsappOnError || false
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
      finalStatus?: string
      finalStatusId?: number
      actionTaken?: string
      previousStatus?: string
      wasExistingPackage?: boolean
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
        finalStatus: response.finalStatus,
        finalStatusId: response.finalStatusId,
        actionTaken: response.actionTaken as 'created' | 'updated' | 'status_changed' | undefined,
        previousStatus: response.previousStatus,
        wasExistingPackage: response.wasExistingPackage,
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
 * Minimum: 0.0950 kg
 * Maximum: 999.99 kg
 */
export function validatePeso(peso: string): boolean {
  if (!peso || peso.trim() === '') {
    return false
  }
  
  const pesoNum = parseFloat(peso)
  return !isNaN(pesoNum) && pesoNum >= 0.0950 && pesoNum <= 999.99
}

/**
 * Normalize peso to ensure minimum weight of 0.0950 kg
 * If weight is below minimum, it will be set to 0.0950 kg
 */
export function normalizePeso(peso: string): string {
  if (!peso || peso.trim() === '') {
    return ''
  }
  
  const pesoNum = parseFloat(peso)
  if (isNaN(pesoNum)) {
    return peso // Return original if not a valid number
  }
  
  const minimumWeight = 0.0950
  if (pesoNum < minimumWeight) {
    // Return with 4 decimal places to match expected format
    return minimumWeight.toFixed(4)
  }
  
  return peso // Return original if already above minimum
}
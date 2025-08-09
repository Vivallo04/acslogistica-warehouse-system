// API utility functions for processing history operations
// Integrates with the .NET WMS API backend audit logging system

export interface ProcessingHistoryDto {
  id: number
  userId: number
  userName: string
  packageNid?: number
  trackingNumber: string
  processingTimeSeconds: number
  startedAt: string
  completedAt: string
  status: string
  changesMade: string
  ciPaquete: string
}

export interface ProcessingStatsDto {
  userId: number
  userName: string
  fromDate: string
  toDate: string
  totalPackagesProcessed: number
  successfulProcesses: number
  failedProcesses: number
  totalProcessingTimeSeconds: number
  averageProcessingTimeSeconds: number
  successRate: number
  totalProcessingTimeFormatted: string
}

export interface ProcessingErrorDto {
  id: number
  userId?: number
  userName: string
  trackingNumber: string
  errorType: string
  errorMessage: string
  stackTrace: string
  requestData: string
  createdAt: string
}

export interface ProcessingHistoryRequestDto {
  userId: number
  fromDate: string
  toDate: string
  pageNumber?: number
  pageSize?: number
  trackingFilter?: string
  statusFilter?: string
}

export interface ProcessingStatsRequestDto {
  userId: number
  fromDate: string
  toDate: string
}

export interface PaginatedResponse<T> {
  success: boolean
  message: string
  data: T[]
  totalCount: number
  pageNumber: number
  pageSize: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

// Base API URL - will use local .NET API
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5001/api'

/**
 * Make an API call with error handling
 */
async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    const errorData = await response.text()
    throw new Error(`HTTP ${response.status}: ${errorData}`)
  }

  return response.json()
}

/**
 * Get processing history for a user
 */
export async function getProcessingHistory(request: ProcessingHistoryRequestDto): Promise<PaginatedResponse<ProcessingHistoryDto>> {
  return apiCall<PaginatedResponse<ProcessingHistoryDto>>('/preregistro/history', {
    method: 'POST',
    body: JSON.stringify(request)
  })
}

/**
 * Get processing statistics for a user
 */
export async function getProcessingStats(request: ProcessingStatsRequestDto): Promise<ProcessingStatsDto> {
  return apiCall<ProcessingStatsDto>('/preregistro/stats', {
    method: 'POST',
    body: JSON.stringify(request)
  })
}

/**
 * Get recent errors for troubleshooting
 */
export async function getRecentErrors(userId?: number, hours: number = 24): Promise<ProcessingErrorDto[]> {
  const params = new URLSearchParams()
  if (userId) params.append('userId', userId.toString())
  params.append('hours', hours.toString())
  
  return apiCall<ProcessingErrorDto[]>(`/preregistro/errors?${params.toString()}`)
}

/**
 * Get processing history for today
 */
export async function getTodayProcessingHistory(userId: number): Promise<PaginatedResponse<ProcessingHistoryDto>> {
  const today = new Date()
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59)

  return getProcessingHistory({
    userId,
    fromDate: startOfDay.toISOString(),
    toDate: endOfDay.toISOString(),
    pageNumber: 1,
    pageSize: 100
  })
}

/**
 * Get processing history for this week
 */
export async function getWeekProcessingHistory(userId: number): Promise<PaginatedResponse<ProcessingHistoryDto>> {
  const today = new Date()
  const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay())
  const endOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + 6, 23, 59, 59)

  return getProcessingHistory({
    userId,
    fromDate: startOfWeek.toISOString(),
    toDate: endOfWeek.toISOString(),
    pageNumber: 1,
    pageSize: 500
  })
}

/**
 * Get processing stats for today
 */
export async function getTodayProcessingStats(userId: number): Promise<ProcessingStatsDto> {
  const today = new Date()
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59)

  return getProcessingStats({
    userId,
    fromDate: startOfDay.toISOString(),
    toDate: endOfDay.toISOString()
  })
}

/**
 * Get processing stats for this week
 */
export async function getWeekProcessingStats(userId: number): Promise<ProcessingStatsDto> {
  const today = new Date()
  const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay())
  const endOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + 6, 23, 59, 59)

  return getProcessingStats({
    userId,
    fromDate: startOfWeek.toISOString(),
    toDate: endOfWeek.toISOString()
  })
}

/**
 * Format processing time for display
 */
export function formatProcessingTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}m ${remainingSeconds}s`
  } else {
    const hours = Math.floor(seconds / 3600)
    const remainingMinutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${remainingMinutes}m`
  }
}

/**
 * Format success rate for display
 */
export function formatSuccessRate(rate: number): string {
  return `${rate.toFixed(1)}%`
}

/**
 * Get status color for UI display
 */
export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'success':
      return 'text-green-600'
    case 'failed':
      return 'text-red-600'
    case 'partial':
      return 'text-yellow-600'
    default:
      return 'text-gray-600'
  }
}

/**
 * Get status badge variant for UI display
 */
export function getStatusBadgeVariant(status: string): 'default' | 'destructive' | 'secondary' {
  switch (status.toLowerCase()) {
    case 'success':
      return 'default'
    case 'failed':
      return 'destructive'
    case 'partial':
      return 'secondary'
    default:
      return 'secondary'
  }
}
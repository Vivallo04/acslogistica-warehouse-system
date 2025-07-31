/**
 * WMS (WareHouse Management System) Type Definitions
 * Interfaces for packages, pallets, users, and other WMS entities
 */

// Package status enumeration
export enum PackageStatus {
  PENDING = 'pending',
  RECEIVED = 'received',
  PROCESSING = 'processing',
  READY_FOR_PICKUP = 'ready_for_pickup',
  PICKED_UP = 'picked_up',
  RETURNED = 'returned',
  DAMAGED = 'damaged',
  LOST = 'lost'
}

// Package priority levels
export enum PackagePriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

// Weight units
export enum WeightUnit {
  KG = 'kg',
  LBS = 'lbs',
  G = 'g',
  OZ = 'oz'
}

// Core Package interface
export interface Package {
  id: number
  tracking_number: string
  reference_number?: string
  sender_name?: string
  sender_phone?: string
  recipient_name: string
  recipient_phone?: string
  recipient_address?: string
  description?: string
  declared_value?: number
  currency?: string
  weight?: number
  weight_unit: WeightUnit
  dimensions?: {
    length?: number
    width?: number
    height?: number
    unit: 'cm' | 'in'
  }
  pallet_id?: number
  pallet_name?: string
  status: PackageStatus
  priority: PackagePriority
  notes?: string
  scanned_by: number // User ID
  scanned_by_name?: string
  created_at: Date
  updated_at: Date
  delivered_at?: Date
  customs_declaration?: string
  insurance_value?: number
  fragile: boolean
  requires_signature: boolean
  // Drupal compatibility fields
  drupal_node_id?: number
  drupal_user_id?: number
}

// Package creation payload (what comes from forms)
export interface CreatePackageRequest {
  tracking_number: string
  reference_number?: string
  sender_name?: string
  sender_phone?: string
  recipient_name: string
  recipient_phone?: string
  recipient_address?: string
  description?: string
  declared_value?: number
  currency?: string
  weight?: number
  weight_unit: WeightUnit
  dimensions?: {
    length?: number
    width?: number
    height?: number
    unit: 'cm' | 'in'
  }
  pallet_id?: number
  priority: PackagePriority
  notes?: string
  customs_declaration?: string
  insurance_value?: number
  fragile: boolean
  requires_signature: boolean
}

// Package update payload
export interface UpdatePackageRequest {
  reference_number?: string
  sender_name?: string
  sender_phone?: string
  recipient_name?: string
  recipient_phone?: string
  recipient_address?: string
  description?: string
  declared_value?: number
  currency?: string
  weight?: number
  weight_unit?: WeightUnit
  dimensions?: {
    length?: number
    width?: number
    height?: number
    unit: 'cm' | 'in'
  }
  pallet_id?: number
  status?: PackageStatus
  priority?: PackagePriority
  notes?: string
  customs_declaration?: string
  insurance_value?: number
  fragile?: boolean
  requires_signature?: boolean
}

// Pallet/Tarima interface
export interface Pallet {
  id: number
  name: string
  description?: string
  location?: string
  capacity?: number
  current_count: number
  is_active: boolean
  created_at: Date
  updated_at: Date
  // Drupal compatibility
  drupal_term_id?: number
}

// User interface (compatible with Drupal users table)
export interface WMSUser {
  id: number
  email: string
  username: string
  first_name?: string
  last_name?: string
  full_name?: string
  role: string
  is_active: boolean
  last_login?: Date
  created_at: Date
  updated_at: Date
  // Drupal compatibility
  drupal_uid?: number
}

// Batch scanning session
export interface BatchSession {
  id: string
  user_id: number
  user_name: string
  default_pallet_id?: number
  default_pallet_name?: string
  default_priority: PackagePriority
  default_weight_unit: WeightUnit
  packages_scanned: number
  started_at: Date
  completed_at?: Date
  status: 'active' | 'paused' | 'completed' | 'cancelled'
}

// Statistics and metrics
export interface PackageStatistics {
  total_packages: number
  packages_today: number
  packages_this_week: number
  packages_this_month: number
  by_status: Record<PackageStatus, number>
  by_priority: Record<PackagePriority, number>
  by_pallet: Array<{
    pallet_id: number
    pallet_name: string
    count: number
  }>
  top_users: Array<{
    user_id: number
    user_name: string
    count: number
  }>
  average_processing_time?: number // in minutes
  last_updated: Date
}

// API Response interfaces
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp: Date
}

export interface PaginatedResponse<T = any> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
    has_next: boolean
    has_prev: boolean
  }
  timestamp: Date
}

// Query filters and options
export interface PackageFilters {
  tracking_number?: string
  recipient_name?: string
  sender_name?: string
  status?: PackageStatus[]
  priority?: PackagePriority[]
  pallet_id?: number[]
  scanned_by?: number[]
  date_from?: string // ISO date string
  date_to?: string   // ISO date string
  search?: string    // Global search term
}

export interface PackageQueryOptions {
  page?: number
  limit?: number
  sort_by?: 'created_at' | 'updated_at' | 'tracking_number' | 'recipient_name' | 'weight'
  sort_order?: 'asc' | 'desc'
  filters?: PackageFilters
}

// WebSocket event types
export interface SocketEvents {
  'package:created': Package
  'package:updated': Package
  'package:deleted': { id: number; tracking_number: string }
  'batch:started': BatchSession
  'batch:updated': BatchSession
  'batch:completed': BatchSession
  'stats:updated': PackageStatistics
  'user:connected': { user_id: number; user_name: string }
  'user:disconnected': { user_id: number; user_name: string }
  'notification': {
    type: 'success' | 'warning' | 'error' | 'info'
    message: string
    data?: any
  }
}

// Form validation errors
export interface ValidationError {
  field: string
  message: string
  code?: string
}

export interface ValidationErrors {
  errors: ValidationError[]
  message: string
}

// Note: All interfaces and enums are already exported at their declarations
// This file serves as the main types entry point
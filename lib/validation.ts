/**
 * Zod Validation Schemas for WMS API
 * Comprehensive validation for all WMS operations
 */

import { z } from 'zod'
import { PackageStatus, PackagePriority, WeightUnit } from '@/types/wms'

// Enums as Zod schemas
export const PackageStatusSchema = z.enum([
  PackageStatus.PENDING,
  PackageStatus.RECEIVED,
  PackageStatus.PROCESSING,
  PackageStatus.READY_FOR_PICKUP,
  PackageStatus.PICKED_UP,
  PackageStatus.RETURNED,
  PackageStatus.DAMAGED,
  PackageStatus.LOST
])

export const PackagePrioritySchema = z.enum([
  PackagePriority.LOW,
  PackagePriority.NORMAL,
  PackagePriority.HIGH,
  PackagePriority.URGENT
])

export const WeightUnitSchema = z.enum([
  WeightUnit.KG,
  WeightUnit.LBS,
  WeightUnit.G,
  WeightUnit.OZ
])

// Base validation schemas
export const TrackingNumberSchema = z.string()
  .min(3, 'Tracking number must be at least 3 characters')
  .max(50, 'Tracking number cannot exceed 50 characters')
  .regex(/^[A-Za-z0-9\-_]+$/, 'Tracking number can only contain letters, numbers, hyphens, and underscores')
  .transform(str => str.toUpperCase().trim())

export const PhoneSchema = z.string()
  .min(8, 'Phone number must be at least 8 digits')
  .max(20, 'Phone number cannot exceed 20 characters')
  .regex(/^[\+]?[0-9\-\s\(\)]+$/, 'Invalid phone number format')
  .transform(str => str.trim())

export const WeightSchema = z.number()
  .min(0.0000001, 'Weight must be at least 0.0000001 kg (0.0001 grams)')
  .max(999.99, 'Weight cannot exceed 999.99 kg')
  .transform(num => Number(num.toFixed(6))) // Round to 6 decimal places for precision

export const CurrencySchema = z.string()
  .length(3, 'Currency code must be 3 characters')
  .regex(/^[A-Z]{3}$/, 'Currency code must be 3 uppercase letters')
  .default('USD')

export const DimensionsSchema = z.object({
  length: z.number().positive().max(1000).optional(),
  width: z.number().positive().max(1000).optional(),
  height: z.number().positive().max(1000).optional(),
  unit: z.enum(['cm', 'in']).default('cm')
}).optional()

// Package validation schemas
export const CreatePackageSchema = z.object({
  tracking_number: TrackingNumberSchema,
  reference_number: z.string()
    .max(50, 'Reference number cannot exceed 50 characters')
    .transform(str => str.trim())
    .optional(),
  sender_name: z.string()
    .max(100, 'Sender name cannot exceed 100 characters')
    .transform(str => str.trim())
    .optional(),
  sender_phone: PhoneSchema.optional(),
  recipient_name: z.string()
    .min(2, 'Recipient name must be at least 2 characters')
    .max(100, 'Recipient name cannot exceed 100 characters')
    .transform(str => str.trim()),
  recipient_phone: PhoneSchema.optional(),
  recipient_address: z.string()
    .max(500, 'Address cannot exceed 500 characters')
    .transform(str => str.trim())
    .optional(),
  description: z.string()
    .max(1000, 'Description cannot exceed 1000 characters')
    .transform(str => str.trim())
    .optional(),
  declared_value: z.number()
    .nonnegative('Declared value must be non-negative')
    .max(1000000, 'Declared value cannot exceed 1,000,000')
    .optional(),
  currency: CurrencySchema.optional(),
  weight: WeightSchema.optional(),
  weight_unit: WeightUnitSchema.default(WeightUnit.KG),
  dimensions: DimensionsSchema,
  pallet_id: z.number()
    .int('Pallet ID must be an integer')
    .positive('Pallet ID must be positive')
    .optional(),
  priority: PackagePrioritySchema.default(PackagePriority.NORMAL),
  notes: z.string()
    .max(2000, 'Notes cannot exceed 2000 characters')
    .transform(str => str.trim())
    .optional(),
  customs_declaration: z.string()
    .max(500, 'Customs declaration cannot exceed 500 characters')
    .transform(str => str.trim())
    .optional(),
  insurance_value: z.number()
    .nonnegative('Insurance value must be non-negative')
    .max(1000000, 'Insurance value cannot exceed 1,000,000')
    .optional(),
  fragile: z.boolean().default(false),
  requires_signature: z.boolean().default(false)
})

export const UpdatePackageSchema = CreatePackageSchema.partial().omit({
  tracking_number: true
}).extend({
  status: PackageStatusSchema.optional()
})

// Batch operation schemas
export const BatchSessionSchema = z.object({
  default_pallet_id: z.number()
    .int('Pallet ID must be an integer')
    .positive('Pallet ID must be positive')
    .optional(),
  default_priority: PackagePrioritySchema.default(PackagePriority.NORMAL),
  default_weight_unit: WeightUnitSchema.default(WeightUnit.KG)
})

export const BatchScanSchema = z.object({
  session_id: z.string()
    .min(1, 'Session ID is required'),
  tracking_number: TrackingNumberSchema,
  weight: WeightSchema.optional(),
  recipient_name: z.string()
    .min(2, 'Recipient name must be at least 2 characters')
    .max(100, 'Recipient name cannot exceed 100 characters')
    .transform(str => str.trim())
    .optional(),
  notes: z.string()
    .max(500, 'Notes cannot exceed 500 characters')
    .transform(str => str.trim())
    .optional()
})

// Query parameter schemas
export const PackageFiltersSchema = z.object({
  tracking_number: z.string().transform(str => str.trim()).optional(),
  recipient_name: z.string().transform(str => str.trim()).optional(),
  sender_name: z.string().transform(str => str.trim()).optional(),
  status: z.array(PackageStatusSchema).optional(),
  priority: z.array(PackagePrioritySchema).optional(),
  pallet_id: z.array(z.number().int().positive()).optional(),
  scanned_by: z.array(z.number().int().positive()).optional(),
  date_from: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional(),
  date_to: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional(),
  search: z.string()
    .min(1, 'Search term must be at least 1 character')
    .max(100, 'Search term cannot exceed 100 characters')
    .transform(str => str.trim())
    .optional()
})

export const PackageQueryOptionsSchema = z.object({
  page: z.number()
    .int('Page must be an integer')
    .min(1, 'Page must be at least 1')
    .default(1),
  limit: z.number()
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .default(50),
  sort_by: z.enum(['created_at', 'updated_at', 'tracking_number', 'recipient_name', 'weight'])
    .default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  filters: PackageFiltersSchema.optional()
})

// Pallet schemas
export const CreatePalletSchema = z.object({
  name: z.string()
    .min(2, 'Pallet name must be at least 2 characters')
    .max(50, 'Pallet name cannot exceed 50 characters')
    .transform(str => str.trim()),
  description: z.string()
    .max(500, 'Description cannot exceed 500 characters')
    .transform(str => str.trim())
    .optional(),
  location: z.string()
    .max(100, 'Location cannot exceed 100 characters')
    .transform(str => str.trim())
    .optional(),
  capacity: z.number()
    .int('Capacity must be an integer')
    .positive('Capacity must be positive')
    .max(10000, 'Capacity cannot exceed 10,000')
    .optional()
})

export const UpdatePalletSchema = CreatePalletSchema.partial().extend({
  is_active: z.boolean().optional()
})

// Label printing schemas
export const PrintLabelSchema = z.object({
  package_ids: z.array(z.number().int().positive())
    .min(1, 'At least one package ID is required')
    .max(100, 'Cannot print more than 100 labels at once'),
  format: z.enum(['4x6', 'letter', 'a4']).default('4x6'),
  include_barcode: z.boolean().default(true),
  include_logo: z.boolean().default(true)
})

// Export schemas
export const ExportPackagesSchema = z.object({
  format: z.enum(['csv', 'xlsx']).default('csv'),
  date_from: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional(),
  date_to: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional(),
  filters: PackageFiltersSchema.optional(),
  include_fields: z.array(z.string()).optional()
})

// Statistics schemas
export const StatisticsQuerySchema = z.object({
  date_from: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional(),
  date_to: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional(),
  group_by: z.enum(['day', 'week', 'month']).default('day'),
  include_details: z.boolean().default(false)
})

// User authentication schemas (for API integration)
export const LoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number')
})

export const UserUpdateSchema = z.object({
  first_name: z.string()
    .max(50, 'First name cannot exceed 50 characters')
    .transform(str => str.trim())
    .optional(),
  last_name: z.string()
    .max(50, 'Last name cannot exceed 50 characters')
    .transform(str => str.trim())
    .optional(),
  phone: PhoneSchema.optional()
})

// Generic ID parameter schema
export const IdParamSchema = z.object({
  id: z.string()
    .regex(/^\d+$/, 'ID must be a valid number')
    .transform(str => parseInt(str, 10))
})

// Validation helper functions
export function validatePackageData(data: unknown) {
  return CreatePackageSchema.safeParse(data)
}

export function validatePackageUpdate(data: unknown) {
  return UpdatePackageSchema.safeParse(data)
}

export function validateQueryParams(data: unknown) {
  return PackageQueryOptionsSchema.safeParse(data)
}

export function validateFilters(data: unknown) {
  return PackageFiltersSchema.safeParse(data)
}

export function validateBatchSession(data: unknown) {
  return BatchSessionSchema.safeParse(data)
}

export function validateBatchScan(data: unknown) {
  return BatchScanSchema.safeParse(data)
}

// Custom validation error formatter
export function formatValidationError(error: z.ZodError) {
  return {
    success: false,
    error: 'Validation failed',
    details: error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code
    }))
  }
}

// Type exports for use in API routes
export type CreatePackageInput = z.infer<typeof CreatePackageSchema>
export type UpdatePackageInput = z.infer<typeof UpdatePackageSchema>
export type PackageFiltersInput = z.infer<typeof PackageFiltersSchema>
export type PackageQueryOptionsInput = z.infer<typeof PackageQueryOptionsSchema>
export type BatchSessionInput = z.infer<typeof BatchSessionSchema>
export type BatchScanInput = z.infer<typeof BatchScanSchema>
export type CreatePalletInput = z.infer<typeof CreatePalletSchema>
export type UpdatePalletInput = z.infer<typeof UpdatePalletSchema>
export type PrintLabelInput = z.infer<typeof PrintLabelSchema>
export type ExportPackagesInput = z.infer<typeof ExportPackagesSchema>
export type StatisticsQueryInput = z.infer<typeof StatisticsQuerySchema>
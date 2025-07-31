/**
 * Database Abstraction Layer for Drupal Compatibility
 * Maps modern WMS API fields to Drupal database structure
 */

import { mysql_db } from './mysql'
import type { 
  Package, 
  CreatePackageRequest, 
  UpdatePackageRequest,
  Pallet,
  WMSUser,
  PackageFilters,
  PackageQueryOptions,
  PaginatedResponse,
  PackageStatistics
} from '@/types/wms'
import { PackageStatus, PackagePriority, WeightUnit } from '@/types/wms'

// Drupal field mappings - maps our modern fields to Drupal database columns
const FIELD_MAPPINGS = {
  packages: {
    // Core fields
    id: 'nid',
    tracking_number: 'field_tracking_number_value',
    reference_number: 'field_reference_number_value',
    sender_name: 'field_sender_name_value',
    sender_phone: 'field_sender_phone_value',
    recipient_name: 'field_recipient_name_value',
    recipient_phone: 'field_recipient_phone_value',
    recipient_address: 'field_recipient_address_value',
    description: 'field_description_value',
    declared_value: 'field_declared_value_value',
    currency: 'field_currency_value',
    weight: 'field_weight_value',
    weight_unit: 'field_weight_unit_value',
    pallet_id: 'field_pallet_target_id',
    status: 'field_status_value',
    priority: 'field_priority_value',
    notes: 'field_notes_value',
    scanned_by: 'uid',
    created_at: 'created',
    updated_at: 'changed',
    delivered_at: 'field_delivered_at_value',
    customs_declaration: 'field_customs_declaration_value',
    insurance_value: 'field_insurance_value_value',
    fragile: 'field_fragile_value',
    requires_signature: 'field_requires_signature_value',
    // Dimension fields
    length: 'field_dimensions_length',
    width: 'field_dimensions_width',
    height: 'field_dimensions_height',
    dimension_unit: 'field_dimensions_unit'
  },
  pallets: {
    id: 'tid',
    name: 'name',
    description: 'description__value',
    location: 'field_location_value',
    capacity: 'field_capacity_value',
    is_active: 'field_active_value',
    created_at: 'created',
    updated_at: 'changed'
  },
  users: {
    id: 'uid',
    email: 'mail',
    username: 'name',
    first_name: 'field_first_name_value',
    last_name: 'field_last_name_value',
    is_active: 'status',
    last_login: 'access',
    created_at: 'created',
    updated_at: 'changed'
  }
}

export class WMSDatabase {
  private static instance: WMSDatabase
  
  private constructor() {}
  
  static getInstance(): WMSDatabase {
    if (!WMSDatabase.instance) {
      WMSDatabase.instance = new WMSDatabase()
    }
    return WMSDatabase.instance
  }

  // PACKAGE OPERATIONS

  /**
   * Create a new package record
   */
  async createPackage(packageData: CreatePackageRequest, userId: number): Promise<Package> {
    const timestamp = mysql_db.getCurrentUnixTimestamp()
    
    // First, insert into node table
    const nodeResult = await mysql_db.insert(`
      INSERT INTO node (
        type, title, uid, status, created, changed, promote, sticky, language
      ) VALUES (?, ?, ?, 1, ?, ?, 0, 0, 'und')
    `, [
      'package', // node type
      packageData.tracking_number, // title
      userId,
      timestamp,
      timestamp
    ])

    const nodeId = nodeResult.insertId

    // Insert package-specific field data
    await mysql_db.insert(`
      INSERT INTO field_data_field_tracking_number (
        entity_type, bundle, entity_id, revision_id, language, delta, field_tracking_number_value
      ) VALUES ('node', 'package', ?, ?, 'und', 0, ?)
    `, [nodeId, nodeId, packageData.tracking_number])

    if (packageData.reference_number) {
      await mysql_db.insert(`
        INSERT INTO field_data_field_reference_number (
          entity_type, bundle, entity_id, revision_id, language, delta, field_reference_number_value
        ) VALUES ('node', 'package', ?, ?, 'und', 0, ?)
      `, [nodeId, nodeId, packageData.reference_number])
    }

    if (packageData.recipient_name) {
      await mysql_db.insert(`
        INSERT INTO field_data_field_recipient_name (
          entity_type, bundle, entity_id, revision_id, language, delta, field_recipient_name_value
        ) VALUES ('node', 'package', ?, ?, 'und', 0, ?)
      `, [nodeId, nodeId, packageData.recipient_name])
    }

    if (packageData.weight) {
      await mysql_db.insert(`
        INSERT INTO field_data_field_weight (
          entity_type, bundle, entity_id, revision_id, language, delta, field_weight_value
        ) VALUES ('node', 'package', ?, ?, 'und', 0, ?)
      `, [nodeId, nodeId, packageData.weight])
    }

    if (packageData.pallet_id) {
      await mysql_db.insert(`
        INSERT INTO field_data_field_pallet (
          entity_type, bundle, entity_id, revision_id, language, delta, field_pallet_target_id
        ) VALUES ('node', 'package', ?, ?, 'und', 0, ?)
      `, [nodeId, nodeId, packageData.pallet_id])
    }

    // Set status
    await mysql_db.insert(`
      INSERT INTO field_data_field_status (
        entity_type, bundle, entity_id, revision_id, language, delta, field_status_value
      ) VALUES ('node', 'package', ?, ?, 'und', 0, ?)
    `, [nodeId, nodeId, PackageStatus.RECEIVED])

    // Set priority
    await mysql_db.insert(`
      INSERT INTO field_data_field_priority (
        entity_type, bundle, entity_id, revision_id, language, delta, field_priority_value
      ) VALUES ('node', 'package', ?, ?, 'und', 0, ?)
    `, [nodeId, nodeId, packageData.priority])

    // Return the created package
    const createdPackage = await this.getPackageById(nodeId)
    if (!createdPackage) {
      throw new Error('Failed to retrieve created package')
    }
    return createdPackage
  }

  /**
   * Get package by ID
   */
  async getPackageById(id: number): Promise<Package | null> {
    const sql = `
      SELECT 
        n.nid as id,
        n.title,
        n.uid as scanned_by,
        n.created,
        n.changed as updated_at,
        u.name as scanned_by_name,
        u.mail as scanned_by_email,
        -- Package fields
        tracking.field_tracking_number_value as tracking_number,
        ref_num.field_reference_number_value as reference_number,
        sender_name.field_sender_name_value as sender_name,
        sender_phone.field_sender_phone_value as sender_phone,
        recipient_name.field_recipient_name_value as recipient_name,
        recipient_phone.field_recipient_phone_value as recipient_phone,
        recipient_addr.field_recipient_address_value as recipient_address,
        description.field_description_value as description,
        declared_value.field_declared_value_value as declared_value,
        currency.field_currency_value as currency,
        weight.field_weight_value as weight,
        weight_unit.field_weight_unit_value as weight_unit,
        pallet_ref.field_pallet_target_id as pallet_id,
        pallet_term.name as pallet_name,
        status.field_status_value as status,
        priority.field_priority_value as priority,
        notes.field_notes_value as notes,
        delivered.field_delivered_at_value as delivered_at,
        customs.field_customs_declaration_value as customs_declaration,
        insurance.field_insurance_value_value as insurance_value,
        fragile.field_fragile_value as fragile,
        signature.field_requires_signature_value as requires_signature,
        -- Dimensions
        dim_length.field_dimensions_length as length,
        dim_width.field_dimensions_width as width,
        dim_height.field_dimensions_height as height,
        dim_unit.field_dimensions_unit as dimension_unit
      FROM node n
      LEFT JOIN users u ON n.uid = u.uid
      -- Package field joins
      LEFT JOIN field_data_field_tracking_number tracking ON n.nid = tracking.entity_id
      LEFT JOIN field_data_field_reference_number ref_num ON n.nid = ref_num.entity_id
      LEFT JOIN field_data_field_sender_name sender_name ON n.nid = sender_name.entity_id
      LEFT JOIN field_data_field_sender_phone sender_phone ON n.nid = sender_phone.entity_id
      LEFT JOIN field_data_field_recipient_name recipient_name ON n.nid = recipient_name.entity_id
      LEFT JOIN field_data_field_recipient_phone recipient_phone ON n.nid = recipient_phone.entity_id
      LEFT JOIN field_data_field_recipient_address recipient_addr ON n.nid = recipient_addr.entity_id
      LEFT JOIN field_data_field_description description ON n.nid = description.entity_id
      LEFT JOIN field_data_field_declared_value declared_value ON n.nid = declared_value.entity_id
      LEFT JOIN field_data_field_currency currency ON n.nid = currency.entity_id
      LEFT JOIN field_data_field_weight weight ON n.nid = weight.entity_id
      LEFT JOIN field_data_field_weight_unit weight_unit ON n.nid = weight_unit.entity_id
      LEFT JOIN field_data_field_pallet pallet_ref ON n.nid = pallet_ref.entity_id
      LEFT JOIN taxonomy_term_data pallet_term ON pallet_ref.field_pallet_target_id = pallet_term.tid
      LEFT JOIN field_data_field_status status ON n.nid = status.entity_id
      LEFT JOIN field_data_field_priority priority ON n.nid = priority.entity_id
      LEFT JOIN field_data_field_notes notes ON n.nid = notes.entity_id
      LEFT JOIN field_data_field_delivered_at delivered ON n.nid = delivered.entity_id
      LEFT JOIN field_data_field_customs_declaration customs ON n.nid = customs.entity_id
      LEFT JOIN field_data_field_insurance_value insurance ON n.nid = insurance.entity_id
      LEFT JOIN field_data_field_fragile fragile ON n.nid = fragile.entity_id
      LEFT JOIN field_data_field_requires_signature signature ON n.nid = signature.entity_id
      LEFT JOIN field_data_field_dimensions_length dim_length ON n.nid = dim_length.entity_id
      LEFT JOIN field_data_field_dimensions_width dim_width ON n.nid = dim_width.entity_id
      LEFT JOIN field_data_field_dimensions_height dim_height ON n.nid = dim_height.entity_id
      LEFT JOIN field_data_field_dimensions_unit dim_unit ON n.nid = dim_unit.entity_id
      WHERE n.nid = ? AND n.type = 'package'
    `

    const result = await mysql_db.queryOne<any>(sql, [id])
    if (!result) return null

    return this.mapDrupalRowToPackage(result)
  }

  /**
   * Get packages with filtering and pagination
   */
  async getPackages(options: PackageQueryOptions = {}): Promise<PaginatedResponse<Package>> {
    const {
      page = 1,
      limit = 50,
      sort_by = 'created_at',
      sort_order = 'desc',
      filters = {}
    } = options

    const offset = (page - 1) * limit
    let whereConditions = ["n.type = 'package'"]
    let params: any[] = []

    // Build WHERE conditions based on filters
    if (filters.tracking_number) {
      whereConditions.push("tracking.field_tracking_number_value LIKE ?")
      params.push(`%${filters.tracking_number}%`)
    }

    if (filters.recipient_name) {
      whereConditions.push("recipient_name.field_recipient_name_value LIKE ?")
      params.push(`%${filters.recipient_name}%`)
    }

    if (filters.status && filters.status.length > 0) {
      const statusPlaceholders = filters.status.map(() => '?').join(',')
      whereConditions.push(`status.field_status_value IN (${statusPlaceholders})`)
      params.push(...filters.status)
    }

    if (filters.pallet_id && filters.pallet_id.length > 0) {
      const palletPlaceholders = filters.pallet_id.map(() => '?').join(',')
      whereConditions.push(`pallet_ref.field_pallet_target_id IN (${palletPlaceholders})`)
      params.push(...filters.pallet_id)
    }

    if (filters.date_from) {
      const fromTimestamp = mysql_db.dateToUnixTimestamp(new Date(filters.date_from))
      whereConditions.push("n.created >= ?")
      params.push(fromTimestamp)
    }

    if (filters.date_to) {
      const toTimestamp = mysql_db.dateToUnixTimestamp(new Date(filters.date_to))
      whereConditions.push("n.created <= ?")
      params.push(toTimestamp)
    }

    // Global search
    if (filters.search) {
      whereConditions.push(`(
        tracking.field_tracking_number_value LIKE ? OR
        recipient_name.field_recipient_name_value LIKE ? OR
        sender_name.field_sender_name_value LIKE ? OR
        ref_num.field_reference_number_value LIKE ?
      )`)
      const searchTerm = `%${filters.search}%`
      params.push(searchTerm, searchTerm, searchTerm, searchTerm)
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    // Map sort fields
    const sortFieldMap: Record<string, string> = {
      'created_at': 'n.created',
      'updated_at': 'n.changed',
      'tracking_number': 'tracking.field_tracking_number_value',
      'recipient_name': 'recipient_name.field_recipient_name_value',
      'weight': 'weight.field_weight_value'
    }

    const orderBy = `ORDER BY ${sortFieldMap[sort_by] || 'n.created'} ${sort_order.toUpperCase()}`

    // Count query
    const countSql = `
      SELECT COUNT(DISTINCT n.nid) as total
      FROM node n
      LEFT JOIN field_data_field_tracking_number tracking ON n.nid = tracking.entity_id
      LEFT JOIN field_data_field_recipient_name recipient_name ON n.nid = recipient_name.entity_id
      LEFT JOIN field_data_field_sender_name sender_name ON n.nid = sender_name.entity_id
      LEFT JOIN field_data_field_reference_number ref_num ON n.nid = ref_num.entity_id
      LEFT JOIN field_data_field_status status ON n.nid = status.entity_id
      LEFT JOIN field_data_field_pallet pallet_ref ON n.nid = pallet_ref.entity_id
      ${whereClause}
    `

    const countResult = await mysql_db.queryOne<{total: number}>(countSql, params)
    const total = countResult?.total || 0

    // Main query (reuse the complex SQL from getPackageById but with filtering)
    const sql = `
      SELECT 
        n.nid as id,
        n.title,
        n.uid as scanned_by,
        n.created,
        n.changed as updated_at,
        u.name as scanned_by_name,
        tracking.field_tracking_number_value as tracking_number,
        recipient_name.field_recipient_name_value as recipient_name,
        weight.field_weight_value as weight,
        weight_unit.field_weight_unit_value as weight_unit,
        pallet_ref.field_pallet_target_id as pallet_id,
        pallet_term.name as pallet_name,
        status.field_status_value as status,
        priority.field_priority_value as priority
      FROM node n
      LEFT JOIN users u ON n.uid = u.uid
      LEFT JOIN field_data_field_tracking_number tracking ON n.nid = tracking.entity_id
      LEFT JOIN field_data_field_recipient_name recipient_name ON n.nid = recipient_name.entity_id
      LEFT JOIN field_data_field_weight weight ON n.nid = weight.entity_id
      LEFT JOIN field_data_field_weight_unit weight_unit ON n.nid = weight_unit.entity_id
      LEFT JOIN field_data_field_pallet pallet_ref ON n.nid = pallet_ref.entity_id
      LEFT JOIN taxonomy_term_data pallet_term ON pallet_ref.field_pallet_target_id = pallet_term.tid
      LEFT JOIN field_data_field_status status ON n.nid = status.entity_id
      LEFT JOIN field_data_field_priority priority ON n.nid = priority.entity_id
      ${whereClause}
      ${orderBy}
      LIMIT ? OFFSET ?
    `

    const results = await mysql_db.query<any>(sql, [...params, limit, offset])
    const packages = results.map(row => this.mapDrupalRowToPackage(row))

    const totalPages = Math.ceil(total / limit)

    return {
      success: true,
      data: packages,
      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages,
        has_next: page < totalPages,
        has_prev: page > 1
      },
      timestamp: new Date()
    }
  }

  /**
   * Get pallets/tarimas
   */
  async getPallets(): Promise<Pallet[]> {
    const sql = `
      SELECT 
        t.tid as id,
        t.name,
        t.description,
        location.field_location_value as location,
        capacity.field_capacity_value as capacity,
        active.field_active_value as is_active,
        COUNT(pallet_ref.field_pallet_target_id) as current_count
      FROM taxonomy_term_data t
      LEFT JOIN field_data_field_location location ON t.tid = location.entity_id
      LEFT JOIN field_data_field_capacity capacity ON t.tid = capacity.entity_id  
      LEFT JOIN field_data_field_active active ON t.tid = active.entity_id
      LEFT JOIN field_data_field_pallet pallet_ref ON t.tid = pallet_ref.field_pallet_target_id
      WHERE t.vid = (SELECT vid FROM taxonomy_vocabulary WHERE name = 'pallets')
      GROUP BY t.tid, t.name, t.description, location.field_location_value, capacity.field_capacity_value, active.field_active_value
      ORDER BY t.name
    `

    const results = await mysql_db.query<any>(sql)
    return results.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      location: row.location,
      capacity: row.capacity,
      current_count: row.current_count || 0,
      is_active: row.is_active === 1,
      created_at: new Date(),
      updated_at: new Date(),
      drupal_term_id: row.id
    }))
  }

  /**
   * Map Drupal database row to Package interface
   */
  private mapDrupalRowToPackage(row: any): Package {
    return {
      id: row.id,
      tracking_number: row.tracking_number || '',
      reference_number: row.reference_number,
      sender_name: row.sender_name,
      sender_phone: row.sender_phone,
      recipient_name: row.recipient_name || '',
      recipient_phone: row.recipient_phone,
      recipient_address: row.recipient_address,
      description: row.description,
      declared_value: row.declared_value,
      currency: row.currency,
      weight: row.weight,
      weight_unit: row.weight_unit || WeightUnit.KG,
      dimensions: row.length || row.width || row.height ? {
        length: row.length,
        width: row.width,
        height: row.height,
        unit: row.dimension_unit || 'cm'
      } : undefined,
      pallet_id: row.pallet_id,
      pallet_name: row.pallet_name,
      status: row.status || PackageStatus.RECEIVED,
      priority: row.priority || PackagePriority.NORMAL,
      notes: row.notes,
      scanned_by: row.scanned_by,
      scanned_by_name: row.scanned_by_name,
      created_at: mysql_db.unixTimestampToDate(row.created),
      updated_at: mysql_db.unixTimestampToDate(row.updated_at),
      delivered_at: row.delivered_at ? mysql_db.unixTimestampToDate(row.delivered_at) : undefined,
      customs_declaration: row.customs_declaration,
      insurance_value: row.insurance_value,
      fragile: row.fragile === 1,
      requires_signature: row.requires_signature === 1,
      drupal_node_id: row.id,
      drupal_user_id: row.scanned_by
    }
  }

  /**
   * Get package statistics
   */
  async getPackageStatistics(): Promise<PackageStatistics> {
    const now = new Date()
    const todayStart = mysql_db.dateToUnixTimestamp(new Date(now.getFullYear(), now.getMonth(), now.getDate()))
    const weekStart = mysql_db.dateToUnixTimestamp(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000))
    const monthStart = mysql_db.dateToUnixTimestamp(new Date(now.getFullYear(), now.getMonth(), 1))

    // Total packages
    const totalResult = await mysql_db.queryOne<{count: number}>(`
      SELECT COUNT(*) as count FROM node WHERE type = 'package'
    `)

    // Today's packages
    const todayResult = await mysql_db.queryOne<{count: number}>(`
      SELECT COUNT(*) as count FROM node WHERE type = 'package' AND created >= ?
    `, [todayStart])

    // This week's packages
    const weekResult = await mysql_db.queryOne<{count: number}>(`
      SELECT COUNT(*) as count FROM node WHERE type = 'package' AND created >= ?
    `, [weekStart])

    // This month's packages
    const monthResult = await mysql_db.queryOne<{count: number}>(`
      SELECT COUNT(*) as count FROM node WHERE type = 'package' AND created >= ?
    `, [monthStart])

    // By status
    const statusResults = await mysql_db.query<{status: string, count: number}>(`
      SELECT 
        COALESCE(status.field_status_value, 'received') as status,
        COUNT(*) as count
      FROM node n
      LEFT JOIN field_data_field_status status ON n.nid = status.entity_id
      WHERE n.type = 'package'
      GROUP BY status.field_status_value
    `)

    // By pallet
    const palletResults = await mysql_db.query<{pallet_id: number, pallet_name: string, count: number}>(`
      SELECT 
        pallet_ref.field_pallet_target_id as pallet_id,
        pallet_term.name as pallet_name,
        COUNT(*) as count
      FROM node n
      LEFT JOIN field_data_field_pallet pallet_ref ON n.nid = pallet_ref.entity_id
      LEFT JOIN taxonomy_term_data pallet_term ON pallet_ref.field_pallet_target_id = pallet_term.tid
      WHERE n.type = 'package' AND pallet_ref.field_pallet_target_id IS NOT NULL
      GROUP BY pallet_ref.field_pallet_target_id, pallet_term.name
      ORDER BY count DESC
      LIMIT 10
    `)

    // Top users
    const userResults = await mysql_db.query<{user_id: number, user_name: string, count: number}>(`
      SELECT 
        n.uid as user_id,
        u.name as user_name,
        COUNT(*) as count
      FROM node n
      LEFT JOIN users u ON n.uid = u.uid
      WHERE n.type = 'package'
      GROUP BY n.uid, u.name
      ORDER BY count DESC
      LIMIT 10
    `)

    // Build status counts
    const by_status = {} as Record<PackageStatus, number>
    Object.values(PackageStatus).forEach(status => {
      by_status[status] = 0
    })
    statusResults.forEach(row => {
      if (row.status && Object.values(PackageStatus).includes(row.status as PackageStatus)) {
        by_status[row.status as PackageStatus] = row.count
      }
    })

    // Build priority counts (simplified for now)
    const by_priority = {
      [PackagePriority.LOW]: 0,
      [PackagePriority.NORMAL]: totalResult?.count || 0, // Default most to normal
      [PackagePriority.HIGH]: 0,
      [PackagePriority.URGENT]: 0
    }

    return {
      total_packages: totalResult?.count || 0,
      packages_today: todayResult?.count || 0,
      packages_this_week: weekResult?.count || 0,
      packages_this_month: monthResult?.count || 0,
      by_status,
      by_priority,
      by_pallet: palletResults.map(row => ({
        pallet_id: row.pallet_id,
        pallet_name: row.pallet_name,
        count: row.count
      })),
      top_users: userResults.map(row => ({
        user_id: row.user_id,
        user_name: row.user_name,
        count: row.count
      })),
      last_updated: new Date()
    }
  }
}

export const wmsDb = WMSDatabase.getInstance()
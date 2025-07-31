/**
 * MySQL Database Connection Utility
 * Handles connections to existing Drupal MySQL database
 */

import mysql from 'mysql2/promise'

// Database connection configuration
interface DatabaseConfig {
  host: string
  port: number
  user: string
  password: string
  database: string
  connectionLimit: number
  acquireTimeout: number
  timeout: number
}

class MySQLConnection {
  private static instance: MySQLConnection
  private pool: mysql.Pool | null = null
  private isConnected: boolean = false

  private constructor() {}

  static getInstance(): MySQLConnection {
    if (!MySQLConnection.instance) {
      MySQLConnection.instance = new MySQLConnection()
    }
    return MySQLConnection.instance
  }

  async connect(): Promise<void> {
    if (this.isConnected && this.pool) {
      return // Already connected
    }

    try {
      const config: DatabaseConfig = {
        host: process.env.MYSQL_HOST || 'localhost',
        port: parseInt(process.env.MYSQL_PORT || '3306'),
        user: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASSWORD || '',
        database: process.env.MYSQL_DATABASE || 'acslogistica_drupal',
        connectionLimit: 10,
        acquireTimeout: 60000,
        timeout: 60000,
      }

      console.log('Connecting to MySQL database...')
      
      this.pool = mysql.createPool({
        ...config,
        waitForConnections: true,
        queueLimit: 0,
        charset: 'utf8mb4',
        timezone: 'Z',
      })

      // Test the connection
      const connection = await this.pool.getConnection()
      await connection.ping()
      connection.release()

      this.isConnected = true
      console.log('Successfully connected to MySQL database')
      
    } catch (error) {
      console.error('MySQL connection error:', error)
      this.isConnected = false
      throw error
    }
  }

  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end()
      this.pool = null
      this.isConnected = false
      console.log('Disconnected from MySQL database')
    }
  }

  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    await this.connect()
    
    if (!this.pool) {
      throw new Error('Database connection not available')
    }

    try {
      const [rows] = await this.pool.execute(sql, params || [])
      return rows as T[]
    } catch (error) {
      console.error('MySQL query error:', error)
      console.error('SQL:', sql)
      console.error('Params:', params)
      throw error
    }
  }

  async queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
    const results = await this.query<T>(sql, params)
    return results.length > 0 ? results[0] : null
  }

  async insert(sql: string, params?: any[]): Promise<{ insertId: number; affectedRows: number }> {
    await this.connect()
    
    if (!this.pool) {
      throw new Error('Database connection not available')
    }

    try {
      const [result] = await this.pool.execute(sql, params || [])
      const insertResult = result as mysql.ResultSetHeader
      return {
        insertId: insertResult.insertId,
        affectedRows: insertResult.affectedRows
      }
    } catch (error) {
      console.error('MySQL insert error:', error)
      console.error('SQL:', sql)
      console.error('Params:', params)
      throw error
    }
  }

  async update(sql: string, params?: any[]): Promise<number> {
    await this.connect()
    
    if (!this.pool) {
      throw new Error('Database connection not available')
    }

    try {
      const [result] = await this.pool.execute(sql, params || [])
      const updateResult = result as mysql.ResultSetHeader
      return updateResult.affectedRows
    } catch (error) {
      console.error('MySQL update error:', error)
      console.error('SQL:', sql)
      console.error('Params:', params)
      throw error
    }
  }

  async transaction<T>(callback: (connection: mysql.PoolConnection) => Promise<T>): Promise<T> {
    await this.connect()
    
    if (!this.pool) {
      throw new Error('Database connection not available')
    }

    const connection = await this.pool.getConnection()
    
    try {
      await connection.beginTransaction()
      const result = await callback(connection)
      await connection.commit()
      return result
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }

  async getConnectionStatus(): Promise<{ connected: boolean; message: string }> {
    try {
      await this.connect()
      
      if (!this.isConnected || !this.pool) {
        return { connected: false, message: 'Database connection not available' }
      }

      // Test connection with a simple query
      await this.query('SELECT 1 as test')
      return { connected: true, message: 'Connected to MySQL database' }
    } catch (error) {
      return { 
        connected: false, 
        message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }
    }
  }

  // Utility methods for Drupal compatibility
  
  /**
   * Convert JavaScript Date to Drupal Unix timestamp
   */
  dateToUnixTimestamp(date: Date): number {
    return Math.floor(date.getTime() / 1000)
  }

  /**
   * Convert Drupal Unix timestamp to JavaScript Date
   */
  unixTimestampToDate(timestamp: number): Date {
    return new Date(timestamp * 1000)
  }

  /**
   * Get current Unix timestamp for Drupal compatibility
   */
  getCurrentUnixTimestamp(): number {
    return Math.floor(Date.now() / 1000)
  }

  /**
   * Escape string for use in LIKE queries
   */
  escapeLike(str: string): string {
    return str.replace(/[%_\\]/g, '\\$&')
  }
}

export const mysql_db = MySQLConnection.getInstance()
export type { DatabaseConfig }
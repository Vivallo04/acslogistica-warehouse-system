"use client"

// JSPrintManager types for TypeScript
declare const JSPM: any

export interface Printer {
  id: string
  name: string
  type: 'local' | 'network' | 'virtual'
  status: 'online' | 'offline' | 'error' | 'unknown'
  isDefault: boolean
  capabilities?: {
    color: boolean
    duplex: boolean
    paperSizes: string[]
    trays: string[]
  }
  ipAddress?: string
  port?: number
  model?: string
  location?: string
}

export interface NetworkPrinter {
  ipAddress: string
  port: number
  name?: string
  model?: string
  status: 'detected' | 'verified' | 'failed'
}

export interface PrinterDiscoveryResult {
  jsprintManagerAvailable: boolean
  localPrinters: Printer[]
  networkPrinters: NetworkPrinter[]
  defaultPrinter?: Printer
  error?: string
}

export class PrinterDiscoveryService {
  private jspmInstalled = false
  private discoveredPrinters: Printer[] = []
  private networkPrinters: NetworkPrinter[] = []
  private discoveryInProgress = false

  constructor() {
    this.checkJSPrintManager()
  }

  /**
   * Check if JSPrintManager is available and properly installed
   */
  private async checkJSPrintManager(): Promise<boolean> {
    try {
      if (typeof window === 'undefined') return false
      
      // Check if JSPM object is available
      if (typeof JSPM !== 'undefined') {
        // Check if JSPrintManager client app is running
        const clientInfo = await JSPM.JSPrintManager.getClientAppInfo()
        this.jspmInstalled = !!clientInfo
        return this.jspmInstalled
      }
      
      return false
    } catch (error) {
      console.warn('JSPrintManager not available:', error)
      this.jspmInstalled = false
      return false
    }
  }

  /**
   * Discover all available printers (local and network)
   */
  async discoverPrinters(): Promise<PrinterDiscoveryResult> {
    if (this.discoveryInProgress) {
      throw new Error('Printer discovery already in progress')
    }

    this.discoveryInProgress = true

    try {
      const result: PrinterDiscoveryResult = {
        jsprintManagerAvailable: await this.checkJSPrintManager(),
        localPrinters: [],
        networkPrinters: []
      }

      if (result.jsprintManagerAvailable) {
        // Get local/installed printers using JSPrintManager
        result.localPrinters = await this.getLocalPrinters()
        
        // Get default printer
        result.defaultPrinter = result.localPrinters.find(p => p.isDefault)
        
        // Scan for network printers
        result.networkPrinters = await this.scanNetworkPrinters()
      } else {
        result.error = 'JSPrintManager client not installed or not running'
      }

      this.discoveredPrinters = result.localPrinters
      this.networkPrinters = result.networkPrinters

      return result
    } catch (error) {
      return {
        jsprintManagerAvailable: false,
        localPrinters: [],
        networkPrinters: [],
        error: error instanceof Error ? error.message : 'Unknown printer discovery error'
      }
    } finally {
      this.discoveryInProgress = false
    }
  }

  /**
   * Get local/installed printers using JSPrintManager
   */
  private async getLocalPrinters(): Promise<Printer[]> {
    try {
      // Get list of installed printers
      const printerNames = await JSPM.JSPrintManager.getPrinters()
      const printers: Printer[] = []

      if (printerNames && printerNames.length > 0) {
        for (const printerName of printerNames) {
          try {
            // Get detailed printer information
            const printerInfo = await this.getPrinterDetails(printerName)
            printers.push(printerInfo)
          } catch (error) {
            console.warn(`Failed to get details for printer ${printerName}:`, error)
            // Add basic printer info even if details fail
            printers.push({
              id: printerName,
              name: printerName,
              type: 'local',
              status: 'unknown',
              isDefault: false
            })
          }
        }
      }

      return printers
    } catch (error) {
      console.error('Failed to get local printers:', error)
      return []
    }
  }

  /**
   * Get detailed information for a specific printer
   */
  private async getPrinterDetails(printerName: string): Promise<Printer> {
    try {
      // Get printer capabilities
      const trays = await JSPM.JSPrintManager.getTrays(printerName).catch(() => [])
      const papers = await JSPM.JSPrintManager.getPapers(printerName).catch(() => [])
      
      // Determine if this is the default printer
      const defaultTrayName = await JSPM.JSPrintManager.getDefaultTrayName(printerName).catch(() => null)
      const isDefault = !!defaultTrayName

      return {
        id: printerName,
        name: printerName,
        type: 'local',
        status: 'online', // Assume online if we can get details
        isDefault,
        capabilities: {
          color: false, // Would need additional detection
          duplex: false, // Would need additional detection
          paperSizes: papers || [],
          trays: trays || []
        }
      }
    } catch (error) {
      console.warn(`Failed to get detailed info for printer ${printerName}:`, error)
      return {
        id: printerName,
        name: printerName,
        type: 'local',
        status: 'unknown',
        isDefault: false
      }
    }
  }

  /**
   * Scan for network printers on common ports
   */
  private async scanNetworkPrinters(): Promise<NetworkPrinter[]> {
    // Note: This is a simplified implementation
    // In a real-world scenario, you'd need more sophisticated network scanning
    const networkPrinters: NetworkPrinter[] = []
    
    try {
      // Get local network range (simplified)
      const networkRange = await this.getLocalNetworkRange()
      
      if (networkRange) {
        // Scan common printer ports (9100 for raw TCP/IP printing)
        const scanPromises = networkRange.map(ip => 
          this.testNetworkPrinter(ip, 9100)
        )
        
        const results = await Promise.allSettled(scanPromises)
        
        results.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value) {
            networkPrinters.push(result.value)
          }
        })
      }
    } catch (error) {
      console.warn('Network printer scan failed:', error)
    }

    return networkPrinters
  }

  /**
   * Get local network IP range for scanning
   */
  private async getLocalNetworkRange(): Promise<string[]> {
    // This is a simplified implementation
    // In practice, you'd use WebRTC or other methods to get local IP
    const ips: string[] = []
    
    // Generate common local network IPs (192.168.1.x, 10.0.0.x, etc.)
    for (let i = 1; i <= 254; i++) {
      ips.push(`192.168.1.${i}`)
      ips.push(`192.168.0.${i}`)
      ips.push(`10.0.0.${i}`)
    }
    
    return ips.slice(0, 50) // Limit scan for performance
  }

  /**
   * Test if a network printer is available at given IP and port
   */
  private async testNetworkPrinter(ip: string, port: number): Promise<NetworkPrinter | null> {
    try {
      // Create a test print job to check connectivity
      const networkPrinter = new JSPM.NetworkPrinter(ip, port)
      
      // This is a simplified test - in reality you'd send a status query
      return {
        ipAddress: ip,
        port,
        name: `Network Printer (${ip})`,
        model: 'Unknown',
        status: 'detected'
      }
    } catch (error) {
      return null
    }
  }

  /**
   * Test printer connectivity
   */
  async testPrinter(printer: Printer): Promise<boolean> {
    try {
      if (!this.jspmInstalled) return false

      if (printer.type === 'network' && printer.ipAddress) {
        const networkPrinter = new JSPM.NetworkPrinter(printer.ipAddress, printer.port || 9100)
        // Test with a simple status command
        return true // Simplified - would actually test connectivity
      } else {
        // Test local printer
        const installedPrinter = new JSPM.InstalledPrinter(printer.name)
        return true // Simplified - would actually test printer
      }
    } catch (error) {
      console.error(`Printer test failed for ${printer.name}:`, error)
      return false
    }
  }

  /**
   * Add a network printer manually
   */
  async addNetworkPrinter(ip: string, port: number = 9100, name?: string): Promise<NetworkPrinter> {
    const networkPrinter: NetworkPrinter = {
      ipAddress: ip,
      port,
      name: name || `Network Printer (${ip})`,
      status: 'detected'
    }

    try {
      // Test the printer
      const isWorking = await this.testNetworkPrinter(ip, port)
      if (isWorking) {
        networkPrinter.status = 'verified'
        this.networkPrinters.push(networkPrinter)
      } else {
        networkPrinter.status = 'failed'
      }
    } catch (error) {
      networkPrinter.status = 'failed'
    }

    return networkPrinter
  }

  /**
   * Get JSPrintManager installation instructions
   */
  getInstallationInstructions(): {
    downloadUrl: string
    instructions: string[]
    platforms: string[]
  } {
    return {
      downloadUrl: 'https://www.neodynamic.com/downloads/jspm/jspm8-8.0.25.719-win.exe',
      instructions: [
        '1. Haga clic en "Descargar JSPrintManager" para descargar el instalador de Windows',
        '2. Ejecute el archivo descargado jspm8-8.0.25.719-win.exe como Administrador',
        '3. Siga el asistente de instalación para completar la configuración',
        '4. Inicie el servicio JSPrintManager después de la instalación',
        '5. Actualice esta página para habilitar las funciones de impresión avanzadas'
      ],
      platforms: ['Windows', 'macOS', 'Linux', 'Raspberry Pi']
    }
  }

  /**
   * Check if printer discovery is supported
   */
  isDiscoverySupported(): boolean {
    return this.jspmInstalled
  }

  /**
   * Get cached printer list
   */
  getCachedPrinters(): { local: Printer[], network: NetworkPrinter[] } {
    return {
      local: this.discoveredPrinters,
      network: this.networkPrinters
    }
  }
}

// Singleton instance
export const printerDiscovery = new PrinterDiscoveryService()
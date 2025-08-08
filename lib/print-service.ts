"use client"

import { PrintJob, PrintResult, PrintSettings } from './print-types'
import { printerDiscovery, Printer } from './printer-discovery'

// JSPrintManager types for TypeScript
declare const JSPM: any

export class PrintService {
  private printWindow: Window | null = null
  private isProcessing = false
  private jspmAvailable = false
  private selectedPrinter: Printer | null = null

  constructor() {
    this.checkJSPrintManager()
  }

  /**
   * Check if JSPrintManager is available
   */
  private async checkJSPrintManager(): Promise<boolean> {
    try {
      if (typeof window === 'undefined') return false
      
      if (typeof JSPM !== 'undefined') {
        const clientInfo = await JSPM.JSPrintManager.getClientAppInfo()
        this.jspmAvailable = !!clientInfo
        return this.jspmAvailable
      }
      
      return false
    } catch (error) {
      this.jspmAvailable = false
      return false
    }
  }

  /**
   * Set the selected printer for printing
   */
  setSelectedPrinter(printer: Printer | null): void {
    this.selectedPrinter = printer
  }

  /**
   * Print a PDF document using JSPrintManager or fallback to browser
   */
  async printPDF(job: PrintJob, settings: PrintSettings, targetPrinter?: Printer): Promise<PrintResult> {
    try {
      // Validate PDF URL
      if (!job.pdfUrl) {
        throw new Error('No PDF URL provided')
      }

      // Check if JSPrintManager is available and try advanced printing first
      if (await this.checkJSPrintManager()) {
        const printer = targetPrinter || this.selectedPrinter
        if (printer) {
          return await this.printWithJSPrintManager(job, settings, printer)
        }
      }

      // Fallback to browser printing
      return await this.printWithBrowser(job, settings)
      
    } catch (error) {
      console.error('Print failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown print error',
        jobId: job.id
      }
    }
  }

  /**
   * Print using JSPrintManager (advanced printing)
   */
  private async printWithJSPrintManager(job: PrintJob, settings: PrintSettings, printer: Printer): Promise<PrintResult> {
    try {
      // Create a new ClientPrintJob
      const cpj = new JSPM.ClientPrintJob()

      // Set the printer
      if (printer.type === 'network' && printer.ipAddress) {
        cpj.clientPrinter = new JSPM.NetworkPrinter(printer.ipAddress, printer.port || 9100)
      } else {
        cpj.clientPrinter = new JSPM.InstalledPrinter(printer.name)
      }

      // Fetch the PDF content
      const response = await fetch(job.pdfUrl)
      if (!response.ok) {
        throw new Error('Failed to fetch PDF for printing')
      }
      
      const pdfBlob = await response.blob()
      const pdfArrayBuffer = await pdfBlob.arrayBuffer()
      const pdfBytes = new Uint8Array(pdfArrayBuffer)

      // Set the file to print
      cpj.files.push(new JSPM.PrintFile(pdfBytes, JSPM.FileSourceType.Base64, `${job.ciNumber || job.trackingNumber}.pdf`, 1))

      // Set print settings based on configuration
      if (settings.printQuality === 'high') {
        cpj.printResolution = 600
      } else if (settings.printQuality === 'normal') {
        cpj.printResolution = 300
      } else {
        cpj.printResolution = 150
      }

      // Send the job to JSPrintManager
      await JSPM.JSPrintManager.send(cpj)

      return {
        success: true,
        jobId: job.id
      }
    } catch (error) {
      console.error('JSPrintManager print failed:', error)
      throw error
    }
  }

  /**
   * Print using browser print dialog (fallback)
   */
  private async printWithBrowser(job: PrintJob, settings: PrintSettings): Promise<PrintResult> {
    try {
      // Create hidden iframe for printing
      const printFrame = await this.createPrintFrame(job.pdfUrl)
      
      // Wait for PDF to load
      await this.waitForPDFLoad(printFrame, settings.printDelay)
      
      // Trigger print
      await this.triggerPrint(printFrame)
      
      // Cleanup
      this.cleanup(printFrame)
      
      return {
        success: true,
        jobId: job.id
      }
    } catch (error) {
      console.error('Browser print failed:', error)
      throw error
    }
  }

  /**
   * Print multiple PDFs in sequence
   */
  async printBatch(jobs: PrintJob[], settings: PrintSettings): Promise<PrintResult[]> {
    if (this.isProcessing) {
      throw new Error('Print service is already processing')
    }

    this.isProcessing = true
    const results: PrintResult[] = []

    try {
      for (const job of jobs) {
        const result = await this.printPDF(job, settings)
        results.push(result)
        
        // Add delay between prints if specified
        if (settings.printDelay > 0 && job !== jobs[jobs.length - 1]) {
          await this.delay(settings.printDelay)
        }
      }
    } finally {
      this.isProcessing = false
    }

    return results
  }

  /**
   * Check if browser supports printing
   */
  isPrintSupported(): boolean {
    return typeof window !== 'undefined' && 'print' in window
  }

  /**
   * Check if JSPrintManager is available for advanced printing
   */
  async isJSPrintManagerAvailable(): Promise<boolean> {
    return await this.checkJSPrintManager()
  }

  /**
   * Get the currently selected printer
   */
  getSelectedPrinter(): Printer | null {
    return this.selectedPrinter
  }

  /**
   * Create a hidden iframe for PDF printing
   */
  private async createPrintFrame(pdfUrl: string): Promise<HTMLIFrameElement> {
    return new Promise((resolve, reject) => {
      const iframe = document.createElement('iframe')
      iframe.style.position = 'absolute'
      iframe.style.left = '-9999px'
      iframe.style.width = '1px'
      iframe.style.height = '1px'
      iframe.style.border = 'none'
      
      iframe.onload = () => {
        resolve(iframe)
      }
      
      iframe.onerror = () => {
        reject(new Error('Failed to load PDF for printing'))
      }
      
      // Set source and append to document
      iframe.src = pdfUrl
      document.body.appendChild(iframe)
      
      // Fallback timeout
      setTimeout(() => {
        if (iframe.parentNode) {
          resolve(iframe)
        }
      }, 5000)
    })
  }

  /**
   * Wait for PDF to fully load in iframe
   */
  private async waitForPDFLoad(iframe: HTMLIFrameElement, delay: number): Promise<void> {
    return new Promise((resolve) => {
      // Wait for specified delay to ensure PDF is rendered
      setTimeout(() => {
        resolve()
      }, Math.max(delay, 500)) // Minimum 500ms
    })
  }

  /**
   * Trigger print dialog for iframe content
   */
  private async triggerPrint(iframe: HTMLIFrameElement): Promise<void> {
    return new Promise((resolve) => {
      try {
        // Access iframe content window
        const iframeWindow = iframe.contentWindow
        if (iframeWindow) {
          // Focus the iframe window
          iframeWindow.focus()
          
          // Trigger print
          iframeWindow.print()
          
          // Give time for print dialog to appear
          setTimeout(() => {
            resolve()
          }, 1000)
        } else {
          // Fallback: open PDF in new window and print
          this.printInNewWindow(iframe.src)
          resolve()
        }
      } catch (error) {
        console.warn('Iframe print failed, trying new window:', error)
        this.printInNewWindow(iframe.src)
        resolve()
      }
    })
  }

  /**
   * Fallback: open PDF in new window for printing
   */
  private printInNewWindow(pdfUrl: string): void {
    if (this.printWindow && !this.printWindow.closed) {
      this.printWindow.close()
    }

    this.printWindow = window.open(pdfUrl, '_blank', 'width=800,height=600')
    
    if (this.printWindow) {
      this.printWindow.addEventListener('load', () => {
        setTimeout(() => {
          this.printWindow?.print()
        }, 1000)
      })
    }
  }

  /**
   * Clean up iframe after printing
   */
  private cleanup(iframe: HTMLIFrameElement): void {
    setTimeout(() => {
      if (iframe && iframe.parentNode) {
        iframe.parentNode.removeChild(iframe)
      }
    }, 2000) // Wait 2 seconds before cleanup
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Get print settings from localStorage
   */
  getStoredSettings(): PrintSettings | null {
    if (typeof window === 'undefined') return null
    
    try {
      const stored = localStorage.getItem('print-settings')
      return stored ? JSON.parse(stored) : null
    } catch (error) {
      console.error('Failed to load print settings:', error)
      return null
    }
  }

  /**
   * Save print settings to localStorage
   */
  saveSettings(settings: PrintSettings): void {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.setItem('print-settings', JSON.stringify(settings))
    } catch (error) {
      console.error('Failed to save print settings:', error)
    }
  }
}

// Singleton instance
export const printService = new PrintService()
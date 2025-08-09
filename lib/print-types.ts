export interface PrintSettings {
  autoPrintEnabled: boolean
  autoQueueEnabled: boolean
  defaultPrintMode: 'browser' | 'client'
  selectedPrinter?: string
  printQuality: 'draft' | 'normal' | 'high'
  enableBatchPrint: boolean
  printDelay: number // milliseconds to wait before printing
}

export interface PrintJob {
  id: string
  pdfUrl: string
  ciNumber?: string
  trackingNumber: string
  timestamp: Date
  status: 'pending' | 'printing' | 'completed' | 'failed'
  retryCount: number
  errorMessage?: string
}

export interface PrintQueueState {
  jobs: PrintJob[]
  isProcessing: boolean
  settings: PrintSettings
}

export const DEFAULT_PRINT_SETTINGS: PrintSettings = {
  autoPrintEnabled: false,
  autoQueueEnabled: false,
  defaultPrintMode: 'browser',
  printQuality: 'normal',
  enableBatchPrint: true,
  printDelay: 1000 // 1 second delay
}

export type PrintResult = {
  success: boolean
  error?: string
  jobId: string
}

export type PrintMode = 'auto' | 'manual' | 'batch'
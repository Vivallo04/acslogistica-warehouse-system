"use client"

import { useState, useCallback } from 'react'
import { PrintJob } from '@/lib/print-types'

export function usePrintQueue() {
  const [queue, setQueue] = useState<PrintJob[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  // Add job to queue
  const addJob = useCallback((job: PrintJob) => {
    setQueue(prev => {
      // Check if job with same tracking number already exists
      const existingIndex = prev.findIndex(
        existingJob => existingJob.trackingNumber === job.trackingNumber && 
                      existingJob.status === 'pending'
      )
      
      if (existingIndex >= 0) {
        // Replace existing pending job
        const updated = [...prev]
        updated[existingIndex] = job
        return updated
      } else {
        // Add new job
        return [...prev, job]
      }
    })
  }, [])

  // Remove job from queue
  const removeJob = useCallback((jobId: string) => {
    setQueue(prev => prev.filter(job => job.id !== jobId))
  }, [])

  // Update job status
  const updateJob = useCallback((jobId: string, updates: Partial<PrintJob>) => {
    setQueue(prev => prev.map(job => 
      job.id === jobId ? { ...job, ...updates } : job
    ))
  }, [])

  // Clear completed and failed jobs
  const clearProcessedJobs = useCallback(() => {
    setQueue(prev => prev.filter(job => 
      job.status === 'pending' || job.status === 'printing'
    ))
  }, [])

  // Clear entire queue
  const clearQueue = useCallback(() => {
    setQueue([])
  }, [])

  // Get queue statistics
  const getQueueStats = useCallback(() => {
    const total = queue.length
    const pending = queue.filter(job => job.status === 'pending').length
    const printing = queue.filter(job => job.status === 'printing').length
    const completed = queue.filter(job => job.status === 'completed').length
    const failed = queue.filter(job => job.status === 'failed').length

    return {
      total,
      pending,
      printing,
      completed,
      failed,
      isProcessing: printing > 0 || isProcessing
    }
  }, [queue, isProcessing])

  return {
    queue,
    isProcessing,
    setIsProcessing,
    addJob,
    removeJob,
    updateJob,
    clearProcessedJobs,
    clearQueue,
    getQueueStats
  }
}
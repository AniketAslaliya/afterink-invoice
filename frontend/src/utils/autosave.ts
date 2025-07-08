interface AutosaveOptions {
  key: string
  delay?: number
  maxDrafts?: number
}

interface DraftMetadata {
  id: string
  timestamp: number
  description: string
}

interface SavedDraft {
  id: string
  data: any
  timestamp: number
  description: string
}

class AutosaveManager {
  private timers: Map<string, NodeJS.Timeout> = new Map()
  private readonly DRAFTS_KEY = 'invoice_drafts'
  private readonly METADATA_KEY = 'invoice_drafts_metadata'

  /**
   * Save a draft to localStorage with debouncing
   */
  saveDraft(data: any, options: AutosaveOptions): void {
    const { key, delay = 2000 } = options

    // Clear existing timer for this key
    const existingTimer = this.timers.get(key)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }

    // Set new timer
    const timer = setTimeout(() => {
      this.performSave(data, options)
      this.timers.delete(key)
    }, delay)

    this.timers.set(key, timer)
  }

  /**
   * Immediately save a draft without debouncing
   */
  saveDraftImmediately(data: any, options: AutosaveOptions): void {
    this.performSave(data, options)
  }

  /**
   * Load a draft from localStorage
   */
  loadDraft(key: string): any | null {
    try {
      const drafts = this.getAllDrafts()
      const draft = drafts.find(d => d.id === key)
      return draft ? draft.data : null
    } catch (error) {
      console.error('Error loading draft:', error)
      return null
    }
  }

  /**
   * Get all saved drafts
   */
  getAllDrafts(): SavedDraft[] {
    try {
      const draftsJson = localStorage.getItem(this.DRAFTS_KEY)
      return draftsJson ? JSON.parse(draftsJson) : []
    } catch (error) {
      console.error('Error getting drafts:', error)
      return []
    }
  }

  /**
   * Get draft metadata for listing
   */
  getDraftMetadata(): DraftMetadata[] {
    try {
      const metadataJson = localStorage.getItem(this.METADATA_KEY)
      return metadataJson ? JSON.parse(metadataJson) : []
    } catch (error) {
      console.error('Error getting draft metadata:', error)
      return []
    }
  }

  /**
   * Delete a specific draft
   */
  deleteDraft(key: string): void {
    try {
      const drafts = this.getAllDrafts().filter(d => d.id !== key)
      localStorage.setItem(this.DRAFTS_KEY, JSON.stringify(drafts))
      
      const metadata = this.getDraftMetadata().filter(m => m.id !== key)
      localStorage.setItem(this.METADATA_KEY, JSON.stringify(metadata))
    } catch (error) {
      console.error('Error deleting draft:', error)
    }
  }

  /**
   * Clear all drafts
   */
  clearAllDrafts(): void {
    try {
      localStorage.removeItem(this.DRAFTS_KEY)
      localStorage.removeItem(this.METADATA_KEY)
      
      // Clear any pending timers
      this.timers.forEach(timer => clearTimeout(timer))
      this.timers.clear()
    } catch (error) {
      console.error('Error clearing drafts:', error)
    }
  }

  /**
   * Check if a draft exists
   */
  hasDraft(key: string): boolean {
    const drafts = this.getAllDrafts()
    return drafts.some(d => d.id === key)
  }

  /**
   * Get the age of a draft in minutes
   */
  getDraftAge(key: string): number | null {
    const draft = this.getAllDrafts().find(d => d.id === key)
    if (!draft) return null
    
    return Math.floor((Date.now() - draft.timestamp) / (1000 * 60))
  }

  /**
   * Internal method to perform the actual save
   */
  private performSave(data: any, options: AutosaveOptions): void {
    const { key, maxDrafts = 10 } = options

    try {
      // Skip saving if data is empty or invalid
      if (!data || this.isEmptyInvoice(data)) {
        return
      }

      const drafts = this.getAllDrafts()
      const timestamp = Date.now()
      
      // Remove existing draft with same key
      const filteredDrafts = drafts.filter(d => d.id !== key)
      
      // Create new draft
      const newDraft: SavedDraft = {
        id: key,
        data: { ...data },
        timestamp,
        description: this.generateDescription(data)
      }
      
      // Add new draft and limit total number
      const updatedDrafts = [newDraft, ...filteredDrafts].slice(0, maxDrafts)
      
      // Save to localStorage
      localStorage.setItem(this.DRAFTS_KEY, JSON.stringify(updatedDrafts))
      
      // Update metadata
      const metadata: DraftMetadata[] = updatedDrafts.map(d => ({
        id: d.id,
        timestamp: d.timestamp,
        description: d.description
      }))
      localStorage.setItem(this.METADATA_KEY, JSON.stringify(metadata))
      
      console.log(`Draft saved: ${key}`)
    } catch (error) {
      console.error('Error saving draft:', error)
    }
  }

  /**
   * Check if invoice data is considered empty
   */
  private isEmptyInvoice(data: any): boolean {
    if (!data) return true
    
    const hasContent = (
      data.clientId ||
      data.projectId ||
      (data.items && data.items.some((item: any) => 
        item.description?.trim() || 
        item.quantity > 0 || 
        item.rate > 0
      )) ||
      data.notes?.trim() ||
      data.terms?.trim()
    )
    
    return !hasContent
  }

  /**
   * Generate a human-readable description for the draft
   */
  private generateDescription(data: any): string {
    if (data.clientId && data.projectId) {
      return `Invoice for client ${data.clientId} - ${data.projectId}`
    } else if (data.clientId) {
      return `Invoice for client ${data.clientId}`
    } else if (data.items && data.items.length > 0) {
      const firstItem = data.items[0]
      const itemDesc = firstItem.description?.substring(0, 30) || 'Untitled item'
      return `Invoice with ${data.items.length} item(s) - ${itemDesc}${firstItem.description?.length > 30 ? '...' : ''}`
    } else {
      return 'New invoice draft'
    }
  }

  /**
   * Cleanup old drafts (older than specified days)
   */
  cleanupOldDrafts(maxAgeDays: number = 7): void {
    try {
      const cutoffTime = Date.now() - (maxAgeDays * 24 * 60 * 60 * 1000)
      const drafts = this.getAllDrafts().filter(d => d.timestamp > cutoffTime)
      
      localStorage.setItem(this.DRAFTS_KEY, JSON.stringify(drafts))
      
      const metadata = drafts.map(d => ({
        id: d.id,
        timestamp: d.timestamp,
        description: d.description
      }))
      localStorage.setItem(this.METADATA_KEY, JSON.stringify(metadata))
    } catch (error) {
      console.error('Error cleaning up old drafts:', error)
    }
  }
}

// Export singleton instance
export const autosaveManager = new AutosaveManager()

// Export hook for React components
export const useAutosave = (key: string, data: any, options: Partial<AutosaveOptions> = {}) => {
  const finalOptions: AutosaveOptions = {
    key,
    delay: 2000,
    maxDrafts: 10,
    ...options
  }

  React.useEffect(() => {
    if (data) {
      autosaveManager.saveDraft(data, finalOptions)
    }
  }, [data, key])

  return {
    saveDraft: (data: any) => autosaveManager.saveDraft(data, finalOptions),
    saveDraftImmediately: (data: any) => autosaveManager.saveDraftImmediately(data, finalOptions),
    loadDraft: () => autosaveManager.loadDraft(key),
    deleteDraft: () => autosaveManager.deleteDraft(key),
    hasDraft: () => autosaveManager.hasDraft(key),
    getDraftAge: () => autosaveManager.getDraftAge(key)
  }
}

// React import for the hook
import React from 'react' 
import React, { useState, useEffect } from 'react'
import { Clock, FileText, Trash2, RefreshCw, AlertCircle } from 'lucide-react'
import { autosaveManager } from '../utils/autosave'

interface DraftManagerProps {
  onRestoreDraft: (draftData: any) => void
  onClose: () => void
  isOpen: boolean
}

interface SavedDraft {
  id: string
  data: any
  timestamp: number
  description: string
}

const DraftManager: React.FC<DraftManagerProps> = ({ onRestoreDraft, onClose, isOpen }) => {
  const [drafts, setDrafts] = useState<SavedDraft[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadDrafts()
    }
  }, [isOpen])

  const loadDrafts = () => {
    setLoading(true)
    try {
      const savedDrafts = autosaveManager.getAllDrafts()
      setDrafts(savedDrafts)
    } catch (error) {
      console.error('Error loading drafts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRestoreDraft = (draft: SavedDraft) => {
    onRestoreDraft(draft.data)
    onClose()
  }

  const handleDeleteDraft = (draftId: string) => {
    autosaveManager.deleteDraft(draftId)
    setDrafts(prev => prev.filter(d => d.id !== draftId))
  }

  const handleClearAllDrafts = () => {
    if (window.confirm('Are you sure you want to delete all saved drafts? This action cannot be undone.')) {
      autosaveManager.clearAllDrafts()
      setDrafts([])
    }
  }

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) {
      return 'Just now'
    } else if (diffMins < 60) {
      return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 overflow-y-auto modal-backdrop">
      <div className="bg-gray-900 rounded-xl w-full max-w-2xl shadow-lg relative mx-4 my-8 border border-gray-700 modal-content">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-blue-400" />
            <h2 className="text-xl font-bold text-white">Saved Drafts</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadDrafts}
              className="p-2 text-gray-400 hover:text-white rounded-lg transition-colors"
              title="Refresh drafts"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl leading-none"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-400">Loading drafts...</span>
            </div>
          ) : drafts.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-300 mb-2">No saved drafts</h3>
              <p className="text-gray-500">
                Start creating an invoice and it will be automatically saved as a draft.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-400">
                  {drafts.length} draft{drafts.length !== 1 ? 's' : ''} found
                </p>
                {drafts.length > 0 && (
                  <button
                    onClick={handleClearAllDrafts}
                    className="text-sm text-red-400 hover:text-red-300 transition-colors"
                  >
                    Clear All
                  </button>
                )}
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {drafts.map((draft) => (
                  <div
                    key={draft.id}
                    className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-medium truncate mb-1">
                          {draft.description}
                        </h4>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTimestamp(draft.timestamp)}
                          </div>
                          {draft.data.items && (
                            <span>{draft.data.items.length} item{draft.data.items.length !== 1 ? 's' : ''}</span>
                          )}
                          {draft.data.clientId && (
                            <span>Client: {draft.data.clientId}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleRestoreDraft(draft)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                        >
                          Restore
                        </button>
                        <button
                          onClick={() => handleDeleteDraft(draft.id)}
                          className="p-1.5 text-gray-400 hover:text-red-400 rounded-lg transition-colors"
                          title="Delete draft"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="text-yellow-300 font-medium mb-1">About Auto-save</p>
                    <p className="text-yellow-200/80">
                      Drafts are automatically saved every 2 seconds while you're editing. 
                      They're stored locally in your browser and will be cleaned up after 7 days.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default DraftManager 
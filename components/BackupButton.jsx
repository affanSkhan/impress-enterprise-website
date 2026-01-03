import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function BackupButton() {
  const [loading, setLoading] = useState(false)
  const [lastBackup, setLastBackup] = useState(null)
  const [status, setStatus] = useState('')

  const handleBackup = async () => {
    if (!confirm('Are you sure you want to start a full system backup? This might take a while.')) return

    setLoading(true)
    setStatus('Starting backup...')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const response = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Backup failed')
      }

      setStatus('Downloading...')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      // Get filename from header if possible, else generate
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = `backup-${new Date().toISOString().split('T')[0]}.zip`
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/)
        if (match) filename = match[1]
      }
      
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setLastBackup(new Date().toLocaleString())
      setStatus('Backup completed successfully')
    } catch (error) {
      console.error(error)
      setStatus(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">System Backup</h3>
          <p className="text-sm text-gray-500 mb-4 max-w-md">
            Create and download a full backup of your database tables and storage files. 
            This includes products, orders, customers, and all uploaded images.
          </p>
        </div>
        <div className="bg-blue-50 p-3 rounded-full">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
          </svg>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <button
          onClick={handleBackup}
          disabled={loading}
          className={`flex items-center px-4 py-2 rounded-lg text-white font-medium transition-all shadow-sm ${
            loading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 hover:shadow-md'
          }`}
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Backup
            </>
          )}
        </button>

        {status && (
          <span className={`text-sm font-medium ${status.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
            {status}
          </span>
        )}
      </div>
      
      {lastBackup && (
        <p className="mt-3 text-xs text-gray-400">
          Last successful backup: {lastBackup}
        </p>
      )}
    </div>
  )
}

import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  FileText,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Minimize2,
  AlertCircle,
} from 'lucide-react'
import { Worker } from '@react-pdf-viewer/core'
import { Viewer } from '@react-pdf-viewer/core'
import '@react-pdf-viewer/core/lib/styles/index.css'
import { filesApi } from '@/api'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

interface DocumentPreviewProps {
  judgmentId: number
  sourceFilePath?: string | null
  sourceOriginalName?: string | null
  sourceType?: string | null
}

export function DocumentPreview({
  judgmentId,
  sourceFilePath,
  sourceOriginalName,
}: DocumentPreviewProps) {
  const { t } = useTranslation(['dataEntry', 'common'])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [docxContent, setDocxContent] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const pdfUrlRef = useRef<string | null>(null)

  const fileExtension = sourceOriginalName?.toLowerCase().split('.').pop()
  const isPdf = fileExtension === 'pdf'
  const isDocx = fileExtension === 'docx'

  useEffect(() => {
    if (!sourceFilePath) return

    const loadDocument = async () => {
      setLoading(true)
      setError(null)

      try {
        if (isPdf) {
          // Use axios with Vite proxy endpoint
          console.log('Loading PDF for judgment:', judgmentId)

          try {
            // Try using downloadJudgmentFile with apiClient
            const blob = await filesApi.downloadJudgmentFile(judgmentId)
            console.log('PDF blob received - size:', blob.size, 'type:', blob.type)

            if (blob.size === 0) {
              throw new Error('Received empty PDF file from server')
            }

            if (blob.type === 'application/json' || blob.type.includes('text')) {
              const text = await blob.text()
              console.error('Server returned error:', text)
              throw new Error(`Server error: ${text}`)
            }

            const blobUrl = URL.createObjectURL(blob)
            pdfUrlRef.current = blobUrl
            setPdfUrl(blobUrl)
          } catch (axiosError: any) {
            console.error('Axios error details:', {
              status: axiosError?.response?.status,
              statusText: axiosError?.response?.statusText,
              data: axiosError?.response?.data,
              message: axiosError?.message,
            })
            throw axiosError
          }
        } else if (isDocx) {
          // For DOCX, use mammoth to convert to HTML
          const blob = await filesApi.downloadJudgmentFile(judgmentId)
          console.log('DOCX blob size:', blob.size)
          const arrayBuffer = await blob.arrayBuffer()

          // Dynamic import mammoth
          const mammoth = await import('mammoth')
          const result = await mammoth.convertToHtml({ arrayBuffer })
          setDocxContent(result.value)
        }
      } catch (err: any) {
        console.error('Failed to load document:', err)
        setError(err.message || t('common:error'))
      } finally {
        setLoading(false)
      }
    }

    loadDocument()

    // Cleanup on unmount or when document changes
    return () => {
      pdfUrlRef.current = null
    }
  }, [judgmentId, sourceFilePath, isPdf, isDocx])

  const handleDownload = async () => {
    try {
      const blob = await filesApi.downloadJudgmentFile(judgmentId)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = sourceOriginalName || 'document'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Download failed:', err)
    }
  }

  const handleZoomIn = () => setZoom((z) => Math.min(3, z + 0.25))
  const handleZoomOut = () => setZoom((z) => Math.max(0.5, z - 0.25))
  const handleResetZoom = () => setZoom(1)

  if (!sourceFilePath) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
        <FileText className="mb-4 h-12 w-12 text-muted-foreground/50" />
        <p className="text-muted-foreground">{t('noSourceFile')}</p>
      </div>
    )
  }

  return (
    <div
      className={`flex flex-col rounded-lg border bg-white ${
        isFullscreen ? 'fixed inset-0 z-50' : 'h-full'
      }`}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="truncate text-sm font-medium">
            {sourceOriginalName || t('document')}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomOut}
            disabled={zoom <= 0.5}
            className="h-8 w-8"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="w-12 text-center text-xs">{Math.round(zoom * 100)}%</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomIn}
            disabled={zoom >= 3}
            className="h-8 w-8"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleResetZoom}
            className="h-8 w-8"
          >
            <RotateCw className="h-4 w-4" />
          </Button>
          <div className="mx-2 h-4 w-px bg-border" />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="h-8 w-8"
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDownload}
            className="h-8 w-8"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-gray-100 p-4">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <div className="flex h-full flex-col items-center justify-center gap-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <p className="text-destructive">{error}</p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              {t('common:refresh')}
            </Button>
          </div>
        ) : isPdf && pdfUrl ? (
          <Worker workerUrl="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js">
            <div className="h-full w-full overflow-auto bg-gray-100">
              <Viewer
                fileUrl={pdfUrl}
                defaultScale={zoom}
              />
            </div>
          </Worker>
        ) : isDocx && docxContent ? (
          <div
            className="mx-auto max-w-3xl rounded border bg-white p-8 shadow-lg"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'top center'
            }}
          >
            <div
              className="prose prose-sm max-w-none rtl:text-right"
              dir="rtl"
              dangerouslySetInnerHTML={{ __html: docxContent }}
            />
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4">
            <FileText className="h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">{t('unsupportedFormat')}</p>
            <Button variant="outline" onClick={handleDownload}>
              <Download className="me-2 h-4 w-4" />
              {t('common:download')}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default DocumentPreview

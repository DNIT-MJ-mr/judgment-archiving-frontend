import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Download, Printer, RotateCcw, Loader2 } from 'lucide-react'
import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.js?url'
import { templatesApi, apiClient } from '@/api'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { generateFilledPdf, createBlobUrl, revokeBlobUrl } from '@/lib/pdfFiller'
import { toast } from 'sonner'

// Set pdf.js worker from local source
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerSrc

const SCALE = 1.5

interface TextBox {
  id: string
  pageIndex: number
  screenX: number  // top-left corner, relative to page container, in CSS pixels
  screenY: number
  screenWidth: number  // width in screen pixels
  screenHeight: number  // height in screen pixels
  pdfX: number  // in PDF points, from left
  pdfY: number  // in PDF points, from bottom
  text: string
  fontSize: number
  rtl: boolean
  isDragging?: boolean
  isResizing?: boolean
  dragOffsetX?: number  // offset from where user grabbed
  dragOffsetY?: number
}

interface PageInfo {
  index: number
  width: number
  height: number
  canvasRef: React.RefObject<HTMLCanvasElement>
}

export function TemplateFillPage() {
  const { t } = useTranslation(['templates', 'common'])
  const { templateId } = useParams<{ templateId: string }>()
  const navigate = useNavigate()

  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null)
  const [pages, setPages] = useState<PageInfo[]>([])
  const [textBoxes, setTextBoxes] = useState<TextBox[]>([])
  const [history, setHistory] = useState<TextBox[][]>([])
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null)
  const [fontSize, setFontSize] = useState(14)
  const [isRTL, setIsRTL] = useState(true)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const pageRefsMap = useRef<Map<number, React.RefObject<HTMLCanvasElement>>>(new Map())
  const draggedBoxRef = useRef<string | null>(null)

  // Fetch template
  const { data: template, isLoading } = useQuery({
    queryKey: ['template', templateId],
    queryFn: () =>
      templateId
        ? templatesApi.get(Number.parseInt(templateId, 10))
        : null,
    enabled: !!templateId,
  })

  // Load PDF
  useEffect(() => {
    if (!template?.id) return

    const loadPDF = async () => {
      try {
        const response = await apiClient.get(`/templates/${template.id}/file`, {
          responseType: 'arraybuffer',
        })
        const blob = new Blob([response.data], { type: 'application/pdf' })
        const url = URL.createObjectURL(blob)

        const pdf = await pdfjsLib.getDocument(url).promise
        setPdfDoc(pdf)

        // Initialize page refs and render all pages
        const pageInfos: PageInfo[] = []
        for (let i = 0; i < pdf.numPages; i++) {
          const page = await pdf.getPage(i + 1)
          const viewport = page.getViewport({ scale: SCALE })
          const ref = pageRefsMap.current.get(i) || { current: null }
          pageRefsMap.current.set(i, ref)

          pageInfos.push({
            index: i,
            width: viewport.width,
            height: viewport.height,
            canvasRef: ref,
          })

          // Render page to canvas
          const canvas = ref.current
          if (canvas) {
            const context = canvas.getContext('2d')
            if (context) {
              canvas.width = viewport.width
              canvas.height = viewport.height
              await page.render({ canvasContext: context, viewport }).promise
            }
          }
        }

        setPages(pageInfos)
      } catch (err) {
        console.error('Error loading PDF:', err)
        toast.error('Failed to load PDF')
      }
    }

    loadPDF()
  }, [template?.id])

  // Handle page overlay click — create new text box
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>, pageIndex: number) => {
    // Check if click was on a text box — if so, don't create new
    if ((e.target as HTMLElement).closest('[data-textbox]')) return

    const rect = e.currentTarget.getBoundingClientRect()
    const canvasHeight = pages[pageIndex]?.height

    const screenX = e.clientX - rect.left
    const screenY = e.clientY - rect.top

    // Adjust for the drag handle (24px) and textarea padding (8px) so text appears where clicked
    const DRAG_HANDLE_HEIGHT = 24
    const TEXT_PADDING_X = 8  // p-2 = 0.5rem = 8px left padding
    const TEXT_PADDING_Y = 8  // p-2 = 0.5rem = 8px top padding
    const screenTextX = screenX + TEXT_PADDING_X
    const screenTextY = screenY + DRAG_HANDLE_HEIGHT + TEXT_PADDING_Y

    const pdfX = screenTextX / SCALE
    const pdfY = (canvasHeight - screenTextY) / SCALE  // flip Y

    const newId = `box-${Date.now()}`
    const minWidth = 150
    const minHeight = fontSize * 1.5
    const newBox: TextBox = {
      id: newId,
      pageIndex,
      screenX,
      screenY,
      screenWidth: minWidth,
      screenHeight: minHeight,
      pdfX,
      pdfY,
      text: '',
      fontSize,
      rtl: isRTL,
    }

    const newBoxes = [...textBoxes, newBox]
    setTextBoxes(newBoxes)
    setHistory([...history, newBoxes])
    setSelectedBoxId(newId)
  }

  // Handle drag start
  const handleDragStart = (e: React.PointerEvent<HTMLDivElement>, boxId: string) => {
    e.stopPropagation()
    e.preventDefault()

    const box = textBoxes.find(b => b.id === boxId)
    if (!box) return

    draggedBoxRef.current = boxId
    const pageIndex = box.pageIndex
    const pageRect = pages[pageIndex]?.canvasRef.current?.getBoundingClientRect()
    if (!pageRect) return

    const dragOffsetX = e.clientX - pageRect.left - box.screenX
    const dragOffsetY = e.clientY - pageRect.top - box.screenY

    setTextBoxes(prev =>
      prev.map(b =>
        b.id === boxId ? { ...b, isDragging: true, dragOffsetX, dragOffsetY } : b
      )
    )

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const pageRect = pages[pageIndex]?.canvasRef.current?.getBoundingClientRect()
      if (!pageRect) return

      const newScreenX = Math.max(0, moveEvent.clientX - pageRect.left - (dragOffsetX || 0))
      const newScreenY = Math.max(0, moveEvent.clientY - pageRect.top - (dragOffsetY || 0))

      // Adjust for the drag handle and padding when calculating PDF coordinates
      const DRAG_HANDLE_HEIGHT = 24
      const TEXT_PADDING_X = 8  // p-2 = 0.5rem = 8px left padding
      const TEXT_PADDING_Y = 8  // p-2 = 0.5rem = 8px top padding
      const screenTextX = newScreenX + TEXT_PADDING_X
      const screenTextY = newScreenY + DRAG_HANDLE_HEIGHT + TEXT_PADDING_Y

      const canvasHeight = pages[pageIndex]?.height
      const newPdfX = screenTextX / SCALE
      const newPdfY = (canvasHeight - screenTextY) / SCALE

      setTextBoxes(prev =>
        prev.map(b =>
          b.id === boxId
            ? { ...b, screenX: newScreenX, screenY: newScreenY, pdfX: newPdfX, pdfY: newPdfY }
            : b
        )
      )
    }

    const handlePointerUp = () => {
      setTextBoxes(prev =>
        prev.map(b => (b.id === boxId ? { ...b, isDragging: false } : b))
      )
      draggedBoxRef.current = null
      document.removeEventListener('pointermove', handlePointerMove)
      document.removeEventListener('pointerup', handlePointerUp)
    }

    document.addEventListener('pointermove', handlePointerMove)
    document.addEventListener('pointerup', handlePointerUp)
  }

  // Update text box content
  const updateTextBox = (id: string, text: string) => {
    const newBoxes = textBoxes.map(b => (b.id === id ? { ...b, text } : b))
    setTextBoxes(newBoxes)
  }

  // Handle resize start
  const handleResizeStart = (e: React.PointerEvent<HTMLDivElement>, boxId: string) => {
    e.stopPropagation()
    e.preventDefault()

    const box = textBoxes.find(b => b.id === boxId)
    if (!box) return

    const pageIndex = box.pageIndex
    const pageRect = pages[pageIndex]?.canvasRef.current?.getBoundingClientRect()
    if (!pageRect) return

    const startX = e.clientX
    const startY = e.clientY
    const startWidth = box.screenWidth
    const startHeight = box.screenHeight

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const newWidth = Math.max(100, startWidth + (moveEvent.clientX - startX))
      const newHeight = Math.max(box.fontSize * 1.2, startHeight + (moveEvent.clientY - startY))

      setTextBoxes(prev =>
        prev.map(b =>
          b.id === boxId ? { ...b, screenWidth: newWidth, screenHeight: newHeight, isResizing: true } : b
        )
      )
    }

    const handlePointerUp = () => {
      setTextBoxes(prev => prev.map(b => (b.id === boxId ? { ...b, isResizing: false } : b)))
      document.removeEventListener('pointermove', handlePointerMove)
      document.removeEventListener('pointerup', handlePointerUp)
    }

    document.addEventListener('pointermove', handlePointerMove)
    document.addEventListener('pointerup', handlePointerUp)
  }

  // Delete text box
  const deleteTextBox = (id: string) => {
    const newBoxes = textBoxes.filter(b => b.id !== id)
    setTextBoxes(newBoxes)
    setHistory([...history, newBoxes])
    setSelectedBoxId(null)
  }

  // Undo
  const undo = () => {
    if (history.length > 0) {
      const newHistory = [...history]
      newHistory.pop()
      setHistory(newHistory)
      const previousState = newHistory.at(-1) ?? []
      setTextBoxes(previousState)
      setSelectedBoxId(null)
    }
  }

  // Generate filled PDF and show preview
  const handlePreview = async () => {
    if (!template?.id || !pdfDoc) return

    try {
      setIsGenerating(true)

      const response = await apiClient.get(`/templates/${template.id}/file`, {
        responseType: 'arraybuffer',
      })

      const filledBytes = await generateFilledPdf(
        response.data,
        textBoxes.map(b => ({
          pageIndex: b.pageIndex,
          pdfX: b.pdfX,
          pdfY: b.pdfY,
          text: b.text,
          fontSize: b.fontSize,
          rtl: b.rtl,
        }))
      )

      const url = createBlobUrl(filledBytes)
      setPreviewUrl(url)
      toast.success('PDF generated successfully')
    } catch (err) {
      console.error('Error generating PDF:', err)
      toast.error('Failed to generate PDF')
    } finally {
      setIsGenerating(false)
    }
  }

  // Download filled PDF
  const handleDownload = () => {
    if (!previewUrl || !template) return

    const link = document.createElement('a')
    link.href = previewUrl
    link.download = `${template.title}-filled.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Print filled PDF
  const handlePrint = () => {
    if (!previewUrl) return

    const w = window.open(previewUrl)
    w?.print()
  }

  // Warn before leaving with unsaved changes
  useEffect(() => {
    if (textBoxes.length === 0) return

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      return true
    }

    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [textBoxes.length])

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    )
  }

  if (!template || !pdfDoc) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{t('templates:failedToLoadTemplate')}</p>
        <Button onClick={() => navigate('/templates')} className="mt-4">
          {t('templates:backToTemplates')}
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Toolbar */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 p-4 shadow-sm">
        <div className="flex justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/templates')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('common:back')}
            </Button>
            <h1 className="text-lg font-semibold truncate">{template.title}</h1>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={undo}
              disabled={history.length === 0}
              title="Undo (Ctrl+Z)"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              {t('templates:undo')}
            </Button>

            <div className="flex items-center gap-1 px-2 py-1 border rounded-md bg-gray-50">
              <label htmlFor="font-size-input" className="text-xs font-medium">
                {t('templates:size')}:
              </label>
              <input
                id="font-size-input"
                type="number"
                min="8"
                max="32"
                value={fontSize}
                onChange={e => setFontSize(Number.parseInt(e.target.value, 10))}
                className="w-10 px-1 py-0.5 border-0 focus:ring-0 text-sm"
              />
              <span className="text-xs text-gray-500">pt</span>
            </div>

            <Button
              variant={isRTL ? 'default' : 'outline'}
              size="sm"
              onClick={() => setIsRTL(!isRTL)}
              title="Toggle text direction"
            >
              {isRTL ? 'RTL' : 'LTR'}
            </Button>

            <div className="w-px h-6 bg-gray-200" />

            <Button
              onClick={handlePreview}
              disabled={isGenerating}
              size="sm"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <>{t('templates:previewAndExport')}</>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* PDF Pages */}
      <div className="flex-1 overflow-y-auto bg-gray-200 py-8">
        <div className="flex flex-col gap-8 items-center">
          {pages.map(pageInfo => {
            const pageTextBoxes = textBoxes.filter(b => b.pageIndex === pageInfo.index)

            return (
              <div key={pageInfo.index} className="relative bg-white shadow-lg" style={{ width: pageInfo.width, height: pageInfo.height }}>
                {/* Canvas (PDF rendered) */}
                <canvas
                  ref={ref => {
                    const pageRef = pageRefsMap.current.get(pageInfo.index)
                    if (pageRef) pageRef.current = ref
                  }}
                  className="absolute inset-0"
                />

                {/* Overlay for click detection and text boxes */}
                <div
                  onClick={e => handleOverlayClick(e, pageInfo.index)}
                  className="absolute inset-0 cursor-crosshair"
                >
                  {/* Text boxes on this page */}
                  {pageTextBoxes.map(box => (
                    <div
                      key={box.id}
                      data-textbox={box.id}
                      className="group absolute"
                      style={{
                        left: `${box.screenX}px`,
                        top: `${box.screenY}px`,
                        width: `${box.screenWidth}px`,
                        height: `${box.screenHeight}px`,
                      }}
                      title="Drag the border to move, click inside to type"
                    >
                      {/* Drag handle border - top area for dragging */}
                      <div
                        onPointerDown={e => handleDragStart(e, box.id)}
                        className={`absolute top-0 left-0 right-0 h-6 cursor-grab active:cursor-grabbing ${
                          box.isDragging ? 'bg-blue-400' : 'bg-blue-300 group-hover:bg-blue-400'
                        } transition-colors`}
                        style={{
                          pointerEvents: 'auto',
                        }}
                      />

                      {/* Textarea (main content) */}
                      <textarea
                        value={box.text}
                        onChange={e => updateTextBox(box.id, e.target.value)}
                        onFocus={() => setSelectedBoxId(box.id)}
                        onPointerDown={e => e.stopPropagation()}
                        dir={box.rtl ? 'rtl' : 'ltr'}
                        className="absolute left-0 right-0 bottom-0 w-full p-2 bg-white border-2 border-blue-400 border-t-0 rounded-b focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        style={{
                          top: '24px',
                          height: `calc(100% - 24px)`,
                          fontSize: `${box.fontSize}px`,
                          fontFamily: box.rtl ? '"Noto Sans Arabic", sans-serif' : 'monospace',
                          direction: box.rtl ? 'rtl' : 'ltr',
                          fontWeight: 'normal',
                          fontStyle: 'normal',
                          lineHeight: '1.5',
                          resize: 'none',
                          overflow: 'auto',
                          boxSizing: 'border-box',
                        }}
                      />

                      {/* Resize handle (bottom-right corner) */}
                      {selectedBoxId === box.id && (
                        <div
                          onPointerDown={e => handleResizeStart(e, box.id)}
                          className="absolute bottom-0 right-0 w-5 h-5 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 transition-colors rounded-tl"
                          style={{
                            pointerEvents: 'auto',
                            cursor: 'se-resize',
                          }}
                          title="Drag to resize"
                        />
                      )}

                      {/* Delete button (visible when selected) */}
                      {selectedBoxId === box.id && (
                        <button
                          onClick={() => deleteTextBox(box.id)}
                          className="absolute -top-3 -right-3 w-6 h-6 bg-red-500 text-white rounded-full text-xs font-bold flex items-center justify-center hover:bg-red-600 transition-colors shadow-md"
                          title="Delete text box"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Preview Modal */}
      <Dialog
        open={!!previewUrl}
        onOpenChange={() => {
          if (previewUrl) revokeBlobUrl(previewUrl)
          setPreviewUrl(null)
        }}
      >
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
          <div className="flex-1 overflow-auto">
            {previewUrl && (
              <iframe
                src={previewUrl}
                className="w-full h-full border-0"
                title="Preview"
              />
            )}
          </div>
          <div className="flex gap-2 justify-end border-t pt-4">
            <Button
              variant="outline"
              onClick={() => {
                if (previewUrl) revokeBlobUrl(previewUrl)
                setPreviewUrl(null)
              }}
            >
              {t('common:close')}
            </Button>
            <Button variant="outline" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              {t('templates:download')}
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              {t('templates:print')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

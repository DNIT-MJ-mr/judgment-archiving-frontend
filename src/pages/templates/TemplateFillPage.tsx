import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ArrowRight, Download, Printer, RotateCcw, Loader2 } from 'lucide-react'
import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorkerSrc from 'pdfjs-dist/build/pdf.worker.min.js?url'
import { templatesApi, apiClient } from '@/api'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { generateFilledPdf, createBlobUrl, revokeBlobUrl } from '@/lib/pdfFiller'
import { toast } from 'sonner'
import { useLanguage } from '@/contexts/LanguageContext'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerSrc

// All dimensions in CSS pixels unless noted as PDF points
const SCALE = 1.5        // PDF points → CSS pixels
const HANDLE_H = 20      // drag handle height px
const PAD = 6            // textarea inner padding px
const FONT_SIZES = [10, 12, 14, 16, 18, 20, 24, 28, 32]

interface TextBox {
  id: string
  pageIndex: number
  screenX: number   // left edge of box relative to page container
  screenY: number   // top edge of box relative to page container
  screenW: number
  screenH: number
  pdfX: number      // text content left edge, PDF points from page left
  pdfY: number      // text content top edge, PDF points from page bottom
  text: string
  fontSize: number  // in PDF points (= CSS pt)
}

interface PageInfo {
  index: number
  width: number    // canvas pixels
  height: number   // canvas pixels
}

export function TemplateFillPage() {
  const { t } = useTranslation(['templates', 'common'])
  const { templateId } = useParams<{ templateId: string }>()
  const navigate = useNavigate()
  const { language } = useLanguage()

  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null)
  const [pages, setPages] = useState<PageInfo[]>([])
  const [boxes, setBoxes] = useState<TextBox[]>([])
  const [past, setPast] = useState<TextBox[][]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [fontSize, setFontSize] = useState(14)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)

  const [template, setTemplate] = useState<Awaited<ReturnType<typeof templatesApi.get>> | null>(null)
  const [templateLoading, setTemplateLoading] = useState(true)
  const [templateError, setTemplateError] = useState<Error | null>(null)

  const canvasRefs = useRef<Map<number, HTMLCanvasElement | null>>(new Map())
  const containerRefs = useRef<Map<number, HTMLDivElement | null>>(new Map())

  // ── Data fetching ───────────────────────────────────────────────────────────

  const fetchTemplate = useCallback(async () => {
    if (!templateId) return
    setTemplateLoading(true)
    setTemplateError(null)
    try {
      const result = await templatesApi.get(+templateId)
      setTemplate(result)
    } catch (err) {
      setTemplateError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setTemplateLoading(false)
    }
  }, [templateId])

  useEffect(() => {
    fetchTemplate()
  }, [fetchTemplate])

  // Effect 1: load PDF metadata — no canvas rendering yet
  useEffect(() => {
    if (!template?.id) return
    setPdfLoading(true)
    ;(async () => {
      try {
        const res = await apiClient.get(`/templates/${template.id}/file`, {
          responseType: 'arraybuffer',
        })
        const pdf = await pdfjsLib.getDocument({
          data: new Uint8Array(res.data),
          cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/cmaps/`,
          cMapPacked: true,
          standardFontDataUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/standard_fonts/`,
        }).promise
        setPdfDoc(pdf)

        const infos: PageInfo[] = []
        for (let i = 0; i < pdf.numPages; i++) {
          const pg = await pdf.getPage(i + 1)
          const vp = pg.getViewport({ scale: SCALE })
          infos.push({ index: i, width: vp.width, height: vp.height })
        }
        setPages(infos) // triggers re-render → canvas elements mount → Effect 2 runs
      } catch {
        toast.error(t('templates:failedToLoadTemplate'))
      } finally {
        setPdfLoading(false)
      }
    })()
  }, [template?.id])

  // Effect 2: render each page to its canvas after they are in the DOM
  useEffect(() => {
    if (!pdfDoc || !pages.length) return
    ;(async () => {
      for (const { index } of pages) {
        const canvas = canvasRefs.current.get(index)
        if (!canvas) continue
        const pg = await pdfDoc.getPage(index + 1)
        const vp = pg.getViewport({ scale: SCALE })
        canvas.width = vp.width
        canvas.height = vp.height
        const ctx = canvas.getContext('2d')
        if (ctx) await pg.render({ canvasContext: ctx, viewport: vp }).promise
      }
    })()
  }, [pdfDoc, pages])

  // ── Keyboard shortcuts ──────────────────────────────────────────────────────

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Ctrl+Z — undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault()
        setPast(prev => {
          if (!prev.length) return prev
          const next = prev.slice(0, -1)
          setBoxes(next[next.length - 1] ?? [])
          setSelectedId(null)
          return next
        })
        return
      }
      // Delete / Backspace when not typing inside a textarea
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        const tag = (document.activeElement as HTMLElement)?.tagName
        if (tag !== 'TEXTAREA' && tag !== 'INPUT') {
          doDelete(selectedId)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedId, past, boxes])

  // ── State helpers ───────────────────────────────────────────────────────────

  const commit = (next: TextBox[]) => {
    setBoxes(next)
    setPast(p => [...p, next])
  }

  const doDelete = (id: string) => {
    commit(boxes.filter(b => b.id !== id))
    setSelectedId(null)
  }

  const getContainerRect = (pageIndex: number) =>
    containerRefs.current.get(pageIndex)?.getBoundingClientRect() ?? null

  // ── Interactions ────────────────────────────────────────────────────────────

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>, pageIndex: number) => {
    if ((e.target as HTMLElement).closest('[data-box]')) return

    const rect = e.currentTarget.getBoundingClientRect()
    const sx = e.clientX - rect.left
    const sy = e.clientY - rect.top
    const pageH = pages[pageIndex]?.height ?? 0

    // PDF coordinates for text content origin (after handle + padding)
    const pdfX = (sx + PAD) / SCALE
    const pdfY = (pageH - (sy + HANDLE_H + PAD)) / SCALE

    const id = `box-${Date.now()}`
    const minH = HANDLE_H + fontSize * SCALE * 1.4 + PAD * 2

    commit([...boxes, {
      id,
      pageIndex,
      screenX: sx,
      screenY: sy,
      screenW: 200,
      screenH: minH,
      pdfX,
      pdfY,
      text: '',
      fontSize,
    }])
    setSelectedId(id)
  }

  const handleDragStart = (e: React.PointerEvent<HTMLDivElement>, boxId: string) => {
    e.stopPropagation()
    e.preventDefault()

    const box = boxes.find(b => b.id === boxId)
    if (!box) return

    const rect = getContainerRect(box.pageIndex)
    if (!rect) return

    const offsetX = e.clientX - rect.left - box.screenX
    const offsetY = e.clientY - rect.top - box.screenY
    const pageH = pages[box.pageIndex]?.height ?? 0

    const onMove = (me: PointerEvent) => {
      const r = getContainerRect(box.pageIndex)
      if (!r) return
      const sx = Math.max(0, me.clientX - r.left - offsetX)
      const sy = Math.max(0, me.clientY - r.top - offsetY)
      const pdfX = (sx + PAD) / SCALE
      const pdfY = (pageH - (sy + HANDLE_H + PAD)) / SCALE
      setBoxes(prev =>
        prev.map(b => b.id === boxId ? { ...b, screenX: sx, screenY: sy, pdfX, pdfY } : b)
      )
    }

    const onUp = () => {
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
    }

    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', onUp)
  }

  const handleResizeStart = (e: React.PointerEvent<HTMLDivElement>, boxId: string) => {
    e.stopPropagation()
    e.preventDefault()

    const box = boxes.find(b => b.id === boxId)
    if (!box) return

    const startX = e.clientX
    const startY = e.clientY
    const startW = box.screenW
    const startH = box.screenH
    const minH = HANDLE_H + box.fontSize + PAD * 2

    const onMove = (me: PointerEvent) => {
      const w = Math.max(120, startW + me.clientX - startX)
      const h = Math.max(minH, startH + me.clientY - startY)
      setBoxes(prev =>
        prev.map(b => b.id === boxId ? { ...b, screenW: w, screenH: h } : b)
      )
    }

    const onUp = () => {
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
    }

    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', onUp)
  }

  // ── PDF generation ──────────────────────────────────────────────────────────

  const handleGenerate = async () => {
    if (!template?.id || !pdfDoc) return
    setGenerating(true)
    try {
      const res = await apiClient.get(`/templates/${template.id}/file`, {
        responseType: 'arraybuffer',
      })
      const filled = await generateFilledPdf(
        res.data,
        boxes
          .filter(b => b.text.trim())
          .map(b => ({
            pageIndex: b.pageIndex,
            pdfX: b.pdfX,
            pdfY: b.pdfY,
            pdfWidth: (b.screenW - PAD) / SCALE,
            pdfHeight: (b.screenH - HANDLE_H - PAD) / SCALE,
            text: b.text,
            fontSize: b.fontSize,
            rtl: true,
          }))
      )
      setPreviewUrl(createBlobUrl(filled))
    } catch {
      toast.error(t('templates:failedToLoadTemplate'))
    } finally {
      setGenerating(false)
    }
  }

  const handleDownload = () => {
    if (!previewUrl || !template) return
    const a = document.createElement('a')
    a.href = previewUrl
    a.download = `${template.title}-filled.pdf`
    a.click()
  }

  const handlePrint = () => {
    if (!previewUrl) return
    window.open(previewUrl)?.print()
  }

  const closePreview = () => {
    if (previewUrl) revokeBlobUrl(previewUrl)
    setPreviewUrl(null)
  }

  // Warn before navigating away with unsaved boxes
  useEffect(() => {
    if (!boxes.length) return
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); return true }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [boxes.length])

  // ── Render ──────────────────────────────────────────────────────────────────

  if (templateLoading || pdfLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!template || !pdfDoc) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-destructive">{t('templates:failedToLoadTemplate')}</p>
        <Button onClick={() => navigate('/templates')}>{t('templates:backToTemplates')}</Button>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-100 flex flex-col overflow-hidden">

      {/* ── Toolbar ── */}
      <div className="shrink-0 bg-white border-b shadow-sm px-4 py-2 flex items-center gap-3">

        {/* Back */}
        <Button variant="ghost" size="sm" onClick={() => navigate('/templates')}>
          {language === 'ar'
            ? <ArrowRight className="me-1 h-4 w-4" />
            : <ArrowLeft className="me-1 h-4 w-4" />}
          {t('common:back')}
        </Button>

        <div className="w-px h-5 bg-gray-200" />

        {/* Title */}
        <h1 className="font-semibold text-sm truncate max-w-xs" dir="rtl">
          {template.title}
        </h1>

        <div className="flex-1" />

        {/* Font size */}
        <div className="flex items-center gap-1.5">
          <label htmlFor="fs" className="text-xs text-gray-500 whitespace-nowrap">
            {t('templates:size')}
          </label>
          <select
            id="fs"
            value={fontSize}
            onChange={e => setFontSize(+e.target.value)}
            className="border rounded px-2 py-1 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {FONT_SIZES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <span className="text-xs text-gray-400">pt</span>
        </div>

        {/* Undo */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setPast(prev => {
              if (!prev.length) return prev
              const next = prev.slice(0, -1)
              setBoxes(next[next.length - 1] ?? [])
              setSelectedId(null)
              return next
            })
          }}
          disabled={!past.length}
          title="Ctrl+Z"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>

        <div className="w-px h-5 bg-gray-200" />

        {/* Generate */}
        <Button size="sm" onClick={handleGenerate} disabled={generating || !boxes.some(b => b.text.trim())}>
          {generating
            ? <Loader2 className="h-4 w-4 animate-spin me-1" />
            : null}
          {t('templates:previewAndExport')}
        </Button>
      </div>

      {/* ── Hint bar ── */}
      <div className="shrink-0 bg-blue-50 border-b border-blue-100 px-4 py-1.5 text-center text-xs text-blue-600" dir="rtl">
        انقر على أي مكان في المستند لإضافة نص — اسحب الشريط الأزرق للتحريك — اسحب الزاوية للتغيير الحجم
      </div>

      {/* ── Pages ── */}
      <div className="flex-1 overflow-y-auto py-8">
        <div className="flex flex-col gap-8 items-center">
          {pages.map(pageInfo => {
            const pageBoxes = boxes.filter(b => b.pageIndex === pageInfo.index)

            return (
              <div
                key={pageInfo.index}
                ref={el => containerRefs.current.set(pageInfo.index, el)}
                className="relative bg-white shadow-xl"
                style={{ width: pageInfo.width, height: pageInfo.height }}
              >
                {/* PDF canvas */}
                <canvas
                  ref={el => canvasRefs.current.set(pageInfo.index, el)}
                  className="absolute inset-0 pointer-events-none"
                />

                {/* Click overlay */}
                <div
                  className="absolute inset-0 cursor-crosshair"
                  onClick={e => handleOverlayClick(e, pageInfo.index)}
                >
                  {pageBoxes.map(box => (
                    <div
                      key={box.id}
                      data-box={box.id}
                      className="absolute"
                      style={{
                        left: box.screenX,
                        top: box.screenY,
                        width: box.screenW,
                        height: box.screenH,
                      }}
                      onClick={e => { e.stopPropagation(); setSelectedId(box.id) }}
                    >
                      {/* Drag handle */}
                      <div
                        onPointerDown={e => handleDragStart(e, box.id)}
                        className="absolute inset-x-0 top-0 flex items-center justify-center cursor-grab active:cursor-grabbing select-none rounded-t"
                        style={{
                          height: HANDLE_H,
                          background: selectedId === box.id ? '#3b82f6' : '#93c5fd',
                        }}
                      >
                        <span className="text-white text-xs opacity-70">⠿</span>
                      </div>

                      {/* Textarea — always RTL, always Arabic font */}
                      <textarea
                        value={box.text}
                        onChange={e => {
                          const text = e.target.value
                          setBoxes(prev => prev.map(b => b.id === box.id ? { ...b, text } : b))
                        }}
                        onFocus={() => setSelectedId(box.id)}
                        onPointerDown={e => e.stopPropagation()}
                        dir="rtl"
                        placeholder="اكتب هنا..."
                        className="absolute resize-none border-2 rounded-b bg-white/90 focus:outline-none focus:bg-white"
                        style={{
                          top: HANDLE_H,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          padding: PAD,
                          paddingTop: PAD + 8,
                          fontSize: box.fontSize,
                          fontFamily: '"Noto Sans Arabic", "Noto Sans", Arial, sans-serif',
                          lineHeight: 1.8,
                          borderColor: selectedId === box.id ? '#3b82f6' : '#93c5fd',
                          borderTop: 'none',
                          overflowY: 'auto',
                          boxSizing: 'border-box',
                        }}
                      />

                      {/* Delete button */}
                      {selectedId === box.id && (
                        <button
                          onPointerDown={e => e.stopPropagation()}
                          onClick={e => { e.stopPropagation(); doDelete(box.id) }}
                          className="absolute -top-2.5 -right-2.5 z-10 w-5 h-5 rounded-full bg-red-500 hover:bg-red-600 text-white text-xs flex items-center justify-center shadow"
                          title="Delete (Del)"
                        >
                          ×
                        </button>
                      )}

                      {/* Resize handle */}
                      {selectedId === box.id && (
                        <div
                          onPointerDown={e => handleResizeStart(e, box.id)}
                          className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 hover:bg-blue-600 rounded-tl cursor-se-resize"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Preview modal ── */}
      <Dialog open={!!previewUrl} onOpenChange={closePreview}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
          <div className="flex-1 min-h-0">
            {previewUrl && (
              <iframe src={previewUrl} className="w-full h-full border-0" title="Preview" />
            )}
          </div>
          <div className="flex gap-2 justify-end border-t p-3 shrink-0">
            <Button variant="outline" onClick={closePreview}>{t('common:close')}</Button>
            <Button variant="outline" onClick={handleDownload}>
              <Download className="h-4 w-4 me-1" />
              {t('templates:download')}
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="h-4 w-4 me-1" />
              {t('templates:print')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

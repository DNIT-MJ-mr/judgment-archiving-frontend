import { PDFDocument } from 'pdf-lib'

export interface FillTextBox {
  pageIndex: number
  pdfX: number      // left edge of textbox, PDF points from page left
  pdfY: number      // top edge of textbox, PDF points from page bottom
  pdfWidth: number  // textbox width in PDF points (used for RTL right-edge alignment)
  pdfHeight: number
  text: string
  fontSize: number  // in PDF points
  rtl: boolean
}

const PX_PER_PT = 96 / 72   // 1 PDF point = 1.3333 CSS px at 96 DPI
const RENDER_SCALE = 3       // oversample for crisp rendering
const FONT = "'Noto Sans Arabic', 'Noto Sans', Arial, sans-serif"

interface RenderedText {
  data: Uint8Array
  widthPt: number
  heightPt: number
}

/**
 * Measure then render Arabic text to a PNG sized exactly to the text.
 * The canvas is never stretched or squeezed — one canvas pixel maps
 * 1:1 to (1 / PX_PER_PT / RENDER_SCALE) PDF points, so letter spacing
 * is whatever the browser produces at that font size, unchanged.
 */
async function renderText(text: string, fontSize: number): Promise<RenderedText | null> {
  const fontPx = Math.round(fontSize * PX_PER_PT * RENDER_SCALE)
  const fontSpec = `${fontPx}px ${FONT}`

  try { await document.fonts.load(fontSpec) } catch { /* fallback to system */ }

  // ── Step 1: measure real text width ──────────────────────────────────────
  const ruler = document.createElement('canvas')
  ruler.width = 8000   // wide enough for any text
  ruler.height = fontPx * 2
  const rc = ruler.getContext('2d')!
  rc.font = fontSpec
  rc.direction = 'rtl'
  const textWidthPx = rc.measureText(text).width

  // ── Step 2: canvas sized exactly to the text ──────────────────────────────
  const padPx = Math.round(4 * RENDER_SCALE)   // small border so ascenders don't clip
  const W = Math.ceil(textWidthPx) + padPx * 2
  const H = Math.ceil(fontPx * 1.6) + padPx

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H

  const ctx = canvas.getContext('2d')!
  ctx.font = fontSpec
  ctx.fillStyle = '#000000'
  ctx.textBaseline = 'top'
  ctx.direction = 'rtl'
  // anchor at right-pad so text fills leftward (correct for Arabic)
  ctx.fillText(text, W - padPx, padPx)

  // ── Step 3: convert canvas pixel dims back to PDF points ─────────────────
  const widthPt  = W / (PX_PER_PT * RENDER_SCALE)
  const heightPt = H / (PX_PER_PT * RENDER_SCALE)

  return new Promise(resolve => {
    canvas.toBlob(async blob => {
      if (!blob) { resolve(null); return }
      resolve({ data: new Uint8Array(await blob.arrayBuffer()), widthPt, heightPt })
    }, 'image/png')
  })
}

export async function generateFilledPdf(
  pdfBytes: ArrayBuffer,
  textBoxes: FillTextBox[]
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes)
  const pages  = pdfDoc.getPages()

  for (const box of textBoxes) {
    if (!box.text.trim()) continue
    if (box.pageIndex >= pages.length) continue

    const rendered = await renderText(box.text, box.fontSize)
    if (!rendered) continue

    const img  = await pdfDoc.embedPng(rendered.data)
    const page = pages[box.pageIndex]

    // RTL: align image's right edge to the textbox's right edge
    const rightEdge = box.pdfX + box.pdfWidth
    const x = rightEdge - rendered.widthPt
    // pdfY is the top of the textbox (from page bottom); drawImage y = bottom of image
    const y = box.pdfY - rendered.heightPt

    page.drawImage(img, {
      x: Math.max(0, x),
      y,
      width:  rendered.widthPt,
      height: rendered.heightPt,
    })
  }

  return await pdfDoc.save()
}

export function createBlobUrl(pdfBytes: Uint8Array): string {
  return URL.createObjectURL(new Blob([pdfBytes], { type: 'application/pdf' }))
}

export function revokeBlobUrl(url: string): void {
  URL.revokeObjectURL(url)
}

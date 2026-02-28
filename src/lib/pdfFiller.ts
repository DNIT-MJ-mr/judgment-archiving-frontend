import { PDFDocument, rgb } from 'pdf-lib'

export interface FillTextBox {
  pageIndex: number
  pdfX: number  // in PDF points, from left
  pdfY: number  // in PDF points, from bottom
  text: string
  fontSize: number  // in points
  rtl: boolean
}

/**
 * Generate a filled PDF by embedding text boxes at exact coordinates.
 *
 * @param pdfBytes - Original PDF binary (ArrayBuffer)
 * @param textBoxes - Array of text boxes with PDF coordinates
 * @returns - Filled PDF as Uint8Array
 */
export async function generateFilledPdf(
  pdfBytes: ArrayBuffer,
  textBoxes: FillTextBox[]
): Promise<Uint8Array> {
  try {
    // Load the original PDF
    const pdfDoc = await PDFDocument.load(pdfBytes)

    const pages = pdfDoc.getPages()

    // Draw each text box on its respective page
    for (const box of textBoxes) {
      if (!box.text.trim()) continue
      if (box.pageIndex >= pages.length) continue

      const page = pages[box.pageIndex]

      // Use the Helvetica font (built-in, no embedding needed)
      // pdf-lib uses bottom-left origin, so pdfY is already in the correct space
      page.drawText(box.text, {
        x: box.pdfX,
        y: box.pdfY,  // already computed as points from bottom
        size: box.fontSize,
        color: rgb(0, 0, 0),
        lineHeight: box.fontSize * 1.2,
      })
    }

    // Save and return the filled PDF
    const filledBytes = await pdfDoc.save()
    return filledBytes
  } catch (error) {
    console.error('Error generating filled PDF:', error)
    throw new Error('Failed to generate filled PDF')
  }
}

/**
 * Convert a fill text box to a downloadable blob URL.
 */
export function createBlobUrl(pdfBytes: Uint8Array): string {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' })
  return URL.createObjectURL(blob)
}

/**
 * Revoke a blob URL to free memory.
 */
export function revokeBlobUrl(url: string): void {
  URL.revokeObjectURL(url)
}

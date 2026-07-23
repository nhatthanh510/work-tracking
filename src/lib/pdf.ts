// Render a DOM element to a multi-page A4 PDF and download it.
// Libraries are dynamically imported so they stay out of the main bundle
// until the user actually saves a PDF.

export async function savePdf(el: HTMLElement, filename: string): Promise<void> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas-pro'),
    import('jspdf'),
  ])

  const canvas = await html2canvas(el, {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true,
  })

  const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
  const margin = 24
  const pageW = pdf.internal.pageSize.getWidth()
  const pageH = pdf.internal.pageSize.getHeight()
  const imgW = pageW - margin * 2
  const imgH = (canvas.height * imgW) / canvas.width
  const usableH = pageH - margin * 2

  const img = canvas.toDataURL('image/png')
  let heightLeft = imgH
  let position = margin

  pdf.addImage(img, 'PNG', margin, position, imgW, imgH)
  heightLeft -= usableH

  // Slice the tall image across additional pages.
  while (heightLeft > 0) {
    position -= usableH
    pdf.addPage()
    pdf.addImage(img, 'PNG', margin, position, imgW, imgH)
    heightLeft -= usableH
  }

  pdf.save(filename)
}

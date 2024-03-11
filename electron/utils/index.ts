import fs from 'fs'
import PDFParser from 'pdf2json'

export function pdf2txt(filepath, targetFilePath = '') {
  return new Promise<string>((resolve, reject) => {
    const pdfParser = new PDFParser(this, 1)

    if (!targetFilePath) {
      const extension = filepath.split('.').pop()
      targetFilePath = filepath.replace('.' + extension, '.txt')
    }
    // console.log(filepath, targetFilePath)
    pdfParser.on('pdfParser_dataError', errData => {
      console.error(errData.parserError)
      reject(errData.parserError)
    })
    pdfParser.on('pdfParser_dataReady', pdfData => {
      fs.writeFile(targetFilePath, pdfParser.getRawTextContent(), () => {
        console.log('Done.')
        resolve('success')
      })
    })

    pdfParser.loadPDF(filepath)
  })
}

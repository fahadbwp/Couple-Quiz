import * as pdfjsLib from "pdfjs-dist";
import { Document, Paragraph, TextRun, Packer } from "docx";

// Set worker path to local self-hosted worker in public/
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
}

export interface ConversionProgress {
  stage: string;
  percent: number;
}

export interface ExtractedPageText {
  pageNumber: number;
  lines: string[];
}

/**
 * Extracts text lines from a PDF File or ArrayBuffer using pdfjs-dist in the browser.
 */
export async function extractTextFromPdf(
  fileOrBuffer: File | ArrayBuffer,
  onProgress?: (progress: ConversionProgress) => void
): Promise<ExtractedPageText[]> {
  const arrayBuffer =
    fileOrBuffer instanceof File ? await fileOrBuffer.arrayBuffer() : fileOrBuffer;

  onProgress?.({ stage: "Loading PDF document...", percent: 10 });

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    useSystemFonts: true,
  });

  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;
  const pagesData: ExtractedPageText[] = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const percent = 10 + Math.round((pageNum / numPages) * 60);
    onProgress?.({
      stage: `Extracting page ${pageNum} of ${numPages}...`,
      percent,
    });

    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();

    // Group items into lines based on vertical Y coordinate
    const items = textContent.items.filter((item): item is import("pdfjs-dist/types/src/display/api").TextItem => "str" in item);

    // Sort items top-to-bottom, left-to-right
    // transform[4] = x, transform[5] = y
    const lineBuckets = new Map<number, string[]>();

    for (const item of items) {
      if (!item.str.trim()) continue;
      // Round y to nearest 4px bucket to group characters on the same line
      const yBucket = Math.round(item.transform[5] / 4) * 4;
      const current = lineBuckets.get(yBucket) || [];
      current.push(item.str);
      lineBuckets.set(yBucket, current);
    }

    // Sort y descending (PDF y=0 is bottom of page)
    const sortedY = Array.from(lineBuckets.keys()).sort((a, b) => b - a);
    const lines: string[] = sortedY.map((y) => (lineBuckets.get(y) || []).join(" ").trim()).filter(Boolean);

    pagesData.push({ pageNumber: pageNum, lines });
  }

  return pagesData;
}

/**
 * Converts extracted PDF lines into a formatted Word (.docx) Document Blob.
 */
export async function convertPdfToDocx(
  file: File,
  onProgress?: (progress: ConversionProgress) => void
): Promise<{ blob: Blob; pageCount: number; wordCount: number }> {
  const pages = await extractTextFromPdf(file, onProgress);

  onProgress?.({ stage: "Generating Word (.docx) document...", percent: 80 });

  let totalWords = 0;
  const docParagraphs: Paragraph[] = [];

  pages.forEach((page, pageIdx) => {
    // If not first page, add a page break before
    page.lines.forEach((line, lineIdx) => {
      const words = line.split(/\s+/).filter(Boolean);
      totalWords += words.length;

      // Simple heuristic: short uppercase line or title-like is styled prominent
      const isHeading = line.length < 60 && (lineIdx === 0 || /^[A-Z0-9\s:_-]+$/.test(line));

      docParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: line,
              bold: isHeading,
              size: isHeading ? 28 : 22, // 14pt or 11pt
              font: "Arial",
            }),
          ],
          spacing: { after: 120, before: isHeading ? 200 : 0 },
          pageBreakBefore: pageIdx > 0 && lineIdx === 0,
        })
      );
    });

    if (page.lines.length === 0) {
      docParagraphs.push(
        new Paragraph({
          children: [new TextRun({ text: `[Page ${page.pageNumber} - No extractable text]`, italics: true, size: 20 })],
          pageBreakBefore: pageIdx > 0,
        })
      );
    }
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: docParagraphs.length > 0 ? docParagraphs : [
          new Paragraph({
            children: [new TextRun({ text: "Empty PDF document", italics: true })],
          }),
        ],
      },
    ],
  });

  onProgress?.({ stage: "Packaging document...", percent: 95 });
  const blob = await Packer.toBlob(doc);
  onProgress?.({ stage: "Ready!", percent: 100 });

  return { blob, pageCount: pages.length, wordCount: totalWords };
}

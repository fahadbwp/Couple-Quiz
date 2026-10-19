import mammoth from "mammoth";
import { jsPDF } from "jspdf";

export interface DocxToPdfProgress {
  stage: string;
  percent: number;
}

/**
 * Converts a Word (.docx) file into a high-quality PDF in the browser using mammoth & jsPDF.
 */
export async function convertDocxToPdf(
  file: File,
  onProgress?: (progress: DocxToPdfProgress) => void
): Promise<{ blob: Blob; pageCount: number; wordCount: number }> {
  onProgress?.({ stage: "Reading Word document...", percent: 15 });

  const arrayBuffer = await file.arrayBuffer();

  onProgress?.({ stage: "Extracting content & formatting...", percent: 40 });

  // Extract raw text and structured paragraphs
  const result = await mammoth.extractRawText({ arrayBuffer });
  const rawText = result.value || "";

  // Split into paragraphs / lines
  const rawParagraphs = rawText
    .split(/\r?\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const wordCount = rawText.split(/\s+/).filter(Boolean).length;

  onProgress?.({ stage: "Rendering PDF pages...", percent: 65 });

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 45;
  const contentWidth = pageWidth - margin * 2;
  const bottomThreshold = pageHeight - margin - 20;

  let cursorY = margin + 15;
  let pageCount = 1;

  // Set font
  doc.setFont("helvetica", "normal");

  for (let i = 0; i < rawParagraphs.length; i++) {
    const para = rawParagraphs[i];
    const isHeading = para.length < 70 && (i === 0 || /^[A-Z0-9\s:_-]+$/.test(para));

    const fontSize = isHeading ? 15 : 10.5;
    const lineHeight = isHeading ? 22 : 15;

    doc.setFontSize(fontSize);
    doc.setFont("helvetica", isHeading ? "bold" : "normal");
    doc.setTextColor(isHeading ? 30 : 50, isHeading ? 41 : 60, isHeading ? 59 : 70);

    // Split text into lines that fit contentWidth
    const lines = doc.splitTextToSize(para, contentWidth);

    for (const line of lines) {
      if (cursorY + lineHeight > bottomThreshold) {
        doc.addPage();
        pageCount++;
        cursorY = margin + 15;
      }

      doc.text(line, margin, cursorY);
      cursorY += lineHeight;
    }

    // Paragraph spacing
    cursorY += isHeading ? 10 : 7;
  }

  // If document was completely empty
  if (rawParagraphs.length === 0) {
    doc.setFontSize(11);
    doc.setTextColor(120, 120, 120);
    doc.text("(Empty document)", margin, cursorY);
  }

  onProgress?.({ stage: "Finalizing PDF...", percent: 90 });

  const blob = doc.output("blob");

  onProgress?.({ stage: "Complete!", percent: 100 });

  return { blob, pageCount, wordCount };
}

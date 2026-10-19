"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { convertPdfToDocx, type ConversionProgress } from "@/lib/converter/pdfToDocx";
import { convertDocxToPdf, type DocxToPdfProgress } from "@/lib/converter/docxToPdf";
import styles from "./converter.module.css";

type Mode = "pdf-to-docx" | "docx-to-pdf";

interface ConversionResult {
  blob: Blob;
  fileName: string;
  pageCount: number;
  wordCount: number;
}

export function DocumentConverter() {
  const [mode, setMode] = useState<Mode>("pdf-to-docx");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState<ConversionProgress | DocxToPdfProgress | null>(null);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptedMime = mode === "pdf-to-docx" ? "application/pdf" : ".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

  const handleTabSwitch = (newMode: Mode) => {
    if (newMode === mode) return;
    setMode(newMode);
    setFile(null);
    setResult(null);
    setError(null);
    setProgress(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileSelect = (selectedFile: File) => {
    setError(null);
    setResult(null);
    setProgress(null);

    const isPdf = selectedFile.name.toLowerCase().endsWith(".pdf");
    const isDocx = selectedFile.name.toLowerCase().endsWith(".docx");

    if (mode === "pdf-to-docx" && !isPdf) {
      setError("Please select a valid PDF file (.pdf)");
      return;
    }

    if (mode === "docx-to-pdf" && !isDocx) {
      setError("Please select a valid Word file (.docx)");
      return;
    }

    // Limit to 50MB for smooth browser memory handling
    if (selectedFile.size > 50 * 1024 * 1024) {
      setError("File size exceeds 50MB limit for browser processing.");
      return;
    }

    setFile(selectedFile);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleConvert = async () => {
    if (!file) return;

    setIsConverting(true);
    setError(null);
    setProgress({ stage: "Preparing conversion...", percent: 5 });

    try {
      if (mode === "pdf-to-docx") {
        const res = await convertPdfToDocx(file, (p) => setProgress(p));
        const outputName = file.name.replace(/\.[^/.]+$/, "") + ".docx";
        setResult({
          blob: res.blob,
          fileName: outputName,
          pageCount: res.pageCount,
          wordCount: res.wordCount,
        });
      } else {
        const res = await convertDocxToPdf(file, (p) => setProgress(p));
        const outputName = file.name.replace(/\.[^/.]+$/, "") + ".pdf";
        setResult({
          blob: res.blob,
          fileName: outputName,
          pageCount: res.pageCount,
          wordCount: res.wordCount,
        });
      }
    } catch (err: unknown) {
      console.error("Conversion failed:", err);
      const errMsg = err instanceof Error ? err.message : "Conversion encountered an unexpected error.";
      setError(`Failed to convert document: ${errMsg}`);
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const url = URL.createObjectURL(result.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = result.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setProgress(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  return (
    <div className={styles.container}>
      {/* Top Navbar */}
      <header className={styles.nav}>
        <Link href="/" className={styles.brand}>
          <span className={styles.brandText}>
            click <span className={styles.brandAmp}>&</span> clique
            <span className={styles.brandDot}>.</span>
          </span>
        </Link>
        <div className={styles.navLinks}>
          <Link href="/" className={styles.navLink}>Quizzes</Link>
          <Link href="/tools/pdf-converter" className={`${styles.navLink} font-bold text-purple-700`}>PDF Converter</Link>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.main}>
        <div className={styles.header}>
          <div className={styles.badge}>
            <span>⚡</span> 100% Free &amp; Private Browser Tool
          </div>
          <h1 className={styles.title}>
            Free <span className={styles.titleHighlight}>Document Converter</span>
          </h1>
          <p className={styles.subtitle}>
            Convert PDF to editable Word (.docx) and Word documents to PDF directly inside your web browser. Zero server upload, completely private and instant.
          </p>
        </div>

        {/* Tab Controls */}
        <div className={styles.tabs} role="tablist" aria-label="Converter Mode">
          <button
            role="tab"
            aria-selected={mode === "pdf-to-docx"}
            className={`${styles.tab} ${mode === "pdf-to-docx" ? styles.tabActive : ""}`}
            onClick={() => handleTabSwitch("pdf-to-docx")}
          >
            <span>📄</span> PDF to Word (.docx)
          </button>
          <button
            role="tab"
            aria-selected={mode === "docx-to-pdf"}
            className={`${styles.tab} ${mode === "docx-to-pdf" ? styles.tabActive : ""}`}
            onClick={() => handleTabSwitch("docx-to-pdf")}
          >
            <span>📝</span> Word (.docx) to PDF
          </button>
        </div>

        {/* Card */}
        <div className={styles.card}>
          <input
            type="file"
            ref={fileInputRef}
            accept={acceptedMime}
            style={{ display: "none" }}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileSelect(e.target.files[0]);
              }
            }}
          />

          {!file ? (
            <div
              className={`${styles.dropzone} ${isDragging ? styles.dropzoneActive : ""}`}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className={styles.dropIcon}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <h3 className={styles.dropTitle}>
                {mode === "pdf-to-docx" ? "Drop your PDF file here" : "Drop your Word document (.docx) here"}
              </h3>
              <p className={styles.dropSubtitle}>
                Supports files up to 50MB • All processing runs 100% locally
              </p>
              <button type="button" className={styles.browseButton}>
                Browse File
              </button>
            </div>
          ) : (
            <div>
              <div className={styles.selectedFile}>
                <div className={styles.fileMeta}>
                  <div className={styles.fileIcon}>
                    {mode === "pdf-to-docx" ? "PDF" : "DOCX"}
                  </div>
                  <div>
                    <div className={styles.fileName}>{file.name}</div>
                    <div className={styles.fileSize}>{formatFileSize(file.size)}</div>
                  </div>
                </div>
                {!isConverting && !result && (
                  <button
                    type="button"
                    className={styles.removeFileBtn}
                    onClick={handleReset}
                    title="Remove file"
                  >
                    ✕
                  </button>
                )}
              </div>

              {!result && (
                <button
                  type="button"
                  className={styles.convertBtn}
                  disabled={isConverting}
                  onClick={handleConvert}
                >
                  {isConverting ? (
                    <>
                      <span>⏳</span> Converting...
                    </>
                  ) : (
                    <>
                      <span>🔄</span>
                      {mode === "pdf-to-docx" ? "Convert to Word (.docx)" : "Convert to PDF"}
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Progress bar */}
          {isConverting && progress && (
            <div className={styles.progressContainer}>
              <div className={styles.progressLabel}>
                <span>{progress.stage}</span>
                <span>{progress.percent}%</span>
              </div>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className={styles.errorBox}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Result Card */}
          {result && (
            <div className={styles.resultBox}>
              <h4 className={styles.resultTitle}>
                <span>✅</span> Conversion Successful!
              </h4>
              <div className={styles.statsRow}>
                <div className={styles.statItem}>
                  <span className={styles.statValue}>{result.pageCount}</span>
                  <span className={styles.statLabel}>Pages</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statValue}>{result.wordCount}</span>
                  <span className={styles.statLabel}>Words</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statValue}>{formatFileSize(result.blob.size)}</span>
                  <span className={styles.statLabel}>File Size</span>
                </div>
              </div>
              <button
                type="button"
                className={styles.downloadBtn}
                onClick={handleDownload}
              >
                <span>📥</span> Download {result.fileName}
              </button>
              <button
                type="button"
                className={styles.resetBtn}
                onClick={handleReset}
              >
                Convert another document
              </button>
            </div>
          )}
        </div>

        {/* Privacy Banner */}
        <div className={styles.privacyBanner}>
          <div className={styles.shieldIcon}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div>
            <h4 className={styles.privacyTitle}>100% Client-Side Privacy Guarantee</h4>
            <p className={styles.privacyText}>
              Unlike other online converters, your documents are never uploaded to any remote server or cloud service. The conversion engine runs directly within your device’s browser memory via WebAssembly and JavaScript. Your confidential files stay strictly private on your computer.
            </p>
          </div>
        </div>

        {/* FAQs Section */}
        <section className={styles.faqSection} aria-labelledby="faq-title">
          <h2 id="faq-title">Frequently Asked Questions</h2>
          <div className={styles.faqGrid}>
            <details className={styles.faqItem}>
              <summary className={styles.faqQuestion}>
                <span>Is this PDF and Word converter completely free?</span>
                <span aria-hidden="true">+</span>
              </summary>
              <p className={styles.faqAnswer}>
                Yes, 100% free with no sign-up, no email registration, and no daily conversion limits.
              </p>
            </details>
            <details className={styles.faqItem}>
              <summary className={styles.faqQuestion}>
                <span>Are my uploaded documents safe and private?</span>
                <span aria-hidden="true">+</span>
              </summary>
              <p className={styles.faqAnswer}>
                Yes, absolutely. All file processing happens locally in your web browser. Your files are never sent over the internet to our servers or third parties.
              </p>
            </details>
            <details className={styles.faqItem}>
              <summary className={styles.faqQuestion}>
                <span>Can I convert multi-page documents?</span>
                <span aria-hidden="true">+</span>
              </summary>
              <p className={styles.faqAnswer}>
                Yes! Both the PDF to Word and Word to PDF converters support multi-page documents, automatically generating corresponding pages and layout structure.
              </p>
            </details>
            <details className={styles.faqItem}>
              <summary className={styles.faqQuestion}>
                <span>What file formats are supported?</span>
                <span aria-hidden="true">+</span>
              </summary>
              <p className={styles.faqAnswer}>
                Currently, we support PDF (.pdf) to Microsoft Word (.docx) and Microsoft Word (.docx) to PDF (.pdf).
              </p>
            </details>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>
          © {new Date().getFullYear()} Click &amp; Clique • Free Client-Side Document Tools • <Link href="/">Back to Quizzes</Link>
        </p>
      </footer>
    </div>
  );
}

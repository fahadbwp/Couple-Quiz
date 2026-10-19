import type { Metadata } from "next";
import { DocumentConverter } from "@/components/converter/DocumentConverter";
import { safeJsonLdStringify } from "@/components/seo/JsonLd";
import { getBaseUrl } from "@/lib/quiz/sharing";

export const metadata: Metadata = {
  title: "Free PDF to Word & Word to PDF Converter Online",
  description:
    "Convert PDF to editable Word (.docx) and Word documents to PDF free directly in your browser. 100% private, instant conversion with zero file upload to servers.",
  keywords: [
    "pdf to doc converter",
    "pdf to docx converter",
    "doc to pdf converter",
    "docx to pdf converter",
    "convert pdf to word online free",
    "free pdf converter",
    "private pdf converter",
    "browser pdf converter",
  ],
  alternates: {
    canonical: "/tools/pdf-converter",
  },
  openGraph: {
    title: "Free PDF to Word & Word to PDF Converter Online | Click & Clique",
    description:
      "Convert PDF to editable Word (.docx) and Word to PDF 100% free in your browser. Complete privacy — zero server uploads.",
    url: "/tools/pdf-converter",
    siteName: "Click & Clique",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free PDF to Word & Word to PDF Converter Online",
    description:
      "Instant, 100% private in-browser document conversion between PDF and Word (.docx).",
  },
};

export default function PdfConverterPage() {
  const baseUrl = getBaseUrl();
  const toolUrl = `${baseUrl}/tools/pdf-converter`;

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        "@id": `${toolUrl}#webapp`,
        name: "Click & Clique PDF & Word Converter",
        url: toolUrl,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Any",
        browserRequirements: "Requires JavaScript",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        description:
          "Free and secure in-browser PDF to DOCX and DOCX to PDF converter without server uploads.",
      },
      {
        "@type": "FAQPage",
        "@id": `${toolUrl}#faq`,
        mainEntity: [
          {
            "@type": "Question",
            name: "Is this PDF and Word converter completely free?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes, 100% free with no sign-up, no email registration, and no daily conversion limits.",
            },
          },
          {
            "@type": "Question",
            name: "Are my uploaded documents safe and private?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes, absolutely. All file processing happens locally in your web browser. Your files are never sent over the internet to our servers or third parties.",
            },
          },
          {
            "@type": "Question",
            name: "Can I convert multi-page documents?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes! Both the PDF to Word and Word to PDF converters support multi-page documents, automatically generating corresponding pages and layout structure.",
            },
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLdStringify(structuredData),
        }}
      />
      <DocumentConverter />
    </>
  );
}

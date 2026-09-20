/**
 * Exact-byte PDF 1.4 Binary Generator
 * Generates standards-compliant valid PDF documents with exact xref offsets
 */

export function generatePublicationPdfBlob(pub: {
  title: string;
  subtitle?: string;
  authorName: string;
  authorClub?: string;
  summary: string;
  content?: string;
  submittedAt?: string;
}): Blob {
  const chunks: Uint8Array[] = [];
  let totalLength = 0;
  const offsets: number[] = [];

  const encoder = new TextEncoder();

  function append(str: string) {
    const bytes = encoder.encode(str);
    chunks.push(bytes);
    totalLength += bytes.length;
  }

  // Header with binary comment
  append('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');

  // Object 1: Catalog
  offsets.push(totalLength);
  append('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  // Object 2: Pages Tree
  offsets.push(totalLength);
  append('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');

  // Object 3: Page Definition (8.5 x 11 inches = 612 x 792 points)
  offsets.push(totalLength);
  append('3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> /F2 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> /Contents 4 0 R >>\nendobj\n');

  // Clean strings for PDF stream
  const cleanTitle = (pub.title || 'Official Community Publication').replace(/[()\\\r\n]/g, ' ');
  const cleanAuthor = `By ${pub.authorName || 'Anonymous'}${pub.authorClub ? ` (${pub.authorClub})` : ''}`.replace(/[()\\\r\n]/g, ' ');
  const dateStr = pub.submittedAt ? new Date(pub.submittedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString();
  const cleanSummary = (pub.summary || 'Official publication details.').replace(/[()\\\r\n]/g, ' ');
  const cleanContent = (pub.content || '').replace(/[()\\\r\n]/g, ' ');

  // Build PDF stream
  let stream = '';
  // Top Banner
  stream += `0.85 0.37 0.50 rg\n50 710 512 36 re f\n`;
  stream += `BT\n/F1 11 Tf\n1 1 1 rg\n65 723 Td\n(PROJECT STHREE SHAKTHI  |  ROTARACT DISTRICT 3220) Tj\nET\n`;

  // Title
  stream += `BT\n/F1 18 Tf\n0.24 0.06 0.16 rg\n50 670 Td\n(${cleanTitle.slice(0, 50)}) Tj\nET\n`;

  // Author & Date
  stream += `BT\n/F2 10 Tf\n0.40 0.40 0.40 rg\n50 650 Td\n(${cleanAuthor.slice(0, 50)}  |  Published: ${dateStr}) Tj\nET\n`;

  // Divider
  stream += `0.80 0.80 0.80 RG\n1 w\n50 635 m 562 635 l S\n`;

  // Summary Header & Text
  stream += `BT\n/F1 11 Tf\n0.55 0.10 0.25 rg\n50 605 Td\n(EXECUTIVE SUMMARY) Tj\nET\n`;
  stream += `BT\n/F2 10 Tf\n0.20 0.20 0.20 rg\n50 585 Td\n(${cleanSummary.slice(0, 85)}) Tj\nET\n`;
  if (cleanSummary.length > 85) {
    stream += `BT\n/F2 10 Tf\n0.20 0.20 0.20 rg\n50 570 Td\n(${cleanSummary.slice(85, 170)}) Tj\nET\n`;
  }

  // Body content
  if (cleanContent) {
    stream += `BT\n/F1 11 Tf\n0.24 0.06 0.16 rg\n50 530 Td\n(PUBLICATION DETAILS) Tj\nET\n`;
    stream += `BT\n/F2 10 Tf\n0.20 0.20 0.20 rg\n50 510 Td\n(${cleanContent.slice(0, 85)}) Tj\nET\n`;
    if (cleanContent.length > 85) {
      stream += `BT\n/F2 10 Tf\n0.20 0.20 0.20 rg\n50 495 Td\n(${cleanContent.slice(85, 170)}) Tj\nET\n`;
    }
  }

  // Footer
  stream += `0.80 0.80 0.80 RG\n0.5 w\n50 45 m 562 45 l S\n`;
  stream += `BT\n/F2 8 Tf\n0.50 0.50 0.50 rg\n50 30 Td\n(Project Sthree Shakthi - Cluster 05 - Digital Document Reader) Tj\nET\n`;

  const streamBytes = encoder.encode(stream);

  // Object 4: Stream Data
  offsets.push(totalLength);
  append(`4 0 obj\n<< /Length ${streamBytes.length} >>\nstream\n`);
  chunks.push(streamBytes);
  totalLength += streamBytes.length;
  append('\nendstream\nendobj\n');

  // Cross-Reference Table
  const startXref = totalLength;
  append('xref\n0 5\n0000000000 65535 f \n');
  for (const o of offsets) {
    append(`${String(o).padStart(10, '0')} 00000 n \n`);
  }

  // Trailer
  append(`trailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`);

  // Combine into single Uint8Array
  const finalBuffer = new Uint8Array(totalLength);
  let cur = 0;
  for (const chunk of chunks) {
    finalBuffer.set(chunk, cur);
    cur += chunk.length;
  }

  return new Blob([finalBuffer], { type: 'application/pdf' });
}

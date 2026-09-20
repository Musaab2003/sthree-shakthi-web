function escapePdfText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function wrapText(text: string, maxCharsPerLine: number = 75): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length <= maxCharsPerLine) {
      currentLine = (currentLine + ' ' + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

export function generatePublicationPdfBlob(pub: {
  title: string;
  subtitle?: string;
  authorName: string;
  authorClub?: string;
  summary: string;
  content?: string;
  submittedAt?: string;
}): Blob {
  const title = pub.title || 'Untitled Publication';
  const author = `Author: ${pub.authorName || 'Anonymous'}${pub.authorClub ? ` (${pub.authorClub})` : ''}`;
  const dateStr = pub.submittedAt ? new Date(pub.submittedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString();
  const summaryLines = wrapText(pub.summary || '', 70);
  const contentLines = pub.content ? wrapText(pub.content, 75) : [];

  const pageHeight = 792;
  const pageWidth = 612;
  const margin = 50;

  let stream = '';
  stream += `0.85 0.37 0.50 rg\n`;
  stream += `${margin} ${pageHeight - 110} ${pageWidth - (margin * 2)} 40 re f\n`;
  stream += `BT\n/F1 12 Tf\n1 1 1 rg\n${margin + 15} ${pageHeight - 95} Td\n(PROJECT STHREE SHAKTHI  |  ROTARACT DISTRICT 3220) Tj\nET\n`;
  stream += `BT\n/F1 20 Tf\n0.24 0.06 0.16 rg\n${margin} ${pageHeight - 150} Td\n(${escapePdfText(title.slice(0, 60))}) Tj\nET\n`;
  stream += `BT\n/F2 10 Tf\n0.40 0.40 0.40 rg\n${margin} ${pageHeight - 175} Td\n(${escapePdfText(author)}   |   Published: ${escapePdfText(dateStr)}) Tj\nET\n`;
  stream += `0.80 0.80 0.80 RG\n1 w\n${margin} ${pageHeight - 190} m ${pageWidth - margin} ${pageHeight - 190} l S\n`;

  let currentY = pageHeight - 225;
  stream += `0.98 0.95 0.92 rg\n`;
  const boxHeight = Math.max(60, summaryLines.length * 16 + 25);
  stream += `${margin} ${currentY - boxHeight + 15} ${pageWidth - (margin * 2)} ${boxHeight} re f\n`;
  stream += `0.85 0.37 0.50 RG\n1.5 w\n${margin} ${currentY - boxHeight + 15} ${pageWidth - (margin * 2)} ${boxHeight} re S\n`;
  stream += `BT\n/F1 10 Tf\n0.55 0.10 0.25 rg\n${margin + 15} ${currentY - 5} Td\n(EXECUTIVE SUMMARY) Tj\nET\n`;
  currentY -= 22;

  for (const line of summaryLines) {
    stream += `BT\n/F2 10 Tf\n0.20 0.20 0.20 rg\n${margin + 15} ${currentY} Td\n(${escapePdfText(line)}) Tj\nET\n`;
    currentY -= 15;
  }

  currentY -= 30;

  if (contentLines.length > 0) {
    stream += `BT\n/F1 12 Tf\n0.24 0.06 0.16 rg\n${margin} ${currentY} Td\n(DOCUMENT BODY) Tj\nET\n`;
    currentY -= 20;

    for (const line of contentLines) {
      if (currentY < margin + 40) break;
      stream += `BT\n/F2 10 Tf\n0.15 0.15 0.15 rg\n${margin} ${currentY} Td\n(${escapePdfText(line)}) Tj\nET\n`;
      currentY -= 15;
    }
  }

  stream += `0.80 0.80 0.80 RG\n0.5 w\n${margin} 45 m ${pageWidth - margin} 45 l S\n`;
  stream += `BT\n/F2 8 Tf\n0.50 0.50 0.50 rg\n${margin} 30 Td\n(Project Sthree Shakthi - Cluster 05 - Official Publication) Tj\nET\n`;

  const streamLength = stream.length;

  const pdfContent = `%PDF-1.4
1 0 obj
<<
  /Type /Catalog
  /Pages 2 0 R
>>
endobj
2 0 obj
<<
  /Type /Pages
  /Kids [3 0 R]
  /Count 1
>>
endobj
3 0 obj
<<
  /Type /Page
  /Parent 2 0 R
  /MediaBox [0 0 ${pageWidth} ${pageHeight}]
  /Resources <<
    /Font <<
      /F1 <<
        /Type /Font
        /Subtype /Type1
        /BaseFont /Helvetica-Bold
      >>
      /F2 <<
        /Type /Font
        /Subtype /Type1
        /BaseFont /Helvetica
      >>
    >>
  >>
  /Contents 4 0 R
>>
endobj
4 0 obj
<<
  /Length ${streamLength}
>>
stream
${stream}
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000350 00000 n 
trailer
<<
  /Size 5
  /Root 1 0 R
>>
startxref
${400 + streamLength}
%%EOF`;

  return new Blob([pdfContent], { type: 'application/pdf' });
}

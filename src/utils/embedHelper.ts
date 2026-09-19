/**
 * Converts various link formats (Google Drive, Flipbooks, PDFs)
 * into safe, interactive embeddable URLs for iframes.
 */

export interface ParsedEmbed {
  originalUrl: string;
  embedUrl: string;
  provider: 'google_drive' | 'heyzine' | 'anyflip' | 'fliphtml5' | 'issuu' | 'canva' | 'generic';
  canEmbed: boolean;
  instructions?: string;
}

export function parseDocumentOrFlipbookUrl(url: string): ParsedEmbed {
  if (!url || typeof url !== 'string') {
    return { originalUrl: '', embedUrl: '', provider: 'generic', canEmbed: false };
  }

  const clean = url.trim();

  // 1. Google Drive Detection
  // Examples:
  // https://drive.google.com/file/d/1a2b3c4d5e/view?usp=sharing
  // https://drive.google.com/open?id=1a2b3c4d5e
  const driveFileRegex = /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/;
  const driveOpenRegex = /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/;
  const driveDocsRegex = /docs\.google\.com\/(document|presentation|spreadsheets)\/d\/([a-zA-Z0-9_-]+)/;

  const driveMatch = clean.match(driveFileRegex) || clean.match(driveOpenRegex);
  if (driveMatch && driveMatch[1]) {
    const fileId = driveMatch[1];
    return {
      originalUrl: clean,
      embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
      provider: 'google_drive',
      canEmbed: true,
      instructions: 'Make sure your Google Drive link is set to "Anyone with the link can view".'
    };
  }

  const docMatch = clean.match(driveDocsRegex);
  if (docMatch && docMatch[2]) {
    const docType = docMatch[1];
    const docId = docMatch[2];
    return {
      originalUrl: clean,
      embedUrl: `https://docs.google.com/${docType}/d/${docId}/preview`,
      provider: 'google_drive',
      canEmbed: true
    };
  }

  // 2. Heyzine Flipbook Detection
  // Example: https://heyzine.com/flip-book/123456789.html or https://heyzine.com/flip-book/123456789
  if (clean.includes('heyzine.com')) {
    let embed = clean;
    if (!embed.endsWith('.html') && !embed.includes('?')) {
      embed = `${embed}.html`;
    }
    return {
      originalUrl: clean,
      embedUrl: embed,
      provider: 'heyzine',
      canEmbed: true
    };
  }

  // 3. AnyFlip Detection
  // Example: https://online.anyflip.com/abc/def/index.html
  if (clean.includes('anyflip.com')) {
    return {
      originalUrl: clean,
      embedUrl: clean,
      provider: 'anyflip',
      canEmbed: true
    };
  }

  // 4. FlipHTML5 Detection
  // Example: https://online.fliphtml5.com/abcde/fghi/
  if (clean.includes('fliphtml5.com')) {
    return {
      originalUrl: clean,
      embedUrl: clean,
      provider: 'fliphtml5',
      canEmbed: true
    };
  }

  // 5. Issuu Detection
  if (clean.includes('issuu.com')) {
    return {
      originalUrl: clean,
      embedUrl: clean,
      provider: 'issuu',
      canEmbed: true
    };
  }

  // 6. Canva Detection
  if (clean.includes('canva.com')) {
    let canvaUrl = clean;
    if (canvaUrl.includes('/view')) {
      canvaUrl = canvaUrl.replace('/view', '/view?embed');
    }
    return {
      originalUrl: clean,
      embedUrl: canvaUrl,
      provider: 'canva',
      canEmbed: true
    };
  }

  // Generic fallback: if it's already an http(s) URL
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    return {
      originalUrl: clean,
      embedUrl: clean,
      provider: 'generic',
      canEmbed: true
    };
  }

  return {
    originalUrl: clean,
    embedUrl: clean,
    provider: 'generic',
    canEmbed: false
  };
}

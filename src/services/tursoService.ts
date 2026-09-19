import { Publication, PublicationStatus, DatabaseConfig } from '../types';

interface LibSqlValue {
  type: 'text' | 'integer' | 'float' | 'null' | 'blob';
  value?: string;
}

interface LibSqlStmt {
  sql: string;
  args?: LibSqlValue[];
}

function convertArgToLibSql(arg: any): LibSqlValue {
  if (arg === null || arg === undefined) {
    return { type: 'null' };
  }
  if (typeof arg === 'number') {
    return Number.isInteger(arg) 
      ? { type: 'integer', value: String(arg) } 
      : { type: 'float', value: String(arg) };
  }
  if (typeof arg === 'boolean') {
    return { type: 'integer', value: arg ? '1' : '0' };
  }
  return { type: 'text', value: String(arg) };
}

function getTursoEndpoint(rawUrl: string): string {
  let url = rawUrl.trim();
  if (url.startsWith('libsql://')) {
    url = url.replace('libsql://', 'https://');
  }
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  url = url.replace(/\/+$/, '');
  if (!url.endsWith('/v2/pipeline')) {
    url += '/v2/pipeline';
  }
  return url;
}

const DEFAULT_TURSO_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODk3OTYxNTQsImlkIjoiMDFhMDdmMmEtM2EwMS03NmY0LWI2ZGUtYzE5YzU3OTY1ZDQ0Iiwia2lkIjoiY1JfdV81RVNLVXJFWTZWejNXMXFXbk5MVGNKeHU2cWZnajlXaFVJOU9MWSIsInJpZCI6ImY5YzUyZGI3LTBhNTItNDhhZC04YWU1LTg5MWZmOWVmYjdlNyJ9.lvfBa8bP0CZHqvzFW1Y1Ush4P5d7iopZKTFarkKjye56R5i7CDbFtqyspyZECyxUSqccoveHtdGbOEANOuZuCw';

export const tursoService = {
  getEffectiveConfig(): { dbUrl: string; token: string } {
    const envUrl = ((import.meta as any).env?.VITE_TURSO_DB_URL as string) || '';
    const envToken = ((import.meta as any).env?.VITE_TURSO_AUTH_TOKEN as string) || '';
    
    let savedUrl = '';
    let savedToken = '';
    try {
      const cfg = JSON.parse(localStorage.getItem('sthree_shakthi_db_config_v2') || '{}');
      savedUrl = cfg.databaseUrl || '';
      savedToken = cfg.authToken || '';
    } catch {}

    const dbUrl = savedUrl || envUrl || 'https://sthree-shakthi-db-musaab2003.aws-ap-south-1.turso.io';
    const token = savedToken || envToken || DEFAULT_TURSO_TOKEN;
    return { dbUrl, token };
  },

  isConfigured(): boolean {
    const { dbUrl, token } = this.getEffectiveConfig();
    return Boolean(dbUrl && token);
  },

  async executeQuery(sql: string, args: any[] = []): Promise<{ rows: any[]; cols: string[]; error?: string }> {
    const { dbUrl, token } = this.getEffectiveConfig();
    if (!dbUrl || !token) {
      return { rows: [], cols: [], error: 'Turso Cloud database URL or Auth Token not set.' };
    }

    try {
      const endpoint = getTursoEndpoint(dbUrl);
      const stmt: LibSqlStmt = {
        sql,
        args: args.map(convertArgToLibSql)
      };

      const payload = {
        requests: [
          { type: 'execute', stmt },
          { type: 'close' }
        ]
      };

      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!resp.ok) {
        const errText = await resp.text();
        return { rows: [], cols: [], error: `HTTP ${resp.status}: ${errText}` };
      }

      const data = await resp.json();
      const firstResult = data.results?.[0]?.response?.result;

      if (!firstResult) {
        return { rows: [], cols: [] };
      }

      const cols: string[] = firstResult.cols?.map((c: any) => c.name) || [];
      const rawRows: any[][] = firstResult.rows || [];

      const rows = rawRows.map(rowArray => {
        const obj: Record<string, any> = {};
        cols.forEach((colName, index) => {
          const valObj = rowArray[index];
          obj[colName] = valObj ? valObj.value : null;
        });
        return obj;
      });

      return { rows, cols };
    } catch (e: any) {
      return { rows: [], cols: [], error: e.message || 'Network error connecting to Turso Cloud.' };
    }
  },

  async syncAllPublications(): Promise<Publication[] | null> {
    if (!this.isConfigured()) return null;
    const { rows, error } = await this.executeQuery(`
      SELECT 
        id, title, subtitle, author_name, author_email, author_club, category, 
        type, summary, content, embed_url, file_name, file_size, file_data, 
        cover_image, tags, status, is_featured, submitted_at, approved_at, 
        rejected_reason, views, likes, read_time_minutes
      FROM publications 
      ORDER BY submitted_at DESC
    `);

    if (error || !rows) {
      console.warn('Turso publications sync notice:', error);
      return null;
    }

    return rows.map((r: any) => ({
      id: r.id,
      title: r.title || 'Untitled',
      subtitle: r.subtitle || undefined,
      authorName: r.author_name || 'Anonymous',
      authorEmail: r.author_email || '',
      authorClub: r.author_club || undefined,
      category: r.category || 'story',
      type: r.type || 'pdf',
      summary: r.summary || '',
      content: r.content || undefined,
      embedUrl: r.embed_url || undefined,
      fileName: r.file_name || undefined,
      fileSize: r.file_size || undefined,
      fileData: r.file_data || undefined,
      coverImage: r.cover_image || '/hero-banner.png',
      tags: r.tags ? String(r.tags).split(',').map(t => t.trim()).filter(Boolean) : [],
      status: (r.status || 'pending') as PublicationStatus,
      isFeatured: r.is_featured === '1' || r.is_featured === 1,
      submittedAt: r.submitted_at || new Date().toISOString(),
      approvedAt: r.approved_at || undefined,
      rejectedReason: r.rejected_reason || undefined,
      views: Number(r.views) || 0,
      likes: Number(r.likes) || 0,
      readTimeMinutes: Number(r.read_time_minutes) || 5
    }));
  },

  async insertPublication(pub: Publication): Promise<boolean> {
    if (!this.isConfigured()) return false;
    const tagsStr = (pub.tags || []).join(', ');
    const res = await this.executeQuery(`
      INSERT OR REPLACE INTO publications (
        id, title, subtitle, author_name, author_email, author_club, category, 
        type, summary, content, embed_url, file_name, file_size, file_data, 
        cover_image, tags, status, is_featured, submitted_at, views, likes, read_time_minutes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      pub.id,
      pub.title,
      pub.subtitle || null,
      pub.authorName,
      pub.authorEmail,
      pub.authorClub || null,
      pub.category,
      pub.type,
      pub.summary,
      pub.content || null,
      pub.embedUrl || null,
      pub.fileName || null,
      pub.fileSize || null,
      pub.fileData || null,
      pub.coverImage,
      tagsStr,
      pub.status,
      pub.isFeatured ? 1 : 0,
      pub.submittedAt,
      pub.views || 0,
      pub.likes || 0,
      pub.readTimeMinutes || 5
    ]);
    return !res.error;
  },

  async updatePublicationStatus(id: string, status: PublicationStatus, rejectedReason?: string): Promise<boolean> {
    if (!this.isConfigured()) return false;
    const res = await this.executeQuery(`
      UPDATE publications 
      SET status = ?, rejected_reason = ?, approved_at = CASE WHEN ? = 'approved' THEN CURRENT_TIMESTAMP ELSE approved_at END 
      WHERE id = ?
    `, [status, rejectedReason || null, status, id]);
    return !res.error;
  },

  async togglePublicationFeature(id: string, isFeatured: boolean): Promise<boolean> {
    if (!this.isConfigured()) return false;
    const res = await this.executeQuery(`
      UPDATE publications SET is_featured = ? WHERE id = ?
    `, [isFeatured ? 1 : 0, id]);
    return !res.error;
  },

  async deletePublication(id: string): Promise<boolean> {
    if (!this.isConfigured()) return false;
    const res = await this.executeQuery(`
      DELETE FROM publications WHERE id = ?
    `, [id]);
    return !res.error;
  },

  async syncSubscribers(): Promise<string[] | null> {
    if (!this.isConfigured()) return null;
    const { rows, error } = await this.executeQuery(`
      SELECT email FROM newsletter_subscribers ORDER BY id DESC
    `);
    if (error || !rows) return null;
    return rows.map((r: any) => String(r.email).trim().toLowerCase()).filter(Boolean);
  },

  async insertSubscriber(email: string): Promise<boolean> {
    if (!this.isConfigured()) return false;
    const clean = email.trim().toLowerCase();
    const res = await this.executeQuery(`
      INSERT OR IGNORE INTO newsletter_subscribers (email) VALUES (?)
    `, [clean]);
    return !res.error;
  },

  async removeSubscriber(email: string): Promise<boolean> {
    if (!this.isConfigured()) return false;
    const clean = email.trim().toLowerCase();
    const res = await this.executeQuery(`
      DELETE FROM newsletter_subscribers WHERE email = ?
    `, [clean]);
    return !res.error;
  }
};

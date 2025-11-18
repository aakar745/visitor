import api from './api';
import type { BadgeOverlayConfig } from '../types/exhibitions';

interface BadgeGenerationRequest {
  visitorId: string;
  exhibitionId: string;
  format?: 'pdf' | 'png';
}

interface BulkBadgeGenerationRequest {
  exhibitionId: string;
  visitorIds: string[];
  format?: 'pdf' | 'png';
  orientation?: 'portrait' | 'landscape';
  badgesPerPage?: number;
}

interface BadgePreviewRequest {
  exhibitionId: string;
  badgeConfig: BadgeOverlayConfig;
  sampleData?: {
    visitorName?: string;
    visitorType?: string;
    company?: string;
    location?: string;
  };
}

class BadgeService {
  /**
   * Generate a single visitor badge
   * Uses the uploaded badge logo as base and overlays visitor data
   */
  async generateBadge(request: BadgeGenerationRequest): Promise<Blob> {
    const response = await api.post('/badges/generate', request, {
      responseType: 'blob',
    });
    return response.data;
  }

  /**
   * Generate badges for multiple visitors (bulk printing)
   */
  async generateBulkBadges(request: BulkBadgeGenerationRequest): Promise<Blob> {
    const response = await api.post('/badges/generate-bulk', request, {
      responseType: 'blob',
    });
    return response.data;
  }

  /**
   * Generate all badges for an exhibition
   */
  async generateAllExhibitionBadges(exhibitionId: string, format: 'pdf' | 'png' = 'pdf'): Promise<Blob> {
    const response = await api.get(`/badges/exhibition/${exhibitionId}/all`, {
      params: { format },
      responseType: 'blob',
    });
    return response.data;
  }

  /**
   * Preview badge with sample data (for badge designer)
   */
  async previewBadge(request: BadgePreviewRequest): Promise<Blob> {
    const response = await api.post('/badges/preview', request, {
      responseType: 'blob',
    });
    return response.data;
  }

  /**
   * Save badge overlay configuration for an exhibition
   */
  async saveBadgeConfig(exhibitionId: string, config: BadgeOverlayConfig): Promise<void> {
    await api.put(`/exhibitions/${exhibitionId}/badge-config`, { badgeConfig: config });
  }

  /**
   * Get badge configuration for an exhibition
   */
  async getBadgeConfig(exhibitionId: string): Promise<BadgeOverlayConfig | null> {
    const response = await api.get(`/exhibitions/${exhibitionId}/badge-config`);
    return response.data.data;
  }

  /**
   * Send badge via email to visitor
   */
  async emailBadge(visitorId: string, exhibitionId: string): Promise<void> {
    await api.post('/badges/email', { visitorId, exhibitionId });
  }

  /**
   * Bulk email badges to all visitors of an exhibition
   */
  async emailAllBadges(exhibitionId: string): Promise<void> {
    await api.post(`/badges/exhibition/${exhibitionId}/email-all`);
  }

  /**
   * Get visitor badge URL (for download link)
   */
  async getBadgeUrl(visitorId: string, exhibitionId: string): Promise<string> {
    const response = await api.get('/badges/url', {
      params: { visitorId, exhibitionId },
    });
    return response.data.data.url;
  }

  /**
   * Regenerate badge (if visitor details changed)
   */
  async regenerateBadge(visitorId: string, exhibitionId: string): Promise<Blob> {
    const response = await api.post('/badges/regenerate', {
      visitorId,
      exhibitionId,
    }, {
      responseType: 'blob',
    });
    return response.data;
  }

  /**
   * Get default badge configuration template
   * Returns a sensible default configuration that can be customized
   */
  getDefaultBadgeConfig(): BadgeOverlayConfig {
    return {
      visitorName: {
        x: 150,
        y: 280,
        fontSize: 24,
        fontFamily: 'Arial',
        color: '#000000',
        fontWeight: 'bold',
        textAlign: 'left',
      },
      visitorType: {
        x: 150,
        y: 450,
        fontSize: 18,
        fontFamily: 'Arial',
        color: '#FFFFFF',
        backgroundColor: '#c41e3a',
        padding: 10,
        borderRadius: 5,
        fontWeight: 'bold',
      },
      company: {
        x: 150,
        y: 310,
        fontSize: 14,
        fontFamily: 'Arial',
        color: '#666666',
        fontWeight: 'normal',
      },
      location: {
        x: 150,
        y: 335,
        fontSize: 14,
        fontFamily: 'Arial',
        color: '#666666',
        fontWeight: 'normal',
      },
      qrCode: {
        x: 80,
        y: 250,
        size: 100,
        backgroundColor: '#FFFFFF',
        foregroundColor: '#000000',
      },
      badgeWidth: 400,
      badgeHeight: 600,
    };
  }

  /**
   * Download badge file
   * Helper method to trigger browser download
   */
  downloadBadge(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

export const badgeService = new BadgeService();


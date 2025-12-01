import apiClient from './client';

export interface PublicSettings {
  appName: string;
  headerLogoUrl: string | null;
  footerLogoUrl: string | null;
  primaryColor: string;
}

/**
 * Get public settings (no authentication required)
 * Used for frontend branding (logos, colors, etc.)
 */
export async function getPublicSettings(): Promise<PublicSettings> {
  try {
    const response = await apiClient.get('/settings/public');
    return response.data.data;
  } catch (error) {
    console.error('Failed to fetch public settings:', error);
    // Return defaults if API fails
    return {
      appName: 'Visitor Management System',
      headerLogoUrl: null,
      footerLogoUrl: null,
      primaryColor: '#2E5778',
    };
  }
}


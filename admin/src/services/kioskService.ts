import api from './api';

export interface KioskSettings {
  _id: string;
  settingsKey: string;
  kioskEnabled: boolean;
  kioskPin?: string;
  autoCheckIn: boolean;
  showRecentCheckIns: boolean;
  recentCheckInsLimit: number;
  enableSound: boolean;
  welcomeMessage: string;
  themeColor: string;
  enableBarcodeScanner: boolean;
  autoRefreshInterval: number;
  // Auto-Print Settings
  autoPrintEnabled: boolean;
  printerType: string;
  printerConnectionType: string;
  printerServiceUrl: string;
  printerIpAddress?: string;
  labelWidth: number;
  labelHeight: number;
  showLocationOnLabel: boolean;
  showRegNumberOnLabel: boolean;
  autoPrintWelcomeMessage: string;
  printTestMode: boolean;
  allowRepeatPrinting: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateKioskSettingsDto {
  kioskEnabled?: boolean;
  kioskPin?: string;
  autoCheckIn?: boolean;
  showRecentCheckIns?: boolean;
  recentCheckInsLimit?: number;
  enableSound?: boolean;
  welcomeMessage?: string;
  themeColor?: string;
  enableBarcodeScanner?: boolean;
  autoRefreshInterval?: number;
  // Auto-Print Settings
  autoPrintEnabled?: boolean;
  printerType?: string;
  printerConnectionType?: string;
  printerServiceUrl?: string;
  printerIpAddress?: string;
  labelWidth?: number;
  labelHeight?: number;
  showLocationOnLabel?: boolean;
  showRegNumberOnLabel?: boolean;
  autoPrintWelcomeMessage?: string;
  printTestMode?: boolean;
  allowRepeatPrinting?: boolean;
}

class KioskService {
  /**
   * Get kiosk settings
   */
  async getSettings(): Promise<KioskSettings> {
    const response = await api.get<{ data: KioskSettings }>('/kiosk/settings');
    return response.data.data;
  }

  /**
   * Update kiosk settings
   */
  async updateSettings(dto: UpdateKioskSettingsDto): Promise<KioskSettings> {
    const response = await api.put<{ data: KioskSettings }>('/kiosk/settings', dto);
    return response.data.data;
  }
}

export const kioskService = new KioskService();


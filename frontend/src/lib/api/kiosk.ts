import apiClient from './client';

export interface KioskConfig {
  enabled: boolean;
  hasPinProtection: boolean;
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
  printerServiceUrl: string;
  labelWidth: number;
  labelHeight: number;
  showLocationOnLabel: boolean;
  showRegNumberOnLabel: boolean;
  autoPrintWelcomeMessage: string;
  printTestMode: boolean;
  allowRepeatPrinting: boolean;
}

export interface ValidateQRResponse {
  visitor: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    company?: string;
    designation?: string;
    city?: string;
    state?: string;
  };
  registration: {
    id: string;
    registrationNumber: string;
    registrationCategory: string;
    registrationDate: string;
    status: string;
    checkInTime?: string;
    badgeUrl?: string;
  };
  exhibition: {
    id: string;
    name: string;
    venue?: string;
  };
  alreadyCheckedIn: boolean;
  checkInTime?: string;
}

export interface CheckInResponse {
  success: boolean;
  message: string;
  checkInTime: string;
  visitor: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    company?: string;
    designation?: string;
    city?: string;
    state?: string;
  };
  registration: {
    id: string;
    registrationNumber: string;
    registrationCategory: string;
    registrationDate: string;
    checkInTime: string;
  };
  exhibition: {
    id: string;
    name: string;
    venue?: string;
    startDate: string;
    endDate: string;
  };
}

export interface RecentCheckIn {
  registrationNumber: string;
  checkInTime: string;
  visitor: {
    name: string;
    company?: string;
    city?: string;
    state?: string;
  };
  exhibitionName: string;
}

export const kioskApi = {
  /**
   * Get public kiosk configuration
   */
  async getConfig(): Promise<KioskConfig> {
    const response = await apiClient.get<{ data: KioskConfig }>('/kiosk/config');
    return response.data.data;
  },

  /**
   * Validate kiosk PIN
   */
  async validatePin(pin: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<{ data: { success: boolean; message: string } }>(
      '/kiosk/validate-pin',
      { pin }
    );
    return response.data.data;
  },

  /**
   * Validate QR code
   */
  async validateQR(registrationNumber: string): Promise<ValidateQRResponse> {
    const response = await apiClient.get<{ data: ValidateQRResponse }>(
      `/registrations/validate-qr/${registrationNumber}`
    );
    return response.data.data;
  },

  /**
   * Check in visitor
   */
  async checkIn(registrationNumber: string): Promise<CheckInResponse> {
    const response = await apiClient.post<{ data: CheckInResponse }>(
      '/registrations/check-in',
      { registrationNumber }
    );
    return response.data.data;
  },

  /**
   * Get recent check-ins
   */
  async getRecentCheckIns(exhibitionId: string = 'all', limit: number = 20): Promise<RecentCheckIn[]> {
    const response = await apiClient.get<{ data: RecentCheckIn[] }>(
      `/registrations/recent-check-ins/${exhibitionId}`,
      { params: { limit } }
    );
    return response.data.data;
  },

  /**
   * Send print job to local print service (LEGACY - direct print)
   * Use queuePrintJob() instead for better reliability
   */
  async sendPrintJob(printerServiceUrl: string, printData: {
    name: string;
    location?: string;
    registrationNumber: string;
    qrCode: string; // Base64 encoded QR code
  }): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${printerServiceUrl}/print`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(printData),
      });
      return await response.json();
    } catch (error) {
      console.error('Print service error:', error);
      throw new Error('Failed to connect to print service. Ensure the print service is running on the kiosk.');
    }
  },

  /**
   * Queue a print job (NEW - uses Redis queue)
   * More reliable for high-volume scenarios
   */
  async queuePrintJob(
    registrationNumber: string,
    printerServiceUrl: string,
    kioskId?: string
  ): Promise<{ jobId: string; queuePosition: number }> {
    const response = await apiClient.post<{ 
      success: boolean;
      data: {
        success: boolean;
        data: { jobId: string; queuePosition: number };
        message: string;
        timestamp: string;
      };
      message: string;
      timestamp: string;
    }>(
      '/registrations/queue-print',
      { 
        registrationNumber,
        printerServiceUrl,
        kioskId,
      }
    );
    
    // Extract the actual jobId and queuePosition from the nested response
    // Response structure: response.data.data.data = { jobId, queuePosition }
    return response.data.data.data;
  },

  /**
   * Get print job status
   */
  async getPrintJobStatus(jobId: string): Promise<{
    status: string;
    progress: number;
    result?: any;
    error?: string;
  }> {
    const response = await apiClient.get<{ 
      data: { 
        status: string; 
        progress: number; 
        result?: any; 
        error?: string;
      } 
    }>(
      `/print-queue/job/${jobId}`
    );
    return response.data.data;
  },
};


import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ExhibitionRegistration,
  ExhibitionRegistrationDocument,
  RegistrationStatus,
  PaymentStatus,
  RegistrationSource,
  ReferralSource,
} from '../../database/schemas/exhibition-registration.schema';
import { GlobalVisitor, GlobalVisitorDocument } from '../../database/schemas/global-visitor.schema';
import { Exhibition, ExhibitionDocument } from '../../database/schemas/exhibition.schema';
import { Exhibitor, ExhibitorDocument } from '../../database/schemas/exhibitor.schema';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { BadgesService } from '../badges/badges.service';
import { PrintQueueService } from '../print-queue/print-queue.service';
import { MeilisearchService } from '../meilisearch/meilisearch.service';
import * as QRCode from 'qrcode';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RegistrationsService {
  private readonly logger = new Logger(RegistrationsService.name);

  constructor(
    @InjectModel(ExhibitionRegistration.name)
    private registrationModel: Model<ExhibitionRegistrationDocument>,
    @InjectModel(GlobalVisitor.name)
    private visitorModel: Model<GlobalVisitorDocument>,
    @InjectModel(Exhibition.name)
    private exhibitionModel: Model<ExhibitionDocument>,
    @InjectModel(Exhibitor.name)
    private exhibitorModel: Model<ExhibitorDocument>,
    @InjectModel('RegistrationCounter')
    private counterModel: Model<any>,
    private badgesService: BadgesService,
    private printQueueService: PrintQueueService,
    private configService: ConfigService,
    private meilisearchService: MeilisearchService,
  ) {}

  /**
   * Normalize phone number to consistent format
   * Removes country code, spaces, dashes, and stores only 10 digits
   * 
   * Examples:
   * +919876543210 -> 9876543210
   * 919876543210 -> 9876543210
   * +91 98765 43210 -> 9876543210
   * 9876543210 -> 9876543210
   */
  private normalizePhoneNumber(phone: string): string {
    if (!phone) return '';
    
    // Remove all non-digit characters (spaces, dashes, parentheses, etc.)
    let cleaned = phone.replace(/\D/g, '');
    
    // Remove country code if present
    // India: +91 (2 digits)
    if (cleaned.startsWith('91') && cleaned.length > 10) {
      cleaned = cleaned.substring(2);
    }
    
    // Ensure we have exactly 10 digits
    if (cleaned.length === 10) {
      return cleaned;
    }
    
    // If length is not 10, return as-is and let validation catch it
    return cleaned;
  }

  /**
   * Create a new registration (Public - for visitor frontend)
   */
  async createRegistration(dto: CreateRegistrationDto) {
    // 1. Validate exhibition exists and registration is open
    const exhibition = await this.exhibitionModel.findById(dto.exhibitionId);
    if (!exhibition) {
      throw new NotFoundException('Exhibition not found');
    }

    // Check if registration is open
    const now = new Date();
    const registrationStart = new Date(exhibition.registrationStartDate);
    const registrationEnd = new Date(exhibition.registrationEndDate);

    if (now < registrationStart || now > registrationEnd) {
      throw new BadRequestException('Registration is not currently open for this exhibition');
    }

    // Check if exhibition is active
    if (exhibition.status !== 'active' && exhibition.status !== 'registration_open') {
      throw new BadRequestException('Exhibition is not accepting registrations');
    }

    // ===== DEBUG: Log incoming data =====
    this.logger.debug('========== INCOMING DTO DATA ==========');
    this.logger.debug('Top-level fields:');
    this.logger.debug(`  dto.name: "${dto.name}"`);
    this.logger.debug(`  dto.email: "${dto.email}"`);
    this.logger.debug(`  dto.phone: "${dto.phone}"`);
    this.logger.debug(`  dto.company: "${dto.company}"`);
    this.logger.debug(`  dto.designation: "${dto.designation}"`);
    this.logger.debug(`  dto.city: "${dto.city}"`);
    this.logger.debug(`  dto.state: "${dto.state}"`);
    this.logger.debug(`  dto.pincode: "${dto.pincode}"`);
    this.logger.debug('customFieldData:');
    if (dto.customFieldData) {
      Object.keys(dto.customFieldData).forEach(key => {
        this.logger.debug(`  customFieldData.${key}: "${dto.customFieldData![key]}"`);
      });
    } else {
      this.logger.debug('  (no customFieldData)');
    }
    this.logger.debug('=======================================');

    // Extract standard fields from customFieldData if not provided at top level
    // This handles cases where frontend sends all data in customFieldData
    if (dto.customFieldData && typeof dto.customFieldData === 'object') {
      const hasValue = (val: any): boolean => val && val !== '' && val !== 'undefined';
      
      // Extract name from various field names
      if (!hasValue(dto.name)) {
        const nameValue = dto.customFieldData.full_name || dto.customFieldData.fullname || dto.customFieldData.name;
        if (hasValue(nameValue)) {
          dto.name = String(nameValue).trim();
          this.logger.debug(`[EXTRACT] Extracted name: "${dto.name}"`);
        }
      }
      
      // Extract email
      if (!hasValue(dto.email) && hasValue(dto.customFieldData.email)) {
        dto.email = String(dto.customFieldData.email).trim();
        this.logger.debug(`[EXTRACT] Extracted email: "${dto.email}"`);
      }
      
      // Extract company
      if (!hasValue(dto.company)) {
        const companyValue = dto.customFieldData.company || dto.customFieldData.organization;
        if (hasValue(companyValue)) {
          dto.company = String(companyValue).trim();
          this.logger.debug(`[EXTRACT] Extracted company: "${dto.company}"`);
        }
      }
      
      // Extract designation
      if (!hasValue(dto.designation)) {
        const designationValue = dto.customFieldData.designation || dto.customFieldData.position || dto.customFieldData.title;
        if (hasValue(designationValue)) {
          dto.designation = String(designationValue).trim();
          this.logger.debug(`[EXTRACT] Extracted designation: "${dto.designation}"`);
        }
      }
      
      // Extract location fields
      if (!hasValue(dto.city) && hasValue(dto.customFieldData.city)) {
        dto.city = String(dto.customFieldData.city).trim();
        this.logger.debug(`[EXTRACT] Extracted city: "${dto.city}"`);
      }
      
      if (!hasValue(dto.state) && hasValue(dto.customFieldData.state)) {
        dto.state = String(dto.customFieldData.state).trim();
        this.logger.debug(`[EXTRACT] Extracted state: "${dto.state}"`);
      }
      
      if (!hasValue(dto.pincode)) {
        const pincodeValue = dto.customFieldData.pincode || dto.customFieldData.pin_code;
        if (hasValue(pincodeValue)) {
          dto.pincode = String(pincodeValue).trim();
          this.logger.debug(`[EXTRACT] Extracted pincode: "${dto.pincode}"`);
        }
      }
    }

    // 2. Find or create visitor (PRIMARY identifier = phone number)
    let visitor: GlobalVisitorDocument | null = null;
    
    // Phone is the PRIMARY identifier - look for visitor by phone ONLY
    // IMPORTANT: Normalize phone number for consistent lookup/storage
    let normalizedPhone = '';
    if (dto.phone && dto.phone.trim()) {
      normalizedPhone = this.normalizePhoneNumber(dto.phone.trim());
      this.logger.debug(`Phone normalization: ${dto.phone} -> ${normalizedPhone}`);
      
      visitor = await this.visitorModel.findOne({
        phone: normalizedPhone,
      });
    }
    
    // ✅ FIX: DO NOT use email as fallback lookup!
    // Email is not a reliable unique identifier (can be shared by multiple people)
    // Phone is the PRIMARY unique identifier - if phone is different, it's a different person
    // If no phone provided, always create a new visitor (email-only registration)

    // Define standard visitor fields that should NOT be stored as dynamic fields
    const STANDARD_VISITOR_FIELDS = [
      'name', 'full_name', 'fullname', 'full-name',
      'email', 'e_mail', 'e-mail',
      'phone', 'mobile', 'contact', 'phone_number',
      'company', 'organization',
      'designation', 'position', 'title',
      'city', 
      'state',
      'pincode', 'pin_code', 'postal', 'zip',
      'address', 'full_address', 'street'
    ];

    // Extract GLOBAL dynamic fields from customFieldData (these go to GlobalVisitor)
    const globalDynamicFields: Record<string, any> = {};
    if (dto.customFieldData && typeof dto.customFieldData === 'object') {
      Object.keys(dto.customFieldData).forEach(key => {
        const normalizedKey = key.toLowerCase().replace(/\s/g, '_');
        // If it's NOT a standard field, it's a dynamic global field
        if (!STANDARD_VISITOR_FIELDS.includes(normalizedKey)) {
          globalDynamicFields[key] = dto.customFieldData![key];
        }
      });
    }

    if (visitor) {
      // ✅ FIXED: Only update fields that are EMPTY (null/undefined/empty string)
      // This prevents overwriting existing visitor data when they register for a new exhibition
      // Phone is the PRIMARY identifier and should NEVER be updated
      
      let updatedFields = 0;
      
      // Only update if field is currently empty/missing
      if (dto.email && dto.email.trim() && !visitor.email) {
        visitor.email = dto.email.toLowerCase().trim();
        updatedFields++;
      }
      if (dto.name && !visitor.name) {
        visitor.name = dto.name;
        updatedFields++;
      }
      if (dto.company && !visitor.company) {
        visitor.company = dto.company;
        updatedFields++;
      }
      if (dto.designation && !visitor.designation) {
        visitor.designation = dto.designation;
        updatedFields++;
      }
      if (dto.state && !visitor.state) {
        visitor.state = dto.state;
        updatedFields++;
      }
      if (dto.city && !visitor.city) {
        visitor.city = dto.city;
        updatedFields++;
      }
      if (dto.pincode && !visitor.pincode) {
        visitor.pincode = dto.pincode;
        updatedFields++;
      }
      if (dto.address && !visitor.address) {
        visitor.address = dto.address;
        updatedFields++;
      }
      
      // Save dynamic fields to GlobalVisitor (only if not already set)
      // Cast to any because schema has strict: false which allows dynamic fields
      Object.keys(globalDynamicFields).forEach(key => {
        if (!(visitor as any)[key]) {
          (visitor as any)[key] = globalDynamicFields[key];
          updatedFields++;
        }
      });
      
      if (updatedFields > 0) {
        await visitor.save();
        this.logger.log(`Updated ${updatedFields} empty fields for visitor ${visitor._id}`);
        // Note: MeiliSearch sync happens later after registeredExhibitions is updated
      } else {
        this.logger.log(`No updates needed - visitor ${visitor._id} already has complete data`);
      }
      
      // Debug: Log visitor data after update
      this.logger.debug('========== VISITOR DATA (EXISTING - AFTER UPDATE) ==========');
      this.logger.debug(`  visitor.name: "${visitor.name}"`);
      this.logger.debug(`  visitor.email: "${visitor.email}"`);
      this.logger.debug(`  visitor.company: "${visitor.company}"`);
      this.logger.debug(`  visitor.designation: "${visitor.designation}"`);
      this.logger.debug(`  visitor.city: "${visitor.city}"`);
      this.logger.debug(`  visitor.state: "${visitor.state}"`);
      this.logger.debug('===========================================================');
    } else {
      // Create new visitor (handle optional fields from dynamic forms)
      // At least one of email or phone must be provided
      if ((!dto.email || !dto.email.trim()) && (!dto.phone || !dto.phone.trim())) {
        throw new BadRequestException('Either email or phone number is required');
      }
      
      try {
        const visitorData: any = {
          phone: normalizedPhone || undefined, // Store normalized phone (10 digits only)
          email: (dto.email && dto.email.trim()) ? dto.email.toLowerCase().trim() : undefined,
          name: dto.name || undefined,
          company: dto.company || undefined,
          designation: dto.designation || undefined,
          state: dto.state || undefined,
          city: dto.city || undefined,
          pincode: dto.pincode || undefined,
          address: dto.address || undefined,
          totalRegistrations: 0,
          // Add dynamic fields (strict: false allows this)
          ...globalDynamicFields,
        };
        
        visitor = await this.visitorModel.create(visitorData);
        this.logger.log(`New visitor created with normalized phone: ${normalizedPhone} and ${Object.keys(globalDynamicFields).length} dynamic fields`);
        
        // Debug: Log visitor data after creation
        this.logger.debug('========== VISITOR DATA (NEW - AFTER CREATION) ==========');
        this.logger.debug(`  visitor.name: "${visitor.name}"`);
        this.logger.debug(`  visitor.email: "${visitor.email}"`);
        this.logger.debug(`  visitor.company: "${visitor.company}"`);
        this.logger.debug(`  visitor.designation: "${visitor.designation}"`);
        this.logger.debug(`  visitor.city: "${visitor.city}"`);
        this.logger.debug(`  visitor.state: "${visitor.state}"`);
        this.logger.debug('========================================================');
        
        // Note: MeiliSearch indexing happens later after registeredExhibitions is updated
      } catch (error) {
        // Handle duplicate key error (E11000) - phone number already exists
        if (error.code === 11000) {
          // Check which field caused the duplicate
          if (error.message.includes('phone')) {
            throw new ConflictException(
              'This mobile number is already registered. Each mobile number can only be used once.'
            );
          } else {
            throw new ConflictException('A visitor with this information already exists');
          }
        } else {
          throw error;
        }
      }
    }

    // 3. Check if already registered for this exhibition
    const existingRegistration = await this.registrationModel.findOne({
      visitorId: visitor._id,
      exhibitionId: new Types.ObjectId(dto.exhibitionId),
    });

    if (existingRegistration) {
      throw new ConflictException('You are already registered for this exhibition');
    }

    // 4. Validate exhibitor if provided
    let exhibitor = null;
    if (dto.exhibitorId) {
      exhibitor = await this.exhibitorModel.findOne({
        _id: new Types.ObjectId(dto.exhibitorId),
        exhibitionId: new Types.ObjectId(dto.exhibitionId),
        isActive: true,
      });

      if (!exhibitor) {
        throw new BadRequestException('Invalid exhibitor reference');
      }
    }

    // 5. Validate pricing tier for paid exhibitions
    this.logger.debug(`[CREATE REGISTRATION] Received DTO:`);
    this.logger.debug(JSON.stringify(dto));
    this.logger.debug(`[CREATE REGISTRATION] pricingTierId: ${dto.pricingTierId}`);
    this.logger.debug(`[CREATE REGISTRATION] Exhibition isPaid: ${exhibition.isPaid}, has pricingTiers: ${exhibition.pricingTiers?.length || 0}`);
    
    if (exhibition.isPaid) {
      // Check if exhibition has pricing tiers defined
      if (!exhibition.pricingTiers || exhibition.pricingTiers.length === 0) {
        throw new BadRequestException(
          'This exhibition is marked as paid but has no pricing tiers configured. Please contact the organizer.'
        );
      }

      // Pricing tier is required for paid exhibitions
      if (!dto.pricingTierId || !dto.pricingTierId.trim()) {
        throw new BadRequestException(
          'Pricing tier selection is required for paid exhibitions. Please select a pricing tier.'
        );
      }

      // Validate that the selected pricing tier exists and is active
      const selectedTier = exhibition.pricingTiers.find(tier => 
        tier._id && tier._id.toString() === dto.pricingTierId
      );

      if (!selectedTier) {
        throw new BadRequestException(
          'Selected pricing tier not found for this exhibition. Please select a valid pricing tier.'
        );
      }

      if (!selectedTier.isActive) {
        throw new BadRequestException(
          'Selected pricing tier is no longer active. Please select a different pricing tier.'
        );
      }

      // Validate tier date range
      const now = new Date();
      const tierStart = new Date(selectedTier.startDate);
      const tierEnd = new Date(selectedTier.endDate);

      if (now < tierStart) {
        throw new BadRequestException(
          `The "${selectedTier.name}" pricing tier is not yet available. It will be available from ${tierStart.toLocaleDateString()}.`
        );
      }

      if (now > tierEnd) {
        throw new BadRequestException(
          `The "${selectedTier.name}" pricing tier has expired. It was available until ${tierEnd.toLocaleDateString()}. Please select a different pricing tier.`
        );
      }

      this.logger.log(`[CREATE REGISTRATION] Valid pricing tier selected: ${selectedTier.name} (ID: ${dto.pricingTierId})`);
    }

    // 6. Calculate amount to be paid (for paid exhibitions)
    let amountToPay = 0;
    if (exhibition.isPaid && dto.pricingTierId) {
      const selectedTier = exhibition.pricingTiers.find(tier => 
        tier._id && tier._id.toString() === dto.pricingTierId
      );
      
      if (selectedTier) {
        if (selectedTier.ticketType === 'full_access') {
          // For full_access tickets, use the tier price
          amountToPay = selectedTier.price;
          this.logger.log(`[CREATE REGISTRATION] Amount to pay: ₹${amountToPay} (Tier: ${selectedTier.name}, Type: full_access)`);
        } 
        else if (selectedTier.ticketType === 'day_wise') {
          // For day_wise tickets, calculate based on user's selection
          const selectedDays = dto.selectedDays || [];
          
          if (selectedDays.length === 0) {
            throw new BadRequestException(
              'For day-wise tickets, you must select at least one day or choose "All Sessions"'
            );
          }
          
          // If day 0 is selected, it means "All Sessions"
          if (selectedDays.includes(0)) {
            if (selectedTier.allSessionsPrice && selectedTier.allSessionsPrice > 0) {
              amountToPay = selectedTier.allSessionsPrice;
              this.logger.log(`[CREATE REGISTRATION] Amount to pay: ₹${amountToPay} (Tier: ${selectedTier.name}, Type: day_wise - All Sessions)`);
            } else {
              throw new BadRequestException(
                'All Sessions option is not available for this pricing tier'
              );
            }
          } else {
            // Calculate sum of selected individual days
            const dayPrices = selectedTier.dayPrices || [];
            const selectedDayPrices = dayPrices.filter(day => 
              day.isActive && selectedDays.includes(day.dayNumber)
            );
            
            if (selectedDayPrices.length !== selectedDays.length) {
              throw new BadRequestException(
                'One or more selected days are not available or inactive'
              );
            }
            
            amountToPay = selectedDayPrices.reduce((sum, day) => sum + (day.price || 0), 0);
            this.logger.log(`[CREATE REGISTRATION] Amount to pay: ₹${amountToPay} (Tier: ${selectedTier.name}, Type: day_wise - ${selectedDays.length} days selected: ${selectedDays.join(', ')})`);
          }
        }
      }
    }

    // 7. Generate unique registration number
    const registrationNumber = await this.generateUniqueRegistrationNumber(dto.exhibitionId);

    // 8. Clean customFieldData - remove both standard visitor fields AND global dynamic fields
    // Only exhibition-specific fields should remain in registration.customFieldData
    // Note: We already extracted globalDynamicFields earlier and saved them to GlobalVisitor
    const cleanedCustomFieldData: Record<string, any> = {};
    const customData = dto.customFieldData || {};
    
    Object.keys(customData).forEach(key => {
      const normalizedKey = key.toLowerCase().replace(/\s/g, '_');
      // Only keep fields that are NOT standard visitor fields AND NOT global dynamic fields
      if (!STANDARD_VISITOR_FIELDS.includes(normalizedKey) && !globalDynamicFields.hasOwnProperty(key)) {
        cleanedCustomFieldData[key] = customData[key];
      }
    });

    // 9. Create registration
    // ✅ RACE CONDITION SAFE: MongoDB unique index prevents duplicates at database level
    // Even if multiple concurrent requests pass the application-level check (line 248),
    // MongoDB will reject duplicate registrations via E11000 error
    this.logger.debug(`[CREATE REGISTRATION] Creating registration with pricingTierId: ${dto.pricingTierId}, amountPaid: ${amountToPay}`);
    this.logger.debug(`[CREATE REGISTRATION] Cleaned customFieldData: ${JSON.stringify(cleanedCustomFieldData)}`);
    
    let registration;
    try {
      registration = await this.registrationModel.create({
        registrationNumber,
        visitorId: visitor._id,
        exhibitionId: new Types.ObjectId(dto.exhibitionId),
        registrationCategory: dto.registrationCategory,
        selectedInterests: dto.selectedInterests || [],
        customFieldData: cleanedCustomFieldData,
        registrationDate: new Date(),
        registrationSource: RegistrationSource.ONLINE,
        status: RegistrationStatus.REGISTERED,
        referralSource: dto.exhibitorId ? ReferralSource.EXHIBITOR : ReferralSource.DIRECT,
        exhibitorId: dto.exhibitorId ? new Types.ObjectId(dto.exhibitorId) : undefined,
        exhibitorName: exhibitor?.name,
        referralCode: dto.referralCode,
        pricingTierId: dto.pricingTierId ? new Types.ObjectId(dto.pricingTierId) : undefined,
        selectedDays: dto.selectedDays || [],
        // CRITICAL: Set amountPaid for Type column to show correctly in Admin Panel
        amountPaid: amountToPay > 0 ? amountToPay : undefined,
        // Payment status: PENDING for paid exhibitions (payment gateway integration pending)
        // Once payment gateway is integrated, this will change to COMPLETED after successful payment
        paymentStatus: exhibition.isPaid ? PaymentStatus.PENDING : undefined,
      });
    } catch (error) {
      // Handle duplicate key error (E11000) - visitor already registered for this exhibition
      // This can happen if multiple concurrent requests bypass the application check
      if (error.code === 11000) {
        this.logger.warn(`[CREATE REGISTRATION] ⛔ Duplicate registration blocked by database: Visitor ${visitor._id} already registered for exhibition ${dto.exhibitionId}`);
        throw new ConflictException(
          'You are already registered for this exhibition. If you submitted multiple times, only the first registration was processed.'
        );
      }
      // Re-throw other errors
      throw error;
    }
    
    this.logger.log(`[CREATE REGISTRATION] ✅ Registration created successfully: ${registrationNumber}`);

    // 10. Generate QR Code (Simple registration number for easy scanning)
    // Use ONLY registration number (not JSON) for better scannability
    const qrData = registration.registrationNumber;

    let qrCodeUrl: string;
    try {
      // Optimized for kiosk scanning (2025 best practices)
      // Simple data + Low EC = fastest scanning, even at low brightness
      qrCodeUrl = await QRCode.toDataURL(qrData, {
        errorCorrectionLevel: 'L', // Low EC for simplest QR (7% recovery)
        width: 512, // Larger for better screen visibility (power of 2)
        margin: 4, // Standard quiet zone (4x module width)
        type: 'image/png',
        color: {
          dark: '#000000', // Maximum contrast for low brightness
          light: '#FFFFFF', // Pure white background
        },
      });
    } catch (error) {
      this.logger.error('Failed to generate QR code', error);
      qrCodeUrl = '';
    }

    // 11. Generate Visitor Badge (Enterprise-Grade with Exhibition Branding)
    // Composes: Exhibition Logo (top) + QR Code + Visitor Info + Category Badge (bottom)
    let badgeUrl: string | null = null;
    try {
      const badgeResult = await this.badgesService.generateBadge(
        registration._id.toString(),
        registration.registrationNumber,
        registration.registrationCategory,
        qrCodeUrl,
        exhibition.badgeLogo, // Exhibition badge logo URL
        visitor.name, // Visitor name
        visitor.city, // Visitor city
        visitor.state, // Visitor state
        visitor.company, // Visitor company (Added)
      );

      if (badgeResult) {
        badgeUrl = badgeResult.url;
        this.logger.log(`[Badge Generated] ${badgeUrl}`);
      } else {
        this.logger.warn(`[Badge Generation] Failed, using plain QR code fallback`);
      }
    } catch (error) {
      this.logger.error(`[Badge Generation] Error: ${error.message}`, error.stack);
      // Graceful fallback - continue with plain QR code
    }

    // 12. Update visitor's total registrations count AND add exhibition to registeredExhibitions
    const updatedVisitor = await this.visitorModel.findByIdAndUpdate(
      visitor._id,
      {
        $inc: { totalRegistrations: 1 },
        $addToSet: { registeredExhibitions: new Types.ObjectId(dto.exhibitionId) }, // ✅ Add exhibition ID (no duplicates)
      },
      { new: true } // ✅ Return updated document
    );
    
    // ✅ AUTO-SYNC: Update visitor in MeiliSearch with new exhibition
    if (updatedVisitor) {
      try {
        await this.meilisearchService.updateVisitor(updatedVisitor);
        this.logger.debug(`✅ Visitor ${updatedVisitor._id} auto-synced to MeiliSearch with exhibition ${dto.exhibitionId}`);
      } catch (error) {
        this.logger.error(`Failed to auto-sync visitor ${updatedVisitor._id} to MeiliSearch: ${error.message}`);
        // Don't throw - registration is complete, search indexing is optional
      }
    }

    // 13. Update exhibitor registration count if applicable
    if (exhibitor) {
      await this.exhibitorModel.findByIdAndUpdate(exhibitor._id, {
        $inc: { totalRegistrations: 1 },
      });
    }

    this.logger.log(
      `Registration created successfully: ${registration._id} for ${visitor.email}`,
    );

    // Return registration details (ensure all IDs are strings)
    return {
      registration: {
        _id: registration._id.toString(),
        registrationNumber: registration.registrationNumber,
        visitorId: visitor._id.toString(),
        exhibitionId: registration.exhibitionId.toString(),
        registrationDate: registration.registrationDate,
        registrationCategory: registration.registrationCategory,
        status: registration.status,
        paymentStatus: registration.paymentStatus || undefined,
      },
      visitor: {
        _id: visitor._id.toString(),
        name: visitor.name || '',
        email: visitor.email || '',
        phone: visitor.phone || '',
        company: visitor.company || undefined,
        designation: visitor.designation || undefined,
        state: visitor.state || undefined,
        city: visitor.city || undefined,
      },
      exhibition: {
        _id: exhibition._id.toString(),
        name: exhibition.name,
        slug: exhibition.slug,
        venue: exhibition.venue,
        onsiteStartDate: exhibition.onsiteStartDate,
        onsiteEndDate: exhibition.onsiteEndDate,
        isPaid: exhibition.isPaid,
      },
      qrCode: qrCodeUrl, // Keep for backward compatibility
      badgeUrl: badgeUrl, // New: Full badge with exhibition branding
    };
  }

  /**
   * Verify registration by ID (Public)
   */
  async verifyRegistration(registrationId: string) {
    if (!Types.ObjectId.isValid(registrationId)) {
      throw new BadRequestException('Invalid registration ID');
    }

    const registration = await this.registrationModel
      .findById(registrationId)
      .populate('visitorId')
      .populate('exhibitionId')
      .exec();

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    const visitor = registration.visitorId as any;
    const exhibition = registration.exhibitionId as any;

    // Regenerate QR code
    const qrData = JSON.stringify({
      registrationNumber: registration.registrationNumber,
      registrationId: registration._id.toString(),
      visitorId: visitor._id.toString(),
      exhibitionId: exhibition._id.toString(),
      email: visitor.email,
      name: visitor.name,
    });

    let qrCodeUrl: string;
    try {
      // High-quality QR code for fast kiosk scanning
      qrCodeUrl = await QRCode.toDataURL(qrData, {
        errorCorrectionLevel: 'H', // High error correction (30% recovery)
        width: 400, // Larger size for better scanning
        margin: 4, // Adequate quiet zone for scanners
        type: 'image/png',
        color: {
          dark: '#000000', // Black dots for maximum contrast
          light: '#FFFFFF', // White background
        },
      });
    } catch (error) {
      this.logger.error('Failed to generate QR code', error);
      qrCodeUrl = '';
    }

    // Check if badge file exists for this registration
    const badgeUrl = await this.getBadgeUrl(registration._id.toString());

    return {
      registration: {
        _id: registration._id.toString(),
        registrationNumber: registration.registrationNumber,
        visitorId: visitor._id.toString(),
        exhibitionId: exhibition._id.toString(),
        registrationDate: registration.registrationDate,
        registrationCategory: registration.registrationCategory,
        status: registration.status,
        paymentStatus: registration.paymentStatus || undefined,
        amountPaid: registration.amountPaid || undefined,
      },
      visitor: {
        _id: visitor._id.toString(),
        name: visitor.name || '',
        email: visitor.email || '',
        phone: visitor.phone || '',
        company: visitor.company || undefined,
        designation: visitor.designation || undefined,
        state: visitor.state || undefined,
        city: visitor.city || undefined,
      },
      exhibition: {
        _id: exhibition._id.toString(),
        name: exhibition.name,
        slug: exhibition.slug,
        venue: exhibition.venue,
        onsiteStartDate: exhibition.onsiteStartDate,
        onsiteEndDate: exhibition.onsiteEndDate,
        isPaid: exhibition.isPaid,
      },
      qrCode: qrCodeUrl,
      badgeUrl: badgeUrl, // Now returns actual badge URL if exists
    };
  }

  /**
   * Lookup visitor by email (Public)
   */
  async lookupVisitorByEmail(email: string) {
    const visitor = await this.visitorModel.findOne({
      email: email.toLowerCase(),
    });

    if (!visitor) {
      throw new NotFoundException('Visitor not found');
    }

    // Get visitor's past registrations
    const registrations = await this.registrationModel
      .find({ visitorId: visitor._id })
      .populate('exhibitionId', 'name slug')
      .sort({ registrationDate: -1 })
      .limit(10)
      .exec();

    return {
      visitor: {
        _id: visitor._id,
        name: visitor.name,
        email: visitor.email,
        phone: visitor.phone,
        company: visitor.company,
        designation: visitor.designation,
        state: visitor.state,
        city: visitor.city,
        pincode: visitor.pincode,
        address: visitor.address,
        totalRegistrations: visitor.totalRegistrations,
      },
      registrations: registrations.map((reg: any) => ({
        _id: reg._id.toString(), // Registration ID for redirect
        registrationId: reg._id.toString(), // Alias for clarity
        exhibitionId: reg.exhibitionId._id.toString(),
        exhibitionName: reg.exhibitionId.name,
        registrationDate: reg.registrationDate,
        registrationNumber: reg.registrationNumber,
        status: reg.status,
      })),
    };
  }

  /**
   * Lookup visitor by phone (Public)
   * Normalizes phone number before lookup to handle different formats
   */
  async lookupVisitorByPhone(phone: string) {
    // Normalize phone number for consistent lookup
    const normalizedPhone = this.normalizePhoneNumber(phone.trim());
    this.logger.log(`[LOOKUP] Original phone: ${phone} -> Normalized: ${normalizedPhone}`);
    
    const visitor = await this.visitorModel.findOne({
      phone: normalizedPhone,
    });

    if (!visitor) {
      this.logger.log(`[LOOKUP] No visitor found for phone: ${normalizedPhone}`);
      throw new NotFoundException('Visitor not found');
    }

    this.logger.log(`[LOOKUP] Found visitor: ${visitor.name} (${visitor.phone}) - ID: ${visitor._id}`);

    // Get visitor's past registrations
    const registrations = await this.registrationModel
      .find({ visitorId: visitor._id })
      .populate('exhibitionId', 'name slug')
      .sort({ registrationDate: -1 })
      .limit(10)
      .exec();

    return {
      visitor: {
        _id: visitor._id,
        name: visitor.name,
        email: visitor.email,
        phone: visitor.phone,
        company: visitor.company,
        designation: visitor.designation,
        state: visitor.state,
        city: visitor.city,
        pincode: visitor.pincode,
        address: visitor.address,
        totalRegistrations: visitor.totalRegistrations,
      },
      registrations: registrations.map((reg: any) => ({
        _id: reg._id.toString(), // Registration ID for redirect
        registrationId: reg._id.toString(), // Alias for clarity
        exhibitionId: reg.exhibitionId._id.toString(),
        exhibitionName: reg.exhibitionId.name,
        registrationDate: reg.registrationDate,
        registrationNumber: reg.registrationNumber,
        status: reg.status,
      })),
    };
  }

  /**
   * Get all registrations with visitor details (Admin)
   */
  async getAllRegistrationsWithVisitors(query: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{
    data: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;
    const sortBy = query.sortBy || 'registrationDate';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;

    // Build filter
    const filter: any = {};
    if (query.search) {
      const sanitizedSearch = query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { registrationNumber: { $regex: sanitizedSearch, $options: 'i' } },
      ];
    }

    // Build sort
    const sort: any = {};
    sort[sortBy] = sortOrder;

    // Execute query with population
    const [data, total] = await Promise.all([
      this.registrationModel
        .find(filter)
        .populate('visitorId', 'name email phone company designation city state')
        .populate('exhibitionId', 'name slug pricingTiers')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.registrationModel.countDocuments(filter).exec(),
    ]);

    // Transform data to include flattened visitor details
    const transformedData = data.map((reg: any) => {
      // Find pricing tier details from exhibition subdocuments
      let pricingTierName = 'N/A';
      let ticketType = null;
      let selectedDaysDetails = [];
      
      if (reg.pricingTierId && reg.exhibitionId?.pricingTiers) {
        const tier = reg.exhibitionId.pricingTiers.find(
          (t: any) => t._id && t._id.toString() === reg.pricingTierId.toString()
        );
        
        if (tier) {
          pricingTierName = tier.name;
          ticketType = tier.ticketType;
          
          // For day-wise tickets, build selected days details
          if (tier.ticketType === 'day_wise' && reg.selectedDays && reg.selectedDays.length > 0) {
            // Check if "All Sessions" was selected (day number 0)
            if (reg.selectedDays.includes(0)) {
              selectedDaysDetails = [{
                dayNumber: 0,
                dayName: 'All Sessions',
                price: tier.allSessionsPrice || 0,
              }];
            } else {
              // Get details for individual selected days
              selectedDaysDetails = tier.dayPrices
                .filter((day: any) => reg.selectedDays.includes(day.dayNumber))
                .map((day: any) => ({
                  dayNumber: day.dayNumber,
                  dayName: day.dayName,
                  date: day.date,
                  price: day.price,
                }));
            }
          }
        }
      }

      // Extract all visitor fields including dynamic ones
      const visitorFields: Record<string, any> = {};
      
      if (reg.visitorId) {
        // Get visitor as plain object to access all fields
        const visitorDoc = reg.visitorId.toObject ? reg.visitorId.toObject() : reg.visitorId;
        
        // Standard fields
        visitorFields.visitorId = visitorDoc._id?.toString();
        visitorFields.name = visitorDoc.name || 'N/A';
        visitorFields.email = visitorDoc.email || 'N/A';
        visitorFields.phone = visitorDoc.phone || 'N/A';
        visitorFields.company = visitorDoc.company || '-';
        visitorFields.designation = visitorDoc.designation || '-';
        visitorFields.city = visitorDoc.city || '-';
        visitorFields.state = visitorDoc.state || '-';
        visitorFields.pincode = visitorDoc.pincode || '-';
        visitorFields.address = visitorDoc.address || '-';
        visitorFields.country = visitorDoc.country || visitorDoc.Country || '-';
        
        // Add all other fields from visitor (dynamic fields saved with strict:false)
        const excludedFields = ['_id', '__v', 'createdAt', 'updatedAt', 'totalRegistrations', 'lastRegistrationDate', 'registeredExhibitions', 'phone'];
        Object.keys(visitorDoc).forEach((key) => {
          if (!excludedFields.includes(key) && !visitorFields.hasOwnProperty(key)) {
            // Store with exact key name to preserve case
            visitorFields[key] = visitorDoc[key];
          }
        });
      }

      return {
        _id: reg._id.toString(),
        registrationNumber: reg.registrationNumber,
        
        // Visitor details (all fields including dynamic ones)
        ...visitorFields,
        
        // Exhibition details
        exhibitionId: reg.exhibitionId?._id?.toString(),
        exhibitionName: reg.exhibitionId?.name || 'N/A',
        
        // Registration details
        registrationDate: reg.registrationDate,
        registrationCategory: reg.registrationCategory,
        selectedInterests: reg.selectedInterests || [],
        status: reg.status,
        checkInTime: reg.checkInTime,
        checkOutTime: reg.checkOutTime,
        
        // Payment details
        paymentStatus: reg.paymentStatus || 'N/A',
        amountPaid: reg.amountPaid || 0,
        pricingTierId: reg.pricingTierId?.toString(),
        pricingTierName,
        ticketType,
        selectedDays: reg.selectedDays || [],
        selectedDaysDetails,
        isFree: !reg.amountPaid || reg.amountPaid === 0,
        
        // Other details
        registrationSource: reg.registrationSource,
        customFieldData: reg.customFieldData || {}, // Exhibition-specific fields only
        createdAt: reg.createdAt,
        updatedAt: reg.updatedAt,
      };
    });

    return {
      data: transformedData,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Delete a registration (Admin)
   */
  async deleteRegistration(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid registration ID');
    }

    const registration = await this.registrationModel.findById(id).exec();
    if (!registration) {
      throw new NotFoundException(`Registration with ID ${id} not found`);
    }

    // Delete the registration
    await this.registrationModel.findByIdAndDelete(id).exec();

    // Check remaining registrations for this visitor
    const visitorId = registration.visitorId;
    const remainingRegistrations = await this.registrationModel
      .countDocuments({ visitorId })
      .exec();

    const visitor = await this.visitorModel.findById(visitorId).exec();
    
    if (visitor) {
      if (remainingRegistrations === 0) {
        // No more registrations - delete the visitor profile (cascade delete)
        await this.visitorModel.findByIdAndDelete(visitorId).exec();
        this.logger.log(`Visitor ${visitorId} deleted (no remaining registrations)`);
      } else {
        // Update visitor's registration count and metadata
        visitor.totalRegistrations = remainingRegistrations;
        
        // Update last registration date
        const lastReg = await this.registrationModel
          .findOne({ visitorId })
          .sort({ registrationDate: -1 })
          .exec();
        visitor.lastRegistrationDate = lastReg?.registrationDate;
        
        // Update registered exhibitions list
        const activeRegistrations = await this.registrationModel
          .find({ visitorId })
          .distinct('exhibitionId')
          .exec();
        visitor.registeredExhibitions = activeRegistrations;
        
        await visitor.save();
        this.logger.log(`Visitor ${visitorId} updated (${remainingRegistrations} registrations remaining)`);
      }
    }

    this.logger.log(`Registration ${id} deleted successfully`);
  }

  /**
   * Bulk delete registrations (Admin)
   */
  async bulkDeleteRegistrations(ids: string[]): Promise<{
    message: string;
    deleted: number;
    failed: Array<{ id: string; reason: string }>;
  }> {
    if (!ids || ids.length === 0) {
      throw new BadRequestException('No registration IDs provided');
    }

    const deleted: string[] = [];
    const failed: Array<{ id: string; reason: string }> = [];

    for (const id of ids) {
      try {
        await this.deleteRegistration(id);
        deleted.push(id);
      } catch (error) {
        failed.push({
          id,
          reason: error.message || 'Unknown error',
        });
      }
    }

    this.logger.log(`Bulk delete completed: ${deleted.length} deleted, ${failed.length} failed`);

    return {
      message: `Bulk delete completed: ${deleted.length} deleted, ${failed.length} failed`,
      deleted: deleted.length,
      failed,
    };
  }

  /**
   * Generate unique registration number
   * Format: REG-DDMMYYYY-NNNNNN (e.g., REG-10112025-000001)
   */
  /**
   * Generate unique registration number using atomic counter
   * ✅ RACE CONDITION SAFE - Uses MongoDB's findOneAndUpdate with $inc
   * Format: REG-{DDMMYYYY}-{SEQUENCE}
   * Example: REG-12112025-000001
   */
  private async generateUniqueRegistrationNumber(exhibitionId: string): Promise<string> {
    const today = new Date();
    
    // Format date as DDMMYYYY
    const day = today.getDate().toString().padStart(2, '0');
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const year = today.getFullYear();
    const dateStr = `${day}${month}${year}`; // DDMMYYYY
    
    // ATOMIC OPERATION: Increment counter for today's date
    // findOneAndUpdate with $inc is atomic and thread-safe
    const counter = await this.counterModel.findOneAndUpdate(
      { date: dateStr }, // Find counter for today
      { 
        $inc: { sequence: 1 }, // Atomically increment sequence
      },
      { 
        new: true, // Return updated document
        upsert: true, // Create if doesn't exist (first registration of the day)
        setDefaultsOnInsert: true,
      }
    );

    // Format: REG-12112025-000001
    const registrationNumber = `REG-${dateStr}-${counter.sequence.toString().padStart(6, '0')}`;
    
    this.logger.log(`[Registration Number] Generated: ${registrationNumber} (Atomic Counter: ${counter.sequence})`);
    
    return registrationNumber;
  }

  /**
   * Get badge URL if badge file exists
   * Helper method to check for existing badge files
   */
  private async getBadgeUrl(registrationId: string): Promise<string | null> {
    try {
      const uploadDir = this.configService.get('UPLOAD_DIR', './uploads');
      const badgeFilePath = path.join(uploadDir, 'badges', `${registrationId}.png`);
      
      // Check if file exists
      await fs.access(badgeFilePath);
      
      // File exists, construct public URL
      const baseUrl = this.configService.get('API_BASE_URL', 'http://localhost:3000');
      return `${baseUrl}/uploads/badges/${registrationId}.png`;
    } catch (error) {
      // File doesn't exist
      return null;
    }
  }

  /**
   * ==========================================
   * CHECK-IN SYSTEM - QR Code Scanner
   * ==========================================
   */

  /**
   * Check-in visitor by registration number (from QR code scan)
   * Records entry time and validates registration status
   * Exhibition is automatically detected from the registration
   * 
   * RACE CONDITION SAFE: Uses atomic findOneAndUpdate
   */
  async checkInVisitor(registrationNumber: string) {
    this.logger.log(`[Check-in] Processing check-in for: ${registrationNumber}`);

    // ✅ STEP 1: ACQUIRE DISTRIBUTED LOCK
    // Prevents race condition when 20 kiosks scan the same QR simultaneously
    const lockAcquired = await this.printQueueService.acquireLock(registrationNumber, 10000);
    
    if (!lockAcquired) {
      this.logger.warn(`[Check-in] ⛔ Lock acquisition failed: ${registrationNumber}`);
      throw new BadRequestException(
        'Another kiosk is currently processing this registration. Please try again in a few seconds.',
      );
    }

    try {
      // ✅ STEP 2: FETCH AND VALIDATE REGISTRATION
      const registration = await this.registrationModel
        .findOne({ registrationNumber })
        .populate('visitorId')
        .populate('exhibitionId')
        .exec();

      if (!registration) {
        this.logger.warn(`[Check-in] Registration not found: ${registrationNumber}`);
        throw new NotFoundException('Registration not found');
      }

      // Check if registration is cancelled
      if (registration.status === RegistrationStatus.CANCELLED) {
        throw new BadRequestException('This registration has been cancelled');
      }

      // ✅ STEP 3: ATOMIC CHECK-IN
      // Even with lock, use atomic update as defense-in-depth
      const updatedRegistration = await this.registrationModel.findOneAndUpdate(
        {
          _id: registration._id,
          checkInTime: null, // ✅ CRITICAL: Only update if not already checked in
        },
        {
          $set: {
            checkInTime: new Date(),
            status: RegistrationStatus.CHECKED_IN,
          },
        },
        { new: true } // Return updated document
      )
      .populate('visitorId')
      .populate('exhibitionId')
      .exec();

      // If null, it means the registration was already checked in
      if (!updatedRegistration) {
        const existingReg = await this.registrationModel.findById(registration._id);
        const checkInTime = existingReg?.checkInTime 
          ? new Date(existingReg.checkInTime).toLocaleString()
          : 'unknown time';
        
        this.logger.warn(`[Check-in] Already checked in at: ${checkInTime}`);
        throw new BadRequestException(
          `Already checked in at ${checkInTime}`,
        );
      }

      this.logger.log(`[Check-in] ✅ Successfully checked in: ${registrationNumber}`);

      // Return enriched data
      const visitor = updatedRegistration.visitorId as any;
      const exhibition = updatedRegistration.exhibitionId as any;

      return {
        success: true,
        message: 'Check-in successful',
        checkInTime: updatedRegistration.checkInTime,
        visitor: {
          id: visitor._id,
          name: visitor.name,
          email: visitor.email,
          phone: visitor.phone,
          company: visitor.company,
          designation: visitor.designation,
          city: visitor.city,
          state: visitor.state,
        },
        registration: {
          id: updatedRegistration._id,
          registrationNumber: updatedRegistration.registrationNumber,
          registrationCategory: updatedRegistration.registrationCategory,
          registrationDate: updatedRegistration.registrationDate,
          checkInTime: updatedRegistration.checkInTime,
        },
        exhibition: {
          id: exhibition._id,
          name: exhibition.name,
          venue: exhibition.venue,
        },
      };
    } finally {
      // ✅ STEP 4: ALWAYS RELEASE LOCK (even if error occurs)
      await this.printQueueService.releaseLock(registrationNumber);
    }
  }

  /**
   * Queue a print job for a visitor badge
   * 
   * This method adds a print job to the Redis queue
   * The print-service worker will consume and process it
   * 
   * @param registrationNumber Registration number
   * @param printerServiceUrl URL of the print service
   * @param kioskId Optional kiosk identifier
   * @returns Job ID and queue position
   */
  async queuePrintJob(
    registrationNumber: string,
    printerServiceUrl: string,
    kioskId?: string,
  ): Promise<{ jobId: string; queuePosition: number }> {
    this.logger.log(`[Print Queue] Queueing print job: ${registrationNumber}`);

    // Validate and get registration details
    const validationResult = await this.validateQRCode(registrationNumber);
    
    if (!validationResult.valid) {
      throw new BadRequestException('Invalid registration');
    }

    // Generate QR code for printing
    const qrCodeDataURL = await QRCode.toDataURL(registrationNumber, {
      errorCorrectionLevel: 'L', // Simple for fastest scanning
      width: 512, // Larger for better visibility
      margin: 4, // Standard quiet zone
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    // Extract location
    const cityValue = validationResult.visitor.city && validationResult.visitor.city !== '-' 
      ? validationResult.visitor.city 
      : '';
    const stateValue = validationResult.visitor.state && validationResult.visitor.state !== '-' 
      ? validationResult.visitor.state 
      : '';
    const location = [cityValue, stateValue].filter(v => v && v.trim() !== '').join(', ');

    // Create print job data
    const printJobData = {
      registrationNumber,
      exhibitionId: validationResult.exhibition.id,
      exhibitionName: validationResult.exhibition.name,
      visitorName: validationResult.visitor.name,
      visitorCompany: validationResult.visitor.company || undefined, // Added: Company name
      visitorLocation: location,
      qrCode: qrCodeDataURL.split(',')[1], // Base64 only (no data URI prefix)
      printerServiceUrl,
      timestamp: new Date().toISOString(),
      kioskId,
    };

    // Add to queue
    const result = await this.printQueueService.addPrintJob(printJobData);
    
    this.logger.log(`[Print Queue] ✅ Job queued: ${result.jobId} at position ${result.queuePosition}`);
    
    return result;
  }

  /**
   * Validate QR code and return visitor details (without check-in)
   * Used for preview before confirming check-in
   */
  async validateQRCode(registrationNumber: string) {
    this.logger.log(`[Validate QR] Checking: ${registrationNumber}`);

    const registration = await this.registrationModel
      .findOne({ registrationNumber })
      .populate('visitorId')
      .populate('exhibitionId')
      .exec();

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }

    const visitor = registration.visitorId as any;
    const exhibition = registration.exhibitionId as any;

    // Get badge URL if exists
    const badgeUrl = await this.getBadgeUrl(registration._id.toString());

    return {
      valid: true,
      alreadyCheckedIn: !!registration.checkInTime,
      checkInTime: registration.checkInTime || null,
      visitor: {
        id: visitor._id,
        name: visitor.name,
        email: visitor.email,
        phone: visitor.phone,
        company: visitor.company || '-',
        designation: visitor.designation || '-',
        city: visitor.city || '-',
        state: visitor.state || '-',
      },
      registration: {
        id: registration._id,
        registrationNumber: registration.registrationNumber,
        registrationCategory: registration.registrationCategory,
        registrationDate: registration.registrationDate,
        status: registration.status,
        checkInTime: registration.checkInTime,
        badgeUrl,
      },
      exhibition: {
        id: exhibition._id,
        name: exhibition.name,
        venue: exhibition.venue,
        onsiteStartDate: exhibition.onsiteStartDate,
        onsiteEndDate: exhibition.onsiteEndDate,
      },
    };
  }

  /**
   * Get recent check-ins for an exhibition or all exhibitions
   * Used for real-time dashboard updates
   */
  async getRecentCheckIns(exhibitionId: string, limit: number = 20) {
    this.logger.log(`[Recent Check-ins] Fetching last ${limit} for: ${exhibitionId}`);

    // Build query based on exhibitionId
    const query: any = {
      checkInTime: { $ne: null },
    };

    // If specific exhibition ID provided (not "all"), filter by it
    if (exhibitionId !== 'all' && Types.ObjectId.isValid(exhibitionId)) {
      query.exhibitionId = new Types.ObjectId(exhibitionId);
    }

    const registrations = await this.registrationModel
      .find(query)
      .populate('visitorId')
      .populate('exhibitionId', 'name') // Include exhibition name
      .sort({ checkInTime: -1 })
      .limit(limit)
      .exec();

    return registrations.map((reg) => {
      const visitor = reg.visitorId as any;
      const exhibition = reg.exhibitionId as any;
      return {
        id: reg._id,
        registrationNumber: reg.registrationNumber,
        checkInTime: reg.checkInTime,
        visitor: {
          name: visitor.name,
          company: visitor.company || '-',
          city: visitor.city || '-',
          state: visitor.state || '-',
        },
        registrationCategory: reg.registrationCategory,
        exhibitionName: exhibition?.name || 'Unknown', // Add exhibition name
      };
    });
  }

  /**
   * Get check-in statistics for an exhibition
   */
  async getCheckInStats(exhibitionId: string) {
    this.logger.log(`[Check-in Stats] Calculating for exhibition: ${exhibitionId}`);

    const exhibitionObjectId = new Types.ObjectId(exhibitionId);

    const totalRegistrations = await this.registrationModel.countDocuments({
      exhibitionId: exhibitionObjectId,
      status: { $ne: RegistrationStatus.CANCELLED },
    });

    const checkedIn = await this.registrationModel.countDocuments({
      exhibitionId: exhibitionObjectId,
      checkInTime: { $ne: null },
    });

    const pending = totalRegistrations - checkedIn;

    // Get check-ins by hour (today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const checkInsByHour = await this.registrationModel.aggregate([
      {
        $match: {
          exhibitionId: new Types.ObjectId(exhibitionId),
          checkInTime: { $gte: today },
        },
      },
      {
        $group: {
          _id: { $hour: '$checkInTime' },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    return {
      totalRegistrations,
      checkedIn,
      pending,
      checkInRate: totalRegistrations > 0 ? ((checkedIn / totalRegistrations) * 100).toFixed(2) : 0,
      checkInsByHour: checkInsByHour.map((item) => ({
        hour: item._id,
        count: item.count,
      })),
    };
  }
}


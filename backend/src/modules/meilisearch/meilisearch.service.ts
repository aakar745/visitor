import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { MeiliSearch, Index } from 'meilisearch';
import { ConfigService } from '@nestjs/config';

/**
 * Document structure for PIN code search index
 */
export interface PincodeDocument {
  id: string; // MongoDB _id
  pincode: string; // The actual PIN code (searchable)
  area?: string; // Area name (searchable)
  cityName: string; // City name for display
  stateName: string; // State name for display
  stateCode: string; // State code (e.g., GJ)
  countryName: string; // Country name for display
  countryCode: string; // Country code (e.g., IN)
  cityId: string; // MongoDB city ID
  stateId: string; // MongoDB state ID
  countryId: string; // MongoDB country ID
  isActive: boolean; // For filtering
  _searchableText: string; // Combined text for better search
}

/**
 * Document structure for Visitor search index
 * For fast searching in Exhibition Reports by name, mobile, company
 */
export interface VisitorDocument {
  id: string; // MongoDB _id
  name: string; // Visitor name (searchable)
  email: string; // Email (searchable)
  phone: string; // Phone number (searchable)
  company?: string; // Company name (searchable)
  designation?: string; // Designation
  city?: string; // City name
  state?: string; // State name
  country?: string; // Country name
  totalRegistrations: number; // Number of registrations
  registeredExhibitions: string[]; // Array of exhibition IDs
  _searchableText: string; // Combined text for better search
}

@Injectable()
export class MeilisearchService implements OnModuleInit {
  private readonly logger = new Logger(MeilisearchService.name);
  private client: MeiliSearch;
  private pincodeIndex: Index<PincodeDocument>;
  private visitorIndex: Index<VisitorDocument>; // ✅ New visitor index
  private readonly PINCODE_INDEX_NAME = 'pincodes';
  private readonly VISITOR_INDEX_NAME = 'visitors'; // ✅ New index name

  constructor(private configService: ConfigService) {
    const host = this.configService.get<string>('MEILISEARCH_URL');
    const apiKey = this.configService.get<string>('MEILISEARCH_MASTER_KEY');

    if (!host || !apiKey) {
      this.logger.warn(
        'Meilisearch configuration missing. Search functionality will be disabled.',
      );
      return;
    }

    try {
      this.client = new MeiliSearch({
        host,
        apiKey,
      });
      this.logger.log(`Meilisearch client initialized: ${host}`);
    } catch (error) {
      this.logger.error('Failed to initialize Meilisearch client', error);
    }
  }

  async onModuleInit() {
    if (!this.client) {
      this.logger.warn('Meilisearch client not available. Skipping initialization.');
      return;
    }

    try {
      await this.initializeIndexes();
    } catch (error) {
      this.logger.error('Failed to initialize Meilisearch indexes', error);
    }
  }

  /**
   * Initialize and configure search indexes
   */
  private async initializeIndexes() {
    try {
      // ========================================================================
      // PINCODE INDEX
      // ========================================================================
      
      // Create or get the pincodes index
      this.pincodeIndex = this.client.index<PincodeDocument>(this.PINCODE_INDEX_NAME);

      // Check if index exists, if not create it
      try {
        await this.pincodeIndex.getStats();
        this.logger.log(`Using existing index: ${this.PINCODE_INDEX_NAME}`);
      } catch {
        // Index doesn't exist, create it
        await this.client.createIndex(this.PINCODE_INDEX_NAME, { primaryKey: 'id' });
        this.logger.log(`Created new index: ${this.PINCODE_INDEX_NAME}`);
        this.pincodeIndex = this.client.index<PincodeDocument>(this.PINCODE_INDEX_NAME);
      }

      // Configure index settings for optimal search
      await this.pincodeIndex.updateSettings({
        // Searchable attributes (ranked by importance)
        searchableAttributes: [
          'pincode', // Highest priority - exact PIN code
          'area', // Area name
          'cityName', // City name
          '_searchableText', // Combined search field
        ],

        // Displayed attributes (returned in results)
        displayedAttributes: [
          'id',
          'pincode',
          'area',
          'cityName',
          'stateName',
          'stateCode',
          'countryName',
          'countryCode',
          'cityId',
          'stateId',
          'countryId',
        ],

        // Filterable attributes
        filterableAttributes: ['isActive', 'countryCode', 'stateCode'],

        // Sortable attributes
        sortableAttributes: ['pincode', 'cityName'],

        // Ranking rules (order matters!)
        rankingRules: [
          'words', // Number of matched words
          'typo', // Number of typos (allows fuzzy matching)
          'proximity', // Word proximity
          'attribute', // Field importance (based on searchableAttributes order)
          'sort', // Custom sort
          'exactness', // Exact matches rank higher
        ],

        // Typo tolerance settings
        typoTolerance: {
          enabled: true,
          minWordSizeForTypos: {
            oneTypo: 4, // Words with 4+ chars allow 1 typo
            twoTypos: 8, // Words with 8+ chars allow 2 typos
          },
        },

        // Pagination
        pagination: {
          maxTotalHits: 1000,
        },

        // Distinct attribute (prevent duplicate PIN codes)
        distinctAttribute: 'pincode',
      });

      this.logger.log(`✅ Meilisearch index "${this.PINCODE_INDEX_NAME}" configured successfully`);

      // ========================================================================
      // VISITOR INDEX  
      // ========================================================================
      
      // Create or get the visitors index
      this.visitorIndex = this.client.index<VisitorDocument>(this.VISITOR_INDEX_NAME);

      // Check if index exists, if not create it
      try {
        await this.visitorIndex.getStats();
        this.logger.log(`Using existing index: ${this.VISITOR_INDEX_NAME}`);
      } catch {
        // Index doesn't exist, create it
        await this.client.createIndex(this.VISITOR_INDEX_NAME, { primaryKey: 'id' });
        this.logger.log(`Created new index: ${this.VISITOR_INDEX_NAME}`);
        this.visitorIndex = this.client.index<VisitorDocument>(this.VISITOR_INDEX_NAME);
      }

      // Configure visitor index settings for optimal search
      await this.visitorIndex.updateSettings({
        // Searchable attributes (ranked by importance)
        searchableAttributes: [
          'name',           // Highest priority - visitor name
          'phone',          // Phone number
          'email',          // Email address
          'company',        // Company name
          'designation',    // Designation
          '_searchableText', // Combined search field
        ],

        // Displayed attributes (returned in results)
        displayedAttributes: [
          'id',
          'name',
          'email',
          'phone',
          'company',
          'designation',
          'city',
          'state',
          'country',
          'totalRegistrations',
          'registeredExhibitions',
        ],

        // Filterable attributes (for filtering by exhibition, location, etc.)
        filterableAttributes: [
          'registeredExhibitions',
          'state',
          'city',
          'country',
        ],

        // Sortable attributes
        sortableAttributes: ['name', 'totalRegistrations'],

        // Ranking rules (order matters!)
        rankingRules: [
          'words',       // Number of matched words
          'typo',        // Number of typos (allows fuzzy matching)
          'proximity',   // Word proximity
          'attribute',   // Field importance (based on searchableAttributes order)
          'sort',        // Custom sort
          'exactness',   // Exact matches rank higher
        ],

        // Typo tolerance settings (allow searching with typos)
        typoTolerance: {
          enabled: true,
          minWordSizeForTypos: {
            oneTypo: 4,   // Words with 4+ chars allow 1 typo
            twoTypos: 8,  // Words with 8+ chars allow 2 typos
          },
        },

        // Pagination
        pagination: {
          maxTotalHits: 10000, // Support up to 10k results
        },
      });

      this.logger.log(`✅ Meilisearch index "${this.VISITOR_INDEX_NAME}" configured successfully`);
      
    } catch (error) {
      this.logger.error('Failed to initialize Meilisearch indexes', error);
      throw error;
    }
  }

  /**
   * Index a single PIN code document
   */
  async indexPincode(pincode: any): Promise<void> {
    if (!this.pincodeIndex) {
      this.logger.warn('Pincode index not available. Skipping indexing.');
      return;
    }

    try {
      const document: PincodeDocument = this.transformPincodeToDocument(pincode);
      await this.pincodeIndex.addDocuments([document]);
      this.logger.debug(`Indexed pincode: ${document.pincode}`);
    } catch (error) {
      this.logger.error(`Failed to index pincode ${pincode.pincode}`, error);
      throw error;
    }
  }

  /**
   * Bulk index multiple PIN codes (for initial sync)
   */
  async indexAllPincodes(pincodes: any[]): Promise<void> {
    if (!this.pincodeIndex) {
      this.logger.warn('Pincode index not available. Skipping bulk indexing.');
      return;
    }

    try {
      const documents: PincodeDocument[] = pincodes.map((pincode) =>
        this.transformPincodeToDocument(pincode),
      );

      // Meilisearch handles large batches efficiently
      const task = await this.pincodeIndex.addDocuments(documents);
      this.logger.log(
        `✅ Queued ${documents.length} pincodes for indexing (Task ID: ${task.taskUid})`,
      );

      // Wait for indexing to complete
      await this.pincodeIndex.waitForTask(task.taskUid);
      this.logger.log(`✅ Successfully indexed ${documents.length} pincodes`);
    } catch (error) {
      this.logger.error('Failed to bulk index pincodes', error);
      throw error;
    }
  }

  /**
   * Search PIN codes with autocomplete
   */
  async searchPincodes(query: string, limit: number = 10) {
    if (!this.pincodeIndex) {
      this.logger.warn('Pincode index not available. Returning empty results.');
      return {
        hits: [],
        estimatedTotalHits: 0,
        processingTimeMs: 0,
      };
    }

    try {
      const results = await this.pincodeIndex.search(query, {
        limit,
        filter: 'isActive = true',
        attributesToHighlight: ['pincode', 'area', 'cityName'],
        highlightPreTag: '<mark>',
        highlightPostTag: '</mark>',
      });

      return results;
    } catch (error) {
      this.logger.error(`Search failed for query: ${query}`, error);
      return {
        hits: [],
        estimatedTotalHits: 0,
        processingTimeMs: 0,
      };
    }
  }

  /**
   * Update a PIN code in the index
   */
  async updatePincode(pincode: any): Promise<void> {
    // Meilisearch upserts by default (addDocuments updates existing docs)
    await this.indexPincode(pincode);
  }

  /**
   * Delete a PIN code from the index
   */
  async deletePincode(id: string): Promise<void> {
    if (!this.pincodeIndex) {
      this.logger.warn('Pincode index not available. Skipping deletion.');
      return;
    }

    try {
      await this.pincodeIndex.deleteDocument(id);
      this.logger.debug(`Deleted pincode document: ${id}`);
    } catch (error) {
      this.logger.error(`Failed to delete pincode ${id}`, error);
      throw error;
    }
  }

  /**
   * Get index statistics
   */
  async getStats() {
    if (!this.pincodeIndex) {
      return null;
    }

    try {
      return await this.pincodeIndex.getStats();
    } catch (error) {
      this.logger.error('Failed to get index stats', error);
      return null;
    }
  }

  /**
   * Clear all documents from index (use with caution!)
   */
  async clearIndex(): Promise<void> {
    if (!this.pincodeIndex) {
      return;
    }

    try {
      await this.pincodeIndex.deleteAllDocuments();
      this.logger.log('Cleared all documents from index');
    } catch (error) {
      this.logger.error('Failed to clear index', error);
      throw error;
    }
  }

  /**
   * Transform MongoDB pincode document to Meilisearch document
   */
  private transformPincodeToDocument(pincode: any): PincodeDocument {
    // Handle both populated and non-populated documents
    const cityName = pincode.cityId?.name || '';
    const stateName = pincode.cityId?.stateId?.name || '';
    const stateCode = pincode.cityId?.stateId?.code || '';
    const countryName = pincode.cityId?.stateId?.countryId?.name || '';
    const countryCode = pincode.cityId?.stateId?.countryId?.code || '';

    const cityId = pincode.cityId?._id?.toString() || pincode.cityId?.toString() || '';
    const stateId =
      pincode.cityId?.stateId?._id?.toString() ||
      pincode.cityId?.stateId?.toString() ||
      '';
    const countryId =
      pincode.cityId?.stateId?.countryId?._id?.toString() ||
      pincode.cityId?.stateId?.countryId?.toString() ||
      '';

    // Create combined searchable text
    const searchableText = [
      pincode.pincode,
      pincode.area,
      cityName,
      stateName,
      countryName,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return {
      id: pincode._id.toString(),
      pincode: pincode.pincode,
      area: pincode.area || undefined,
      cityName,
      stateName,
      stateCode,
      countryName,
      countryCode,
      cityId,
      stateId,
      countryId,
      isActive: pincode.isActive !== false, // Default to true if not specified
      _searchableText: searchableText,
    };
  }

  // ==========================================================================
  // VISITOR SEARCH METHODS
  // ==========================================================================

  /**
   * Index a single visitor document
   */
  async indexVisitor(visitor: any): Promise<void> {
    if (!this.visitorIndex) {
      this.logger.warn('Visitor index not available. Skipping indexing.');
      return;
    }

    const startTime = Date.now();
    try {
      const document: VisitorDocument = this.transformVisitorToDocument(visitor);
      
      this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      this.logger.log('🔄 AUTO-SYNC: Indexing New Visitor');
      this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      this.logger.log(`👤 Visitor ID: ${visitor._id}`);
      this.logger.log(`📝 Name: ${document.name}`);
      this.logger.log(`📱 Phone: ${document.phone}`);
      this.logger.log(`🏢 Company: ${document.company || 'N/A'}`);
      
      await this.visitorIndex.addDocuments([document]);
      
      const duration = Date.now() - startTime;
      this.logger.log(`⚡ Indexed in ${duration}ms`);
      this.logger.log(`✅ Visitor is now instantly searchable!`);
      this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      this.logger.error('❌ AUTO-SYNC: Failed to Index Visitor');
      this.logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      this.logger.error(`👤 Visitor ID: ${visitor._id}`);
      this.logger.error(`⏱️  Duration: ${duration}ms`);
      this.logger.error(`❌ Error: ${error.message}`);
      this.logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      throw error;
    }
  }

  /**
   * Bulk index multiple visitors (for initial sync)
   */
  async indexAllVisitors(visitors: any[]): Promise<void> {
    if (!this.visitorIndex) {
      this.logger.warn('Visitor index not available. Skipping bulk indexing.');
      return;
    }

    try {
      const documents: VisitorDocument[] = visitors.map((v) =>
        this.transformVisitorToDocument(v),
      );
      await this.visitorIndex.addDocuments(documents);
      this.logger.log(`✅ Indexed ${documents.length} visitors`);
    } catch (error) {
      this.logger.error('Failed to bulk index visitors', error);
      throw error;
    }
  }

  /**
   * Search visitors with autocomplete
   * Searches by name, phone, email, company
   */
  async searchVisitors(
    query: string,
    exhibitionId?: string,
    limit: number = 20,
  ) {
    if (!this.visitorIndex) {
      this.logger.warn('Visitor index not available. Returning empty results.');
      return {
        hits: [],
        estimatedTotalHits: 0,
        processingTimeMs: 0,
      };
    }

    try {
      const searchOptions: any = {
        limit,
        attributesToHighlight: ['name', 'phone', 'email', 'company'],
        highlightPreTag: '<mark>',
        highlightPostTag: '</mark>',
      };

      // Filter by exhibition if provided
      if (exhibitionId) {
        searchOptions.filter = `registeredExhibitions = ${exhibitionId}`;
      }

      const results = await this.visitorIndex.search(query, searchOptions);
      return results;
    } catch (error) {
      this.logger.error(`Visitor search failed for query: ${query}`, error);
      return {
        hits: [],
        estimatedTotalHits: 0,
        processingTimeMs: 0,
      };
    }
  }

  /**
   * Update a visitor in the index
   */
  async updateVisitor(visitor: any): Promise<void> {
    if (!this.visitorIndex) {
      this.logger.warn('Visitor index not available. Skipping update.');
      return;
    }

    const startTime = Date.now();
    try {
      const document: VisitorDocument = this.transformVisitorToDocument(visitor);
      
      this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      this.logger.log('🔄 AUTO-SYNC: Updating Visitor');
      this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      this.logger.log(`👤 Visitor ID: ${visitor._id}`);
      this.logger.log(`📝 Name: ${document.name}`);
      this.logger.log(`📱 Phone: ${document.phone}`);
      this.logger.log(`🏢 Company: ${document.company || 'N/A'}`);
      
      // Meilisearch upserts by default (addDocuments updates existing docs)
      await this.visitorIndex.addDocuments([document]);
      
      const duration = Date.now() - startTime;
      this.logger.log(`⚡ Updated in ${duration}ms`);
      this.logger.log(`✅ Search results now show latest data!`);
      this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      this.logger.error('❌ AUTO-SYNC: Failed to Update Visitor');
      this.logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      this.logger.error(`👤 Visitor ID: ${visitor._id}`);
      this.logger.error(`⏱️  Duration: ${duration}ms`);
      this.logger.error(`❌ Error: ${error.message}`);
      this.logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      throw error;
    }
  }

  /**
   * Delete a visitor from the index
   */
  async deleteVisitor(id: string): Promise<void> {
    if (!this.visitorIndex) {
      this.logger.warn('Visitor index not available. Skipping deletion.');
      return;
    }

    const startTime = Date.now();
    try {
      this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      this.logger.log('🔄 AUTO-SYNC: Deleting Visitor');
      this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      this.logger.log(`👤 Visitor ID: ${id}`);
      
      await this.visitorIndex.deleteDocument(id);
      
      const duration = Date.now() - startTime;
      this.logger.log(`⚡ Deleted in ${duration}ms`);
      this.logger.log(`✅ Visitor removed from search index!`);
      this.logger.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      this.logger.error('❌ AUTO-SYNC: Failed to Delete Visitor');
      this.logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      this.logger.error(`👤 Visitor ID: ${id}`);
      this.logger.error(`⏱️  Duration: ${duration}ms`);
      this.logger.error(`❌ Error: ${error.message}`);
      this.logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      throw error;
    }
  }

  /**
   * Transform MongoDB visitor document to Meilisearch document
   */
  private transformVisitorToDocument(visitor: any): VisitorDocument {
    // Create combined searchable text
    const searchableText = [
      visitor.name,
      visitor.email,
      visitor.phone,
      visitor.company,
      visitor.designation,
      visitor.city,
      visitor.state,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return {
      id: visitor._id.toString(),
      name: visitor.name || '',
      email: visitor.email || '',
      phone: visitor.phone || '',
      company: visitor.company || undefined,
      designation: visitor.designation || undefined,
      city: visitor.city || undefined,
      state: visitor.state || undefined,
      country: visitor.country || visitor.Country || undefined,
      totalRegistrations: visitor.totalRegistrations || 0,
      registeredExhibitions: Array.isArray(visitor.registeredExhibitions)
        ? visitor.registeredExhibitions.map((id: any) => id.toString())
        : [],
      _searchableText: searchableText,
    };
  }
}


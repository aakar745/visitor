import { Injectable, Logger, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Country, CountryDocument } from '../../database/schemas/country.schema';
import { State, StateDocument } from '../../database/schemas/state.schema';
import { City, CityDocument } from '../../database/schemas/city.schema';
import { Pincode, PincodeDocument } from '../../database/schemas/pincode.schema';
import { CreateCountryDto } from './dto/create-country.dto';
import { UpdateCountryDto } from './dto/update-country.dto';
import { CreateStateDto } from './dto/create-state.dto';
import { UpdateStateDto } from './dto/update-state.dto';
import { CreateCityDto } from './dto/create-city.dto';
import { UpdateCityDto } from './dto/update-city.dto';
import { CreatePincodeDto } from './dto/create-pincode.dto';
import { UpdatePincodeDto } from './dto/update-pincode.dto';
import { BulkImportDto } from './dto/bulk-import.dto';
import { MeilisearchService } from '../meilisearch/meilisearch.service';

@Injectable()
export class LocationsService {
  private readonly logger = new Logger(LocationsService.name);

  constructor(
    @InjectModel(Country.name) private countryModel: Model<CountryDocument>,
    @InjectModel(State.name) private stateModel: Model<StateDocument>,
    @InjectModel(City.name) private cityModel: Model<CityDocument>,
    @InjectModel(Pincode.name) private pincodeModel: Model<PincodeDocument>,
    private meilisearchService: MeilisearchService,
  ) {}

  // ============================================================================
  // COUNTRY OPERATIONS
  // ============================================================================

  async createCountry(dto: CreateCountryDto): Promise<Country> {
    // Check for duplicate country name or code
    const existing = await this.countryModel.findOne({
      $or: [
        { name: { $regex: new RegExp(`^${dto.name}$`, 'i') } },
        { code: dto.code.toUpperCase() },
      ],
    });

    if (existing) {
      throw new ConflictException(
        existing.name.toLowerCase() === dto.name.toLowerCase()
          ? `Country "${dto.name}" already exists`
          : `Country code "${dto.code}" already exists`,
      );
    }

    const country = new this.countryModel({
      ...dto,
      code: dto.code.toUpperCase(),
    });

    await country.save();
    this.logger.log(`Country created: ${country.name} (${country.code})`);
    return country;
  }

  async findAllCountries(filters?: {
    isActive?: boolean;
    search?: string;
  }): Promise<Country[]> {
    const query: any = {};

    if (filters?.isActive !== undefined) {
      query.isActive = filters.isActive;
    }

    if (filters?.search) {
      query.name = { $regex: filters.search, $options: 'i' };
    }

    return this.countryModel.find(query).sort({ name: 1 }).exec();
  }

  async findCountryById(id: string): Promise<Country> {
    const country = await this.countryModel.findById(id);
    if (!country) {
      throw new NotFoundException(`Country with ID "${id}" not found`);
    }
    return country;
  }

  async updateCountry(id: string, dto: UpdateCountryDto): Promise<Country> {
    const country = await this.findCountryById(id);

    // Check for duplicate if name or code is being changed
    if (dto.name || dto.code) {
      const existing = await this.countryModel.findOne({
        _id: { $ne: id },
        $or: [
          ...(dto.name ? [{ name: { $regex: new RegExp(`^${dto.name}$`, 'i') } }] : []),
          ...(dto.code ? [{ code: dto.code.toUpperCase() }] : []),
        ],
      });

      if (existing) {
        throw new ConflictException(
          dto.name && existing.name.toLowerCase() === dto.name.toLowerCase()
            ? `Country "${dto.name}" already exists`
            : `Country code "${dto.code}" already exists`,
        );
      }
    }

    const updateData: any = { ...dto };
    if (dto.code) {
      updateData.code = dto.code.toUpperCase();
    }

    const updatedCountry = await this.countryModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true },
    );

    if (!updatedCountry) {
      throw new NotFoundException(`Country with ID "${id}" not found`);
    }

    this.logger.log(`Country updated: ${updatedCountry.name}`);
    return updatedCountry;
  }

  async deleteCountry(id: string): Promise<void> {
    const country = await this.findCountryById(id);

    // Check if country has states
    const stateCount = await this.stateModel.countDocuments({ countryId: id });
    if (stateCount > 0) {
      throw new BadRequestException(
        `Cannot delete country "${country.name}" because it has ${stateCount} state(s). Delete states first.`,
      );
    }

    await this.countryModel.findByIdAndDelete(id);
    this.logger.log(`Country deleted: ${country.name}`);
  }

  // ============================================================================
  // STATE OPERATIONS
  // ============================================================================

  async createState(dto: CreateStateDto): Promise<State> {
    // Verify country exists
    await this.findCountryById(dto.countryId);

    // Check for duplicate state name in same country
    const existing = await this.stateModel.findOne({
      countryId: dto.countryId,
      name: { $regex: new RegExp(`^${dto.name}$`, 'i') },
    });

    if (existing) {
      throw new ConflictException(`State "${dto.name}" already exists in this country`);
    }

    // Check for duplicate state code globally
    const existingCode = await this.stateModel.findOne({
      code: dto.code.toUpperCase(),
    });

    if (existingCode) {
      throw new ConflictException(`State code "${dto.code}" is already in use`);
    }

    const state = new this.stateModel({
      ...dto,
      code: dto.code.toUpperCase(),
      countryId: new Types.ObjectId(dto.countryId),
    });

    await state.save();

    // Update country state count
    await this.countryModel.findByIdAndUpdate(dto.countryId, {
      $inc: { stateCount: 1 },
    });

    this.logger.log(`State created: ${state.name} (${state.code})`);
    return state;
  }

  async findAllStates(filters?: {
    countryId?: string;
    isActive?: boolean;
    search?: string;
  }): Promise<State[]> {
    const query: any = {};

    if (filters?.countryId) {
      query.countryId = filters.countryId;
    }

    if (filters?.isActive !== undefined) {
      query.isActive = filters.isActive;
    }

    if (filters?.search) {
      query.name = { $regex: filters.search, $options: 'i' };
    }

    return this.stateModel
      .find(query)
      .populate('countryId', 'name code')
      .sort({ name: 1 })
      .exec();
  }

  async findStateById(id: string): Promise<State> {
    const state = await this.stateModel.findById(id).populate('countryId', 'name code');
    if (!state) {
      throw new NotFoundException(`State with ID "${id}" not found`);
    }
    return state;
  }

  async updateState(id: string, dto: UpdateStateDto): Promise<State> {
    const state = await this.findStateById(id);

    // Extract the actual ObjectId from potentially populated countryId
    const oldCountryId = typeof state.countryId === 'object' && state.countryId._id 
      ? state.countryId._id.toString() 
      : state.countryId.toString();

    // If country is being changed, verify new country exists
    if (dto.countryId && dto.countryId !== oldCountryId) {
      await this.findCountryById(dto.countryId);
    }

    // Check for duplicate state name if name or country is changing
    if (dto.name || dto.countryId) {
      const targetCountryId = dto.countryId || oldCountryId;
      const targetName = dto.name || state.name;

      const existing = await this.stateModel.findOne({
        _id: { $ne: id },
        countryId: targetCountryId,
        name: { $regex: new RegExp(`^${targetName}$`, 'i') },
      });

      if (existing) {
        throw new ConflictException(`State "${targetName}" already exists in this country`);
      }
    }

    // Check for duplicate state code if code is changing
    if (dto.code && dto.code.toUpperCase() !== state.code) {
      const existingCode = await this.stateModel.findOne({
        _id: { $ne: id },
        code: dto.code.toUpperCase(),
      });

      if (existingCode) {
        throw new ConflictException(`State code "${dto.code}" is already in use`);
      }
    }

    const updateData: any = { ...dto };

    if (dto.code) {
      updateData.code = dto.code.toUpperCase();
    }

    if (dto.countryId) {
      updateData.countryId = new Types.ObjectId(dto.countryId);

      // Update state counts
      await Promise.all([
        this.countryModel.findByIdAndUpdate(oldCountryId, { $inc: { stateCount: -1 } }),
        this.countryModel.findByIdAndUpdate(dto.countryId, { $inc: { stateCount: 1 } }),
      ]);
    }

    await this.stateModel.findByIdAndUpdate(id, { $set: updateData });
    this.logger.log(`State updated: ${updateData.name || state.name}`);
    return this.findStateById(id); // Return with populated country
  }

  async deleteState(id: string): Promise<void> {
    const state = await this.findStateById(id);

    // Extract the actual ObjectId from potentially populated countryId
    const countryId = typeof state.countryId === 'object' && state.countryId._id 
      ? state.countryId._id 
      : state.countryId;

    // Check if state has cities
    const cityCount = await this.cityModel.countDocuments({ stateId: id });
    if (cityCount > 0) {
      throw new BadRequestException(
        `Cannot delete state "${state.name}" because it has ${cityCount} city/cities. Delete cities first.`,
      );
    }

    await this.stateModel.findByIdAndDelete(id);

    // Update country state count
    await this.countryModel.findByIdAndUpdate(countryId, {
      $inc: { stateCount: -1 },
    });

    this.logger.log(`State deleted: ${state.name}`);
  }

  // ============================================================================
  // CITY OPERATIONS
  // ============================================================================

  async createCity(dto: CreateCityDto): Promise<City> {
    // Verify state exists
    await this.findStateById(dto.stateId);

    // Check for duplicate city name in same state
    const existing = await this.cityModel.findOne({
      stateId: dto.stateId,
      name: { $regex: new RegExp(`^${dto.name}$`, 'i') },
    });

    if (existing) {
      throw new ConflictException(`City "${dto.name}" already exists in this state`);
    }

    const city = new this.cityModel({
      ...dto,
      stateId: new Types.ObjectId(dto.stateId),
    });

    await city.save();

    // Update state city count
    await this.stateModel.findByIdAndUpdate(dto.stateId, {
      $inc: { cityCount: 1 },
    });

    this.logger.log(`City created: ${city.name}`);
    return city;
  }

  async findAllCities(filters?: {
    stateId?: string;
    isActive?: boolean;
    search?: string;
  }): Promise<City[]> {
    const query: any = {};

    if (filters?.stateId) {
      query.stateId = filters.stateId;
    }

    if (filters?.isActive !== undefined) {
      query.isActive = filters.isActive;
    }

    if (filters?.search) {
      query.name = { $regex: filters.search, $options: 'i' };
    }

    return this.cityModel
      .find(query)
      .populate({
        path: 'stateId',
        select: 'name code',
        populate: {
          path: 'countryId',
          select: 'name code',
        },
      })
      .sort({ name: 1 })
      .exec();
  }

  async findCityById(id: string): Promise<City> {
    const city = await this.cityModel.findById(id).populate({
      path: 'stateId',
      select: 'name code',
      populate: {
        path: 'countryId',
        select: 'name code',
      },
    });

    if (!city) {
      throw new NotFoundException(`City with ID "${id}" not found`);
    }
    return city;
  }

  async updateCity(id: string, dto: UpdateCityDto): Promise<City> {
    const city = await this.findCityById(id);

    // Extract the actual ObjectId from potentially populated stateId
    const oldStateId = typeof city.stateId === 'object' && city.stateId._id 
      ? city.stateId._id.toString() 
      : city.stateId.toString();

    // If state is being changed, verify new state exists
    if (dto.stateId && dto.stateId !== oldStateId) {
      await this.findStateById(dto.stateId);
    }

    // Check for duplicate city name if name or state is changing
    if (dto.name || dto.stateId) {
      const targetStateId = dto.stateId || oldStateId;
      const targetName = dto.name || city.name;

      const existing = await this.cityModel.findOne({
        _id: { $ne: id },
        stateId: targetStateId,
        name: { $regex: new RegExp(`^${targetName}$`, 'i') },
      });

      if (existing) {
        throw new ConflictException(`City "${targetName}" already exists in this state`);
      }
    }

    const updateData: any = { ...dto };

    if (dto.stateId) {
      updateData.stateId = new Types.ObjectId(dto.stateId);

      // Update city counts
      await Promise.all([
        this.stateModel.findByIdAndUpdate(oldStateId, { $inc: { cityCount: -1 } }),
        this.stateModel.findByIdAndUpdate(dto.stateId, { $inc: { cityCount: 1 } }),
      ]);
    }

    await this.cityModel.findByIdAndUpdate(id, { $set: updateData });
    this.logger.log(`City updated: ${updateData.name || city.name}`);
    return this.findCityById(id); // Return with populated state
  }

  async deleteCity(id: string): Promise<void> {
    const city = await this.findCityById(id);

    // Extract the actual ObjectId from potentially populated stateId
    const stateId = typeof city.stateId === 'object' && city.stateId._id 
      ? city.stateId._id 
      : city.stateId;

    // Check if city has PIN codes
    const pincodeCount = await this.pincodeModel.countDocuments({ cityId: id });
    if (pincodeCount > 0) {
      throw new BadRequestException(
        `Cannot delete city "${city.name}" because it has ${pincodeCount} PIN code(s). Delete PIN codes first.`,
      );
    }

    await this.cityModel.findByIdAndDelete(id);

    // Update state city count
    await this.stateModel.findByIdAndUpdate(stateId, {
      $inc: { cityCount: -1 },
    });

    this.logger.log(`City deleted: ${city.name}`);
  }

  // ============================================================================
  // PINCODE OPERATIONS
  // ============================================================================

  async createPincode(dto: CreatePincodeDto): Promise<Pincode> {
    // Verify city exists
    await this.findCityById(dto.cityId);

    // Check for duplicate PIN code
    const existing = await this.pincodeModel.findOne({ pincode: dto.pincode });
    if (existing) {
      throw new ConflictException(`PIN code "${dto.pincode}" already exists`);
    }

    const pincode = new this.pincodeModel({
      ...dto,
      cityId: new Types.ObjectId(dto.cityId),
    });

    await pincode.save();

    // Update city pincode count
    await this.cityModel.findByIdAndUpdate(dto.cityId, {
      $inc: { pincodeCount: 1 },
    });

    this.logger.log(`PIN code created: ${pincode.pincode} for city ${dto.cityId}`);

    // Sync to Meilisearch (with populated data)
    try {
      const populated = await this.findPincodeById(pincode._id.toString());
      await this.meilisearchService.indexPincode(populated);
      this.logger.debug(`Synced PIN code ${pincode.pincode} to Meilisearch`);
    } catch (error) {
      this.logger.warn(`Failed to sync PIN code ${pincode.pincode} to Meilisearch:`, error.message);
      // Don't fail the request if Meilisearch sync fails
    }

    return pincode;
  }

  async findAllPincodes(filters?: {
    cityId?: string;
    isActive?: boolean;
    search?: string;
  }): Promise<Pincode[]> {
    const query: any = {};

    if (filters?.cityId) {
      query.cityId = filters.cityId;
    }

    if (filters?.isActive !== undefined) {
      query.isActive = filters.isActive;
    }

    if (filters?.search) {
      query.$or = [
        { pincode: { $regex: filters.search, $options: 'i' } },
        { area: { $regex: filters.search, $options: 'i' } },
      ];
    }

    return this.pincodeModel
      .find(query)
      .populate({
        path: 'cityId',
        select: 'name',
        populate: {
          path: 'stateId',
          select: 'name code',
          populate: {
            path: 'countryId',
            select: 'name code',
          },
        },
      })
      .sort({ pincode: 1 })
      .exec();
  }

  async findPincodeById(id: string): Promise<Pincode> {
    const pincode = await this.pincodeModel.findById(id).populate({
      path: 'cityId',
      select: 'name',
      populate: {
        path: 'stateId',
        select: 'name code',
        populate: {
          path: 'countryId',
          select: 'name code',
        },
      },
    });

    if (!pincode) {
      throw new NotFoundException(`PIN code with ID "${id}" not found`);
    }
    return pincode;
  }

  async updatePincode(id: string, dto: UpdatePincodeDto): Promise<Pincode> {
    const pincode = await this.findPincodeById(id);

    // Extract the actual ObjectId from potentially populated cityId
    const oldCityId = typeof pincode.cityId === 'object' && pincode.cityId._id 
      ? pincode.cityId._id.toString() 
      : pincode.cityId.toString();

    // If city is being changed, verify new city exists
    if (dto.cityId && dto.cityId !== oldCityId) {
      await this.findCityById(dto.cityId);
    }

    // Check for duplicate PIN code if pincode is changing
    if (dto.pincode && dto.pincode !== pincode.pincode) {
      const existing = await this.pincodeModel.findOne({
        _id: { $ne: id },
        pincode: dto.pincode,
      });

      if (existing) {
        throw new ConflictException(`PIN code "${dto.pincode}" already exists`);
      }
    }

    const updateData: any = { ...dto };

    if (dto.cityId) {
      updateData.cityId = new Types.ObjectId(dto.cityId);

      // Update pincode counts
      await Promise.all([
        this.cityModel.findByIdAndUpdate(oldCityId, { $inc: { pincodeCount: -1 } }),
        this.cityModel.findByIdAndUpdate(dto.cityId, { $inc: { pincodeCount: 1 } }),
      ]);
    }

    await this.pincodeModel.findByIdAndUpdate(id, { $set: updateData });
    this.logger.log(`PIN code updated: ${updateData.pincode || pincode.pincode}`);
    
    const updated = await this.findPincodeById(id); // Return with populated city

    // Sync to Meilisearch
    try {
      await this.meilisearchService.updatePincode(updated);
      this.logger.debug(`Synced updated PIN code ${updated.pincode} to Meilisearch`);
    } catch (error) {
      this.logger.warn(`Failed to sync updated PIN code to Meilisearch:`, error.message);
    }

    return updated;
  }

  async deletePincode(id: string): Promise<void> {
    const pincode = await this.findPincodeById(id);

    // Extract the actual ObjectId from potentially populated cityId
    const cityId = typeof pincode.cityId === 'object' && pincode.cityId._id 
      ? pincode.cityId._id 
      : pincode.cityId;

    // Soft delete if used in registrations (check usageCount)
    if (pincode.usageCount > 0) {
      await this.pincodeModel.findByIdAndUpdate(id, { $set: { isActive: false } });
      this.logger.log(`PIN code soft-deleted (used ${pincode.usageCount} times): ${pincode.pincode}`);
      
      // Update Meilisearch (soft delete = update with isActive: false)
      try {
        const updated = await this.findPincodeById(id);
        await this.meilisearchService.updatePincode(updated);
        this.logger.debug(`Updated PIN code ${pincode.pincode} in Meilisearch (soft-deleted)`);
      } catch (error) {
        this.logger.warn(`Failed to update soft-deleted PIN code in Meilisearch:`, error.message);
      }
      
      return;
    }

    // Hard delete if never used
    await this.pincodeModel.findByIdAndDelete(id);

    // Update city pincode count
    await this.cityModel.findByIdAndUpdate(cityId, {
      $inc: { pincodeCount: -1 },
    });

    this.logger.log(`PIN code deleted: ${pincode.pincode}`);

    // Remove from Meilisearch
    try {
      await this.meilisearchService.deletePincode(id);
      this.logger.debug(`Removed PIN code ${pincode.pincode} from Meilisearch`);
    } catch (error) {
      this.logger.warn(`Failed to remove PIN code from Meilisearch:`, error.message);
    }
  }

  // ============================================================================
  // LOOKUP & SEARCH OPERATIONS
  // ============================================================================

  /**
   * Lookup location by PIN code
   * Returns complete hierarchy: Country → State → City → PIN
   */
  async lookupByPincode(pincode: string): Promise<{
    found: boolean;
    pincode?: Pincode;
    city?: City;
    state?: State;
    country?: Country;
  }> {
    const pincodeDoc = await this.pincodeModel.findOne({ pincode, isActive: true }).populate({
      path: 'cityId',
      select: 'name',
      populate: {
        path: 'stateId',
        select: 'name code',
        populate: {
          path: 'countryId',
          select: 'name code',
        },
      },
    });

    if (!pincodeDoc) {
      return { found: false };
    }

    // Increment usage count (track popular PINs)
    await this.pincodeModel.findByIdAndUpdate(pincodeDoc._id, {
      $inc: { usageCount: 1 },
    });

    const city = pincodeDoc.cityId as any;
    const state = city?.stateId as any;
    const country = state?.countryId as any;

    return {
      found: true,
      pincode: pincodeDoc,
      city,
      state,
      country,
    };
  }

  /**
   * Search PIN codes with autocomplete support
   * For future Meilisearch integration
   */
  async searchPincodes(query: string, limit: number = 10): Promise<Pincode[]> {
    return this.pincodeModel
      .find({
        pincode: { $regex: `^${query}`, $options: 'i' },
        isActive: true,
      })
      .populate({
        path: 'cityId',
        select: 'name',
        populate: {
          path: 'stateId',
          select: 'name',
        },
      })
      .sort({ usageCount: -1, pincode: 1 }) // Popular PINs first
      .limit(limit)
      .exec();
  }

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================

  /**
   * Bulk import locations from CSV data
   * Creates hierarchy: Country → State → City → PIN
   */
  async bulkImport(dto: BulkImportDto): Promise<{
    success: number;
    failed: number;
    errors: string[];
  }> {
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const location of dto.locations) {
      try {
        // Find or create country
        let country = await this.countryModel.findOne({
          code: location.countryCode.toUpperCase(),
        });

        if (!country) {
          country = await this.countryModel.create({
            name: location.country,
            code: location.countryCode.toUpperCase(),
          });
        }

        // Find or create state
        let state = await this.stateModel.findOne({
          countryId: country._id,
          code: location.stateCode.toUpperCase(),
        });

        if (!state) {
          state = await this.stateModel.create({
            countryId: country._id,
            name: location.state,
            code: location.stateCode.toUpperCase(),
          });

          await this.countryModel.findByIdAndUpdate(country._id, {
            $inc: { stateCount: 1 },
          });
        }

        // Find or create city
        let city = await this.cityModel.findOne({
          stateId: state._id,
          name: { $regex: new RegExp(`^${location.city}$`, 'i') },
        });

        if (!city) {
          city = await this.cityModel.create({
            stateId: state._id,
            name: location.city,
          });

          await this.stateModel.findByIdAndUpdate(state._id, {
            $inc: { cityCount: 1 },
          });
        }

        // Create PIN code if doesn't exist
        const existingPincode = await this.pincodeModel.findOne({
          pincode: location.pincode,
        });

        if (!existingPincode) {
          await this.pincodeModel.create({
            cityId: city._id,
            pincode: location.pincode,
            area: location.area,
          });

          await this.cityModel.findByIdAndUpdate(city._id, {
            $inc: { pincodeCount: 1 },
          });
        }

        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`${location.pincode}: ${error.message}`);
      }
    }

    this.logger.log(
      `Bulk import completed: ${results.success} success, ${results.failed} failed`,
    );

    return results;
  }

  /**
   * Export all locations as hierarchical data
   */
  async exportLocations(): Promise<any[]> {
    const countries = await this.countryModel.find().sort({ name: 1 });
    const result = [];

    for (const country of countries) {
      const states = await this.stateModel
        .find({ countryId: country._id })
        .sort({ name: 1 });

      for (const state of states) {
        const cities = await this.cityModel
          .find({ stateId: state._id })
          .sort({ name: 1 });

        for (const city of cities) {
          const pincodes = await this.pincodeModel
            .find({ cityId: city._id })
            .sort({ pincode: 1 });

          for (const pincode of pincodes) {
            result.push({
              country: country.name,
              countryCode: country.code,
              state: state.name,
              stateCode: state.code,
              city: city.name,
              pincode: pincode.pincode,
              area: pincode.area || '',
              usageCount: pincode.usageCount,
              isActive: pincode.isActive,
            });
          }
        }
      }
    }

    return result;
  }
}

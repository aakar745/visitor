import { Injectable, Logger, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Country, CountryDocument } from '../../database/schemas/country.schema';
import { State, StateDocument } from '../../database/schemas/state.schema';
import { City, CityDocument } from '../../database/schemas/city.schema';
import { Pincode, PincodeDocument } from '../../database/schemas/pincode.schema';
import { GlobalVisitor, GlobalVisitorDocument } from '../../database/schemas/global-visitor.schema';
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
    @InjectModel(GlobalVisitor.name) private visitorModel: Model<GlobalVisitorDocument>,
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
    page?: number;
    limit?: number;
    isActive?: boolean;
    search?: string;
  }): Promise<{ data: Country[]; total: number; page: number; limit: number; totalPages: number }> {
    const page = filters?.page || 1;
    const limit = Math.min(filters?.limit || 50, 100); // Max 100 items per page
    const skip = (page - 1) * limit;

    const query: any = {};

    if (filters?.isActive !== undefined) {
      query.isActive = filters.isActive;
    }

    if (filters?.search) {
      query.name = { $regex: filters.search, $options: 'i' };
    }

    // Execute query and count in parallel for better performance
    const [data, total] = await Promise.all([
      this.countryModel
        .find(query)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .lean() // ✅ Better performance
        .exec(),
      this.countryModel.countDocuments(query).exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
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

  async deleteCountry(id: string): Promise<{ deleted: boolean; softDeleted: boolean; usageCount: number }> {
    const country = await this.findCountryById(id);

    // Check if country has states
    const stateCount = await this.stateModel.countDocuments({ countryId: id });
    if (stateCount > 0) {
      throw new BadRequestException(
        `Cannot delete country "${country.name}" because it has ${stateCount} state(s). Delete states first.`,
      );
    }

    // Soft delete if used in registrations (check usageCount)
    if (country.usageCount > 0) {
      await this.countryModel.findByIdAndUpdate(id, { $set: { isActive: false } });
      this.logger.log(`Country soft-deleted (used ${country.usageCount} times): ${country.name}`);
      return {
        deleted: false,
        softDeleted: true,
        usageCount: country.usageCount,
      };
    }

    // Hard delete if never used
    await this.countryModel.findByIdAndDelete(id);
    this.logger.log(`Country deleted: ${country.name}`);

    return {
      deleted: true,
      softDeleted: false,
      usageCount: 0,
    };
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
    page?: number;
    limit?: number;
    countryId?: string;
    isActive?: boolean;
    search?: string;
  }): Promise<{ data: State[]; total: number; page: number; limit: number; totalPages: number }> {
    const page = filters?.page || 1;
    const limit = Math.min(filters?.limit || 50, 100); // Max 100 items per page
    const skip = (page - 1) * limit;

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

    // Execute query and count in parallel for better performance
    const [data, total] = await Promise.all([
      this.stateModel
        .find(query)
        .populate('countryId', 'name code')
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .lean() // ✅ Better performance
        .exec(),
      this.stateModel.countDocuments(query).exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
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

  async deleteState(id: string): Promise<{ deleted: boolean; softDeleted: boolean; usageCount: number }> {
    const state = await this.findStateById(id);

    // Extract the actual ObjectId from potentially populated countryId
    const countryId = typeof state.countryId === 'object' && state.countryId && state.countryId._id 
      ? state.countryId._id 
      : state.countryId;

    // Check if state has cities
    const cityCount = await this.cityModel.countDocuments({ stateId: id });
    if (cityCount > 0) {
      throw new BadRequestException(
        `Cannot delete state "${state.name}" because it has ${cityCount} city/cities. Delete cities first.`,
      );
    }

    // Soft delete if used in registrations (check usageCount)
    if (state.usageCount > 0) {
      await this.stateModel.findByIdAndUpdate(id, { $set: { isActive: false } });
      this.logger.log(`State soft-deleted (used ${state.usageCount} times): ${state.name}`);
      return {
        deleted: false,
        softDeleted: true,
        usageCount: state.usageCount,
      };
    }

    // Hard delete if never used
    await this.stateModel.findByIdAndDelete(id);

    // Update country state count (only if country exists)
    if (countryId) {
      await this.countryModel.findByIdAndUpdate(countryId, {
        $inc: { stateCount: -1 },
      });
    }

    this.logger.log(`State deleted: ${state.name}`);

    return {
      deleted: true,
      softDeleted: false,
      usageCount: 0,
    };
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
    page?: number;
    limit?: number;
    stateId?: string;
    isActive?: boolean;
    search?: string;
  }): Promise<{ data: City[]; total: number; page: number; limit: number; totalPages: number }> {
    const page = filters?.page || 1;
    const limit = Math.min(filters?.limit || 50, 100); // Max 100 items per page
    const skip = (page - 1) * limit;

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

    // Execute query and count in parallel for better performance
    const [data, total] = await Promise.all([
      this.cityModel
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
        .skip(skip)
        .limit(limit)
        .lean() // ✅ Better performance
        .exec(),
      this.cityModel.countDocuments(query).exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
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

  async deleteCity(id: string): Promise<{ deleted: boolean; softDeleted: boolean; usageCount: number }> {
    const city = await this.findCityById(id);

    // Extract the actual ObjectId from potentially populated stateId
    const stateId = typeof city.stateId === 'object' && city.stateId && city.stateId._id 
      ? city.stateId._id 
      : city.stateId;

    // Check if city has PIN codes
    const pincodeCount = await this.pincodeModel.countDocuments({ cityId: id });
    if (pincodeCount > 0) {
      throw new BadRequestException(
        `Cannot delete city "${city.name}" because it has ${pincodeCount} PIN code(s). Delete PIN codes first.`,
      );
    }

    // Soft delete if used in registrations (check usageCount)
    if (city.usageCount > 0) {
      await this.cityModel.findByIdAndUpdate(id, { $set: { isActive: false } });
      this.logger.log(`City soft-deleted (used ${city.usageCount} times): ${city.name}`);
      return {
        deleted: false,
        softDeleted: true,
        usageCount: city.usageCount,
      };
    }

    // Hard delete if never used
    await this.cityModel.findByIdAndDelete(id);

    // Update state city count (only if state exists)
    if (stateId) {
      await this.stateModel.findByIdAndUpdate(stateId, {
        $inc: { cityCount: -1 },
      });
    }

    this.logger.log(`City deleted: ${city.name}`);

    return {
      deleted: true,
      softDeleted: false,
      usageCount: 0,
    };
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
    page?: number;
    limit?: number;
    cityId?: string;
    isActive?: boolean;
    search?: string;
  }): Promise<{ data: Pincode[]; total: number; page: number; limit: number; totalPages: number }> {
    const page = filters?.page || 1;
    const limit = Math.min(filters?.limit || 50, 100); // Max 100 items per page
    const skip = (page - 1) * limit;

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

    // Execute query and count in parallel for better performance
    const [data, total] = await Promise.all([
      this.pincodeModel
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
        .skip(skip)
        .limit(limit)
        .lean() // ✅ Better performance
        .exec(),
      this.pincodeModel.countDocuments(query).exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
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
    const oldCityId = typeof pincode.cityId === 'object' && pincode.cityId && pincode.cityId._id 
      ? pincode.cityId._id.toString() 
      : pincode.cityId?.toString();

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

  async deletePincode(id: string): Promise<{ deleted: boolean; softDeleted: boolean; usageCount: number }> {
    const pincode = await this.findPincodeById(id);

    // Extract the actual ObjectId from potentially populated cityId
    const cityId = typeof pincode.cityId === 'object' && pincode.cityId && pincode.cityId._id 
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
      
      return {
        deleted: false,
        softDeleted: true,
        usageCount: pincode.usageCount,
      };
    }

    // Hard delete if never used
    await this.pincodeModel.findByIdAndDelete(id);

    // Update city pincode count (only if city exists)
    if (cityId) {
      await this.cityModel.findByIdAndUpdate(cityId, {
        $inc: { pincodeCount: -1 },
      });
    }

    this.logger.log(`PIN code deleted: ${pincode.pincode}`);

    // Remove from Meilisearch
    try {
      await this.meilisearchService.deletePincode(id);
      this.logger.debug(`Removed PIN code ${pincode.pincode} from Meilisearch`);
    } catch (error) {
      this.logger.warn(`Failed to remove PIN code from Meilisearch:`, error.message);
    }

    return {
      deleted: true,
      softDeleted: false,
      usageCount: 0,
    };
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
   * Bulk import locations from CSV data with transaction support
   * Creates hierarchy: Country → State → City → PIN
   * Properly handles duplicates and provides detailed reporting
   */
  async bulkImport(dto: BulkImportDto): Promise<{
    success: number;
    skipped: number;
    failed: number;
    errors: string[];
    details: {
      countriesCreated: number;
      statesCreated: number;
      citiesCreated: number;
      pincodesCreated: number;
      pincodesSkipped: number;
    };
  }> {
    const results = {
      success: 0,
      skipped: 0,
      failed: 0,
      errors: [] as string[],
      details: {
        countriesCreated: 0,
        statesCreated: 0,
        citiesCreated: 0,
        pincodesCreated: 0,
        pincodesSkipped: 0,
      },
    };

    // In-memory cache to avoid repeated DB queries for large imports
    const countryCache = new Map<string, any>();
    const stateCache = new Map<string, any>();
    const cityCache = new Map<string, any>();
    
    // Limit error messages to prevent memory issues with lakhs of records
    const MAX_ERRORS = 200;
    
    // Track newly created pincode IDs for Meilisearch syncing
    const newPincodeIds: string[] = [];

    this.logger.log(`Starting bulk import of ${dto.locations.length} records`);

    // Process each location
    for (const location of dto.locations) {
      try {
        // Validate required fields
        if (!location.countryCode || !location.stateCode || !location.city || !location.pincode) {
          results.failed++;
          if (results.errors.length < MAX_ERRORS) {
            results.errors.push(`${location.pincode || 'unknown'}: Missing required fields`);
          }
          continue;
        }

        // Find or create country (with caching for performance)
        const countryCode = location.countryCode.toUpperCase();
        let country = countryCache.get(countryCode);
        
        if (!country) {
          country = await this.countryModel.findOne({ code: countryCode });
          
          if (!country) {
            try {
              country = await this.countryModel.create({
                name: location.country,
                code: countryCode,
              });
              results.details.countriesCreated++;
            } catch (error) {
              // Handle race condition or duplicate key error
              if (error.code === 11000) {
                // Duplicate detected - fetch existing country
                country = await this.countryModel.findOne({ code: countryCode });
                if (!country) throw error; // Still not found, re-throw
              } else {
                throw error; // Different error
              }
            }
          }
          
          // Cache for future lookups
          countryCache.set(countryCode, country);
        }

        // Find or create state (with caching for performance)
        const stateKey = `${country._id}_${location.stateCode.toUpperCase()}`;
        let state = stateCache.get(stateKey);
        
        if (!state) {
          const stateCode = location.stateCode.toUpperCase();
          // Lookup by code first (globally unique)
          state = await this.stateModel.findOne({
            countryId: country._id,
            code: stateCode,
          });

          if (!state) {
            try {
              state = await this.stateModel.create({
                countryId: country._id,
                name: location.state,
                code: stateCode,
              });
              results.details.statesCreated++;

              // Update country state count
              await this.countryModel.findByIdAndUpdate(country._id, {
                $inc: { stateCount: 1 },
              });
            } catch (error) {
              // Handle race condition or duplicate key error
              if (error.code === 11000) {
                // Duplicate detected - try to find by code OR name (case-insensitive)
                state = await this.stateModel.findOne({
                  countryId: country._id,
                  code: stateCode,
                });
                
                if (!state) {
                  // Not found by code, try by name (the duplicate might be on name)
                  state = await this.stateModel.findOne({
                    countryId: country._id,
                    name: location.state,
                  }).collation({ locale: 'en', strength: 2 });
                }
                
                if (!state) throw error; // Still not found, re-throw
              } else {
                throw error; // Different error
              }
            }
          }
          
          // Cache for future lookups
          stateCache.set(stateKey, state);
        }

        // Find or create city (with caching for performance)
        const cityKey = `${state._id}_${location.city.toLowerCase()}`;
        let city = cityCache.get(cityKey);
        
        if (!city) {
          // Use collation for case-insensitive search (matches unique index)
          city = await this.cityModel.findOne({
            stateId: state._id,
            name: location.city,
          }).collation({ locale: 'en', strength: 2 }); // Case-insensitive

          if (!city) {
            try {
              city = await this.cityModel.create({
                stateId: state._id,
                name: location.city,
              });
              results.details.citiesCreated++;

              // Update state city count
              await this.stateModel.findByIdAndUpdate(state._id, {
                $inc: { cityCount: 1 },
              });
            } catch (error) {
              // Handle race condition or duplicate key error
              if (error.code === 11000) {
                // Duplicate detected - fetch existing city
                city = await this.cityModel.findOne({
                  stateId: state._id,
                  name: location.city,
                }).collation({ locale: 'en', strength: 2 });
                
                if (!city) throw error; // Still not found, re-throw
              } else {
                throw error; // Different error
              }
            }
          }
          
          // Cache for future lookups
          cityCache.set(cityKey, city);
        }

        // Check if this EXACT pincode + city + area combination exists
        // Important: Only check for exact area match, not all areas!
        const incomingArea = (location.area || '').trim();
        const existingPincode = await this.pincodeModel.findOne({
          pincode: location.pincode,
          cityId: city._id,
          area: incomingArea, // Exact match only!
        });

        if (existingPincode) {
          // Exact duplicate found (same pincode, same city, same area) - skip
          results.skipped++;
          results.details.pincodesSkipped++;
        } else {
          // New entry (either new pincode, or same pincode with different area/city)
          try {
            const newPincode = await this.pincodeModel.create({
              cityId: city._id,
              pincode: location.pincode,
              area: incomingArea, // Use the same trimmed value from the check
            });
            results.details.pincodesCreated++;
            
            // Track for Meilisearch syncing
            newPincodeIds.push(newPincode._id.toString());

            // Update city pincode count
            await this.cityModel.findByIdAndUpdate(city._id, {
              $inc: { pincodeCount: 1 },
            });

            results.success++;
          } catch (error) {
            // Handle duplicate (race condition or unique constraint)
            if (error.code === 11000) {
              results.skipped++;
              results.details.pincodesSkipped++;
              this.logger.debug(`Pincode ${location.pincode} duplicate, skipping`);
            } else {
              throw error;
            }
          }
        }
      } catch (error) {
        results.failed++;
        if (results.errors.length < MAX_ERRORS) {
          results.errors.push(
            `${location.pincode} (${location.city}): ${error.message}`
          );
        }
        this.logger.error(
          `Import error for ${location.pincode}: ${error.message}`,
          error.stack
        );
      }
    }

    this.logger.log(
      `Bulk import completed: ${results.success} created, ${results.skipped} skipped, ${results.failed} failed | ` +
      `Details: ${results.details.countriesCreated} countries, ${results.details.statesCreated} states, ` +
      `${results.details.citiesCreated} cities, ${results.details.pincodesCreated} pincodes | ` +
      `Cache stats: ${countryCache.size} countries, ${stateCache.size} states, ${cityCache.size} cities cached`
    );

    // Clear caches to free memory after import
    countryCache.clear();
    stateCache.clear();
    cityCache.clear();

    // Add truncation notice if errors were limited
    if (results.failed > MAX_ERRORS) {
      results.errors.push(`... and ${results.failed - MAX_ERRORS} more errors (truncated for performance)`);
    }

    // ✅ AUTO-SYNC: Index all newly created pincodes in Meilisearch
    if (newPincodeIds.length > 0) {
      this.logger.log(`🔄 Syncing ${newPincodeIds.length} new pincodes to Meilisearch...`);
      
      try {
        // Fetch newly created pincodes with populated data
        const newPincodes = await this.pincodeModel
          .find({
            _id: { $in: newPincodeIds.map((id: string) => new Types.ObjectId(id)) },
          })
          .populate({
            path: 'cityId',
            populate: {
              path: 'stateId',
              populate: {
                path: 'countryId',
              },
            },
          })
          .lean()
          .exec();

        if (newPincodes.length > 0) {
          await this.meilisearchService.indexAllPincodes(newPincodes);
          this.logger.log(`✅ Successfully synced ${newPincodes.length} pincodes to Meilisearch (autocomplete ready!)`);
        }
      } catch (error) {
        this.logger.warn(`⚠️ Failed to auto-sync pincodes to Meilisearch: ${error.message}`);
        this.logger.warn(`   → Run 'npm run sync:meilisearch' to manually sync`);
        // Don't throw - import is complete, search indexing is optional
      }
    }

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

  // ============================================================================
  // MAINTENANCE OPERATIONS
  // ============================================================================

  /**
   * Recalculate all pincode usage counts based on actual visitor data
   * This fixes discrepancies caused by deleted registrations or lookup inflations
   */
  async recalculatePincodeUsageCounts(): Promise<{
    totalPincodes: number;
    updated: number;
    errors: number;
  }> {
    this.logger.log('Starting pincode usage count recalculation...');

    const stats = {
      totalPincodes: 0,
      updated: 0,
      errors: 0,
    };

    try {
      // Get all pincodes
      const allPincodes = await this.pincodeModel.find().exec();
      stats.totalPincodes = allPincodes.length;

      // For each pincode, count how many visitors have it
      for (const pincode of allPincodes) {
        try {
          const actualCount = await this.visitorModel
            .countDocuments({ 
              pincodeId: pincode._id,
              totalRegistrations: { $gt: 0 } // Only count visitors with active registrations
            })
            .exec();

          // Update if count is different
          if (pincode.usageCount !== actualCount) {
            await this.pincodeModel.findByIdAndUpdate(pincode._id, {
              $set: { usageCount: actualCount },
            }).exec();
            
            this.logger.debug(
              `Updated pincode ${pincode.pincode}: ${pincode.usageCount} → ${actualCount}`
            );
            stats.updated++;
          }
        } catch (error) {
          this.logger.error(`Error updating pincode ${pincode.pincode}:`, error.message);
          stats.errors++;
        }
      }

      this.logger.log(
        `Recalculation complete: ${stats.updated} updated, ${stats.errors} errors out of ${stats.totalPincodes} total`
      );

      return stats;
    } catch (error) {
      this.logger.error('Fatal error during recalculation:', error);
      throw error;
    }
  }

  /**
   * Recalculate all country usage counts based on actual visitor data
   */
  async recalculateCountryUsageCounts(): Promise<{
    totalCountries: number;
    updated: number;
    errors: number;
  }> {
    this.logger.log('Starting country usage count recalculation...');

    const stats = {
      totalCountries: 0,
      updated: 0,
      errors: 0,
    };

    try {
      const allCountries = await this.countryModel.find().exec();
      stats.totalCountries = allCountries.length;

      for (const country of allCountries) {
        try {
          const actualCount = await this.visitorModel
            .countDocuments({ 
              countryId: country._id,
              totalRegistrations: { $gt: 0 }
            })
            .exec();

          if (country.usageCount !== actualCount) {
            await this.countryModel.findByIdAndUpdate(country._id, {
              $set: { usageCount: actualCount },
            }).exec();
            
            this.logger.debug(
              `Updated country ${country.name}: ${country.usageCount} → ${actualCount}`
            );
            stats.updated++;
          }
        } catch (error) {
          this.logger.error(`Error updating country ${country.name}:`, error.message);
          stats.errors++;
        }
      }

      this.logger.log(
        `Recalculation complete: ${stats.updated} updated, ${stats.errors} errors out of ${stats.totalCountries} total`
      );

      return stats;
    } catch (error) {
      this.logger.error('Fatal error during recalculation:', error);
      throw error;
    }
  }

  /**
   * Recalculate all state usage counts based on actual visitor data
   */
  async recalculateStateUsageCounts(): Promise<{
    totalStates: number;
    updated: number;
    errors: number;
  }> {
    this.logger.log('Starting state usage count recalculation...');

    const stats = {
      totalStates: 0,
      updated: 0,
      errors: 0,
    };

    try {
      const allStates = await this.stateModel.find().exec();
      stats.totalStates = allStates.length;

      for (const state of allStates) {
        try {
          const actualCount = await this.visitorModel
            .countDocuments({ 
              stateId: state._id,
              totalRegistrations: { $gt: 0 }
            })
            .exec();

          if (state.usageCount !== actualCount) {
            await this.stateModel.findByIdAndUpdate(state._id, {
              $set: { usageCount: actualCount },
            }).exec();
            
            this.logger.debug(
              `Updated state ${state.name}: ${state.usageCount} → ${actualCount}`
            );
            stats.updated++;
          }
        } catch (error) {
          this.logger.error(`Error updating state ${state.name}:`, error.message);
          stats.errors++;
        }
      }

      this.logger.log(
        `Recalculation complete: ${stats.updated} updated, ${stats.errors} errors out of ${stats.totalStates} total`
      );

      return stats;
    } catch (error) {
      this.logger.error('Fatal error during recalculation:', error);
      throw error;
    }
  }

  /**
   * Recalculate all city usage counts based on actual visitor data
   */
  async recalculateCityUsageCounts(): Promise<{
    totalCities: number;
    updated: number;
    errors: number;
  }> {
    this.logger.log('Starting city usage count recalculation...');

    const stats = {
      totalCities: 0,
      updated: 0,
      errors: 0,
    };

    try {
      const allCities = await this.cityModel.find().exec();
      stats.totalCities = allCities.length;

      for (const city of allCities) {
        try {
          const actualCount = await this.visitorModel
            .countDocuments({ 
              cityId: city._id,
              totalRegistrations: { $gt: 0 }
            })
            .exec();

          if (city.usageCount !== actualCount) {
            await this.cityModel.findByIdAndUpdate(city._id, {
              $set: { usageCount: actualCount },
            }).exec();
            
            this.logger.debug(
              `Updated city ${city.name}: ${city.usageCount} → ${actualCount}`
            );
            stats.updated++;
          }
        } catch (error) {
          this.logger.error(`Error updating city ${city.name}:`, error.message);
          stats.errors++;
        }
      }

      this.logger.log(
        `Recalculation complete: ${stats.updated} updated, ${stats.errors} errors out of ${stats.totalCities} total`
      );

      return stats;
    } catch (error) {
      this.logger.error('Fatal error during recalculation:', error);
      throw error;
    }
  }

  /**
   * Recalculate ALL location usage counts at once
   */
  async recalculateAllUsageCounts(): Promise<{
    countries: { totalCountries: number; updated: number; errors: number };
    states: { totalStates: number; updated: number; errors: number };
    cities: { totalCities: number; updated: number; errors: number };
    pincodes: { totalPincodes: number; updated: number; errors: number };
  }> {
    this.logger.log('Starting comprehensive usage count recalculation...');

    const [countries, states, cities, pincodes] = await Promise.all([
      this.recalculateCountryUsageCounts(),
      this.recalculateStateUsageCounts(),
      this.recalculateCityUsageCounts(),
      this.recalculatePincodeUsageCounts(),
    ]);

    this.logger.log('✅ All location usage counts recalculated successfully');

    return { countries, states, cities, pincodes };
  }

  // ============================================================================
  // BULK DELETE OPERATIONS
  // ============================================================================

  /**
   * Bulk delete cities
   */
  async bulkDeleteCities(ids: string[]): Promise<{
    deleted: number;
    softDeleted: number;
    failed: number;
    errors: string[];
  }> {
    const results = {
      deleted: 0,
      softDeleted: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const id of ids) {
      try {
        const result = await this.deleteCity(id);
        if (result.deleted) {
          results.deleted++;
        } else if (result.softDeleted) {
          results.softDeleted++;
        }
      } catch (error) {
        results.failed++;
        results.errors.push(`City ${id}: ${error.message}`);
        this.logger.error(`Failed to delete city ${id}:`, error.message);
      }
    }

    this.logger.log(
      `Bulk delete cities complete: ${results.deleted} deleted, ${results.softDeleted} soft-deleted, ${results.failed} failed`
    );

    return results;
  }

  /**
   * Bulk delete pincodes
   */
  async bulkDeletePincodes(ids: string[]): Promise<{
    deleted: number;
    softDeleted: number;
    failed: number;
    errors: string[];
  }> {
    const results = {
      deleted: 0,
      softDeleted: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const id of ids) {
      try {
        const result = await this.deletePincode(id);
        if (result.deleted) {
          results.deleted++;
        } else if (result.softDeleted) {
          results.softDeleted++;
        }
      } catch (error) {
        results.failed++;
        results.errors.push(`Pincode ${id}: ${error.message}`);
        this.logger.error(`Failed to delete pincode ${id}:`, error.message);
      }
    }

    this.logger.log(
      `Bulk delete pincodes complete: ${results.deleted} deleted, ${results.softDeleted} soft-deleted, ${results.failed} failed`
    );

    return results;
  }
}

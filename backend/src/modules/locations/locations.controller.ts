import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { LocationsService } from './locations.service';
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

@ApiTags('Locations')
@Controller('locations')
export class LocationsController {
  constructor(
    private readonly locationsService: LocationsService,
    private readonly meilisearchService: MeilisearchService,
  ) {}

  // ============================================================================
  // COUNTRY ENDPOINTS
  // ============================================================================

  @Post('countries')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super-admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new country' })
  @ApiResponse({ status: 201, description: 'Country created successfully' })
  @ApiResponse({ status: 409, description: 'Country already exists' })
  async createCountry(@Body() dto: CreateCountryDto) {
    const country = await this.locationsService.createCountry(dto);
    return {
      success: true,
      message: 'Country created successfully',
      data: country,
    };
  }

  @Public() // Frontend needs to fetch countries without authentication
  @Get('countries')
  @ApiOperation({ summary: 'Get all countries (Public)' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false, type: String })
  async findAllCountries(
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
  ) {
    const filters: any = {};
    if (isActive !== undefined) {
      filters.isActive = isActive === 'true';
    }
    if (search) {
      filters.search = search;
    }

    const countries = await this.locationsService.findAllCountries(filters);
    return {
      success: true,
      data: countries,
      total: countries.length,
    };
  }

  @Get('countries/:id')
  @ApiOperation({ summary: 'Get country by ID' })
  async findCountryById(@Param('id') id: string) {
    const country = await this.locationsService.findCountryById(id);
    return {
      success: true,
      data: country,
    };
  }

  @Put('countries/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super-admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update country' })
  async updateCountry(@Param('id') id: string, @Body() dto: UpdateCountryDto) {
    const country = await this.locationsService.updateCountry(id, dto);
    return {
      success: true,
      message: 'Country updated successfully',
      data: country,
    };
  }

  @Delete('countries/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super-admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete country' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCountry(@Param('id') id: string) {
    await this.locationsService.deleteCountry(id);
  }

  // ============================================================================
  // STATE ENDPOINTS
  // ============================================================================

  @Post('states')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super-admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new state' })
  async createState(@Body() dto: CreateStateDto) {
    const state = await this.locationsService.createState(dto);
    return {
      success: true,
      message: 'State created successfully',
      data: state,
    };
  }

  @Get('states')
  @ApiOperation({ summary: 'Get all states' })
  @ApiQuery({ name: 'countryId', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false, type: String })
  async findAllStates(
    @Query('countryId') countryId?: string,
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
  ) {
    const filters: any = {};
    if (countryId) filters.countryId = countryId;
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (search) filters.search = search;

    const states = await this.locationsService.findAllStates(filters);
    return {
      success: true,
      data: states,
      total: states.length,
    };
  }

  @Get('states/:id')
  @ApiOperation({ summary: 'Get state by ID' })
  async findStateById(@Param('id') id: string) {
    const state = await this.locationsService.findStateById(id);
    return {
      success: true,
      data: state,
    };
  }

  @Put('states/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super-admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update state' })
  async updateState(@Param('id') id: string, @Body() dto: UpdateStateDto) {
    const state = await this.locationsService.updateState(id, dto);
    return {
      success: true,
      message: 'State updated successfully',
      data: state,
    };
  }

  @Delete('states/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super-admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete state' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteState(@Param('id') id: string) {
    await this.locationsService.deleteState(id);
  }

  // ============================================================================
  // CITY ENDPOINTS
  // ============================================================================

  @Post('cities')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super-admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new city' })
  async createCity(@Body() dto: CreateCityDto) {
    const city = await this.locationsService.createCity(dto);
    return {
      success: true,
      message: 'City created successfully',
      data: city,
    };
  }

  @Get('cities')
  @ApiOperation({ summary: 'Get all cities' })
  @ApiQuery({ name: 'stateId', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false, type: String })
  async findAllCities(
    @Query('stateId') stateId?: string,
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
  ) {
    const filters: any = {};
    if (stateId) filters.stateId = stateId;
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (search) filters.search = search;

    const cities = await this.locationsService.findAllCities(filters);
    return {
      success: true,
      data: cities,
      total: cities.length,
    };
  }

  @Get('cities/:id')
  @ApiOperation({ summary: 'Get city by ID' })
  async findCityById(@Param('id') id: string) {
    const city = await this.locationsService.findCityById(id);
    return {
      success: true,
      data: city,
    };
  }

  @Put('cities/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super-admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update city' })
  async updateCity(@Param('id') id: string, @Body() dto: UpdateCityDto) {
    const city = await this.locationsService.updateCity(id, dto);
    return {
      success: true,
      message: 'City updated successfully',
      data: city,
    };
  }

  @Delete('cities/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super-admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete city' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCity(@Param('id') id: string) {
    await this.locationsService.deleteCity(id);
  }

  // ============================================================================
  // PINCODE ENDPOINTS
  // ============================================================================

  @Post('pincodes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super-admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new PIN code' })
  async createPincode(@Body() dto: CreatePincodeDto) {
    const pincode = await this.locationsService.createPincode(dto);
    return {
      success: true,
      message: 'PIN code created successfully',
      data: pincode,
    };
  }

  @Get('pincodes')
  @ApiOperation({ summary: 'Get all PIN codes' })
  @ApiQuery({ name: 'cityId', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false, type: String })
  async findAllPincodes(
    @Query('cityId') cityId?: string,
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
  ) {
    const filters: any = {};
    if (cityId) filters.cityId = cityId;
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (search) filters.search = search;

    const pincodes = await this.locationsService.findAllPincodes(filters);
    return {
      success: true,
      data: pincodes,
      total: pincodes.length,
    };
  }

  @Get('pincodes/:id')
  @ApiOperation({ summary: 'Get PIN code by ID' })
  async findPincodeById(@Param('id') id: string) {
    const pincode = await this.locationsService.findPincodeById(id);
    return {
      success: true,
      data: pincode,
    };
  }

  @Put('pincodes/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super-admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update PIN code' })
  async updatePincode(@Param('id') id: string, @Body() dto: UpdatePincodeDto) {
    const pincode = await this.locationsService.updatePincode(id, dto);
    return {
      success: true,
      message: 'PIN code updated successfully',
      data: pincode,
    };
  }

  @Delete('pincodes/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super-admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete PIN code' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePincode(@Param('id') id: string) {
    await this.locationsService.deletePincode(id);
  }

  // ============================================================================
  // LOOKUP & SEARCH ENDPOINTS (PUBLIC - NO AUTH)
  // ============================================================================

  @Public()
  @Get('pincode/:pincode')
  @ApiOperation({ summary: 'Lookup location by PIN code (Public)' })
  @ApiResponse({ status: 200, description: 'Location found' })
  @ApiResponse({ status: 404, description: 'PIN code not found' })
  async lookupByPincode(@Param('pincode') pincode: string) {
    const result = await this.locationsService.lookupByPincode(pincode);
    
    if (!result.found) {
      return {
        success: false,
        found: false,
        message: 'PIN code not found',
      };
    }

    return {
      success: true,
      found: true,
      data: {
        pincode: result.pincode?.pincode,
        area: result.pincode?.area,
        city: {
          id: result.city?._id?.toString(),
          name: result.city?.name,
        },
        state: {
          id: result.state?._id?.toString(),
          name: result.state?.name,
          code: result.state?.code,
        },
        country: {
          id: result.country?._id?.toString(),
          name: result.country?.name,
          code: result.country?.code,
        },
      },
    };
  }

  @Public()
  @Get('search/pincodes')
  @ApiOperation({ summary: 'Search PIN codes (MongoDB search - slower)' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async searchPincodes(
    @Query('q') query: string,
    @Query('limit') limit?: number,
  ) {
    const pincodes = await this.locationsService.searchPincodes(
      query,
      limit ? parseInt(limit.toString()) : 10,
    );
    
    return {
      success: true,
      data: pincodes,
      total: pincodes.length,
    };
  }

  @Public()
  @Get('search/pincodes/autocomplete')
  @ApiOperation({ summary: 'Autocomplete PIN code search (Meilisearch - < 20ms)' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query (min 2 chars)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Max results (default: 10)' })
  async autocompletePincodes(
    @Query('q') query: string,
    @Query('limit') limit?: string,
  ) {
    if (!query || query.length < 2) {
      return {
        success: false,
        message: 'Query must be at least 2 characters',
        data: [],
        estimatedTotalHits: 0,
        processingTimeMs: 0,
      };
    }

    const results = await this.meilisearchService.searchPincodes(
      query,
      limit ? parseInt(limit) : 10,
    );

    return {
      success: true,
      data: results.hits,
      estimatedTotalHits: results.estimatedTotalHits,
      processingTimeMs: results.processingTimeMs,
    };
  }

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================

  @Post('bulk-import')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super-admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bulk import locations from CSV data' })
  async bulkImport(@Body() dto: BulkImportDto) {
    const result = await this.locationsService.bulkImport(dto);
    return {
      success: true,
      message: 'Bulk import completed',
      data: result,
    };
  }

  @Get('export')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'super-admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Export all locations as CSV' })
  async exportLocations(@Res() res: Response) {
    const data = await this.locationsService.exportLocations();

    // Generate CSV
    const headers = [
      'Country',
      'Country Code',
      'State',
      'State Code',
      'City',
      'PIN Code',
      'Area',
      'Usage Count',
      'Active',
    ];

    const rows = data.map((item) => [
      item.country,
      item.countryCode,
      item.state,
      item.stateCode,
      item.city,
      item.pincode,
      item.area || '',
      item.usageCount,
      item.isActive ? 'Yes' : 'No',
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    res.header('Content-Type', 'text/csv');
    res.header(
      'Content-Disposition',
      `attachment; filename="locations_export_${Date.now()}.csv"`,
    );
    res.send(csv);
  }
}

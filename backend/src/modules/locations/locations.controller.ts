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
import { Public } from '../../common/decorators/public.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
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
import { QueryCountryDto } from './dto/query-country.dto';
import { QueryStateDto } from './dto/query-state.dto';
import { QueryCityDto } from './dto/query-city.dto';
import { QueryPincodeDto } from './dto/query-pincode.dto';
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
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('locations.create')
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
  @ApiOperation({ summary: 'Get all countries with pagination (Public)' })
  async findAllCountries(@Query() query: QueryCountryDto) {
    const result = await this.locationsService.findAllCountries(query);
    return {
      success: true,
      data: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
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
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('locations.update')
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
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('locations.delete')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete country' })
  @ApiResponse({ status: 200, description: 'Country deleted or deactivated' })
  async deleteCountry(@Param('id') id: string) {
    const result = await this.locationsService.deleteCountry(id);
    return {
      success: true,
      message: result.softDeleted 
        ? `Country deactivated (used in ${result.usageCount} registration${result.usageCount > 1 ? 's' : ''})` 
        : 'Country deleted successfully',
      data: result,
    };
  }

  // ============================================================================
  // STATE ENDPOINTS
  // ============================================================================

  @Post('states')
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('locations.create')
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
  @ApiOperation({ summary: 'Get all states with pagination' })
  async findAllStates(@Query() query: QueryStateDto) {
    const result = await this.locationsService.findAllStates(query);
    return {
      success: true,
      data: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
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
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('locations.update')
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
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('locations.delete')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete state' })
  @ApiResponse({ status: 200, description: 'State deleted or deactivated' })
  async deleteState(@Param('id') id: string) {
    const result = await this.locationsService.deleteState(id);
    return {
      success: true,
      message: result.softDeleted 
        ? `State deactivated (used in ${result.usageCount} registration${result.usageCount > 1 ? 's' : ''})` 
        : 'State deleted successfully',
      data: result,
    };
  }

  // ============================================================================
  // CITY ENDPOINTS
  // ============================================================================

  @Post('cities')
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('locations.create')
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
  @ApiOperation({ summary: 'Get all cities with pagination' })
  async findAllCities(@Query() query: QueryCityDto) {
    const result = await this.locationsService.findAllCities(query);
    return {
      success: true,
      data: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
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
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('locations.update')
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
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('locations.delete')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete city' })
  @ApiResponse({ status: 200, description: 'City deleted or deactivated' })
  async deleteCity(@Param('id') id: string) {
    const result = await this.locationsService.deleteCity(id);
    return {
      success: true,
      message: result.softDeleted 
        ? `City deactivated (used in ${result.usageCount} registration${result.usageCount > 1 ? 's' : ''})` 
        : 'City deleted successfully',
      data: result,
    };
  }

  // ============================================================================
  // PINCODE ENDPOINTS
  // ============================================================================

  @Post('pincodes')
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('locations.create')
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
  @ApiOperation({ summary: 'Get all PIN codes with pagination' })
  async findAllPincodes(@Query() query: QueryPincodeDto) {
    const result = await this.locationsService.findAllPincodes(query);
    return {
      success: true,
      data: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
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
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('locations.update')
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
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('locations.delete')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete PIN code' })
  @ApiResponse({ status: 200, description: 'PIN code deleted or deactivated' })
  async deletePincode(@Param('id') id: string) {
    const result = await this.locationsService.deletePincode(id);
    return {
      success: true,
      message: result.softDeleted 
        ? `PIN code deactivated (used in ${result.usageCount} registration${result.usageCount > 1 ? 's' : ''})` 
        : 'PIN code deleted successfully',
      data: result,
    };
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
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('locations.import')
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
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('locations.export')
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

  // ============================================================================
  // MAINTENANCE ENDPOINTS
  // ============================================================================

  @Post('pincodes/recalculate-usage')
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('locations.manage')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Recalculate pincode usage counts (Admin)' })
  @ApiResponse({ status: 200, description: 'Usage counts recalculated successfully' })
  async recalculatePincodeUsage() {
    const result = await this.locationsService.recalculatePincodeUsageCounts();
    return {
      success: true,
      message: `Recalculated ${result.updated} pincode(s) out of ${result.totalPincodes} total`,
      data: result,
    };
  }

  @Post('countries/recalculate-usage')
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('locations.manage')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Recalculate country usage counts (Admin)' })
  @ApiResponse({ status: 200, description: 'Usage counts recalculated successfully' })
  async recalculateCountryUsage() {
    const result = await this.locationsService.recalculateCountryUsageCounts();
    return {
      success: true,
      message: `Recalculated ${result.updated} country/countries out of ${result.totalCountries} total`,
      data: result,
    };
  }

  @Post('states/recalculate-usage')
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('locations.manage')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Recalculate state usage counts (Admin)' })
  @ApiResponse({ status: 200, description: 'Usage counts recalculated successfully' })
  async recalculateStateUsage() {
    const result = await this.locationsService.recalculateStateUsageCounts();
    return {
      success: true,
      message: `Recalculated ${result.updated} state(s) out of ${result.totalStates} total`,
      data: result,
    };
  }

  @Post('cities/recalculate-usage')
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('locations.manage')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Recalculate city usage counts (Admin)' })
  @ApiResponse({ status: 200, description: 'Usage counts recalculated successfully' })
  async recalculateCityUsage() {
    const result = await this.locationsService.recalculateCityUsageCounts();
    return {
      success: true,
      message: `Recalculated ${result.updated} city/cities out of ${result.totalCities} total`,
      data: result,
    };
  }

  @Post('recalculate-all-usage')
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('locations.manage')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Recalculate ALL location usage counts (Admin)' })
  @ApiResponse({ status: 200, description: 'All usage counts recalculated successfully' })
  async recalculateAllUsage() {
    const result = await this.locationsService.recalculateAllUsageCounts();
    const totalUpdated = result.countries.updated + result.states.updated + result.cities.updated + result.pincodes.updated;
    return {
      success: true,
      message: `✅ Recalculated ${totalUpdated} location(s) across all types`,
      data: result,
    };
  }

  // ============================================================================
  // BULK DELETE ENDPOINTS
  // ============================================================================

  @Post('cities/bulk-delete')
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('locations.delete')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bulk delete cities (Admin)' })
  @ApiResponse({ status: 200, description: 'Cities deleted or deactivated' })
  async bulkDeleteCities(@Body('ids') ids: string[]) {
    const result = await this.locationsService.bulkDeleteCities(ids);
    return {
      success: true,
      message: `${result.deleted} deleted, ${result.softDeleted} deactivated, ${result.failed} failed`,
      data: result,
    };
  }

  @Post('pincodes/bulk-delete')
  @UseGuards(JwtAuthGuard)
  @RequirePermissions('locations.delete')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bulk delete pincodes (Admin)' })
  @ApiResponse({ status: 200, description: 'Pincodes deleted or deactivated' })
  async bulkDeletePincodes(@Body('ids') ids: string[]) {
    const result = await this.locationsService.bulkDeletePincodes(ids);
    return {
      success: true,
      message: `${result.deleted} deleted, ${result.softDeleted} deactivated, ${result.failed} failed`,
      data: result,
    };
  }
}
